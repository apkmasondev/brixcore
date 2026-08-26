# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Because the deliverable is a film as much as it is a build, "changed" here covers
the picture too — a new cut is a breaking change to everything measured from it.

## [2.0.0] — 2026-08-26

An entirely new film, and every number measured from the old one re-derived.

### Changed

- **New film, new concept.** The spacecraft that came apart is gone. The intro
  now opens inside a drift of grey bricks and pushes through them to find the two
  lit cores. The branches are built on opposite physics rather than two variants
  of the same assembly: FORGE drags the loose bricks inward, crushes them and
  forges a single monolith; EVOLVE branches outward from one brick into a
  symmetrical bloom.
- **Both media sets are now 1280×720.** The masters are 720p, so there is no
  larger picture to serve a desktop and upscaling would ship invented pixels. The
  desktop/mobile split is now bitrate (CRF 20 / CRF 24) rather than resolution.
  Measured: a 960×540 mobile tier came out *both* bigger and worse than staying
  at 720p and raising CRF, because this footage is fine detail nearly everywhere.
- **Brick anchors re-measured** — FORGE moved 25.9 % → **37.1 %** of frame width,
  EVOLVE 73.9 % → **62.8 %**. The new composition holds the bricks much closer to
  centre. The two mirror each other to within 0.12 %, which is the check that the
  measurement found the composition rather than fitted it.
- **Safe crop limit** 17.6 % → **27.7 %** per side. `cover` now stays safe down to
  a ~0.79 viewport aspect; the letterbox switch stays at 4:3 because that is also
  where the portrait layout takes over.
- **`labelY`** 71 % → **72.5 %**, following the bricks down (their bottom edge
  moved from ~60 % to ~63.9 %).
- **Posters** regenerated from the new final frames, now 1280×720.
- **Video layer descriptions** rewritten — the old ones described a spacecraft, a
  molten creature and a futuristic city, none of which are in the film any more.
- **Project dossier and README** updated throughout to match the new picture and
  the new measurements.

### Added

- **A measured VMAF ceiling.** Scored against itself this footage returns
  **99.63**, not 100, so encodes are now read against that rather than against a
  perfect score. The control: a file compared with itself must return the
  ceiling, and a bit-exact copy must return the same number as its source.
- **`CHANGELOG.md`** — this file.

### Fixed

- **Colour tagging was incomplete on every file shipped in 1.1.0.** On ffmpeg 9
  the plain `-color_primaries / -color_trc / -colorspace` output flags tag only
  the primaries and leave transfer and matrix `unknown` — and can additionally
  trigger a real pixel conversion rather than a pure retag. Replaced with the
  `setparams` filter, verified to leave the decoded output bit-identical (same
  MD5). Every shipped file now reports `tv / bt709 / bt709 / bt709`.
- **Two bugs in the quality measurement itself**, both of which had been quietly
  understating quality:
  - masters carry an audio track, so their container runs 10.005 s against the
    encode's 10.000 s; libvmaf drifted out of frame alignment near the tail.
    Timestamps are now rebuilt from the frame index on both sides.
  - scoring a colour-tagged encode against an untagged master made ffmpeg insert
    a conversion inside the comparison. Both sides are now forced to identical
    colour parameters.
- **Choice labels could be clipped by the bottom of a short, wide window.** The
  label is placed as a percentage of the *film*, and past 16:9 the film is taller
  than the window. Pre-existing — 1920×480 clipped by 15 px in 1.1.0 — and
  widened by the anchors moving down. The short-landscape rule that shrinks the
  chrome now starts at 560 px of height instead of 460 px, and `labelY` was
  tuned against it.

### Removed

- The film's own AAC audio tracks, which the generator attaches and the
  experience never uses. The score has always been separate.

## [1.1.0] — 2026-08-25

### Changed

- Re-encoded the delivered film from archive-grade masters: **56.3 MB → 37.3 MB
  (−34 %)** at CRF 23, `preset veryslow`, `aq-mode=3`, a fixed 5 s GOP and
  `+faststart`, holding a mean VMAF of 97.9–98.4 on desktop.
- The 720p set was rebuilt from the 1080p masters rather than re-encoding the
  shipped 720p files, so it carried one generation of loss instead of two.

## [1.0.0] — 2026-08-07

### Added

- The experience: one intro, one choice, two branches, a staged end screen and a
  completion state once both paths have been seen.
- A Web Audio score engine with equal-power crossfades, two encodes per track
  (Opus/WebM and AAC/M4A) chosen per engine, and loudness normalised to
  −18 LUFS.
- The project dossier.
- Deployment to GitHub Pages via GitHub Actions.

[2.0.0]: https://github.com/apkmasondev/brixcore/compare/81f78b0...HEAD
[1.1.0]: https://github.com/apkmasondev/brixcore/compare/dc8bea5...81f78b0
[1.0.0]: https://github.com/apkmasondev/brixcore/releases/tag/dc8bea5
