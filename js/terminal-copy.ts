/** Signal 9 Tempo Scanner — operational terminal language. */

export const CARRIER = {
  STANDBY: "CARRIER STANDBY",
  ACQUIRING: "ACQUIRING SIGNAL",
  REQUESTING_ACCESS: "REQUESTING CARRIER ACCESS",
  ACCESS_DENIED: "CARRIER ACCESS DENIED",
  UNAVAILABLE: "CARRIER UNAVAILABLE",
  STOPPED: "CARRIER STOPPED",
} as const

export const LOCK = {
  SEARCHING: "SEARCHING",
  WEAK: "WEAK LOCK",
  MODERATE: "MODERATE LOCK",
  STRONG: "STRONG LOCK",
  NO_LOCK: "NO LOCK",
  MODE_UNRESOLVED: "MODE UNRESOLVED",
} as const

export const PANEL_STATE = {
  OFFLINE: "offline",
  STANDBY: "standby",
  SEARCHING: "searching",
  ACQUIRING: "acquiring",
  LOCKED: "locked",
  DECODING: "decoding",
  DEGRADED: "degraded",
  JAMMED: "jammed",
  TRANSMITTING: "transmitting",
  ARCHIVED: "archived",
  RECOVERED: "recovered",
} as const

export type PanelState = (typeof PANEL_STATE)[keyof typeof PANEL_STATE]

export const PANEL_STATE_LABEL: Record<PanelState, string> = {
  [PANEL_STATE.OFFLINE]: "OFFLINE",
  [PANEL_STATE.STANDBY]: "STANDBY",
  [PANEL_STATE.SEARCHING]: "SEARCHING",
  [PANEL_STATE.ACQUIRING]: "ACQUIRING",
  [PANEL_STATE.LOCKED]: "LOCKED",
  [PANEL_STATE.DECODING]: "DECODING",
  [PANEL_STATE.DEGRADED]: "DEGRADED",
  [PANEL_STATE.JAMMED]: "JAMMED",
  [PANEL_STATE.TRANSMITTING]: "TRANSMITTING",
  [PANEL_STATE.ARCHIVED]: "ARCHIVED",
  [PANEL_STATE.RECOVERED]: "RECOVERED",
}

export const META = {
  NONE: "NONE",
  NO_MATCHES: "NO MATCHES",
} as const

export const CONTROLS = {
  MARK_BEAT: "MARK BEAT",
  CLEAR_SESSION: "CLEAR SESSION",
  OPEN_CARRIER: "OPEN CARRIER",
  CLOSE_CARRIER: "CLOSE CARRIER",
} as const

export const VISUAL = {
  STANDBY: "STANDBY",
  TAP_ACTIVE: "TAP ACTIVE",
  MIC_SCANNING: "MIC SCANNING",
  KEY_PENDING: "KEY SCAN PENDING",
  NO_SIGNAL: "NO SIGNAL",
  PENDING: "PENDING",
} as const

/** Map confidence score to lock terminology. */
export function lockLabel(score: number): string {
  if (score >= 0.75) return LOCK.STRONG
  if (score >= 0.45) return LOCK.MODERATE
  return LOCK.WEAK
}

/** Format key mode for display. */
export function formatKeyMode(mode: string | null | undefined): string {
  if (!mode || mode === "Mode unknown") return LOCK.MODE_UNRESOLVED
  return mode.toUpperCase()
}
