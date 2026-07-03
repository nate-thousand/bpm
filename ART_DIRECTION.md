# Signal 9 Art Direction

Signal 9 should look like resistance infrastructure: field radios, rack gear, avionics panels, CRT monitors, signal analyzers, battered broadcast decks, packet diagnostics, and improvised archive machines.

This is not a redesign brief. It is the art-direction boundary for Signal 9 screens, field utilities, Figma concepts, v0 prompts, and CSS/theme decisions in this repo.

**Art Direction** defines what Signal 9 should look and feel like. **[UI Principles](UI_PRINCIPLES.md)** defines how UI behaves and is structured. **[styleguide.html](styleguide.html)** shows live tokens and components.

## Scope

This document governs:

- Signal 9 game HUD and home screens
- Signal 9 field utilities (including **Signal 9 Tempo Scanner**)
- Figma concepts and v0 generation prompts
- Theme and atmosphere decisions in the CSS stack

It does not replace component specs or implementation rules — those live in UI Principles and the style guide.

## Tempo Scanner Identity

**Signal 9 Tempo Scanner** is not a generic music utility. It is an in-world audio analysis instrument — a field scanner for rhythm signal, tempo lock, and harmonic decode.

It should feel like retro broadcast equipment, a terminal scanner, and a rhythm signal monitor. Operators use it to acquire tempo and key from nearby transmission, not to browse a music library.

## Visual Keywords

- Retro broadcast terminal
- Audio signal scanner
- ASCII frequency monitor
- Dark interface
- Purple Signal 9 glow
- Minimal utility panel
- Field equipment
- Oscilloscope grid and CRT atmosphere
- No cartoon effects
- No generic music app styling

## Copy Tone

Use:

- Tempo signal awaiting input.
- Manual tap channel armed.
- Mic scan standing by.
- Key detection pending.
- Rhythm lock active.
- Frequency monitor online.
- CARRIER STANDBY / ACQUIRING SIGNAL / STRONG LOCK

Avoid:

- Welcome to the coolest BPM app.
- Fun music tool.
- AI-powered magic detector.
- Generic BPM calculator.
- Your dashboard / Start listening

## North Star

The player is operating illegal analog communications equipment inside hostile digital territory.

Every visual choice should reinforce:

- Music is civilization.
- Memory is resistance.
- Analog systems preserve individuality.
- Digital systems optimize conformity.

The world is not “retro” for style. It is analog because analog memory is harder to normalize, erase, and centralize.

## Theme Architecture

Signal 9 visual identity is implemented through a layered CSS stack. Do not flatten or merge these layers.

```text
Plantasonic DS tokens (ds-variables.css)
  → Signal 9 semantic bridge (--s9-* in signal9-theme.css)
  → Preset palettes (data-s9-preset in preset-themes.css)
  → Portable components (s9-components.css)
  → App layout (styles.css)
  → GSAP motion layer (js/s9-motion.js)
```

Rules:

- Signal 9 color and atmosphere live in `--s9-*` tokens, bridged at runtime via `.s9-themed` on `<html>`
- Do not move Signal 9 tokens into `ds-variables.css` or edit DS source files for S9-specific styling
- Do not remove or reorder the stylesheet stack documented in [README.md](README.md)
- Presets shift carrier identity; they do not change layout or component structure

Sync shared theme files from signal-9-live-eq via [scripts/sync-s9-styles.sh](scripts/sync-s9-styles.sh).

## Visual Sources

Primary references:

- Shortwave radio consoles
- Pirate radio stations
- Military avionics displays
- Rack-mounted broadcast processors
- Oscilloscopes
- Spectrum analyzers
- Packet analyzers
- CRT terminals
- Tape decks
- Vinyl equipment
- Signal intelligence workstations
- Industrial diagnostic panels
- Electronic warfare systems

Secondary references:

- Archive rooms
- Field repair kits
- Number stations
- Emergency broadcast systems
- Amateur radio logs
- Underground music flyers
- War-room telemetry

Avoid references rooted in:

- Consumer electronics product pages
- SaaS dashboards
- Mobile app UI kits
- Lifestyle music apps
- Streaming service interfaces
- Generic cyberpunk neon
- Frosted glass app shells

## Surface Quality

Surfaces should feel functional and material:

- Matte black equipment casings
- CRT phosphor
- Printed labels
- Worn but legible panel markings
- Metal or Bakelite control logic
- Dust, heat, and signal wear
- Burned-in terminal traces
- Tape and archive labels
- Rack screws, seams, and service panels

Wear should be meaningful. Use damage where hands touch controls, where equipment overheats, where tape labels are replaced, or where signal corruption appears. Avoid random grunge.

## Shape Language

Use shapes that feel engineered:

- Rectangular modules
- Rack-unit proportions
- Terminal cells
- Oscilloscope grids
- Meter bays
- Dense control rows
- Hinged panel logic
- Patch fields
- Diagnostic slots
- Industrial labels

