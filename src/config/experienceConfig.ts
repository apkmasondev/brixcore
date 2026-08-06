import type { CoreId } from './assetManifest';

/**
 * Every tunable number and every user-visible string in one place.
 * Nothing in `components/` or `hooks/` should hard-code copy or thresholds.
 */

/* ------------------------------------------------------------------ layout */

/** Below this viewport width the mobile media set is used. */
export const MOBILE_BREAKPOINT_PX = 768;

/**
 * Touch devices up to this width also get the mobile media set.
 *
 * Width alone is not enough: a phone held in landscape reports ~850 px and would
 * otherwise pull the 1080p files — around 16 MB per branch — over a mobile
 * connection. A coarse pointer at this size means a phone or a small tablet,
 * where the 720p set is the right trade. Desktops report a fine pointer and are
 * unaffected.
 */
export const TOUCH_MOBILE_MAX_WIDTH_PX = 1024;

/**
 * Anchor points for the choice buttons, expressed in **video content
 * coordinates** (percent of the 16:9 frame), not viewport coordinates.
 *
 * Measured from the final frame of `01-intro-choice.mp4` by isolating the
 * orange and cyan pixel clusters:
 *
 *   FORGE  bbox x 17.60%–34.22%, y 39.26%–60.65%  → centre 25.91% / 49.95%
 *   EVOLVE bbox x 65.83%–82.03%, y 39.54%–59.54%  → centre 73.93% / 49.54%
 *
 * The mobile intro is the same composition at 1280×720, so the same numbers
 * apply to both media sets.
 *
 * `labelY` sits just under each brick so the artwork is never covered.
 */
export const BRICK_ANCHORS: Record<CoreId, { x: number; brickBottomY: number; labelY: number }> = {
  forge: { x: 25.9, brickBottomY: 60.7, labelY: 71 },
  evolve: { x: 73.9, brickBottomY: 59.5, labelY: 71 },
};

/**
 * Widest brick extent across both bricks, as percent of frame width.
 * `object-fit: cover` must never crop more than this, or a brick gets cut off —
 * which is why the stage falls back to `contain` below a 4:3 viewport
 * (4:3 crops 12.5% per side, leaving ~5% of headroom).
 */
export const SAFE_CROP_LIMIT_PERCENT = 17.6;

/* -------------------------------------------------------------- timing (ms) */

export const TIMING = {
  /**
   * Cross-fade between video layers. The branch sequences open on the same
   * brick composition the intro ends on, so this only needs to be long enough
   * to hide the seam — anything longer would eat the start of the branch.
   */
  layerFade: 420,
  /** Choice and end-screen reveal. */
  uiReveal: 900,
  /** Beat before overlay UI appears, so the film's last frame reads first. */
  uiRevealDelay: 300,
  /**
   * A branch that becomes playable faster than this never shows a loader —
   * a spinner that flashes for 100 ms looks worse than no spinner at all.
   */
  loaderGrace: 350,
} as const;

/* ---------------------------------------------------------------- preloading */

export const PRELOAD = {
  /**
   * Desktop: begin buffering both branches once the intro is actually playing,
   * so the fetch never competes with the intro's own first frames.
   */
  desktopBranchPreload: 'both',
  /**
   * Mobile / Save-Data: ~7 MB per branch is not something to spend on a guess.
   * Only the chosen branch is fetched, on demand.
   */
  constrainedBranchPreload: 'on-demand',
} as const;

/* --------------------------------------------------------------------- copy */

export const COPY = {
  brand: 'APKMASON BRIXCORE',
  documentHeading: 'APKMASON BRIXCORE — Choose Your Core',

  choicePrompt: 'CHOOSE YOUR CORE',

  cores: {
    forge: {
      label: 'FORGE',
      tagline: 'BUILT FROM FIRE',
      ariaLabel: 'Choose FORGE — built from fire',
      finale: 'BUILT TO COMMAND',
    },
    evolve: {
      label: 'EVOLVE',
      tagline: 'BUILT FOR TOMORROW',
      ariaLabel: 'Choose EVOLVE — built for tomorrow',
      finale: 'BUILD WHAT COMES NEXT',
    },
  },

  endChooseAnother: 'CHOOSE ANOTHER CORE',
  endReplay: 'REPLAY FROM START',

  loading: 'PREPARING',
  loadingBranch: 'ASSEMBLING',

  beginExperience: 'BEGIN EXPERIENCE',
  beginHint: 'Your browser paused autoplay',

  errorTitle: 'PLAYBACK UNAVAILABLE',
  errorBody: 'The sequence could not be loaded. Check your connection and try again.',
  errorRetry: 'TRY AGAIN',

  soundOn: 'Sound on',
  soundOff: 'Sound off',
} as const;

export const CORE_ORDER: readonly CoreId[] = ['forge', 'evolve'];
