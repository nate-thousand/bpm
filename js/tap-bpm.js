import { average, standardDeviation, confidenceLabel } from './audio-utils.js';
import { LOCK, META } from './terminal-copy.js';

const MIN_TAP_GAP_MS = 180;
const SESSION_TIMEOUT_MS = 3000;
const MAX_TAPS = 16;

let taps = [];
let smoothedBpm = 0;

export function recordTap(now = performance.now()) {
  const lastTap = taps[taps.length - 1];

  if (lastTap && now - lastTap < MIN_TAP_GAP_MS) {
    return getTapStats();
  }

  if (lastTap && now - lastTap > SESSION_TIMEOUT_MS) {
    taps = [];
    smoothedBpm = 0;
  }

  taps.push(now);
  taps = taps.slice(-MAX_TAPS);

  const bpm = calculateTapBpm();
  if (bpm) {
    smoothedBpm = smoothedBpm ? smoothedBpm * 0.72 + bpm * 0.28 : bpm;
  }

  return getTapStats();
}

export function resetTapBpm() {
  taps = [];
  smoothedBpm = 0;
  return getTapStats();
}

export function calculateTapBpm() {
  if (taps.length < 2) return 0;

  const intervals = [];
  for (let i = 1; i < taps.length; i += 1) {
    intervals.push(taps[i] - taps[i - 1]);
  }

  const avgInterval = average(intervals);
  if (!avgInterval) return 0;

  return 60000 / avgInterval;
}

export function getTapStats() {
  const intervals = [];
  for (let i = 1; i < taps.length; i += 1) {
    intervals.push(taps[i] - taps[i - 1]);
  }

  let stabilityScore = 0;
  if (intervals.length >= 2) {
    const mean = average(intervals);
    const deviation = standardDeviation(intervals);
    stabilityScore = Math.max(0, 1 - deviation / mean);
  }

  return {
    bpm: smoothedBpm ? Math.round(smoothedBpm) : 0,
    tapCount: taps.length,
    stability: taps.length < 3 ? LOCK.SEARCHING : confidenceLabel(stabilityScore),
    stabilityScore,
    lastTap: taps.length ? new Date().toLocaleTimeString() : META.NONE,
  };
}
