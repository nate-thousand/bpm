import { average, clamp, confidenceLabel, smoothValue, standardDeviation } from './audio-utils.js';

const MIN_PEAK_GAP_MS = 280;
const MAX_PEAK_AGE_MS = 14000;
const MIN_BPM = 60;
const MAX_BPM = 200;
const MIN_PEAKS_FOR_ESTIMATE = 6;
const ENERGY_HISTORY_SIZE = 56;
const BPM_SMOOTHING = 0.22;
const BPM_JUMP_RATIO = 1.12;
const MIN_MAIN_BEAT_INTERVAL_MS = 295;

let energyHistory = [];
let bassFluxHistory = [];
let recentOnsetScores = [0, 0, 0];
let peakTimes = [];
let lastPeakTime = 0;
let smoothedBpm = 0;
let previousBassEnergy = 0;

export function resetBpmDetector() {
  energyHistory = [];
  bassFluxHistory = [];
  recentOnsetScores = [0, 0, 0];
  peakTimes = [];
  lastPeakTime = 0;
  smoothedBpm = 0;
  previousBassEnergy = 0;
}

export function analyzeBpm(snapshot, inputLevel, now = performance.now()) {
  if (!snapshot) {
    return {
      bpm: 0,
      confidence: 'Waiting',
      confidenceScore: 0,
      peakCount: 0,
    };
  }

  detectPeaks(snapshot, inputLevel, now);
  peakTimes = peakTimes.filter((time) => now - time <= MAX_PEAK_AGE_MS);

  const estimate = estimateBpm();
  if (estimate.bpm && estimate.confidenceScore >= 0.4) {
    smoothedBpm = applyBpmSmoothing(smoothedBpm, estimate);
  }

  return {
    bpm: smoothedBpm ? Math.round(smoothedBpm) : 0,
    confidence: calculateBpmConfidence(estimate),
    confidenceScore: estimate.confidenceScore,
    peakCount: peakTimes.length,
  };
}

export function detectPeaks(snapshot, inputLevel, now = performance.now()) {
  if (inputLevel < 0.008) return;

  const minGap = smoothedBpm
    ? clamp((60000 / smoothedBpm) * 0.54, 260, 520)
    : MIN_PEAK_GAP_MS;

  const energy = calculateTimeDomainEnergy(snapshot.timeData);
  energyHistory.push(energy);
  energyHistory = energyHistory.slice(-ENERGY_HISTORY_SIZE);

  const bassEnergy = calculateBandEnergy(snapshot.frequencyData, 2, 22);
  const bassFlux = Math.max(0, bassEnergy - previousBassEnergy);
  previousBassEnergy = bassEnergy;
  bassFluxHistory.push(bassFlux);
  bassFluxHistory = bassFluxHistory.slice(-ENERGY_HISTORY_SIZE);

  const avgEnergy = average(energyHistory);
  const avgBassFlux = average(bassFluxHistory);
  const energyOnset = Math.max(0, energy - avgEnergy);
  const fluxOnset = Math.max(0, bassFlux - avgBassFlux * 0.5);

  const energyNorm = energyOnset / Math.max(avgEnergy * 0.22, 0.003);
  const fluxNorm = fluxOnset / Math.max(avgBassFlux * 1.9, 1.3);
  const combinedScore = fluxNorm * 0.72 + energyNorm * 0.28;

  recentOnsetScores.push(combinedScore);
  recentOnsetScores = recentOnsetScores.slice(-3);
  const isLocalPeak =
    recentOnsetScores.length === 3 &&
    recentOnsetScores[1] >= recentOnsetScores[0] &&
    recentOnsetScores[1] >= recentOnsetScores[2] &&
    recentOnsetScores[1] > 1.4;

  if (isLocalPeak && now - lastPeakTime > minGap) {
    peakTimes.push(now - 16);
    lastPeakTime = now;
  }
}

export function estimateBpm() {
  if (peakTimes.length < MIN_PEAKS_FOR_ESTIMATE) {
    return { bpm: 0, confidenceScore: 0, intervals: [] };
  }

  const anchorBpm = estimateIntervalAnchor(peakTimes);
  const combResult = findBestBpmByCombFilter(peakTimes);
  let resolvedBpm = resolveWithAnchor(combResult.bpm, combResult.score, anchorBpm);
  resolvedBpm = correctSubdivisionTempo(resolvedBpm, peakTimes);

  if (!resolvedBpm) {
    return { bpm: 0, confidenceScore: 0, intervals: [] };
  }

  const intervals = collectValidIntervals(peakTimes, resolvedBpm);
  const intervalStability =
    intervals.length >= 3
      ? clamp(1 - standardDeviation(intervals) / average(intervals), 0, 1)
      : 0;
  const sampleScore = clamp(peakTimes.length / 16, 0, 1);
  const anchorAgreement = anchorBpm
    ? clamp(1 - Math.abs(resolvedBpm - anchorBpm) / Math.max(anchorBpm, 1), 0, 1)
    : 0.45;
  const confidenceScore = clamp(
    combResult.score * 0.5 + intervalStability * 0.22 + sampleScore * 0.1 + anchorAgreement * 0.18,
    0,
    1,
  );

  return {
    bpm: resolvedBpm,
    confidenceScore,
    intervals,
  };
}

