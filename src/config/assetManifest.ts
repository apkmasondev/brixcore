/**
 * Single source of truth for every media URL in the experience.
 *
 * Files live in `public/assets/**` and are served verbatim at `/assets/**`.
 * Every entry below was verified with ffprobe (see `docs/media-report.md`):
 * H.264 High / yuv420p / 24 fps, no audio track, no truncated or black tails.
 */

export type MediaMode = 'desktop' | 'mobile';
export type CoreId = 'forge' | 'evolve';

export interface VideoAsset {
  /** Absolute URL, served from `public/`. */
  readonly src: string;
  /** Poster shown before the first frame decodes and on playback failure. */
  readonly poster: string;
  /** Verified duration in seconds. */
  readonly duration: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  /** Verified frame count. */
  readonly frames: number;
}

export interface ModeAssets {
  readonly intro: VideoAsset;
  readonly forge: VideoAsset;
  readonly evolve: VideoAsset;
}

const POSTERS = {
  intro: '/assets/images/intro-choice-poster.jpg',
  forge: '/assets/images/forge-finale-poster.jpg',
  evolve: '/assets/images/evolve-finale-poster.jpg',
} as const;

export const assetManifest: Record<MediaMode, ModeAssets> = {
  desktop: {
    intro: {
      src: '/assets/video/desktop/clips/01-intro-choice.mp4',
      poster: POSTERS.intro,
      duration: 10,
      width: 1920,
      height: 1080,
      fps: 24,
      frames: 240,
    },
    // Pre-joined 02a + 03a. Playing the combined file avoids a mid-story
    // source swap, which is where inter-scene hitching would otherwise appear.
    forge: {
      src: '/assets/video/desktop/sequences/forge-path-sequence.mp4',
      poster: POSTERS.forge,
      duration: 20,
      width: 1920,
      height: 1080,
      fps: 24,
      frames: 480,
    },
    // Pre-joined 02b + 03b.
    evolve: {
      src: '/assets/video/desktop/sequences/evolve-path-sequence.mp4',
      poster: POSTERS.evolve,
      duration: 20,
      width: 1920,
      height: 1080,
      fps: 24,
      frames: 480,
    },
  },
  mobile: {
    intro: {
      src: '/assets/video/mobile/01-intro-choice-mobile.mp4',
      poster: POSTERS.intro,
      duration: 10,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 240,
    },
    forge: {
      src: '/assets/video/mobile/forge-path-sequence-mobile.mp4',
      poster: POSTERS.forge,
      duration: 20,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 480,
    },
    evolve: {
      src: '/assets/video/mobile/evolve-path-sequence-mobile.mp4',
      poster: POSTERS.evolve,
      duration: 20,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 480,
    },
  },
};

/**
 * Optional ambient score. No audio track ships with the current media package,
 * so this is intentionally `null` — {@link SoundToggle} stays hidden and no
 * request (and therefore no console error) is ever made. Drop a file into
 * `public/assets/audio/` and point this at it to enable sound.
 */
export const ambientAudioSrc: string | null = null;

export function getModeAssets(mode: MediaMode): ModeAssets {
  return assetManifest[mode];
}

export function getBranchAsset(mode: MediaMode, core: CoreId): VideoAsset {
  return assetManifest[mode][core];
}
