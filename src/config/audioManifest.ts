import { withBase, type CoreId } from './assetManifest';

/**
 * The score. One piece per layer of the film, mirroring `assetManifest.ts`.
 *
 * Every track was encoded from the delivered masters with a two-pass EBU R128
 * pass (`I=-18 LUFS`, `TP=-1.5 dBTP`) *before* compression. That matters more
 * than it sounds: the three masters arrived between -12.3 and -13.0 LUFS and two
 * of them clipped (+0.29 and +0.25 dBTP), so crossfading straight between them
 * would have stepped in level at every transition. Normalised, they now sit
 * within 0.13 dB of each other and a crossfade is inaudible as a level change.
 *
 * Two encodes per track, offered in preference order:
 *
 *   Opus in WebM — smaller at equal quality, but Safari only decodes it from 17.
 *   AAC in M4A   — universal, and the reason iOS 15/16 still gets a score.
 *
 * Only one of the two is ever downloaded; `canPlayType` picks per engine.
 */

export type ScoreTrackId = 'intro' | CoreId;

export interface AudioSource {
  /** Passed verbatim to `HTMLMediaElement.canPlayType`. */
  readonly type: string;
  readonly src: string;
}

export interface ScoreTrack {
  readonly id: ScoreTrackId;
  /** Most preferred first. */
  readonly sources: readonly AudioSource[];
  /** Verified duration in seconds. */
  readonly duration: number;
}

function track(id: ScoreTrackId, duration: number): ScoreTrack {
  return {
    id,
    duration,
    sources: [
      { type: 'audio/webm; codecs="opus"', src: withBase(`/assets/audio/${id}.webm`) },
      { type: 'audio/mp4; codecs="mp4a.40.2"', src: withBase(`/assets/audio/${id}.m4a`) },
    ],
  };
}

/**
 * Durations are far longer than the picture they sit under — the intro film runs
 * 10 s against 171 s of music, each branch 20 s against ~245 s. That is by
 * design rather than an oversight: the choice screen and the end screen both
 * persist for as long as the viewer leaves them, so the score has to keep going
 * long after the film has stopped. Every track loops, so silence never falls.
 */
export const scoreManifest: Record<ScoreTrackId, ScoreTrack> = {
  intro: track('intro', 170.981),
  forge: track('forge', 249.901),
  evolve: track('evolve', 242.261),
};

export const SCORE_TRACK_IDS: readonly ScoreTrackId[] = ['intro', 'forge', 'evolve'];
