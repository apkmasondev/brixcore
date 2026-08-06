import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getModeAssets } from '../config/assetManifest';
import { COPY, TIMING } from '../config/experienceConfig';
import { useChoiceFlow, type LayerId } from '../hooks/useChoiceFlow';
import { useMediaMode } from '../hooks/useMediaMode';
import { useVideoPreload, type LayerKey } from '../hooks/useVideoPreload';
import { ChoiceOverlay } from './ChoiceOverlay';
import { EndOverlay } from './EndOverlay';
import { LoadingOverlay } from './LoadingOverlay';
import { PosterFallback } from './PosterFallback';
import { SoundToggle } from './SoundToggle';
import { VideoStage, type StageLayerSpec } from './VideoStage';
import styles from './BrixcoreExperience.module.css';

/** A branch that never becomes playable eventually surfaces as an error. */
const STALL_TIMEOUT_MS = 45_000;

/**
 * Makes `TIMING` the single source of truth for motion: the stylesheet's own
 * values are only the pre-mount fallback. The `prefers-reduced-motion` block in
 * global.css uses `!important`, so it still overrides these.
 */
const MOTION_VARS = {
  '--dur-fade': `${TIMING.layerFade}ms`,
  '--dur-ui': `${TIMING.uiReveal}ms`,
  '--delay-ui': `${TIMING.uiRevealDelay}ms`,
} as CSSProperties;

/**
 * Starts playback, absorbing the two rejections that are expected rather than
 * exceptional: an autoplay refusal (reported to the caller) and an `AbortError`
 * from a `pause()`/`load()` that raced the play request — which React's
 * StrictMode double-effect reliably produces in development.
 */
function safePlay(el: HTMLVideoElement): Promise<'ok' | 'blocked'> {
  const result = el.play();
  if (result === undefined) return Promise.resolve('ok');
  return result.then(
    () => 'ok' as const,
    (error: unknown) => {
      const name = error instanceof Error ? error.name : '';
      return name === 'AbortError' ? ('ok' as const) : ('blocked' as const);
    },
  );
}

