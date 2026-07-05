/** Shared types for the Signal 9 Tempo Scanner. */

/** A single frame of audio analysis data pulled from the analyser node. */
export interface AudioSnapshot {
  timeData: Uint8Array
  frequencyData: Uint8Array
  sampleRate: number
  fftSize: number
}

/** Result of the microphone BPM analysis. */
export interface BpmResult {
  bpm: number
  confidence: string
  confidenceScore: number
  peakCount: number
}

/** Intermediate BPM estimate produced from detected peaks. */
export interface BpmEstimate {
  bpm: number
  confidenceScore: number
  intervals: number[]
}

/** Result of the harmonic key analysis. */
export interface KeyResult {
  key: string
  mode: string
  confidence: string
  confidenceScore: number
  alternates: string[]
}

/** Stats surfaced from the manual tap detector. */
export interface TapStats {
  bpm: number
  tapCount: number
  stability: string
  stabilityScore: number
  lastTap: string
}

/** DOM elements wired up by the main controller and shared with the visuals. */
export interface AppElements {
  tapButton: HTMLButtonElement
  resetTapButton: HTMLButtonElement
  tapBpm: HTMLElement
  tapCount: HTMLElement
  tapStability: HTMLElement
  lastTap: HTMLElement
  tapPanelState: HTMLElement
  tapPanel: HTMLElement
  startMicButton: HTMLButtonElement
  stopMicButton: HTMLButtonElement
  micStatus: HTMLElement
  inputLevelBar: HTMLElement
  micBpm: HTMLElement
  micConfidence: HTMLElement
  peakCount: HTMLElement
  micPanelState: HTMLElement
  micPanel: HTMLDetailsElement
  micSummaryBpm: HTMLElement
  detectedKey: HTMLElement
  keyMode: HTMLElement
  keyConfidence: HTMLElement
  alternateKeys: HTMLElement
  keyPanelState: HTMLElement
  keyPanel: HTMLDetailsElement
  keySummaryHint: HTMLElement
  asciiEqPanel: HTMLElement
  asciiEqBars: HTMLElement
  inputLevelText: HTMLElement
  signalLockBar: HTMLElement
  signalLockValue: HTMLElement
  rhythmGrid: HTMLElement
  keyScanStatus: HTMLElement
  keyScanMode: HTMLElement
  harmonicBar: HTMLElement
  harmonicValue: HTMLElement
}
