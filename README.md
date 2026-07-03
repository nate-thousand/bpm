# BPM + Key Finder

A minimal browser app for three things:

1. Tap BPM with the keyboard space bar or tap button
2. Estimate BPM from microphone input
3. Estimate musical key from microphone input

## How to run

Clone the repo and serve it locally. JavaScript modules and microphone access require a local server — do not open `index.html` directly.

```bash
git clone https://github.com/nate-thousand/bpm.git
cd bpm
python3 -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173)

### Live Server (optional)

Install the Live Server extension in VS Code or Cursor, then run `index.html` with Live Server.

## Project structure

```text
bpm/
  index.html
  README.md
  ROADMAP.md
  css/
    styles.css
    signal9-theme.css
    preset-themes.css
    startup.css
  js/
    main.js
    tap-bpm.js
    mic-input.js
    bpm-detector.js
    key-detector.js
    audio-utils.js
```

## Notes

Tap BPM is the most reliable feature.

Mic BPM is approximate. It works best with clear drums, steady tempo, and limited background noise.

Key detection is approximate. It works best with chords or melodic material and several seconds of clean audio.

## No backend

The app runs in the browser only. It does not upload audio or save data.
