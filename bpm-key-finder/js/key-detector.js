import { NOTE_NAMES, clamp, confidenceLabel, frequencyToMidiNote, midiNoteToPitchClass, normalize } from './audio-utils.js';

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

let chromaProfile = new Array(12).fill(0);
let framesAnalyzed = 0;

export function resetKeyDetector() {
  chromaProfile = new Array(12).fill(0);
  framesAnalyzed = 0;
}

export function analyzeKey(snapshot) {
  if (!snapshot) return createUnknownResult();

  const { frequencyData, sampleRate } = snapshot;
  const binHz = sampleRate / (frequencyData.length * 2);

  for (let bin = 2; bin < frequencyData.length; bin += 1) {
    const frequency = bin * binHz;
    if (frequency < 65 || frequency > 1600) continue;

    const magnitude = frequencyData[bin];
    if (magnitude < 18) continue;

    const midi = frequencyToMidiNote(frequency);
    const pitchClass = midiNoteToPitchClass(midi);
    if (pitchClass === null) continue;

    chromaProfile[pitchClass] = chromaProfile[pitchClass] * 0.996 + magnitude * 0.004;
  }

  framesAnalyzed += 1;
  return detectKey();
}

function detectKey() {
  if (framesAnalyzed < 120 || Math.max(...chromaProfile) < 3) {
    return createUnknownResult();
  }

  const chroma = normalize(chromaProfile);
  const majorTemplate = normalize(MAJOR_PROFILE);
  const minorTemplate = normalize(MINOR_PROFILE);

  const candidates = [];

  for (let root = 0; root < 12; root += 1) {
    candidates.push({
      key: NOTE_NAMES[root],
      mode: 'major',
      score: correlation(chroma, rotateProfile(majorTemplate, root)),
    });
    candidates.push({
      key: NOTE_NAMES[root],
      mode: 'minor',
      score: correlation(chroma, rotateProfile(minorTemplate, root)),
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  const separation = clamp(best.score - second.score, 0, 1);
  const confidenceScore = clamp((best.score + separation * 1.4) / 1.8, 0, 1);

  return {
    key: best.key,
    mode: best.mode,
    confidence: confidenceLabel(confidenceScore),
    confidenceScore,
    alternates: candidates.slice(1, 4).map((candidate) => `${candidate.key} ${candidate.mode}`),
  };
}

function createUnknownResult() {
  return {
    key: 'Unknown',
    mode: 'Mode unknown',
    confidence: 'Low',
    confidenceScore: 0,
    alternates: [],
  };
}

function rotateProfile(profile, root) {
  const rotated = new Array(12);
  for (let i = 0; i < 12; i += 1) {
    rotated[(i + root) % 12] = profile[i];
  }
  return rotated;
}

function correlation(a, b) {
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;

  let numerator = 0;
  let denominatorA = 0;
  let denominatorB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denominatorA += da * da;
    denominatorB += db * db;
  }

  return numerator / Math.sqrt(denominatorA * denominatorB || 1);
}
