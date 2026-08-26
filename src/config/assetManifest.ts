/**
 * Single source of truth for every media URL in the experience.
 *
 * Files live in `public/assets/**` and are served verbatim at `/assets/**`.
 * Every entry below was verified with ffprobe (see `docs/media-report.md`):
 * H.264 High / yuv420p / 24 fps / 1280×720, no audio track, no truncated or
 * black tails, colour fully tagged bt709.
 *
 * Both media sets are the same resolution. The masters are 720p, so there is no
 * larger picture to serve a desktop; the two sets differ in bitrate instead —
 * see `MOBILE_BREAKPOINT_PX` in `experienceConfig.ts` for who gets which.
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

/** Prefixes a `public/` path with Vite's base, so GitHub Pages sub-paths work. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
}

const POSTERS = {
  intro: withBase('/assets/images/intro-choice-poster.jpg'),
  forge: withBase('/assets/images/forge-finale-poster.jpg'),
  evolve: withBase('/assets/images/evolve-finale-poster.jpg'),
} as const;

export const assetManifest: Record<MediaMode, ModeAssets> = {
  desktop: {
    intro: {
      src: withBase('/assets/video/desktop/clips/01-intro-choice.mp4'),
      poster: POSTERS.intro,
      duration: 10,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 240,
    },
    // Each branch is one 20 s file rather than a build clip followed by a
    // finale clip. Playing a single file avoids a mid-story source swap, which
    // is where inter-scene hitching would otherwise appear.
    forge: {
      src: withBase('/assets/video/desktop/sequences/forge-path-sequence.mp4'),
      poster: POSTERS.forge,
      duration: 20,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 480,
    },
    evolve: {
      src: withBase('/assets/video/desktop/sequences/evolve-path-sequence.mp4'),
      poster: POSTERS.evolve,
      duration: 20,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 480,
    },
  },
  mobile: {
    intro: {
      src: withBase('/assets/video/mobile/01-intro-choice-mobile.mp4'),
      poster: POSTERS.intro,
      duration: 10,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 240,
    },
    forge: {
      src: withBase('/assets/video/mobile/forge-path-sequence-mobile.mp4'),
      poster: POSTERS.forge,
      duration: 20,
      width: 1280,
      height: 720,
      fps: 24,
      frames: 480,
    },
    evolve: {
      src: withBase('/assets/video/mobile/evolve-path-sequence-mobile.mp4'),
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
 * The video files carry no audio track of their own. The score is a separate
 * set of three pieces — see `audioManifest.ts`.
 */

export function getModeAssets(mode: MediaMode): ModeAssets {
  return assetManifest[mode];
}

export function getBranchAsset(mode: MediaMode, core: CoreId): VideoAsset {
  return assetManifest[mode][core];
}
