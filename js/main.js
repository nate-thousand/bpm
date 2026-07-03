import { analyzeBpm, resetBpmDetector } from './bpm-detector.js';
import { analyzeKey, resetKeyDetector } from './key-detector.js';
import { getAudioSnapshot, getInputLevel, isMicActive, resumeMic, startMic, stopMic } from './mic-input.js';
import { recordTap, resetTapBpm } from './tap-bpm.js';
import { clamp } from './audio-utils.js';
import {
  deriveTapLockPercent,
  flashTapSpike,
  initAsciiVisuals,
  resetKeyScan,
  resetTapVisuals,
  setEqState,
  setMicListening,
  updateAsciiEqFromMic,
  updateKeyScan,
  updateRhythmGrid,
  updateSignalLock,
} from './ascii-visuals.js';
import {
  animateKeyScan,
  animateMicScan,
  animateSignalLock,
  animateTapPulse,
  initS9Motion,
} from './s9-motion.js';
import {
  CARRIER,
  CONTROLS,
  LOCK,
  META,
  PANEL_STATE,
  PANEL_STATE_LABEL,
  formatKeyMode,
} from './terminal-copy.js';

const elements = {
  tapButton: document.querySelector('#tapButton'),
  resetTapButton: document.querySelector('#resetTapButton'),
  tapBpm: document.querySelector('#tapBpm'),
  tapCount: document.querySelector('#tapCount'),
  tapStability: document.querySelector('#tapStability'),
  lastTap: document.querySelector('#lastTap'),
  tapPanelState: document.querySelector('#tapPanelState'),
  tapPanel: document.querySelector('#tapPanel'),
  startMicButton: document.querySelector('#startMicButton'),
  stopMicButton: document.querySelector('#stopMicButton'),
  micStatus: document.querySelector('#micStatus'),
  inputLevelBar: document.querySelector('#inputLevelBar'),
  micBpm: document.querySelector('#micBpm'),
  micConfidence: document.querySelector('#micConfidence'),
  peakCount: document.querySelector('#peakCount'),
  micPanelState: document.querySelector('#micPanelState'),
  micPanel: document.querySelector('#micPanel'),
  micSummaryBpm: document.querySelector('#micSummaryBpm'),
  detectedKey: document.querySelector('#detectedKey'),
  keyMode: document.querySelector('#keyMode'),
  keyConfidence: document.querySelector('#keyConfidence'),
  alternateKeys: document.querySelector('#alternateKeys'),
  keyPanelState: document.querySelector('#keyPanelState'),
  keyPanel: document.querySelector('#keyPanel'),
  keySummaryHint: document.querySelector('#keySummaryHint'),
  asciiEqPanel: document.querySelector('#asciiEqPanel'),
  asciiEqBars: document.querySelector('#asciiEqBars'),
  inputLevelText: document.querySelector('#inputLevelText'),
  signalLockBar: document.querySelector('#signalLockBar'),
  signalLockValue: document.querySelector('#signalLockValue'),
  rhythmGrid: document.querySelector('#rhythmGrid'),
  keyScanStatus: document.querySelector('#keyScanStatus'),
  keyScanMode: document.querySelector('#keyScanMode'),
  harmonicBar: document.querySelector('#harmonicBar'),
  harmonicValue: document.querySelector('#harmonicValue'),
};

let isListening = false;
let animationFrameId = null;
let lastTapStats = resetTapBpm();
let lastBpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0 };
let lastKeyResult = createIdleKeyResult();

function createIdleKeyResult() {
  return {
    key: LOCK.NO_LOCK,
    mode: LOCK.MODE_UNRESOLVED,
    confidence: LOCK.WEAK,
    confidenceScore: 0,
    alternates: [],
  };
}

function formatBpm(value) {
  return value ? String(value).padStart(3, '0') : '000';
}

function updateMicSummaryBpm(bpm) {
  if (elements.micSummaryBpm) {
    elements.micSummaryBpm.textContent = formatBpm(bpm);
  }
}

