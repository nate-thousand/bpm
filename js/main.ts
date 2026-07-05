import { analyzeBpm, resetBpmDetector } from "./bpm-detector"
import { analyzeKey, resetKeyDetector } from "./key-detector"
import { getAudioSnapshot, getInputLevel, isMicActive, resumeMic, startMic, stopMic } from "./mic-input"
import { recordTap, resetTapBpm } from "./tap-bpm"
import { clamp } from "./audio-utils"
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
} from "./ascii-visuals"
import {
  animateKeyScan,
  animateMicScan,
  animateSignalLock,
  animateTapPulse,
  initS9Motion,
} from "./s9-motion"
import {
  CARRIER,
  LOCK,
  META,
  PANEL_STATE,
  PANEL_STATE_LABEL,
  formatKeyMode,
} from "./terminal-copy"
import type { AppElements, BpmResult, KeyResult, TapStats } from "./types"

const $ = <T extends HTMLElement>(selector: string): T =>
  document.querySelector<T>(selector) as T

const elements: AppElements = {
  tapButton: $<HTMLButtonElement>("#tapButton"),
  resetTapButton: $<HTMLButtonElement>("#resetTapButton"),
  tapBpm: $("#tapBpm"),
  tapCount: $("#tapCount"),
  tapStability: $("#tapStability"),
  lastTap: $("#lastTap"),
  tapPanelState: $("#tapPanelState"),
  tapPanel: $("#tapPanel"),
  startMicButton: $<HTMLButtonElement>("#startMicButton"),
  stopMicButton: $<HTMLButtonElement>("#stopMicButton"),
  micStatus: $("#micStatus"),
  inputLevelBar: $("#inputLevelBar"),
  micBpm: $("#micBpm"),
  micConfidence: $("#micConfidence"),
  peakCount: $("#peakCount"),
  micPanelState: $("#micPanelState"),
  micPanel: $<HTMLDetailsElement>("#micPanel"),
  micSummaryBpm: $("#micSummaryBpm"),
  detectedKey: $("#detectedKey"),
  keyMode: $("#keyMode"),
  keyConfidence: $("#keyConfidence"),
  alternateKeys: $("#alternateKeys"),
  keyPanelState: $("#keyPanelState"),
  keyPanel: $<HTMLDetailsElement>("#keyPanel"),
  keySummaryHint: $("#keySummaryHint"),
  asciiEqPanel: $("#asciiEqPanel"),
  asciiEqBars: $("#asciiEqBars"),
  inputLevelText: $("#inputLevelText"),
  signalLockBar: $("#signalLockBar"),
  signalLockValue: $("#signalLockValue"),
  rhythmGrid: $("#rhythmGrid"),
  keyScanStatus: $("#keyScanStatus"),
  keyScanMode: $("#keyScanMode"),
  harmonicBar: $("#harmonicBar"),
  harmonicValue: $("#harmonicValue"),
}

let isListening = false
let animationFrameId: number | null = null
let lastTapStats: TapStats = resetTapBpm()
let lastBpmResult: BpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0, peakCount: 0 }
let lastKeyResult: KeyResult = createIdleKeyResult()

function createIdleKeyResult(): KeyResult {
  return {
    key: LOCK.NO_LOCK,
    mode: LOCK.MODE_UNRESOLVED,
    confidence: LOCK.WEAK,
    confidenceScore: 0,
    alternates: [],
  }
}

function formatBpm(value: number): string {
  return value ? String(value).padStart(3, "0") : "000"
}

function updateMicSummaryBpm(bpm: number): void {
  if (elements.micSummaryBpm) {
    elements.micSummaryBpm.textContent = formatBpm(bpm)
  }
}

function updateKeySummaryHint(key: string, mode: string): void {
  if (!elements.keySummaryHint) return
  elements.keySummaryHint.textContent =
    key === LOCK.NO_LOCK ? LOCK.NO_LOCK : `${key} · ${formatKeyMode(mode)}`
}

function openScannerDisclosures(): void {
  if (elements.micPanel) elements.micPanel.open = true
  if (elements.keyPanel) elements.keyPanel.open = true
}

