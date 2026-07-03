/** Signal 9 Tempo Scanner — operational terminal language. */

export const CARRIER = {
  STANDBY: 'CARRIER STANDBY',
  ACQUIRING: 'ACQUIRING SIGNAL',
  REQUESTING_ACCESS: 'REQUESTING CARRIER ACCESS',
  ACCESS_DENIED: 'CARRIER ACCESS DENIED',
  UNAVAILABLE: 'CARRIER UNAVAILABLE',
  STOPPED: 'CARRIER STOPPED',
};

export const LOCK = {
  SEARCHING: 'SEARCHING',
  WEAK: 'WEAK LOCK',
  MODERATE: 'MODERATE LOCK',
  STRONG: 'STRONG LOCK',
  NO_LOCK: 'NO LOCK',
  MODE_UNRESOLVED: 'MODE UNRESOLVED',
};

export const PANEL_STATE = {
  OFFLINE: 'offline',
  STANDBY: 'standby',
  SEARCHING: 'searching',
  ACQUIRING: 'acquiring',
  LOCKED: 'locked',
  DECODING: 'decoding',
  DEGRADED: 'degraded',
  JAMMED: 'jammed',
  TRANSMITTING: 'transmitting',
  ARCHIVED: 'archived',
  RECOVERED: 'recovered',
};

export const PANEL_STATE_LABEL = {
  [PANEL_STATE.OFFLINE]: 'OFFLINE',
  [PANEL_STATE.STANDBY]: 'STANDBY',
  [PANEL_STATE.SEARCHING]: 'SEARCHING',
  [PANEL_STATE.ACQUIRING]: 'ACQUIRING',
  [PANEL_STATE.LOCKED]: 'LOCKED',
  [PANEL_STATE.DECODING]: 'DECODING',
  [PANEL_STATE.DEGRADED]: 'DEGRADED',
  [PANEL_STATE.JAMMED]: 'JAMMED',
  [PANEL_STATE.TRANSMITTING]: 'TRANSMITTING',
  [PANEL_STATE.ARCHIVED]: 'ARCHIVED',
  [PANEL_STATE.RECOVERED]: 'RECOVERED',
};

export const META = {
  NONE: 'NONE',
  NO_MATCHES: 'NO MATCHES',
};

export const CONTROLS = {
  MARK_BEAT: 'MARK BEAT',
  CLEAR_SESSION: 'CLEAR SESSION',
  OPEN_CARRIER: 'OPEN CARRIER',
  CLOSE_CARRIER: 'CLOSE CARRIER',
};

export const VISUAL = {
  STANDBY: 'STANDBY',
  TAP_ACTIVE: 'TAP ACTIVE',
  MIC_SCANNING: 'MIC SCANNING',
  KEY_PENDING: 'KEY SCAN PENDING',
  NO_SIGNAL: 'NO SIGNAL',
  PENDING: 'PENDING',
};

/** Map confidence score to lock terminology. */
export function lockLabel(score) {
  if (score >= 0.75) return LOCK.STRONG;
  if (score >= 0.45) return LOCK.MODERATE;
  return LOCK.WEAK;
}

/** Format key mode for display. */
export function formatKeyMode(mode) {
  if (!mode || mode === 'Mode unknown') return LOCK.MODE_UNRESOLVED;
  return mode.toUpperCase();
}
