# APKMASON BRIXCORE — Choose Your Core

A one-screen, choice-driven cinematic experience. An intro plays, settles on two
floating bricks, and the viewer picks a core: **FORGE** or **EVOLVE**. Each pick
plays its own sequence and ends on its own line.

Not a landing page — there is nothing below the film, and nothing is driven by
scroll.

## Running it

```bash
npm install
```

```bash
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` then a production build into `dist/` |
| `npm run preview` | Serves the production build |
| `npm run lint` | ESLint (flat config, type-aware React rules) |
| `npm run typecheck` | Types only, no emit |

React 18 · Vite 6 · TypeScript (strict) · CSS Modules · native `HTMLVideoElement`.
No animation library, no state library, no UI framework.

## Layout

```
public/assets/            media, served verbatim at /assets/**
src/
  config/
    assetManifest.ts      every media URL + its verified duration/fps/frames
    audioManifest.ts      the three score tracks, two encodes each
    experienceConfig.ts   copy, timings, breakpoint, brick anchors
    projectDossier.ts     the informational layer's copy and figures
  hooks/
    useChoiceFlow.ts      the state machine (reducer)
    useMediaMode.ts       desktop vs mobile media set, data-constrained detection
    useVideoPreload.ts    owns the video elements and what downloads when
    useAudioScore.ts      owns the score: gain graph, crossfades, preload budget
    useReducedMotion.ts   prefers-reduced-motion
  components/
    BrixcoreExperience.tsx  orchestrator — the only place effects live
    VideoStage.tsx          the three video layers and the cross-fade
    ChoiceOverlay.tsx       CHOOSE YOUR CORE + the two brick-anchored buttons
    EndOverlay.tsx          finale line + CHOOSE ANOTHER CORE / REPLAY FROM START
    InfoPanel.tsx           the project dossier, opened from the end screen
    LoadingOverlay.tsx      the discreet loader
    PosterFallback.tsx      error and autoplay-blocked screens
    SoundToggle.tsx         the score's only control (presentational)
  styles/
    filmFrame.module.css    the shared film-frame geometry
    global.css              tokens and reset
docs/media-report.md      how every video file was verified
docs/audio-report.md      how the score was normalised and encoded
```

Every path, string, breakpoint, timing and brick coordinate lives in `config/`.
Nothing is hard-coded in a component.

## The state machine

One reducer, no scattered booleans (`src/hooks/useChoiceFlow.ts`):

```
intro-loading → intro-playing → choice-ready
                                     ↓ choose
                              branch-loading → branch-playing-forge  → branch-ended-forge
                                             → branch-playing-evolve → branch-ended-evolve
                                     ↑                    ↓
                              choose-another ─────────────┘
error  ← any failure, → retry
```

`CHOOSE ANOTHER CORE` returns to `choice-ready`, not to `intro-loading`: the
intro is never re-watched. `REPLAY FROM START` bumps `introRunId` and resets
everything.

`seenCores` is the one piece of state that only ever grows — `replay` and `retry`
deliberately leave it alone. Having watched a path is a fact about the viewer,
not about the current run, and making them earn it back would read as a
punishment for pressing replay.

Guards live in the reducer, so a second click on a choice cannot change the
branch — `choose` is ignored unless the phase is exactly `choice-ready`.

## Three video elements, not one with a swapped `src`

Both approaches were built and measured. The three-element cross-fade won:

- Swapping `src` tears down the decoder, so the element paints black or the
  poster for a beat before the new first frame arrives — exactly the flash this
  experience must not have.
- Each element owns one URL for its whole life, so the first frame of the
  *wrong* branch can never appear.
- The intro element stays parked on its final frame, which makes
  `CHOOSE ANOTHER CORE` an instant fade back instead of a reload.
- The preload budget becomes a per-element attribute instead of scheduling
  logic, and the bytes fetched are the bytes played — no second download through
  a hidden preloader.

The cost is two idle elements. They are paused, never played off-screen, and
released on unmount.

The hand-off has no black frame in it: during `branch-loading` the **intro**
layer stays visible on its final frame, and the branch only becomes visible once
it is genuinely playing. The branch sequences happen to open on the same brick
composition the intro ends on, so the 420 ms cross-fade is essentially invisible.

## The ending

The end screen is staged rather than presented all at once.