function updateKeySummaryHint(key, mode) {
  if (!elements.keySummaryHint) return;
  elements.keySummaryHint.textContent =
    key === LOCK.NO_LOCK ? LOCK.NO_LOCK : `${key} · ${formatKeyMode(mode)}`;
}

function openScannerDisclosures() {
  if (elements.micPanel) elements.micPanel.open = true;
  if (elements.keyPanel) elements.keyPanel.open = true;
}

function setPanelState(element, panelElement, state) {
  if (!element) return;
  element.textContent = PANEL_STATE_LABEL[state] || state.toUpperCase();
  element.dataset.panelState = state;
  if (panelElement) panelElement.dataset.panelState = state;
}

function resolveTapPanelState(stats) {
  if (stats.tapCount === 0) return PANEL_STATE.STANDBY;
  if (stats.tapCount < 3 || stats.stability === LOCK.SEARCHING) return PANEL_STATE.ACQUIRING;
  if (stats.stability === LOCK.STRONG || stats.stability === LOCK.MODERATE) return PANEL_STATE.LOCKED;
  return PANEL_STATE.DEGRADED;
}

function resolveMicPanelState() {
  if (!isListening) return PANEL_STATE.OFFLINE;
  if (lastBpmResult.confidence === LOCK.SEARCHING || !lastBpmResult.bpm) return PANEL_STATE.SEARCHING;
  if (lastBpmResult.confidence === LOCK.STRONG || lastBpmResult.confidence === LOCK.MODERATE) {
    return PANEL_STATE.LOCKED;
  }
  return PANEL_STATE.DEGRADED;
}

function resolveKeyPanelState() {
  if (!isListening) return PANEL_STATE.OFFLINE;
  if (lastKeyResult.key === LOCK.NO_LOCK) return PANEL_STATE.DECODING;
  if (lastKeyResult.confidence === LOCK.STRONG || lastKeyResult.confidence === LOCK.MODERATE) {
    return PANEL_STATE.LOCKED;
  }
  return PANEL_STATE.DEGRADED;
}

function updatePanelStates() {
  setPanelState(elements.tapPanelState, elements.tapPanel, resolveTapPanelState(lastTapStats));
  setPanelState(elements.micPanelState, elements.micPanel, resolveMicPanelState());
  setPanelState(elements.keyPanelState, elements.keyPanel, resolveKeyPanelState());
}

function resolveKeyScanMotionState() {
  if (!isListening) return 'idle';
  if (lastKeyResult.key === LOCK.NO_LOCK) return 'pending';
  return 'locked';
}

function updateTapUi(stats) {
  lastTapStats = stats;
  elements.tapBpm.textContent = formatBpm(stats.bpm);
  elements.tapCount.textContent = stats.tapCount;
  elements.tapStability.textContent = stats.stability;
  elements.lastTap.textContent = stats.lastTap;
  updatePanelStates();

  if (!isListening) {
    updateSignalLock(deriveTapLockPercent(stats));
    animateSignalLock(elements.signalLockBar);
  }
}

function handleTap() {
  const stats = recordTap();
  updateTapUi(stats);
  flashTapSpike();
  updateRhythmGrid(stats.tapCount);
  animateTapPulse();
}

function handleResetTap() {
  updateTapUi(resetTapBpm());
  resetTapVisuals();
}

async function handleStartMic() {
  if (isListening) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    elements.micStatus.textContent = CARRIER.UNAVAILABLE;
    return;
  }

  try {
    elements.micStatus.textContent = CARRIER.REQUESTING_ACCESS;
    await startMic();
    resetBpmDetector();
    resetKeyDetector();
    isListening = true;
    setMicListening(true);
    setEqState('scanning');
    lastBpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0 };
    lastKeyResult = createIdleKeyResult();
    elements.micStatus.textContent = CARRIER.ACQUIRING;
    elements.micConfidence.textContent = LOCK.SEARCHING;
    elements.startMicButton.disabled = true;
    elements.stopMicButton.disabled = false;
    openScannerDisclosures();
    updatePanelStates();
    updateKeyScan(lastKeyResult, true);
    animateMicScan(true);
    animateKeyScan(elements.keyPanel?.querySelector('.s9-key-scan'), 'pending');
    tickAudioAnalysis();
  } catch (error) {
    elements.micStatus.textContent = CARRIER.ACCESS_DENIED;
    console.error(error);
  }
}

