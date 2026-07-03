import { analyzeBpm, resetBpmDetector } from './bpm-detector.js';
import { analyzeKey, resetKeyDetector } from './key-detector.js';
import { getAudioSnapshot, getInputLevel, startMic, stopMic } from './mic-input.js';
import { recordTap, resetTapBpm } from './tap-bpm.js';
import { clamp } from './audio-utils.js';

const elements = {
  tapButton: document.querySelector('#tapButton'),
  resetTapButton: document.querySelector('#resetTapButton'),
  tapBpm: document.querySelector('#tapBpm'),
  tapCount: document.querySelector('#tapCount'),
  tapStability: document.querySelector('#tapStability'),
  lastTap: document.querySelector('#lastTap'),
  startMicButton: document.querySelector('#startMicButton'),
  stopMicButton: document.querySelector('#stopMicButton'),
  micStatus: document.querySelector('#micStatus'),
  inputLevelBar: document.querySelector('#inputLevelBar'),
  micBpm: document.querySelector('#micBpm'),
  micConfidence: document.querySelector('#micConfidence'),
  peakCount: document.querySelector('#peakCount'),
  detectedKey: document.querySelector('#detectedKey'),
  keyMode: document.querySelector('#keyMode'),
  keyConfidence: document.querySelector('#keyConfidence'),
  alternateKeys: document.querySelector('#alternateKeys'),
};

let isListening = false;
let animationFrameId = null;

function formatBpm(value) {
  return value ? String(value).padStart(3, '0') : '000';
}

function updateTapUi(stats) {
  elements.tapBpm.textContent = formatBpm(stats.bpm);
  elements.tapCount.textContent = stats.tapCount;
  elements.tapStability.textContent = stats.stability;
  elements.lastTap.textContent = stats.lastTap;
}

function handleTap() {
  updateTapUi(recordTap());
}

function handleResetTap() {
  updateTapUi(resetTapBpm());
}

async function handleStartMic() {
  if (isListening) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    elements.micStatus.textContent = 'Mic unavailable in this browser';
    return;
  }

  try {
    elements.micStatus.textContent = 'Requesting permission';
    await startMic();
    resetBpmDetector();
    resetKeyDetector();
    isListening = true;
    elements.micStatus.textContent = 'Listening';
    elements.micConfidence.textContent = 'Waiting';
    elements.startMicButton.disabled = true;
    elements.stopMicButton.disabled = false;
    tickAudioAnalysis();
  } catch (error) {
    elements.micStatus.textContent = 'Mic permission denied or unavailable';
    console.error(error);
  }
}

function handleStopMic() {
  isListening = false;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  stopMic();
  resetBpmDetector();
  resetKeyDetector();

  elements.micStatus.textContent = 'Not listening';
  elements.startMicButton.disabled = false;
  elements.stopMicButton.disabled = true;
  elements.inputLevelBar.style.width = '0%';
  elements.micBpm.textContent = '000';
  elements.micConfidence.textContent = 'Low';
  elements.peakCount.textContent = '0';
  elements.detectedKey.textContent = 'Unknown';
  elements.keyMode.textContent = 'Mode unknown';
  elements.keyConfidence.textContent = 'Low';
  elements.alternateKeys.textContent = 'None yet';
}

function tickAudioAnalysis() {
  if (!isListening) return;

  const snapshot = getAudioSnapshot();
  if (!snapshot) {
    animationFrameId = requestAnimationFrame(tickAudioAnalysis);
    return;
  }

  const inputLevel = getInputLevel();
  const levelPercent = clamp(inputLevel * 280, 0, 100);
  elements.inputLevelBar.style.width = `${levelPercent}%`;

  const bpmResult = analyzeBpm(snapshot, inputLevel);
  elements.micBpm.textContent = formatBpm(bpmResult.bpm);
  elements.micConfidence.textContent = bpmResult.confidence;
  elements.peakCount.textContent = bpmResult.peakCount;

  const keyResult = analyzeKey(snapshot);
  elements.detectedKey.textContent = keyResult.key === 'Unknown' ? 'Unknown' : `${keyResult.key}`;
  elements.keyMode.textContent = keyResult.mode === 'Mode unknown' ? keyResult.mode : keyResult.mode;
  elements.keyConfidence.textContent = keyResult.confidence;
  elements.alternateKeys.textContent = keyResult.alternates.length ? keyResult.alternates.join(', ') : 'None yet';

  animationFrameId = requestAnimationFrame(tickAudioAnalysis);
}

function bindEvents() {
  elements.tapButton.addEventListener('click', handleTap);
  elements.resetTapButton.addEventListener('click', handleResetTap);
  elements.startMicButton.addEventListener('click', handleStartMic);
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
updateTapUi(resetTapBpm());