Avoid:

- Friendly rounded cards
- Floating blobs
- App-store pill clusters
- Decorative glass sheets
- Hero marketing curves
- Generic analytics dashboard modules

Rounded corners may exist, but they should feel like equipment casing radius (`--s9-radius-sm/md/lg`), not consumer softness.

## Color Direction

The dominant field is dark, technical, and restrained. Color appears as signal, not decoration.

Core moods:

- Black and near-black equipment space
- Violet and ultraviolet Signal 9 identity
- Phosphor cyan or green for recovered signal
- Amber for warnings, warm hardware, or archive lamps
- Red for hostile intrusion, carrier failure, or system danger
- Desaturated gray for offline, dead, or archived states

Do not over-light the interface. Brightness should feel powered by signal events.

### Token mapping

| Art-direction intent | Semantic token(s) |
|----------------------|-------------------|
| Equipment field | `--s9-bg`, `--s9-stage`, `--s9-surface`, `--s9-surface-elevated` |
| Carrier identity | `--s9-signal`, `--s9-transmission`, `--s9-accent` |
| Recovered / corrupt signal | `--s9-interference`, `--s9-static` |
| Warning / intrusion | `--s9-warning`, `--s9-danger` |
| Offline / dead | `--s9-offline`, `--s9-text-muted` |
| Primary readout text | `--s9-text`, `--s9-text-secondary` |
| Active readout glow | `--s9-glow-soft`, `--s9-glow`, `--s9-glow-strong` |

Live swatches and preset previews: [styleguide.html](styleguide.html).

## Texture And Noise

Texture should be tied to source:

- RF static
- CRT scanlines
- Magnetic tape noise
- Dither
- Compression damage
- Signal ghosting
- Analog bloom
- Dropout
- Data corruption
- Printed label wear

Avoid decorative overlays that do not map to a signal or material explanation.

### Implementation map

| Material source | CSS implementation |
|-----------------|-------------------|
| Oscilloscope grid | `--s9-grid-line` on `.s9-app-shell` background |
| CRT scanlines | `--s9-scanline-color` pseudo-element overlay on shell |
| RF static | `--s9-noise-dot` radial noise overlay |
| Signal bloom | `--s9-glow-*` on readouts, panel titles, ASCII logo |
| Startup identity | [css/startup.css](css/startup.css) — sweep, interference, fade, grid drift |

Atmosphere overlays are non-interactive. Critical readouts and controls must remain legible beneath them.

## Typography

Typography should read as equipment labeling, not marketing.

- HUD labels, codenames, panel titles: mono via `--s9-font-hud` and `--s9-font-display`
- Body and hint copy: sans via `--s9-font-body`
- Panel titles and status: uppercase, letter-spaced
- Numeric readouts: tabular figures, mono display font
- No friendly rounded UI fonts, no hero marketing display type

## Motion

Motion is signal-driven, not decorative.

- Preset palette crossfade: `--s9-slow` (420ms)
- Control response: `--s9-fast` (120ms) on buttons and borders
- Normal state transitions: `--s9-normal` (220ms)
- Logo pulse and startup fades: keyframes in [css/startup.css](css/startup.css) and [css/s9-components.css](css/s9-components.css)
- `prefers-reduced-motion`: disable decorative animation; panel states and labels remain readable via text

Avoid motion that only signals “this is interactive.” If motion cannot be explained as signal, hardware, or state change, remove it.

## Preset Palettes

Presets (`data-s9-preset` on `<html>`) shift the carrier palette without changing layout. Each preset is a narrative transmission condition:

| Preset | Fiction |
|--------|---------|
| `broadcast` | Default violet carrier — Atmo Beats transmission |
| `interference` | Cold static cyan corruption — Dead Wave |
| `jammer` | Fuchsia pulse interference — Ghost Shadow |
| `uplink` | Emerald data stream — Dust & Data |
| `blackout` | Collapsed void, heavy threshold — signal nearly lost |

Derived atmosphere tokens (`--s9-grid-line`, `--s9-scanline-color`, `--s9-noise-dot`) recompute per preset from the active carrier color.

## Image Treatment

Images are recovered memory. Treat them as decoded artifacts.

Use:

- Thresholding
- Dither
- Scanline reconstruction
- Contrast recovery
- Channel drift
- Ghost frames
- Cropped broadcast frames
- Metadata slugs
- Signal provenance labels
- Partial loss

Do not use glossy thumbnails, clean hero imagery, or social-media-style cards unless the fiction specifically calls for a pristine recovered source.

## ASCII Treatment

ASCII is a material, not an effect. It is the visible form of low-bandwidth reconstruction.

Use ASCII for:

- Identity marks
- Recovered portraits
- Video-to-ASCII transmissions
- Signal signatures
- Memory previews
- System boot states
- Corruption states

