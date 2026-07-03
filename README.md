# Signal 9 Tempo Scanner

Signal 9 Tempo Scanner is a focused Signal 9 utility for tapping BPM, scanning audio tempo through the microphone, and identifying musical key.

It uses the Plantasonic Design System as its foundation, then applies the Signal 9 `.s9-themed` layer to align the interface with the larger Signal 9 ecosystem.

## Overview

Signal 9 Tempo Scanner is an in-world audio analysis instrument — not a generic music app. It acquires rhythm, tempo, and harmonic signal from nearby audio transmission using manual tap input, microphone scan, and key detection.

The interface uses operational terminal language, equipment bay layout, ASCII signal graphics, and subtle GSAP motion for state feedback. Everything runs in the browser with no backend.

## Features

- **Manual tap BPM** — space bar or Mark Beat button with rhythm lock display
- **Microphone BPM scan** — live tempo detection via Open/Close Carrier
- **Musical key detection** — harmonic lock readout with alternate matches
- **Signal 9 ASCII logo** — Figlet wordmark from the Signal 9 intro screen
- **ASCII frequency monitor** — equalizer strip for standby, tap, and mic scan states
- **Signal lock meter** — tempo stability readout (tap consistency or mic confidence)
- **Tap rhythm grid** — visual tap history across 16 slots
- **Key scan readout** — harmonic scan status and confidence meter
- **Panel state badges** — STANDBY, SEARCHING, LOCKED, etc. on equipment bays
- **Preset themes** — broadcast, interference, jammer, uplink, blackout
- **GSAP motion layer** — startup reveal, tap pulse, mic scan pulse, button feedback
- **Style guide** — live token and component reference at `styleguide.html`

## Design System Structure

This app uses the Plantasonic Design System as its foundation and applies the Signal 9 visual layer through `.s9-themed`.

```text
Plantasonic DS tokens (ds-variables.css)
  → Signal 9 theme bridge (signal9-theme.css)
  → Signal 9 preset themes (preset-themes.css)
  → Signal 9 startup visuals (startup.css)
  → Signal 9 components (s9-components.css)
  → Tempo Scanner app layout (styles.css)
  → GSAP motion layer (js/s9-motion.js)
```

CSS load order:

1. `ds-variables.css` — Base Plantasonic design tokens.
2. `signal9-theme.css` — Signal 9 token bridge and global theme overrides.
3. `preset-themes.css` — Signal 9 preset variations.
4. `startup.css` — Signal 9 startup and boot screen visuals.
5. `s9-components.css` — Reusable Signal 9 components.
6. `styles.css` — Tempo Scanner app-specific layout and responsive structure.

The style guide adds `styleguide.css` after `styles.css`.

Naming rules:

| Prefix | Scope |
|--------|-------|
| `ds-*` | Plantasonic foundation |
| `s9-*` | Reusable Signal 9 system |
| `tempo-*` | Tempo Scanner app only |
| `bpm-*` | Technical BPM behavior only |
| `sg-*` | Style guide only |

Switch palettes by changing `data-s9-preset` on `<html>`: `broadcast`, `interference`, `jammer`, `uplink`, `blackout`.

## File Structure

```text
bpm/
  index.html
  styleguide.html
  README.md
  ROADMAP.md
  ART_DIRECTION.md
  UI_PRINCIPLES.md
  CURSOR_RULES.md
  CHANGELOG.md
  scripts/
    sync-s9-styles.sh
  css/
    ds-variables.css
    signal9-theme.css
    preset-themes.css
    startup.css
    s9-components.css
    styles.css
    styleguide.css
  js/
    main.js
    terminal-copy.js
    ascii-visuals.js
    s9-motion.js
    styleguide.js
    tap-bpm.js
    mic-input.js
    bpm-detector.js
    key-detector.js
    audio-utils.js
```

## Local Usage

Clone the repo and serve it locally. JavaScript modules and microphone access require a local server — do not open `index.html` directly.

```bash
git clone https://github.com/nate-thousand/bpm.git
cd bpm
python3 -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173) · [Style Guide](http://localhost:5173/styleguide.html)

### Live Server (optional)

Install the Live Server extension in VS Code or Cursor, then run `index.html` with Live Server.

## Syncing styles with Signal 9

Theme CSS is copied from **signal-9-live-eq** (canonical for theme files). To refresh:

```bash
./scripts/sync-s9-styles.sh
```

The ASCII logo art matches `signal-9-live-eq/src/startup/signal9LogoArt.ts`.

GSAP is loaded via CDN ESM import in `js/s9-motion.js` — no build step required.

## Notes

Manual tap input is the most reliable tempo acquisition method.

Mic scan tempo detection is approximate. It works best with clear drums, steady rhythm signal, and limited background noise.

Key detection is approximate. It works best with chords or melodic material and several seconds of clean audio.

## No backend

The scanner runs in the browser only. It does not upload audio or save data.

## Documentation

- [ART_DIRECTION.md](ART_DIRECTION.md) — visual boundary for Signal 9 screens
- [art-direction.html](art-direction.html) — Art Direction (HTML)
- [UI_PRINCIPLES.md](UI_PRINCIPLES.md) — operational UI rules
- [ui-principles.html](ui-principles.html) — UI Principles (HTML)
- [CURSOR_RULES.md](CURSOR_RULES.md) — agent and contributor constraints
- [ROADMAP.md](ROADMAP.md) — feature phases and definition of done
- [roadmap.html](roadmap.html) — Roadmap (HTML)
- [CHANGELOG.md](CHANGELOG.md) — release history
- [readme.html](readme.html) — project overview (HTML)
- [styleguide.html](styleguide.html) — live token and component reference

## GitHub Push Checklist

Before pushing to GitHub, confirm:

- [ ] App title is **Signal 9 Tempo Scanner** (`<title>` and sr-only heading)
- [ ] README, ROADMAP, and style guide use the correct product name
- [ ] No old product names (`BPM App`, `BPM Scanner`, etc.) in visible copy
- [ ] CSS load order unchanged; `.s9-themed` on `<html>`
- [ ] `ds-variables.css` not edited for Signal 9-specific styling
- [ ] Tap BPM works (button + space bar)
- [ ] Mic scan UI renders; key detection does not fake results
- [ ] ASCII logo, equalizer, signal lock, rhythm grid, and key scan appear in app and style guide
- [ ] GSAP motion runs; reduced motion is respected
- [ ] No junk files (`.DS_Store`, `__MACOSX`, `._*`, zips)
- [ ] `.gitignore` covers OS and env artifacts
- [ ] Browser console is clean on `index.html` and `styleguide.html`
