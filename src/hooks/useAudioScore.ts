import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SCORE_TRACK_IDS,
  scoreManifest,
  type AudioSource,
  type ScoreTrackId,
} from '../config/audioManifest';
import { AUDIO } from '../config/experienceConfig';

/**
 * The score engine: three tracks, one audible at a time, crossfaded.
 *
 * ## Why Web Audio and not `element.volume`
 *
 * A `.volume` ramp is the obvious way to fade a media element and it is the
 * wrong one here: iOS Safari treats `volume` as read-only — assigning it is
 * silently ignored, because level is the hardware buttons' job. Every fade in
 * this file would have been a hard cut on iPhone. Routing each element through a
 * `GainNode` moves the fades into the audio graph, where every engine honours
 * them.
 *
 * ## Why nothing downloads until sound is switched on
 *
 * Autoplay policy means a score can never start on its own, so bytes fetched
 * before the toggle is pressed are bytes most viewers will never hear. Every
 * element starts at `preload="none"`; the first toggle-on is what promotes them.
 *
 * ## Failure is silence, never an error screen
 *
 * The film carries the experience and the music is additive. A track that will
 * not load or will not play is marked failed and skipped — the picture is never
 * interrupted, and nothing is surfaced to the viewer.
 */

interface ScoreVoice {
  readonly el: HTMLAudioElement;
  readonly gain: GainNode;
  /** Latched once a track has proved it cannot play. It is then skipped. */
  failed: boolean;
}

interface ScoreEngine {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly voices: Partial<Record<ScoreTrackId, ScoreVoice>>;
}

export interface AudioScoreApi {
  /** False when the engine could not exist at all — the toggle then stays hidden. */
  readonly available: boolean;
  readonly enabled: boolean;
  readonly toggle: () => void;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext ?? null;
}

/** First source this engine claims it can decode. Only that one is fetched. */
function pickSource(sources: readonly AudioSource[]): string | null {
  const probe = document.createElement('audio');
  for (const source of sources) {
    if (probe.canPlayType(source.type) !== '') return source.src;
  }
  return null;
}

/**
 * Moves a gain to `to` over `ms` along an equal-power curve.
 *
 * Two linear ramps crossing each other sag by about 3 dB through the middle,
 * which between two pieces of music reads as a dip rather than a dissolve. A
 * sine/cosine pair keeps the summed power constant, and chaining short linear
 * ramps gets there while staying trivially interruptible: cancel, pin the
 * current value, re-schedule. `setValueCurveAtTime` cannot be cut into safely
 * halfway, and a viewer clicking quickly does exactly that.
 */
function rampGain(param: AudioParam, ctx: AudioContext, to: number, ms: number): void {
  const now = ctx.currentTime;
  const from = param.value;

  param.cancelScheduledValues(now);
  param.setValueAtTime(from, now);

  if (ms <= 0 || Math.abs(to - from) < 1e-4) {
    param.setValueAtTime(to, now);
    return;
  }

  const seconds = ms / 1000;
  const rising = to > from;
  for (let i = 1; i <= AUDIO.fadeSegments; i++) {
    const t = i / AUDIO.fadeSegments;
    const shape = rising ? Math.sin((t * Math.PI) / 2) : 1 - Math.cos((t * Math.PI) / 2);
    param.linearRampToValueAtTime(from + (to - from) * shape, now + seconds * t);
  }
}

/** Resolves when the element is genuinely producing sound — or has given up. */
function whenAudible(el: HTMLAudioElement): Promise<void> {
  if (!el.paused && el.readyState >= el.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve) => {
    const settle = () => {
      el.removeEventListener('playing', settle);
      el.removeEventListener('error', settle);
      resolve();
    };
    el.addEventListener('playing', settle);
    el.addEventListener('error', settle);
  });
}

