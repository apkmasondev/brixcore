/**
 * Copy for the project dossier — the informational layer that opens from the end
 * screen once a path has been watched.
 *
 * Kept here rather than in the component for the same reason as everything in
 * `experienceConfig.ts`: nothing user-visible is hard-coded in `components/`.
 *
 * Every figure below is a real measurement taken from this build — the media
 * verification pass in `docs/media-report.md` and the values in
 * `assetManifest.ts` / `experienceConfig.ts` — not a rounded claim. If one of
 * those changes, the number here changes with it.
 */

export interface DossierSpec {
  readonly label: string;
  readonly value: string;
}

export interface DossierSection {
  /** Two-digit index, rendered in the accent colour. */
  readonly index: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly specs: readonly DossierSpec[];
}

export const DOSSIER = {
  title: 'PROJECT DOSSIER',
  lede: 'An interactive branded short film that fits inside a single screen. One intro, one choice, two endings — with every coordinate in the interface measured from the footage itself.',

  sections: [
    {
      index: '01',
      title: 'THE CONCEPT',
      body: [
        'BRIXCORE opens on a spacecraft built entirely from bricks. It comes apart, and what is left floating are two cores.',
        'FORGE is heat and mass — power taking shape. EVOLVE is intelligence and structure — a city assembling itself out of the same parts. Identical bricks, two futures.',
        'The choice is the product. There is nothing below the film, nothing driven by scroll, and nothing happens until a core is picked.',
      ],
      specs: [
        { label: 'Form', value: 'Interactive branded short film' },
        { label: 'Surface', value: 'One screen · no scroll' },
        { label: 'Paths', value: 'Two · mutually exclusive' },
        { label: 'Run time', value: '~30 s per path' },
      ],
    },
    {
      index: '02',
      title: 'THE EXPERIENCE',
      body: [
        'A ten-second intro plays and stops on its own final frame — held, not faded out. The prompt arrives over that frame a beat later, and the two labels appear tethered to the bricks themselves rather than parked in the corners of the screen.',
        'A pick starts a twenty-second sequence: the core builds, then resolves into its finale. Each path closes on a single line — BUILT TO COMMAND, or BUILD WHAT COMES NEXT.',
        'CHOOSE ANOTHER CORE returns to the held intro frame instead of replaying it, so the film is never shown twice unless it is asked for. REPLAY FROM START resets the run to frame zero.',
      ],
      specs: [
        { label: 'Intro', value: '10 s · 240 frames' },
        { label: 'Each path', value: '20 s · 480 frames' },
        { label: 'Hand-off', value: '420 ms cross-fade' },
        { label: 'Black frames', value: 'None, anywhere' },
      ],
    },
    {
      index: '03',
      title: 'THE MAKING',
      body: [
        'Nothing in the interface was positioned by eye.',
        'All ten video files were verified before a line of interface existed: a full decode to surface damage, an exact frame count rather than a trusted header duration, and a black-frame scan to catch a clip that runs the right length but ends on nothing. Ten of ten came back clean — 24 fps exactly, no audio track, no black tails.',
        "The intro's final frame was then decoded to raw pixels and the orange and cyan clusters isolated. Their centres — 25.9% and 73.9% of frame width — are the coordinates the two labels sit on. The same pass produced the accent colours, sampled from the lit brick faces instead of picked from a swatch.",
        'One figure from that measurement, the outermost brick edge at 17.6%, also decides how far the film is ever allowed to be cropped.',
      ],
      specs: [
        { label: 'Files verified', value: '10 of 10' },
        { label: 'Frame rate', value: '24 fps, exact' },
        { label: 'Black spans found', value: '0' },
        { label: 'FORGE core', value: '25.9% of frame width' },
        { label: 'EVOLVE core', value: '73.9% of frame width' },
        { label: 'Accents sampled', value: '#F2913C · #4FC6E4' },
      ],
    },
    {
      index: '04',
      title: 'THE BUILD',
      body: [
        "React, TypeScript in strict mode, Vite, CSS Modules, and the browser's own video element. No animation library, no state library, no UI framework — two runtime dependencies in total.",
        'The flow is a single reducer with nine named states, so a second click cannot redirect a branch that has already started. Three video elements are mounted at once, each owning one file for its entire life: swapping a source tears the decoder down and paints black for a beat, which is the one thing this experience cannot do. The intro simply stays parked on its final frame.',
        'Preloading is deliberate rather than eager. On desktop both branches begin buffering the moment the intro is genuinely playing, so the fetch never competes with its own first frames. On mobile, under Save-Data, or on a slow connection nothing speculative is fetched at all. Measured in the production build: one request per file, zero cancelled.',
        'Reduced motion, full keyboard operation, a 350 ms grace period before any loader is allowed to appear and a 45-second watchdog behind it are part of the build rather than a pass at the end.',
      ],
      specs: [
        { label: 'Runtime', value: 'React 18 · TypeScript strict' },
        { label: 'Build', value: 'Vite 6 · CSS Modules' },
        { label: 'Runtime dependencies', value: '2' },
        { label: 'Flow states', value: '9, one reducer' },
        { label: 'Video layers', value: '3, cross-faded' },
        { label: 'Per-frame state', value: 'None' },
      ],
    },
    {
      index: '05',
      title: 'DESKTOP & MOBILE',
      body: [
        'Two layouts, not one layout that shrinks.',
        "The film's geometry is declared once and the interface composes the same rule, so the labels stay welded to the bricks at any viewport ratio with nothing measured at runtime. Wider than 16:9 the film overflows vertically; between 4:3 and 16:9 it overflows horizontally; below 4:3 it stops cropping and letterboxes — because past that point a crop would start cutting into a brick.",
        'On desktop each label sits just beneath its own brick, joined to it by a hairline, so the artwork is never covered. In portrait the film letterboxes and the interface moves down into the black band underneath as two large cards — clear of the picture, well past the touch minimum, balanced within that band rather than pinned to the bottom edge.',
        'Below 768 px, and on any touch device up to 1024 px, a separate 720p media set is served. Width alone would miss a phone held in landscape and hand it the 1080p files.',
      ],
      specs: [
        { label: 'Desktop media', value: '1920 × 1080' },
        { label: 'Mobile media', value: '1280 × 720' },
        { label: 'Maximum crop', value: '17.6% per side' },
        { label: 'Portrait targets', value: '170 × 78 px' },
        { label: 'Mobile threshold', value: '768 px · 1024 px on touch' },
      ],
    },
  ] as const satisfies readonly DossierSection[],

  colophon:
    'Every string, timing, breakpoint and brick coordinate in this build lives in a single configuration module — including the text you are reading now.',
} as const;