ASCII should remain legible and meaningful. Avoid random glyph showers unless they represent diagnostic output, packet loss, or active decoding.

### Identity mark

The canonical Signal 9 logo is a Figlet slant wordmark:

- **Source art:** `signal-9-live-eq/src/startup/signal9LogoArt.ts`
- **Static markup:** `.s9-ascii-logo` + `.s9-ascii-logo__output--static` (used on Tempo Scanner header)
- **Animated variant:** ASCII Visual Engine on intro/title screens in signal-9-live-eq
- **Styles:** [css/s9-components.css](css/s9-components.css) — signal color, glow, mono font, responsive scale

Rules for the identity mark:

- Preserve ASCII spacing exactly — do not substitute with an image or SVG wordmark
- Use `--s9-signal` color and `--s9-glow` text-shadow
- Scale down on small viewports; contain horizontal overflow within the logo block
- Do not animate the static utility header unless reduced-motion is respected

## Environmental Storytelling

Tell the world through operating details:

- Relay names
- Callsigns
- Frequency bands
- Repair marks
- Archive stamps
- Memory provenance
- Warning codes
- Signal paths
- Recovered medium type
- Jammer state
- Surveillance pressure

Text and labels should feel placed by operators, not marketers.

Operational copy examples (from [js/terminal-copy.js](js/terminal-copy.js)):

- Use: `CARRIER STANDBY`, `ACQUIRING SIGNAL`, `STRONG LOCK`, `NO LOCK`, `OPEN CARRIER`
- Avoid: `Welcome back`, `Start Listening`, `Your dashboard`, `Tap to continue`

Full terminal language do/don't: [UI_PRINCIPLES.md](UI_PRINCIPLES.md) and [styleguide.html](styleguide.html).

## Project Digital Harmony Contrast

Project Digital Harmony should feel clean, optimized, flattening, and coercive when it appears.

Visual contrast:

- Signal 9: analog, dense, repairable, human, noisy, modular.
- Digital Harmony: smooth, sterile, predictive, centralized, over-normalized.

Do not let Signal 9 accidentally adopt Digital Harmony’s visual language.

## Screen Composition

Screens should feel like workstations:

- A persistent operational frame
- A central signal or mission workspace
- Supporting equipment modules
- Continuous telemetry
- Clear alert and lock states

Avoid page layouts that prioritize visual hierarchy like a website. Prioritize operational hierarchy: what needs monitoring, what needs tuning, what is transmitting, what is threatened.

Panel state badges (`STANDBY`, `SEARCHING`, `LOCKED`, `DEGRADED`, etc.) are part of composition — never rely on color alone.

### Tempo Scanner frame

[Signal 9 Tempo Scanner](index.html) demonstrates the workstation model at utility scale:

```text
Identity header     .tempo-scanner-header — ASCII logo + field utility kicker
Status rail         .s9-status-rail — transmission status + input level
Equipment bays      Rhythm Signal | Audio Scan | Key Detection
Footer telemetry    local processing readout
```

Each equipment bay exposes live panel state via `.s9-broadcast__panel-state` and `data-panel-state`.

## Art Direction Checklist

Before approving a visual direction:

- Does it feel like equipment?
- Is every effect tied to signal, memory, hardware, or surveillance?
- Does it avoid modern SaaS and consumer app patterns?
- Does it make music and memory feel culturally important?
- Does it preserve Signal 9 as analog resistance infrastructure?
- Can a future developer implement it with existing Signal 9 theme ownership?

## Reference Implementation

### Signal 9 Tempo Scanner

[index.html](index.html) is the in-repo reference for applying this art direction to a focused field utility — tempo scanning, rhythm signal acquisition, and harmonic key detection.

It demonstrates:

- Figlet ASCII identity mark in the header
- CRT broadcast shell (grid, scanlines, noise)
- Equipment bays with live panel states
- Operational terminal copy (not SaaS language)
- Full `--s9-*` token stack with preset support
- No consumer app patterns, hero sections, or marketing chrome

### Style Guide

[styleguide.html](styleguide.html) is the live design reference — token swatches, component demos, preset switcher, panel states, and condensed art direction summary.

### Theme sync

Shared theme CSS is synced from **signal-9-live-eq** via [scripts/sync-s9-styles.sh](scripts/sync-s9-styles.sh). ASCII logo art matches `signal-9-live-eq/src/startup/signal9LogoArt.ts`.

## Related Documentation

- [UI_PRINCIPLES.md](UI_PRINCIPLES.md) — operational UI rules and component thinking
- [CURSOR_RULES.md](CURSOR_RULES.md) — agent and contributor constraints
- [styleguide.html](styleguide.html) — live tokens, components, presets
- [README.md](README.md) — project overview and CSS stack
- [ROADMAP.md](ROADMAP.md) — feature phases and definition of done
- [CHANGELOG.md](CHANGELOG.md) — release history
