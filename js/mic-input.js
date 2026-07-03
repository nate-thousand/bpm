let audioContext;
let analyser;
let stream;
let timeData;
let frequencyData;
let source;
let muteNode;

export async function startMic() {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;

  muteNode = audioContext.createGain();
  muteNode.gain.value = 0;

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  analyser.connect(muteNode);
  muteNode.connect(audioContext.destination);

  timeData = new Uint8Array(analyser.fftSize);
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  await resumeMic();

  return { audioContext, analyser };
}

export async function resumeMic() {
  if (audioContext?.state === 'suspended') {
    await audioContext.resume();
  }
}

export function stopMic() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  if (source) {
    source.disconnect();
  }

  if (analyser) {
    analyser.disconnect();
  }

  if (muteNode) {
    muteNode.disconnect();
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }

  audioContext = null;
  analyser = null;
  stream = null;
  source = null;
  muteNode = null;
  timeData = null;
  frequencyData = null;
}

export function getAudioSnapshot() {
  if (!analyser || !audioContext || !timeData || !frequencyData) return null;

  analyser.getByteTimeDomainData(timeData);
  analyser.getByteFrequencyData(frequencyData);

  return {
    timeData,
    frequencyData,
    sampleRate: audioContext.sampleRate,
    fftSize: analyser.fftSize,
  };
}

export function getInputLevel(snapshot) {
  const samples = snapshot?.timeData ?? timeData;
  if (!samples) return 0;

  let sumSquares = 0;
  for (const sample of samples) {
    const centered = (sample - 128) / 128;
    sumSquares += centered * centered;
  }

  return Math.sqrt(sumSquares / samples.length);
}

export function isMicActive() {
  return Boolean(analyser && audioContext && stream?.active);
}
