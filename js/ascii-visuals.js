import { clamp } from './audio-utils.js';
import { LOCK, VISUAL, formatKeyMode } from './terminal-copy.js';

const BAR_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const BLOCK_FILLED = '█';
const BLOCK_EMPTY = '░';
const METER_SLOTS = 10;
const GRID_SLOTS = 16;
const GRID_GROUP = 4;
const BAND_COUNT = 16;
const TAP_SPIKE_DECAY_MS = 350;
const GRID_DECAY_MS = 3000;

let els = {};
let eqState = 'standby';
let tapSpikeStrength = 0;
let tapSpikeUntil = 0;
let standbyFrameId = null;
let micListening = false;
let gridSlots = Array(GRID_SLOTS).fill(null);

export function initAsciiVisuals(elements) {
  els = elements;
  renderMeter(els.signalLockBar, els.signalLockValue, 0);
  renderRhythmGrid();
  resetKeyScan(false);
  setEqState('standby');
}

export function setEqState(state) {
  eqState = state;
  if (els.asciiEqPanel) {
    els.asciiEqPanel.dataset.state = state;
  }

  if (state === 'standby') {
    startStandbyLoop();
    if (els.inputLevelText) els.inputLevelText.textContent = VISUAL.STANDBY;
    return;
  }

  stopStandbyLoop();

  if (state === 'active' && els.inputLevelText) {
    els.inputLevelText.textContent = VISUAL.TAP_ACTIVE;
  }

  if (state === 'scanning' && els.inputLevelText) {
    els.inputLevelText.textContent = VISUAL.MIC_SCANNING;
  }
}

export function setMicListening(listening) {
  micListening = listening;
}

export function flashTapSpike() {
  tapSpikeStrength = 1;
  tapSpikeUntil = performance.now() + TAP_SPIKE_DECAY_MS;

  if (!micListening) {
    setEqState('active');
    renderTapEq();
  }
}

export function updateAsciiEqFromMic(snapshot, inputLevel) {
  if (eqState !== 'scanning' || !els.asciiEqBars) return;

  const bands = snapshot?.frequencyData
    ? frequencyToBands(snapshot.frequencyData, snapshot.sampleRate)
    : new Array(BAND_COUNT).fill(0);

  const levelPercent = clamp(Math.round(Math.pow(inputLevel, 0.72) * 100), 0, 100);
  els.asciiEqBars.textContent = renderBarLine(bands);

  if (els.inputLevelText) {
    els.inputLevelText.textContent =
      inputLevel > 0.004 ? `${VISUAL.MIC_SCANNING} ${levelPercent}%` : VISUAL.MIC_SCANNING;
  }
}

export function deriveTapLockPercent(stats) {
  const { tapCount, stabilityScore = 0 } = stats;

  if (tapCount === 0) return 0;
  if (tapCount === 1) return 10;
  if (tapCount === 2) return 20;

  let base;
  if (tapCount <= 4) {
    base = 40 + (tapCount - 3) * 20;
  } else {
    base = 70 + Math.min(25, (tapCount - 5) * 5);
  }

  const adjusted = Math.round(base * clamp(0.35 + stabilityScore * 0.65, 0, 1));
  return clamp(adjusted, 0, 95);
}

export function updateSignalLock(percent) {
  renderMeter(els.signalLockBar, els.signalLockValue, clamp(Math.round(percent), 0, 95));
}

export function updateRhythmGrid(tapCount) {
  if (!tapCount) return;

  const slotIndex = (tapCount - 1) % GRID_SLOTS;
  gridSlots[slotIndex] = performance.now();
  renderRhythmGrid();
}

export function updateKeyScan(keyResult, listening) {
  if (!els.keyScanStatus) return;

  const noLock = !keyResult || keyResult.key === LOCK.NO_LOCK;

  if (noLock) {
    els.keyScanStatus.textContent = listening ? VISUAL.KEY_PENDING : VISUAL.NO_SIGNAL;
    if (els.keyScanMode) els.keyScanMode.textContent = VISUAL.PENDING;
    renderMeter(els.harmonicBar, els.harmonicValue, 0);
    return;
  }

  els.keyScanStatus.textContent = keyResult.key;
  if (els.keyScanMode) {
    els.keyScanMode.textContent = formatKeyMode(keyResult.mode);
  }

  const harmonicPercent = Math.round((keyResult.confidenceScore || 0) * 95);
  renderMeter(els.harmonicBar, els.harmonicValue, harmonicPercent);
}

