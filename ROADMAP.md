# Signal 9 Tempo Scanner Roadmap

## Current Scope

Signal 9 Tempo Scanner is a lightweight audio utility inside the Signal 9 ecosystem.

It supports:

- Keyboard space bar tap BPM
- Manual tap BPM input (Mark Beat button)
- Microphone BPM scan
- Musical key detection
- Signal 9 ASCII logo
- ASCII equalizer graphics
- Signal lock meter
- Tap rhythm grid
- Key scan visual readout
- Signal 9 / Plantasonic design system alignment
- GSAP motion enhancement layer
- Style guide and documentation

The scanner runs in the browser only — no framework, backend, database, or accounts.

## Non Goals

Do not turn this into a game.

Do not add AI chat.

Do not add missions, inventory, characters, or backend services.

Do not redesign the UI from scratch.

Do not remove `.s9-themed`.

Do not edit Plantasonic DS tokens for Signal 9-specific styling.

Do not fake BPM, mic, or key detection results.

Do not add song libraries, playlists, streaming integrations, or heavy visualizers.

## Phase 1 Complete

- App renamed to **Signal 9 Tempo Scanner**
- Signal 9 mythos copy added (`js/terminal-copy.js`)
- Signal 9 ASCII logo added (Figlet from `signal9LogoArt.ts`)
- Equipment bay layout — Rhythm Signal, Audio Scan, Key Detection
- Signal Health Strip with transmission status and input level
- ASCII equalizer and signal graphics (`js/ascii-visuals.js`)
- GSAP motion layer (`js/s9-motion.js`)
- Art direction and UI principles documentation expanded
- Style guide created and updated
- Repo cleaned for GitHub

## Future Phases

### Phase 2: Real Audio Analysis Hardening

- Confirm mic BPM detection accuracy across genres and room conditions
- Improve tempo confidence scoring
- Clarify scan states (searching, degraded, locked)
- Improve key detection accuracy
- Add failure states for low signal / noisy input
- Formal browser test pass (Phase 7 checklist from original roadmap)

### Phase 3: Signal 9 Ecosystem Reuse

- Extract shared Signal 9 ASCII components for reuse across utilities
- Reuse the Signal 9 logo module across apps
- Align with other Signal 9 utilities (signal-9-live-eq)
- Document shared component contracts
- Keep theme sync via `scripts/sync-s9-styles.sh`

### Phase 4: Product Polish

- Responsive QA across mobile and desktop
- Keyboard accessibility audit
- Reduced motion QA
- Style guide screenshots
- GitHub Pages deployment
- Optional: manual BPM nudge, half/double-time suggestions, Camelot notation toggle

## Known Limitations

**Manual tap input** is reliable when marks are consistent. Accuracy drops with uneven intervals or tempo changes mid-session.

**Mic scan tempo detection** is approximate. Accuracy depends on room noise, microphone quality, music volume, drum clarity, tempo stability, and arrangement.

**Key detection** is approximate and should be treated as a helpful estimate. Accuracy depends on harmonic clarity, background noise, vocals, chord complexity, bass-heavy mixes, key changes, and microphone quality. The app shows `NO LOCK` when confidence is too low.

## Locked Design Rule

The visual system (colors, typography, spacing, button styles, tokens, presets) is approved and locked.

Operational alignment with Signal 9 art direction is permitted: copy, panel states, telemetry framing, ASCII graphics, and GSAP motion feedback.

Do not change `--s9-*` token values, preset palettes, grid column proportions, spacing scale, or typography scale without explicit approval.