export function BrixcoreExperience() {
  const { mode, isDataConstrained } = useMediaMode();
  const assets = useMemo(() => getModeAssets(mode), [mode]);
  const { state, dispatch, activeLayer, isChoiceVisible, isEndVisible, endedCore, actions } =
    useChoiceFlow();
  const { readiness, register, markReady, getElement, requestPreload, resetPreloads } =
    useVideoPreload();

  const { phase, selectedCore, requestedCores, autoplayBlocked, introRunId, branchRunId } = state;

  /* -------------------------------------------------------------- layers */

  /**
   * Preload policy.
   *
   * The intro is the critical path and is always eager. A branch downloads only
   * once the flow marks it wanted: on desktop that happens as soon as the intro
   * is actually playing, so the fetch never competes with the intro's own first
   * frames; on mobile or under Save-Data / a slow connection it happens only
   * after the user picks, because ~7 MB per branch is not worth spending on a
   * guess.
   */
  const introStarted = phase !== 'intro-loading';

  const layers = useMemo<StageLayerSpec[]>(() => {
    return [
      {
        id: 'intro',
        asset: assets.intro,
        preload: 'auto',
        label: 'A spacecraft built from bricks disassembles into two glowing bricks.',
      },
      // Branches render as `preload="none"` for their whole life. `useVideoPreload`
      // is then the single owner of when a branch starts downloading: letting
      // React also raise the attribute to `auto` would race the imperative
      // `load()`, and whichever lost showed up as a cancelled request.
      {
        id: 'forge',
        asset: assets.forge,
        preload: 'none',
        label: 'The FORGE core assembles into a molten creature.',
      },
      {
        id: 'evolve',
        asset: assets.evolve,
        preload: 'none',
        label: 'The EVOLVE core assembles into a futuristic city.',
      },
    ];
  }, [assets]);

  /* ------------------------------------------------------------ playback */

  // Intro. Re-runs on replay and on retry via `introRunId`.
  useEffect(() => {
    if (autoplayBlocked) return;

    const el = getElement('intro');
    if (!el) return;

    let cancelled = false;
    // A previous failure leaves the element in an error state that only load()
    // clears; otherwise play() would reject immediately again.
    if (el.error) el.load();
    // Guarded: assigning currentTime runs the seek algorithm even when the value
    // is unchanged, which on a still-buffering element re-issues its range request.
    if (el.currentTime !== 0) el.currentTime = 0;

    void safePlay(el).then((result) => {
      if (!cancelled && result === 'blocked') dispatch({ type: 'autoplay-blocked' });
    });

    return () => {
      cancelled = true;
    };
  }, [introRunId, mode, autoplayBlocked, getElement, dispatch]);

  // Desktop: mark both branches wanted as soon as the intro is running. This
  // flips their `preload` to `auto` in the same commit that the effect below
  // kicks the fetch, so each branch is downloaded exactly once.
  useEffect(() => {
    if (!introStarted || isDataConstrained) return;
    dispatch({ type: 'request-core', core: 'forge' });
    dispatch({ type: 'request-core', core: 'evolve' });
  }, [introStarted, isDataConstrained, dispatch]);

  // Anything the flow has asked for starts buffering. Idempotent per layer.
  useEffect(() => {
    for (const core of requestedCores) requestPreload(core);
  }, [requestedCores, requestPreload]);

  // Chosen branch. Kicked by `branchRunId`, so re-picking the same core replays.
  useEffect(() => {
    if (phase !== 'branch-loading' || !selectedCore) return;

    const el = getElement(selectedCore);
    if (!el) return;

    let cancelled = false;
    requestPreload(selectedCore);
    if (el.error) el.load();
    if (el.currentTime !== 0) el.currentTime = 0;

    void safePlay(el).then((result) => {
      if (!cancelled && result === 'blocked') {
        dispatch({ type: 'fail', message: 'branch-autoplay-blocked' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [phase, selectedCore, branchRunId, getElement, requestPreload, dispatch]);

  /**
   * Parks every layer that should not be running.
   *
   * The layer being buffered during `branch-loading` is deliberately exempt: it
   * is already playing behind the intro's held final frame, and pausing it here
   * would deadlock the hand-off. The intro is paused but never rewound — its
   * final frame is what "CHOOSE ANOTHER CORE" returns to.
   */
  const busyLayer: LayerId | null = phase === 'branch-loading' ? selectedCore : null;

  useEffect(() => {
    const timers: number[] = [];

    for (const id of ['intro', 'forge', 'evolve'] as const) {
      if (id === activeLayer || id === busyLayer) continue;
      const el = getElement(id);
      if (!el) continue;
      if (!el.paused) el.pause();
      // The intro holds its final frame — that is what CHOOSE ANOTHER CORE
      // fades back to. Branches rewind so re-entering one starts clean, but
      // only once they have finished fading out; rewinding immediately would
      // snap the outgoing layer to its first frame while it is still visible.
      if (id !== 'intro' && el.currentTime !== 0) {
        timers.push(
          window.setTimeout(() => {
            el.currentTime = 0;
          }, TIMING.layerFade + 80),
        );
      }
    }

    // Re-picking a branch changes busyLayer, which cancels its pending rewind
    // before it can interrupt playback.
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [activeLayer, busyLayer, getElement]);

  /* -------------------------------------------------- media-set switching */

  // Crossing the mobile breakpoint swaps every source, so the run is restarted
  // rather than left half-playing against the wrong media set.
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    resetPreloads();
    dispatch({ type: 'retry' });
  }, [mode, resetPreloads, dispatch]);

  /* -------------------------------------------------------------- events */

  const handlePlaying = useCallback(
    (id: LayerId) => {
      if (id === 'intro') dispatch({ type: 'intro-started' });
      else if (id === selectedCore) dispatch({ type: 'branch-started' });
    },
    [dispatch, selectedCore],
  );

  const handleEnded = useCallback(
    (id: LayerId) => {
      if (id === 'intro') dispatch({ type: 'intro-ended' });
      else dispatch({ type: 'branch-ended' });
    },
    [dispatch],
  );

  const handleError = useCallback(
    (id: LayerId) => {
      // Only a layer we are actually waiting on should break the experience;
      // a background preload failing must not interrupt what is on screen.
      const isCritical =
        (id === 'intro' && (phase === 'intro-loading' || phase === 'intro-playing')) ||
        (id === selectedCore && phase === 'branch-loading');
      if (isCritical) dispatch({ type: 'fail', message: `media-error:${id}` });
    },
    [dispatch, phase, selectedCore],
  );

  const handleBegin = useCallback(() => {
    // Runs inside the click, so the gesture is still in scope for play().
    const el = getElement('intro');
    if (el) void safePlay(el);
    actions.begin();
  }, [actions, getElement]);

  /* -------------------------------------------------------------- loader */

  const waitingLayer: LayerKey | null =
    phase === 'intro-loading' && !autoplayBlocked
      ? 'intro'
      : phase === 'branch-loading' && selectedCore
        ? selectedCore
        : null;

  const needsLoader = waitingLayer !== null && !readiness[waitingLayer];
  const [loaderVisible, setLoaderVisible] = useState(false);

  // A grace period keeps an already-buffered branch from flashing a spinner.
  useEffect(() => {
    if (!needsLoader) {
      setLoaderVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setLoaderVisible(true), TIMING.loaderGrace);
    return () => window.clearTimeout(timer);
  }, [needsLoader]);

  // Never leave the user watching a spinner forever.
  useEffect(() => {
    if (phase !== 'branch-loading') return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'fail', message: 'branch-stalled' }),
      STALL_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, branchRunId, dispatch]);

  /* -------------------------------------------------------------- render */

  const fallbackPoster =
    phase === 'branch-loading' || phase === 'error'
      ? (selectedCore ? assets[selectedCore].poster : assets.intro.poster)
      : assets.intro.poster;

  const isRunning =
    phase === 'intro-playing' ||
    phase === 'branch-playing-forge' ||
    phase === 'branch-playing-evolve';

  return (
    <main className={styles.root} style={MOTION_VARS}>
      <h1 className={styles.heading}>{COPY.documentHeading}</h1>

      <VideoStage
        key={mode}
        layers={layers}
        activeLayer={activeLayer}
        registerLayer={register}
        markReady={markReady}
        onLayerPlaying={handlePlaying}
        onLayerEnded={handleEnded}
        onLayerError={handleError}
      />

      <p className={styles.brand} aria-hidden="true">
        <span className={styles.brandMark} />
        {COPY.brand}
      </p>

      <ChoiceOverlay
        visible={isChoiceVisible}
        locked={phase !== 'choice-ready'}
        onChoose={actions.choose}
      />

      <EndOverlay
        visible={isEndVisible}
        core={endedCore}
        onChooseAnother={actions.chooseAnother}
        onReplay={actions.replay}
      />

      <LoadingOverlay
        visible={loaderVisible}
        label={phase === 'branch-loading' ? COPY.loadingBranch : COPY.loading}
        blanket={phase === 'intro-loading'}
      />

      <SoundToggle active={isRunning} />

      {phase === 'error' && (
        <PosterFallback kind="error" poster={fallbackPoster} onAction={actions.retry} />
      )}

      {phase !== 'error' && autoplayBlocked && (
        <PosterFallback kind="autoplay-blocked" onAction={handleBegin} />
      )}
    </main>
  );
}
