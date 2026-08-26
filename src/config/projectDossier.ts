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
        'BRIXCORE opens inside a drift of grey bricks with nowhere to be. The camera pushes through them, and what it finds at the centre are two lit cores.',
        'FORGE is pressure. It drags the loose bricks inward, crushes them into a molten mass and comes out the other side as one forged monolith. EVOLVE is the opposite motion: a single brick branches, and branches again, until it has grown into a symmetrical bloom. Same bricks, opposite physics.',
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
        'Every master was verified before a line of interface was touched: a full decode to surface damage, an exact frame count rather than a trusted header duration, and a black-frame scan to catch a clip that runs the right length but ends on nothing. Three of three came back clean — 24 fps exactly, 240 and 480 frames on the nose, no black tails. The audio the generator attached was dropped; the score is separate.',
        "The intro's final frame was then decoded to raw pixels and split into bright objects, and the two largest taken. The separation is total: every one of the 11,878 orange pixels falls inside one, all 20,521 cyan pixels inside the other. Their centres — 37.1% and 62.8% of frame width — are the coordinates the two labels sit on, and the two mirror each other to within 0.12%, which is what says the measurement found the composition rather than fitted it.",
        'The same pass re-checked the accent colours against the new footage. The lit brick faces read 24.6° and 190.3° in hue; the accents already in the build sit at 28.0° and 192.1°. A few degrees apart, so they were kept — the measurement was worth taking to find that out, not to change anything.',
        'One figure from that measurement, the outermost brick edge at 27.7%, also decides how far the film is ever allowed to be cropped.',
        'The films that ship are not the masters. Re-encoded at constant quality, with the quantiser biased toward the dark frames this footage is almost entirely made of, a full desktop run fell from 25.6 MB to 14.3 MB. The intro was left alone: its master was already lean enough that every re-encode came out larger, so it ships as an untouched copy of the original stream with the audio stripped — the one file in the set that is mathematically identical to what came out of the generator.',
        'Quality was read against a ceiling rather than against 100. Scored against itself, this footage tops out at 99.6 rather than a perfect 100, so that is the number the encodes are measured from: the desktop set lands between 98.1 and 99.6.',
      ],
      specs: [
        { label: 'Masters verified', value: '3 of 3' },
        { label: 'Frame rate', value: '24 fps, exact' },
        { label: 'Black spans found', value: '0' },
        { label: 'FORGE core', value: '37.1% of frame width' },
        { label: 'EVOLVE core', value: '62.8% of frame width' },
        { label: 'Symmetry error', value: '0.12% of frame width' },
        { label: 'Accents re-checked', value: '#F2913C · #4FC6E4, kept' },
        { label: 'Desktop payload', value: '25.6 MB → 14.3 MB' },
        { label: 'VMAF vs master', value: '98.1—99.6, ceiling 99.6' },
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
        'Below 768 px, and on any touch device up to 1024 px, a lighter media set is served. The masters are 720p, so there is no larger picture to hand a desktop — the two sets are the same size and differ in bitrate instead, which on this footage measured better than shipping a smaller picture. Width alone would miss a phone held in landscape and hand it the heavier files.',
      ],
      specs: [
        { label: 'Both media sets', value: '1280 × 720' },
        { label: 'Split by', value: 'Bitrate, not resolution' },
        { label: 'Maximum crop', value: '27.7% per side' },
        { label: 'Portrait targets', value: '170 × 78 px' },
        { label: 'Mobile threshold', value: '768 px · 1024 px on touch' },
      ],
    },
  ] as const satisfies readonly DossierSection[],

  colophon:
    'Every string, timing, breakpoint and brick coordinate in this build lives in a single configuration module — including the text you are reading now.',
} as const;