**Two beats.** The finale line arrives with the overlay, on the film's held last
frame. The controls hold back a further 900 ms and fade in under it over 520 ms.
A line and a row of buttons appearing together reads as a menu; the same two
beats apart reads as an ending followed by an offer. Measured in the browser:
the controls sit at opacity 0 for the first ~1.2 s, then resolve by ~1.8 s.

**The road not taken.** Under the finale, one quiet line naming the core that was
left behind — `THE EVOLVE CORE IS STILL UNBUILT` — in *that* core's accent. The
thing you did not build should not be wearing the colour of the thing you did.
It turns `CHOOSE ANOTHER CORE` from an item in a menu into unfinished business.

**Both cores seen.** Once every path has been watched through, the end screen
changes without a word of explanation:

| | First path | Both seen |
|---|---|---|
| Headline | the path's own finale | *unchanged* — never taken away |
| Subline | the other core, still unbuilt | `SAME BRICKS. BOTH FUTURES.` |
| Rule | one accent, `clamp(56px, 7vw, 112px)` | both accents, widened |
| Primary action | `CHOOSE ANOTHER CORE` | `RETURN TO THE CORES` |
| Brand mark | 75% opacity | full, with a halo in both accents |

The headline staying put is the point: each path's finale is the payoff of the
sequence just watched, so the completion state sits *under* it rather than
replacing it. Watch FORGE then EVOLVE and you still get `BUILD WHAT COMES NEXT`.

The primary action is relabelled rather than removed. `CHOOSE ANOTHER CORE` is
the fast way back to the held intro frame; dropping it would have made
re-watching a path cost a full intro replay, which is a real loss for a
ceremonial gain.

## The project dossier

The informational layer lives behind the film rather than beside it. There is no
"about" link on the choice screen and none during playback — the only way in is
`ABOUT THIS PROJECT` on an end screen, after a path has actually been watched.

It is a tertiary text link, not a third button: two framed actions plus a quiet
line reads as a hierarchy, three framed actions reads as a menu.

Five sections — concept, the experience, the making, the build, desktop &
mobile — each with prose and a table of the hard numbers. Every figure in it is
a real measurement from this build (`docs/media-report.md`, `assetManifest.ts`,
`experienceConfig.ts`) rather than a rounded claim.

`InfoPanel` is a real modal: it takes focus, traps `Tab`, closes on `Escape` or
`CLOSE`, and hands focus back to the trigger. The scroll region takes focus on
open so arrows and Page Down work without tabbing first, and `overscroll-behavior:
contain` keeps a flick at either end from reaching the document.

The backdrop is opaque rather than a scrim. Finale frames average dark but carry
a lit object and near-white type: at 0.96 the headline underneath ghosted
through the body copy, and at 0.988 it was still legible. Depth comes from a
single radial halo in the accent of the path just watched — which also carries
that path's colour through the whole panel.

Copy lives in `config/projectDossier.ts`, following the same rule as everything
else: nothing user-visible is hard-coded in a component.

## Aligning the UI to the bricks

The choice buttons are positioned in **film coordinates**, not viewport
coordinates. `styles/filmFrame.module.css` defines one rule set that both the
`<video>` layers and the overlay's positioning box `composes:`, so the film and
the UI are guaranteed to share geometry — no measuring, no `ResizeObserver`, no
reverse-engineering `object-fit`:

| Viewport | Behaviour |
|---|---|
| wider than 16:9 | `width: 100%`, overflows vertically (cover) |
| 4:3 – 16:9 | `height: 100%`, overflows horizontally (cover) |
| narrower than 4:3 | `width: 100%`, letterboxes (contain) |

The 4:3 switch is not arbitrary: `cover` at 4:3 crops 12.5 % per side and the
outermost brick edge sits at 17.6 %, so no brick is ever clipped. Anything
narrower letterboxes rather than cropping further.

Brick centres were measured from the actual final frame — 25.9 % and 73.9 % —
see [docs/media-report.md](docs/media-report.md).

## Desktop and mobile are laid out separately

**Desktop / landscape** — labels sit just under each brick, tethered by a
hairline, so the artwork is never covered.

**Portrait** — the film letterboxes (the source is 16:9; cropping it to a phone's
aspect would cut both bricks off entirely). The choice UI moves into the black
band below the film as two 170 × 78 px cards, comfortably above the 44 × 44 px
touch minimum, balanced within that band rather than pinned to the bottom edge.

