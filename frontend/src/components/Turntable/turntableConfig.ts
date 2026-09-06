// Tunable constants for the turntable hero widget. Keeping these in one
// place makes it easy to tweak the feel (speed, angles, timings) without
// hunting through animation/orchestration code.

// Real-world 33⅓ RPM record: one revolution every 1800ms.
export const PLATTER_RPM = 33 + 1 / 3
export const PLATTER_REVOLUTION_MS = (60 / PLATTER_RPM) * 1000

// Tonearm rotation angles (degrees), measured around the pivot point
// defined in TurntableSvg's viewBox coordinates.
export const TONEARM_REST_ANGLE = -18
export const TONEARM_CUE_ANGLE = 4
export const TONEARM_END_ANGLE = 28

// Choreography durations (ms).
export const RECORD_DROP_DURATION_MS = 700
export const TONEARM_CUE_DURATION_MS = 900
export const TONEARM_RETURN_DURATION_MS = 600

// Reduced-motion durations — near-instant, but never literally 0 so
// anime.js still fires completion callbacks reliably.
export const REDUCED_MOTION_DURATION_MS = 1
