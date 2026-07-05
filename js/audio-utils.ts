import { lockLabel } from "./terminal-copy"

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

export function normalize(values: number[]): number[] {
  const max = Math.max(...values, 0.000001)
  return values.map((value) => value / max)
}

export function frequencyToMidiNote(frequency: number): number | null {
  if (!frequency || frequency <= 0) return null
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function midiNoteToPitchClass(midiNote: number | null): number | null {
  if (midiNote === null) return null
  return ((midiNote % 12) + 12) % 12
}

export function smoothValue(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

export function confidenceLabel(score: number): string {
  return lockLabel(score)
}

export const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