`100dvh` with `svh`/`vh` fallbacks, `position: fixed` on `<body>`, and
`overscroll-behavior: none` mean the page cannot scroll or rubber-band.

## Preloading

The intro is the critical path and is always eager. Branches download only once
the flow marks them wanted:

- **Desktop** — both branches start buffering as soon as the intro is *playing*,
  so the fetch never competes with the intro's own first frames. Both are
  normally ready well before the choice appears.
- **Mobile, `saveData`, or a 2g/3g-class connection** — nothing speculative.
  Only the chosen branch is fetched, on demand.

Branch elements are rendered as `preload="none"` for their whole life, and
`useVideoPreload` is the single owner of when one starts downloading. That split
matters: letting React also raise the attribute to `auto` raced the imperative
`load()`, and whichever call lost showed up as a cancelled request. Raising
`preload` is what actually starts the fetch in Chromium and Firefox; `load()` is
kept only as a deferred fallback for engines that ignore the change, and runs
solely if nothing has begun buffering 200 ms later.

Verified in the production build: **one request per file, zero cancelled
requests**, and on a mobile viewport the unchosen branch stays at `readyState 0`
for the whole run.

The loader has a 350 ms grace period, so an already-buffered branch never flashes
a spinner. A 45 s watchdog turns a permanently stalled branch into the error
screen rather than an endless spinner.

## Accessibility

- Real `<button>` elements with descriptive `aria-label`s
  ("Choose FORGE — built from fire").
- Focus moves to the choice *group* when the choice appears, and to the primary
  action when an end screen or error appears. The group rather than the first
  button on purpose: Chromium treats a programmatic focus as keyboard-initiated
  until the user has clicked, so focusing the button directly matched
  `:focus-visible` on a fresh load and lit FORGE up as though it were hovered.
  The group is unstyled, announces its label, and puts the next `Tab` on FORGE.
- The dossier is a modal — focus trap, `Escape` to close, focus returned to the
  trigger.
- One consistent `:focus-visible` ring.
- Hidden overlays disable their buttons, so nothing focusable is ever left inside
  an `aria-hidden` subtree.
- `prefers-reduced-motion` collapses UI transitions and stops the loader pulse.
  The film still plays — it is the content, not decoration — it just arrives
  without a dissolve.
- A semantic `<h1>` is present but visually hidden.
- Errors are announced via `role="alert"`; the loader via `role="status"`.

## Failure handling

| Situation | What the viewer sees |
|---|---|
| Video fails to load | Poster, `PLAYBACK UNAVAILABLE`, one line of explanation, `TRY AGAIN` |
| Autoplay refused | Black, the brand mark, `BEGIN EXPERIENCE` (no poster — it would spoil the ending) |
| Branch stalls > 45 s | The error screen |

A failing background preload never interrupts what is on screen — only a layer
the flow is actually waiting on can raise an error.

## Performance notes

- No React state is written per frame. Readiness updates only on discrete media
  events; there is no `timeupdate` handler and no `requestAnimationFrame` loop.
- No `backdrop-filter`, no blurs, no CSS filters over the video. The only overlay
  effect is a single radial-gradient vignette.
- Cross-fades animate `opacity` only.
- `playsInline` (plus the WebKit/X5 variants), `disablePictureInPicture`, and
  `muted` — the media carries no audio track, so `muted` is set once for autoplay
  eligibility and never toggled.
- Listeners are removed on cleanup; unmounted layers are paused and their source
  released.

## Sound

The video files contain **no audio track**. The score is separate: three pieces,
one per layer of the film, crossfaded by `hooks/useAudioScore.ts`.

### Why Web Audio rather than `element.volume`

A `.volume` ramp is the obvious way to fade a media element and it is the wrong
one here: **iOS Safari treats `volume` as read-only.** Assigning it is silently
ignored, because level is the hardware buttons' job. Every fade in this feature
would have been a hard cut on iPhone. Each element is routed through its own
`GainNode` instead, so the fades happen in the audio graph, where every engine
honours them.

### The fades are equal-power, not linear

Two linear ramps crossing sag by about 3 dB through the middle, which between two
pieces of music reads as a dip rather than a dissolve. Each fade follows a
sine/cosine pair, built out of chained short linear ramps — which keeps it
trivially interruptible (cancel, pin the current value, re-schedule) for a viewer
clicking quickly. `setValueCurveAtTime` cannot be cut into safely halfway.