function setPanelState(element: HTMLElement | null, panelElement: HTMLElement | null, state: string): void {
  if (!element) return
  element.textContent = PANEL_STATE_LABEL[state as keyof typeof PANEL_STATE_LABEL] || state.toUpperCase()
  element.dataset.panelState = state
  if (panelElement) panelElement.dataset.panelState = state
}

function resolveTapPanelState(stats: TapStats): string {
  if (stats.tapCount === 0) return PANEL_STATE.STANDBY
  if (stats.tapCount < 3 || stats.stability === LOCK.SEARCHING) return PANEL_STATE.ACQUIRING
  if (stats.stability === LOCK.STRONG || stats.stability === LOCK.MODERATE) return PANEL_STATE.LOCKED
  return PANEL_STATE.DEGRADED
}

function resolveMicPanelState(): string {
  if (!isListening) return PANEL_STATE.OFFLINE
  if (lastBpmResult.confidence === LOCK.SEARCHING || !lastBpmResult.bpm) return PANEL_STATE.SEARCHING
  if (lastBpmResult.confidence === LOCK.STRONG || lastBpmResult.confidence === LOCK.MODERATE) {
    return PANEL_STATE.LOCKED
  }
  return PANEL_STATE.DEGRADED
}

function resolveKeyPanelState(): string {
  if (!isListening) return PANEL_STATE.OFFLINE
  if (lastKeyResult.key === LOCK.NO_LOCK) return PANEL_STATE.DECODING
  if (lastKeyResult.confidence === LOCK.STRONG || lastKeyResult.confidence === LOCK.MODERATE) {
    return PANEL_STATE.LOCKED
  }
  return PANEL_STATE.DEGRADED
}

function updatePanelStates(): void {
  setPanelState(elements.tapPanelState, elements.tapPanel, resolveTapPanelState(lastTapStats))
  setPanelState(elements.micPanelState, elements.micPanel, resolveMicPanelState())
  setPanelState(elements.keyPanelState, elements.keyPanel, resolveKeyPanelState())
}

function resolveKeyScanMotionState(): string {
  if (!isListening) return "idle"
  if (lastKeyResult.key === LOCK.NO_LOCK) return "pending"
  return "locked"
}

function updateTapUi(stats: TapStats): void {
  lastTapStats = stats
  elements.tapBpm.textContent = formatBpm(stats.bpm)
  elements.tapCount.textContent = String(stats.tapCount)
  elements.tapStability.textContent = stats.stability
  elements.lastTap.textContent = stats.lastTap
  updatePanelStates()

  if (!isListening) {
    updateSignalLock(deriveTapLockPercent(stats))
    animateSignalLock(elements.signalLockBar)
  }
}

function handleTap(): void {
  const stats = recordTap()
  updateTapUi(stats)
  flashTapSpike()
  updateRhythmGrid(stats.tapCount)
  animateTapPulse()
}

function handleResetTap(): void {
  updateTapUi(resetTapBpm())
  resetTapVisuals()
}

async function handleStartMic(): Promise<void> {
  if (isListening) return

  if (!navigator.mediaDevices?.getUserMedia) {
    elements.micStatus.textContent = CARRIER.UNAVAILABLE
    return
  }

  try {
    elements.micStatus.textContent = CARRIER.REQUESTING_ACCESS
    await startMic()
    resetBpmDetector()
    resetKeyDetector()
    isListening = true
    setMicListening(true)
    setEqState("scanning")
    lastBpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0, peakCount: 0 }
    lastKeyResult = createIdleKeyResult()
    elements.micStatus.textContent = CARRIER.ACQUIRING
    elements.micConfidence.textContent = LOCK.SEARCHING
    elements.startMicButton.disabled = true
    elements.stopMicButton.disabled = false
    openScannerDisclosures()
    updatePanelStates()
    updateKeyScan(lastKeyResult, true)
    animateMicScan(true)
    animateKeyScan(elements.keyPanel?.querySelector(".s9-key-scan"), "pending")
    tickAudioAnalysis()
  } catch (error) {
    elements.micStatus.textContent = CARRIER.ACCESS_DENIED
    console.error(error)
  }
}

