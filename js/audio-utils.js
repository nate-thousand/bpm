export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function normalize(values) {
  const max = Math.max(...values, 0.000001);
  return values.map((value) => value / max);
}

export function frequencyToMidiNote(frequency) {
  if (!frequency || frequency <= 0) return null;
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function midiNoteToPitchClass(midiNote) {
  if (midiNote === null) return null;
  return ((midiNote % 12) + 12) % 12;
}

export function smoothValue(current, target, factor) {
  return current + (target - current) * factor;
}

import { lockLabel } from './terminal-copy.js';

export function confidenceLabel(score) {
  return lockLabel(score);
}

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
