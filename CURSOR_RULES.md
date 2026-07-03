# Cursor Rules

## Do Not Change

Do not redesign the app.

Do not remove the Signal 9 theme layer.

Do not remove `.s9-themed`.

Do not edit `ds-variables.css` for Signal 9-specific styling.

Do not flatten the CSS architecture.

Do not replace ASCII logo with an image.

Do not fake BPM, mic, or key detection results.

Do not add AI chat, game mechanics, missions, characters, backend services, or accounts.

Do not introduce Bootstrap unless explicitly requested.

Do not move reusable `.s9-*` components into app-specific CSS.

## Required Architecture

```text
Plantasonic DS tokens (ds-variables.css)
  → Signal 9 theme bridge (signal9-theme.css)
  → Signal 9 preset themes (preset-themes.css)
  → Signal 9 startup visuals (startup.css)
  → Signal 9 components (s9-components.css)
  → Tempo Scanner app layout (styles.css)
  → GSAP motion layer (js/s9-motion.js)
```

## Naming Rules

- `ds-*` = Plantasonic foundation
- `s9-*` = reusable Signal 9 system
- `tempo-*` = Tempo Scanner app only
- `bpm-*` = technical BPM behavior only
- `sg-*` = styleguide only

## Motion Rules

GSAP is allowed only as an enhancement layer.

Use GSAP for:

- Startup reveal
- ASCII logo flicker
- Tap pulse
- Signal lock meter motion
- Mic scan pulse
- Button press feedback

Respect reduced motion.

Kill infinite tweens when inactive.

Do not use motion that hurts readability.

Do not scatter GSAP calls across unrelated files — use `js/s9-motion.js`.