function handleStopMic(): void {
  isListening = false
  setMicListening(false)
  setEqState("standby")
  animateMicScan(false)
  animateKeyScan(elements.keyPanel?.querySelector(".s9-key-scan"), "idle")
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  animationFrameId = null
  stopMic()
  resetBpmDetector()
  resetKeyDetector()
  lastBpmResult = { bpm: 0, confidence: LOCK.SEARCHING, confidenceScore: 0, peakCount: 0 }
  lastKeyResult = createIdleKeyResult()

  elements.micStatus.textContent = CARRIER.STANDBY
  elements.startMicButton.disabled = false
  elements.stopMicButton.disabled = true
  elements.inputLevelBar.style.width = "0%"
  elements.micBpm.textContent = "000"
  updateMicSummaryBpm(0)
  elements.micConfidence.textContent = LOCK.WEAK
  elements.peakCount.textContent = "0"
  elements.detectedKey.textContent = LOCK.NO_LOCK
  elements.keyMode.textContent = LOCK.MODE_UNRESOLVED
  updateKeySummaryHint(LOCK.NO_LOCK, LOCK.MODE_UNRESOLVED)
  elements.keyConfidence.textContent = LOCK.WEAK
  elements.alternateKeys.textContent = META.NO_MATCHES
  updatePanelStates()
  resetKeyScan(false)
  updateSignalLock(deriveTapLockPercent(lastTapStats))
}

async function tickAudioAnalysis(): Promise<void> {
  if (!isListening) return

  await resumeMic()

  const snapshot = getAudioSnapshot()
  if (!snapshot) {
    if (!isMicActive()) {
      elements.micStatus.textContent = CARRIER.STOPPED
      handleStopMic()
      return
    }

    animationFrameId = requestAnimationFrame(tickAudioAnalysis)
    return
  }

  const inputLevel = getInputLevel(snapshot)
  const levelPercent = clamp(Math.pow(inputLevel, 0.72) * 420, 0, 100)
  elements.inputLevelBar.style.width = `${levelPercent}%`
  updateAsciiEqFromMic(snapshot, inputLevel)

  lastBpmResult = analyzeBpm(snapshot, inputLevel)
  elements.micBpm.textContent = formatBpm(lastBpmResult.bpm)
  updateMicSummaryBpm(lastBpmResult.bpm)
  elements.micConfidence.textContent = lastBpmResult.confidence
  elements.peakCount.textContent = String(lastBpmResult.peakCount)
  updateSignalLock(Math.round(lastBpmResult.confidenceScore * 95))
  animateSignalLock(elements.signalLockBar)

  lastKeyResult = analyzeKey(snapshot)
  elements.detectedKey.textContent = lastKeyResult.key
  elements.keyMode.textContent = formatKeyMode(lastKeyResult.mode)
  updateKeySummaryHint(lastKeyResult.key, lastKeyResult.mode)
  elements.keyConfidence.textContent = lastKeyResult.confidence
  elements.alternateKeys.textContent = lastKeyResult.alternates.length
    ? lastKeyResult.alternates.join(", ")
    : META.NO_MATCHES
  updateKeyScan(lastKeyResult, true)
  animateKeyScan(elements.keyPanel?.querySelector(".s9-key-scan"), resolveKeyScanMotionState())
  updatePanelStates()

  animationFrameId = requestAnimationFrame(tickAudioAnalysis)
}

function bindEvents(): void {
  elements.tapButton.addEventListener("click", handleTap)
  elements.resetTapButton.addEventListener("click", handleResetTap)
  elements.startMicButton.addEventListener("click", (event) => {
    event.stopPropagation()
    handleStartMic()
  })
  elements.stopMicButton.addEventListener("click", handleStopMic)

  window.addEventListener("keydown", (event) => {
    const isSpace = event.code === "Space"
    const target = event.target as HTMLElement | null
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")

    if (!isSpace || isTyping || event.repeat) return

    event.preventDefault()
    handleTap()
  })
}

bindEvents()
initS9Motion()
initAsciiVisuals(elements)
updateTapUi(resetTapBpm())
