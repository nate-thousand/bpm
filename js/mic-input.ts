import type { AudioSnapshot } from "./types"

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let stream: MediaStream | null = null
let timeData: Uint8Array | null = null
let frequencyData: Uint8Array | null = null
let source: MediaStreamAudioSourceNode | null = null
let muteNode: GainNode | null = null

export async function startMic(): Promise<{ audioContext: AudioContext; analyser: AnalyserNode }> {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.35

  muteNode = audioContext.createGain()
  muteNode.gain.value = 0

  source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)
  analyser.connect(muteNode)
  muteNode.connect(audioContext.destination)

  timeData = new Uint8Array(analyser.fftSize)
  frequencyData = new Uint8Array(analyser.frequencyBinCount)

  await resumeMic()

  return { audioContext, analyser }
}

export async function resumeMic(): Promise<void> {
  if (audioContext?.state === "suspended") {
    await audioContext.resume()
  }
}

export function stopMic(): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }

  if (source) {
    source.disconnect()
  }

  if (analyser) {
    analyser.disconnect()
  }

  if (muteNode) {
    muteNode.disconnect()
  }

  if (audioContext && audioContext.state !== "closed") {
    audioContext.close()
  }

  audioContext = null
  analyser = null
  stream = null
  source = null
  muteNode = null
  timeData = null
  frequencyData = null
}

export function getAudioSnapshot(): AudioSnapshot | null {
  if (!analyser || !audioContext || !timeData || !frequencyData) return null

  analyser.getByteTimeDomainData(timeData)
  analyser.getByteFrequencyData(frequencyData)

  return {
    timeData,
    frequencyData,
    sampleRate: audioContext.sampleRate,
    fftSize: analyser.fftSize,
  }
}

export function getInputLevel(snapshot?: AudioSnapshot | null): number {
  const samples = snapshot?.timeData ?? timeData
  if (!samples) return 0

  let sumSquares = 0
  for (const sample of samples) {
    const centered = (sample - 128) / 128
    sumSquares += centered * centered
  }

  return Math.sqrt(sumSquares / samples.length)
}

export function isMicActive(): boolean {
  return Boolean(analyser && audioContext && stream?.active)
}