export function calculateBpmConfidence(estimate) {
  if (peakTimes.length < MIN_PEAKS_FOR_ESTIMATE) {
    return 'Waiting';
  }

  if (!estimate.bpm || estimate.confidenceScore < 0.4) {
    return 'Low';
  }

  return confidenceLabel(estimate.confidenceScore);
}

function estimateIntervalAnchor(times) {
  const intervals = [];

  for (let i = 1; i < times.length; i += 1) {
    const interval = times[i] - times[i - 1];
    if (interval >= MIN_MAIN_BEAT_INTERVAL_MS) {
      intervals.push(interval);
    }
  }

  if (intervals.length < 2) {
    return 0;
  }

  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  return foldBpm(60000 / medianInterval);
}

function findBestBpmByCombFilter(times) {
  let bestBpm = 0;
  let bestScore = 0;

  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += 1) {
    const score = scoreBpmCandidate(bpm, times);
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }

  return { bpm: bestBpm, score: bestScore };
}

function correctSubdivisionTempo(bpm, times) {
  if (!bpm || bpm <= 132) return bpm;

  const slowerBpm = foldBpm(bpm / 2);
  if (slowerBpm >= bpm) return bpm;

  const intervals = [];
  for (let i = 1; i < times.length; i += 1) {
    intervals.push(times[i] - times[i - 1]);
  }

  if (intervals.length < 3) return bpm;

  const mean = average(intervals);
  const deviation = standardDeviation(intervals);
  const isUniform = mean > 0 && deviation / mean < 0.13;
  if (!isUniform) return bpm;

  const fastScore = scoreBpmCandidate(bpm, times);
  const slowScore = scoreBpmCandidate(slowerBpm, times);
  if (slowScore >= fastScore * 0.86) {
    return slowerBpm;
  }

  return bpm;
}

function resolveWithAnchor(combBpm, combScore, anchorBpm) {
  if (!combBpm) return anchorBpm || 0;
  if (!anchorBpm) return combBpm;

  const ratio = combBpm / anchorBpm;
  const isOctaveMismatch = (ratio > 1.8 && ratio < 2.2) || (ratio > 0.45 && ratio < 0.55);
  if (isOctaveMismatch) {
    return anchorBpm;
  }

  if (Math.abs(combBpm - anchorBpm) / anchorBpm <= 0.08) {
    return Math.round(combBpm * 0.6 + anchorBpm * 0.4);
  }

  const anchorScore = scoreBpmCandidate(anchorBpm, peakTimes);
  return anchorScore >= combScore * 0.9 ? anchorBpm : combBpm;
}

function scoreBpmCandidate(bpm, times) {
  const period = 60000 / bpm;
  const tolerance = period * 0.095;
  const minSpacing = period * 0.62;
  let bestPhaseScore = 0;

  for (let phaseStep = 0; phaseStep < 8; phaseStep += 1) {
    const phaseOffset = (period / 8) * phaseStep;
    let matched = 0;
    let lastMatchedTime = -Infinity;

    for (const time of times) {
      const phase = ((time - phaseOffset) % period + period) % period;
      const dist = Math.min(phase, period - phase);

      if (dist > tolerance) continue;
      if (time - lastMatchedTime < minSpacing) continue;

      matched += 1 - dist / tolerance;
      lastMatchedTime = time;
    }

    const duration = times[times.length - 1] - times[0];
    const expectedBeats = Math.max(1, duration / period);
    bestPhaseScore = Math.max(bestPhaseScore, matched / expectedBeats);
  }

  return clamp(bestPhaseScore, 0, 1);
}

function foldBpm(bpm) {
  let folded = bpm;
  while (folded < MIN_BPM) folded *= 2;
  while (folded > MAX_BPM) folded /= 2;
  return Math.round(folded);
}

function applyBpmSmoothing(current, estimate) {
  const target = estimate.bpm;
  if (!current) return target;

  const ratio = target / current;
  const isLargeJump = ratio > BPM_JUMP_RATIO || ratio < 1 / BPM_JUMP_RATIO;

  if (isLargeJump && estimate.confidenceScore < 0.62) {
    return current;
  }

  const factor = estimate.confidenceScore >= 0.7 ? BPM_SMOOTHING : BPM_SMOOTHING * 0.5;
  return smoothValue(current, target, factor);
}

function collectValidIntervals(times, expectedBpm) {
  const expectedInterval = 60000 / expectedBpm;
  const tolerance = expectedInterval * 0.16;
  const intervals = [];

  for (let i = 1; i < times.length; i += 1) {
    const interval = times[i] - times[i - 1];
    if (Math.abs(interval - expectedInterval) <= tolerance) {
      intervals.push(interval);
    }
  }

  return intervals;
}

function calculateTimeDomainEnergy(timeData) {
  let sumSquares = 0;

  for (const sample of timeData) {
    const centered = (sample - 128) / 128;
    sumSquares += centered * centered;
  }

  return Math.sqrt(sumSquares / timeData.length);
}

function calculateBandEnergy(frequencyData, startBin, endBin) {
  let sum = 0;
  const end = Math.min(endBin, frequencyData.length);

  for (let i = startBin; i < end; i += 1) {
    sum += frequencyData[i];
  }

  return sum / Math.max(1, end - startBin);
}
