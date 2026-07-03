let audioContext;
let analyser;
let stream;
let timeData;
let frequencyData;
let source;

export async function startMic() {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  audioContext = new AudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  timeData = new Uint8Array(analyser.fftSize);
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  return { audioContext, analyser };
}

export function stopMic() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  if (source) {
    source.disconnect();
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }

  audioContext = null;
  analyser = null;
  stream = null;
  source = null;
}

export function getAudioSnapshot() {
  if (!analyser || !audioContext) return null;

  analyser.getByteTimeDomainData(timeData);
  analyser.getByteFrequencyData(frequencyData);

  return {
    timeData,
    frequencyData,
    sampleRate: audioContext.sampleRate,
    fftSize: analyser.fftSize,
  };
}

export function getInputLevel() {
  if (!timeData) return 0;

  let sumSquares = 0;
  for (const sample of timeData) {
    const centered = (sample - 128) / 128;
    sumSquares += centered * centered;
  }

  return Math.sqrt(sumSquares / timeData.length);
}
