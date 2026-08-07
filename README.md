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
    experienceConfig.ts   copy, timings, breakpoint, brick anchors
    projectDossier.ts     the informational layer's copy and figures
  hooks/
    useChoiceFlow.ts      the state machine (reducer)
    useMediaMode.ts       desktop vs mobile media set, data-constrained detection
    useVideoPreload.ts    owns the video elements and what downloads when
    useReducedMotion.ts   prefers-reduced-motion
  components/
    BrixcoreExperience.tsx  orchestrator — the only place effects live
    VideoStage.tsx          the three video layers and the cross-fade
    ChoiceOverlay.tsx       CHOOSE YOUR CORE + the two brick-anchored buttons
    EndOverlay.tsx          finale line + CHOOSE ANOTHER CORE / REPLAY FROM START
    InfoPanel.tsx           the project dossier, opened from the end screen
    LoadingOverlay.tsx      the discreet loader
    PosterFallback.tsx      error and autoplay-blocked screens
    SoundToggle.tsx         optional ambient audio
  styles/
    filmFrame.module.css    the shared film-frame geometry
    global.css              tokens and reset
docs/media-report.md      how every video file was verified
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

The video files contain **no audio track**. `SoundToggle` is wired for a separate
`<audio>` element — off by default, started only from a real click, never
autoplayed — but `ambientAudioSrc` in `assetManifest.ts` is `null`, so the control
does not render and no request is made. Point it at a file in
`public/assets/audio/` to enable it.

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
