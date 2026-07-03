# BPM + Key Finder

A minimal browser app for three things:

1. Tap BPM with the keyboard space bar or tap button
2. Estimate BPM from microphone input
3. Estimate musical key from microphone input

## How to run

Open the folder in Cursor or any code editor.

Because this app uses JavaScript modules and microphone access, run it with a local server instead of opening `index.html` directly.

### Option 1: Python

```bash
cd bpm-key-finder
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

### Option 2: VS Code or Cursor Live Server

Install the Live Server extension, then run `index.html` with Live Server.

## Files

```text
bpm-key-finder/
  index.html
  css/
    styles.css
  js/
    main.js
    tap-bpm.js
    mic-input.js
    bpm-detector.js
    key-detector.js
    audio-utils.js
  README.md
```

## Notes

Tap BPM is the most reliable feature.

Mic BPM is approximate. It works best with clear drums, steady tempo, and limited background noise.

Key detection is approximate. It works best with chords or melodic material and several seconds of clean audio.

## No backend

The app runs in the browser only. It does not upload audio or save data.