export function resetTapVisuals() {
  tapSpikeStrength = 0;
  tapSpikeUntil = 0;
  gridSlots = Array(GRID_SLOTS).fill(null);
  renderRhythmGrid();
  updateSignalLock(0);

  if (!micListening) {
    setEqState('standby');
  }
}

export function resetKeyScan(listening = false) {
  updateKeyScan({ key: LOCK.NO_LOCK, mode: LOCK.MODE_UNRESOLVED, confidenceScore: 0 }, listening);
}

function startStandbyLoop() {
  if (standbyFrameId || eqState !== 'standby') return;

  const tick = () => {
    if (eqState !== 'standby') {
      standbyFrameId = null;
      return;
    }

    renderStandbyEq();
    standbyFrameId = requestAnimationFrame(tick);
  };

  standbyFrameId = requestAnimationFrame(tick);
}

function stopStandbyLoop() {
  if (standbyFrameId) {
    cancelAnimationFrame(standbyFrameId);
    standbyFrameId = null;
  }
}

function renderStandbyEq() {
  if (!els.asciiEqBars || eqState !== 'standby') return;

  const t = performance.now() / 1000;
  const bands = Array.from({ length: BAND_COUNT }, (_, index) => {
    const wave = Math.sin(t * 0.3 * Math.PI * 2 + index * 0.45);
    return clamp(Math.round((wave + 1) * 1.2), 0, 3);
  });

  els.asciiEqBars.textContent = renderBarLine(bands);
}

function renderTapEq() {
  if (!els.asciiEqBars) return;

  const now = performance.now();
  if (tapSpikeUntil && now > tapSpikeUntil) {
    tapSpikeStrength = 0;
    if (!micListening) {
      setEqState('standby');
      return;
    }
  }

  if (tapSpikeUntil && now <= tapSpikeUntil) {
    const progress = 1 - (tapSpikeUntil - now) / TAP_SPIKE_DECAY_MS;
    tapSpikeStrength = 1 - progress;
  }

  const center = (BAND_COUNT - 1) / 2;
  const bands = Array.from({ length: BAND_COUNT }, (_, index) => {
    const dist = Math.abs(index - center) / center;
    const spike = Math.max(0, 1 - dist * 1.1) * tapSpikeStrength;
    const base = 1 + Math.sin(index * 0.6) * 0.5;
    return clamp(Math.round(base + spike * 6), 0, 7);
  });

  els.asciiEqBars.textContent = renderBarLine(bands);

  if (tapSpikeStrength > 0 && eqState === 'active') {
    requestAnimationFrame(renderTapEq);
  }
}

function frequencyToBands(frequencyData, sampleRate) {
  const binHz = sampleRate / (frequencyData.length * 2);
  const minHz = 80;
  const maxHz = 8000;
  const bands = new Array(BAND_COUNT).fill(0);

  for (let band = 0; band < BAND_COUNT; band += 1) {
    const startHz = minHz * Math.pow(maxHz / minHz, band / BAND_COUNT);
    const endHz = minHz * Math.pow(maxHz / minHz, (band + 1) / BAND_COUNT);
    const startBin = Math.max(1, Math.floor(startHz / binHz));
    const endBin = Math.min(frequencyData.length - 1, Math.ceil(endHz / binHz));

    let sum = 0;
    let count = 0;
    for (let bin = startBin; bin <= endBin; bin += 1) {
      sum += frequencyData[bin];
      count += 1;
    }

    const avg = count ? sum / count : 0;
    bands[band] = clamp(Math.round((avg / 255) * 7), 0, 7);
  }

  return bands;
}

function renderBarLine(bands) {
  return bands.map((height) => BAR_CHARS[height] ?? BAR_CHARS[0]).join(' ');
}

function renderMeter(barEl, valueEl, percent) {
  if (!barEl || !valueEl) return;

  const filled = clamp(Math.round((percent / 100) * METER_SLOTS), 0, METER_SLOTS);
  barEl.textContent = BLOCK_FILLED.repeat(filled) + BLOCK_EMPTY.repeat(METER_SLOTS - filled);
  valueEl.textContent = `${percent}%`;
}

function renderRhythmGrid() {
  if (!els.rhythmGrid) return;

  const now = performance.now();
  const slots = gridSlots.map((timestamp, index) => {
    if (!timestamp) return '○';
    if (now - timestamp > GRID_DECAY_MS) {
      gridSlots[index] = null;
      return '○';
    }
    return '●';
  });

  const groups = [];
  for (let i = 0; i < GRID_SLOTS; i += GRID_GROUP) {
    groups.push(slots.slice(i, i + GRID_GROUP).join(' '));
  }

  els.rhythmGrid.textContent = `TAP GRID  ${groups.join(' | ')}`;
}