function handleStopMic() {
  isListening = false;
  setMicListening(false);
  setEqState('standby');
  animateMicScan(false);
  animateKeyScan(elements.keyPanel?.querySelector('.s9-key-scan'), 'idle');
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  stopMic();
  resetBpmDetector();
  resetKeyDetector();
  lastBpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0 };
  lastKeyResult = createIdleKeyResult();

  elements.micStatus.textContent = CARRIER.STANDBY;
  elements.startMicButton.disabled = false;
  elements.stopMicButton.disabled = true;
  elements.inputLevelBar.style.width = '0%';
  elements.micBpm.textContent = '000';
  updateMicSummaryBpm(0);
  elements.micConfidence.textContent = LOCK.WEAK;
  elements.peakCount.textContent = '0';
  elements.detectedKey.textContent = LOCK.NO_LOCK;
  elements.keyMode.textContent = LOCK.MODE_UNRESOLVED;
  updateKeySummaryHint(LOCK.NO_LOCK, LOCK.MODE_UNRESOLVED);
  elements.keyConfidence.textContent = LOCK.WEAK;
  elements.alternateKeys.textContent = META.NO_MATCHES;
  updatePanelStates();
  resetKeyScan(false);
  updateSignalLock(deriveTapLockPercent(lastTapStats));
}

async function tickAudioAnalysis() {
  if (!isListening) return;

  await resumeMic();

  const snapshot = getAudioSnapshot();
  if (!snapshot) {
    if (!isMicActive()) {
      elements.micStatus.textContent = CARRIER.STOPPED;
      handleStopMic();
      return;
    }

    animationFrameId = requestAnimationFrame(tickAudioAnalysis);
    return;
  }

  const inputLevel = getInputLevel(snapshot);
  const levelPercent = clamp(Math.pow(inputLevel, 0.72) * 420, 0, 100);
  elements.inputLevelBar.style.width = `${levelPercent}%`;
  updateAsciiEqFromMic(snapshot, inputLevel);

  lastBpmResult = analyzeBpm(snapshot, inputLevel);
  elements.micBpm.textContent = formatBpm(lastBpmResult.bpm);
  updateMicSummaryBpm(lastBpmResult.bpm);
  elements.micConfidence.textContent = lastBpmResult.confidence;
  elements.peakCount.textContent = lastBpmResult.peakCount;
  updateSignalLock(Math.round(lastBpmResult.confidenceScore * 95));
  animateSignalLock(elements.signalLockBar);

  lastKeyResult = analyzeKey(snapshot);
  elements.detectedKey.textContent = lastKeyResult.key;
  elements.keyMode.textContent = formatKeyMode(lastKeyResult.mode);
  updateKeySummaryHint(lastKeyResult.key, lastKeyResult.mode);
  elements.keyConfidence.textContent = lastKeyResult.confidence;
  elements.alternateKeys.textContent = lastKeyResult.alternates.length
    ? lastKeyResult.alternates.join(', ')
    : META.NO_MATCHES;
  updateKeyScan(lastKeyResult, true);
  animateKeyScan(elements.keyPanel?.querySelector('.s9-key-scan'), resolveKeyScanMotionState());
  updatePanelStates();

  animationFrameId = requestAnimationFrame(tickAudioAnalysis);
}

function bindEvents() {
  elements.tapButton.addEventListener('click', handleTap);
  elements.resetTapButton.addEventListener('click', handleResetTap);
  elements.startMicButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleStartMic();
  });
  elements.stopMicButton.addEventListener('click', handleStopMic);

  window.addEventListener('keydown', (event) => {
    const isSpace = event.code === 'Space';
    const target = event.target;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

    if (!isSpace || isTyping || event.repeat) return;

    event.preventDefault();
    handleTap();
  });
}

bindEvents();
initS9Motion();
initAsciiVisuals(elements);
updateTapUi(resetTapBpm());