export function useAudioScore(
  /** Track that should be playing, or null for silence. */
  target: ScoreTrackId | null,
  isDataConstrained: boolean,
): AudioScoreApi {
  const [available] = useState(
    () => resolveAudioContext() !== null && pickSource(scoreManifest.intro.sources) !== null,
  );
  const [enabled, setEnabled] = useState(false);

  const engineRef = useRef<ScoreEngine | null>(null);
  const stopTimers = useRef<Map<ScoreTrackId, number>>(new Map());
  const wasEnabled = useRef(false);
  /** Latest target, readable from the click handler without re-binding it. */
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const buildEngine = useCallback((): ScoreEngine | null => {
    const Ctor = resolveAudioContext();
    if (!Ctor) return null;

    let ctx: AudioContext;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const voices: Partial<Record<ScoreTrackId, ScoreVoice>> = {};

    for (const id of SCORE_TRACK_IDS) {
      const src = pickSource(scoreManifest[id].sources);
      if (!src) continue;

      const el = new Audio();
      el.src = src;
      // Every track outlasts the picture it sits under, so looping is what keeps
      // the choice screen and the end screen from falling silent.
      el.loop = true;
      el.preload = 'none';
      el.setAttribute('playsinline', '');

      const gain = ctx.createGain();
      gain.gain.value = 0;
      const voice: ScoreVoice = { el, gain, failed: false };
      el.addEventListener('error', () => {
        voice.failed = true;
      });

      try {
        ctx.createMediaElementSource(el).connect(gain).connect(master);
      } catch {
        // Element already bound to a graph, or the engine refused the node.
        continue;
      }

      voices[id] = voice;
    }

    return { ctx, master, voices };
  }, []);

  const clearStopTimer = useCallback((id: ScoreTrackId) => {
    const timer = stopTimers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      stopTimers.current.delete(id);
    }
  }, []);

  /**
   * Brings exactly one track up and takes every other one down.
   *
   * The two overlap only for the length of the fade — that overlap *is* the
   * crossfade. Outside it a single element is ever unpaused, because anything
   * faded out is paused once it reaches silence rather than left running under
   * a zero gain.
   *
   * Resolves when the incoming track is actually audible.
   */
  const applyTarget = useCallback(
    (next: ScoreTrackId | null, fadeMs: number): Promise<void> => {
      const engine = engineRef.current;
      if (!engine) return Promise.resolve();

      let audible: Promise<void> = Promise.resolve();

      for (const id of SCORE_TRACK_IDS) {
        const voice = engine.voices[id];
        if (!voice || voice.failed) continue;

        clearStopTimer(id);

        if (id === next) {
          if (voice.el.paused) {
            // Coming back from silence always restarts the piece.
            try {
              if (voice.el.currentTime !== 0) voice.el.currentTime = 0;
            } catch {
              // Not seekable yet; it will start at zero anyway.
            }
            void voice.el.play().catch(() => {
              voice.failed = true;
            });
          }
          audible = whenAudible(voice.el);
          rampGain(voice.gain.gain, engine.ctx, 1, fadeMs);
        } else if (!voice.el.paused) {
          rampGain(voice.gain.gain, engine.ctx, 0, fadeMs);
          const timer = window.setTimeout(() => {
            stopTimers.current.delete(id);
            voice.el.pause();
          }, fadeMs + 60);
          stopTimers.current.set(id, timer);
        }
      }

      return audible;
    },
    [clearStopTimer],
  );

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      return;
    }

    const engine = engineRef.current ?? buildEngine();
    engineRef.current = engine;
    if (!engine) return;

    /*
     * Both of these run inside the click on purpose. A context constructed
     * outside a gesture starts suspended, and iOS only honours `play()` while
     * the gesture that triggered it is still in scope — a passive effect, which
     * is where the ramps below live, is already too late.
     */
    void engine.ctx.resume().catch(() => {});

    const id = targetRef.current;
    const voice = id ? engine.voices[id] : null;
    if (voice && !voice.failed && voice.el.paused) {
      voice.el.preload = 'auto';
      void voice.el.play().catch(() => {
        voice.failed = true;
      });
    }

    setEnabled(true);
  }, [enabled, buildEngine]);

  /* ------------------------------------------------------ level and routing */

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const justEnabled = enabled && !wasEnabled.current;
    wasEnabled.current = enabled;

    if (!enabled) {
      rampGain(engine.master.gain, engine.ctx, 0, AUDIO.fadeOut);
      const timer = window.setTimeout(() => {
        for (const id of SCORE_TRACK_IDS) engine.voices[id]?.el.pause();
        void engine.ctx.suspend().catch(() => {});
      }, AUDIO.fadeOut + 60);
      return () => window.clearTimeout(timer);
    }

    // Once sound is on, buffer what the viewer is plausibly about to hear. On a
    // constrained connection that is only the track actually playing; ~3 MB per
    // branch is not worth spending on a guess, exactly as with the video.
    for (const id of SCORE_TRACK_IDS) {
      const voice = engine.voices[id];
      if (!voice || voice.failed) continue;
      if (id === target || !isDataConstrained) voice.el.preload = 'auto';
    }

    let cancelled = false;

    if (justEnabled) {
      // The track is positioned instantly and the *master* carries the fade, so
      // switching sound on is one gentle arrival rather than two stacked ramps.
      // Held until the element is genuinely audible, so a track still buffering
      // does not land halfway up the fade.
      void applyTarget(target, 0).then(() => {
        if (cancelled) return;
        rampGain(engine.master.gain, engine.ctx, AUDIO.masterVolume, AUDIO.fadeIn);
      });
    } else {
      void applyTarget(target, AUDIO.crossfade);
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, target, isDataConstrained, applyTarget]);

  /* ------------------------------------------------------------- lifecycle */

  // A hidden tab keeps its film running but has no business making noise.
  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      const engine = engineRef.current;
      if (!engine) return;
      if (document.hidden) void engine.ctx.suspend().catch(() => {});
      else void engine.ctx.resume().catch(() => {});
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);

  useEffect(() => {
    const timers = stopTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();

      const engine = engineRef.current;
      engineRef.current = null;
      if (!engine) return;

      for (const id of SCORE_TRACK_IDS) {
        const voice = engine.voices[id];
        if (!voice) continue;
        voice.el.pause();
        voice.el.removeAttribute('src');
        voice.el.load();
      }
      void engine.ctx.close().catch(() => {});
    };
  }, []);

  return { available, enabled, toggle };
}