Measured in the browser, intro → FORGE:

| t (ms) | intro | forge | sum of squares |
|---|---|---|---|
| 245 | 0.91 | 0.41 | 1.00 |
| 480 | 0.68 | 0.73 | 0.99 |
| 607 | 0.50 | 0.87 | 1.01 |
| 975 | 0.00 | 1.00 | 1.00 |

Constant power throughout. Switching sound on rides a 1200 ms master fade-in;
switching it off, a 600 ms fade-out, after which every element is paused.

### The score follows the picture, not the click

The target track is `activeLayer` — the same value that decides which video layer
is on screen. During `branch-loading` that deliberately stays on the intro, so
the intro theme keeps playing under the held final frame and the crossfade only
runs once the branch genuinely starts. On desktop, where both branches are
buffered before the choice appears, this is indistinguishable from crossfading on
the click; on a slow connection it is what stops the music from racing ahead of a
spinner. The error screen and the autoplay prompt both fall to silence.

### Never two tracks at once

Exactly one track is ever the target. Everything else is ramped to zero and then
**paused** once silent, rather than left running under a zero gain. The only
overlap is the length of a crossfade, which is what a crossfade is.

### Loudness was fixed before compression

The three masters arrived between -12.3 and -13.0 LUFS and two of them clipped
(+0.29 and +0.25 dBTP). Crossfading straight between them would have stepped in
level at every transition. A two-pass EBU R128 normalisation (`I=-18 LUFS`,
`TP=-1.5 dBTP`) puts them within **0.13 dB** of each other:

| track | duration | source | Opus/WebM | AAC/M4A | in | out |
|---|---|---|---|---|---|---|
| intro | 170.98 s | 3.83 MB | 2.11 MB | 2.76 MB | -12.31 | -17.40 |
| forge | 249.90 s | 5.84 MB | 2.95 MB | 4.05 MB | -12.26 | -17.40 |
| evolve | 242.26 s | 5.32 MB | 3.11 MB | 3.88 MB | -13.01 | -17.53 |

Two encodes per track, chosen per engine with `canPlayType`: Opus in WebM is
smaller at equal quality but Safari only decodes it from 17, so AAC in M4A is
what keeps a score on iOS 15/16. **Only one of the two is ever downloaded** —
verified: no `.m4a` request on Chromium.

Each track runs far longer than the picture it sits under (10 s of intro film
against 171 s of music). That is deliberate: the choice screen and the end screen
both persist for as long as the viewer leaves them, so every track loops and
silence never falls.

### Nothing downloads until sound is switched on

Autoplay policy means a score can never start on its own, so bytes fetched before
the toggle is pressed are bytes most viewers will never hear. Every element
starts at `preload="none"`. The first toggle-on promotes them, on the same budget
as the video:

| | intro | branches |
|---|---|---|
| Desktop | `auto` | both `auto` |
| Mobile / Save-Data / 2g-3g | `auto` | `none` until chosen |

Verified on a 375 px viewport: the unchosen branch finished the run at
`readyState 0`, `networkState 1`, nothing buffered.

Both the `AudioContext` and the first `play()` are started **inside the click**.
A context constructed outside a gesture starts suspended, and iOS only honours
`play()` while the gesture is still in scope — a passive effect is already too
late. A hidden tab suspends the context, so a backgrounded film makes no noise.

### Failure is silence, never an error screen

The film carries the experience; the music is additive. A track that will not
load or will not play is marked failed and skipped — verified by failing a track
and then selecting it: all gains fell to zero, nothing was forced, the film
carried on and the console stayed clean. If the browser has no `AudioContext`, or
can decode neither encode, `SoundToggle` does not render at all.

## A note on the asset folder

`assets/` was moved to `public/assets/` so Vite serves and ships it unprocessed.
The URLs are unchanged (`/assets/video/desktop/clips/01-intro-choice.mp4`), and
the video is copied, not bundled.

Because `public/` ships verbatim, anything left in it is shipped whether or not
the app asks for it. The four source clips behind the joined branch sequences
(`02a`, `02b`, `03a`, `03b`) were never requested at runtime but were being
copied into every build — 33 MB — so they were removed once
[docs/media-report.md](docs/media-report.md) had verified the concatenations
against them. They remain in git history at `b69e3c4`.
