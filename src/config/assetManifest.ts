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
      width: 1920,
      height: 1080,
      fps: 24,
      frames: 240,
    },
    // Pre-joined from the 02a + 03a source clips, which is why they are no
    // longer in the repo — `public/` ships verbatim, and 33 MB that nothing
    // ever requests was 33 MB of dead weight in every build. See
    // `docs/media-report.md` for the concatenation check, and git history
    // (commit b69e3c4) if the sources are ever needed again.
    //
    // Playing the combined file avoids a mid-story source swap, which is where
    // inter-scene hitching would otherwise appear.
    forge: {
      src: withBase('/assets/video/desktop/sequences/forge-path-sequence.mp4'),
      poster: POSTERS.forge,
      duration: 20,
      width: 1920,
      height: 1080,
      fps: 24,
      frames: 480,
    },
    // Pre-joined 02b + 03b.
    evolve: {
      src: withBase('/assets/video/desktop/sequences/evolve-path-sequence.mp4'),
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
