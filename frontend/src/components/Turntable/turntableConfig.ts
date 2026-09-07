// Tunable constants for the turntable hero widget. Keeping these in one
// place makes it easy to tweak the feel (speed, angles, timings) without
// hunting through animation/orchestration code.

// Real-world 33⅓ RPM record: one revolution every 1800ms.
export const PLATTER_RPM = 33 + 1 / 3
export const PLATTER_REVOLUTION_MS = (60 / PLATTER_RPM) * 1000

// Tonearm rotation angles (degrees), measured around the pivot point
// defined in TurntableSvg's viewBox coordinates. Found empirically (by
// setting `rotate` directly in a live browser and observing the result) —
// the CSS `rotate` individual property on an SVG group doesn't compose
// with hand-derived polar-coordinate trig the way you'd expect, so these
// were tuned by eye rather than calculated:
//   - REST parks the needle well outside the platter (radius 150), in the
//     gap before the pitch fader — not hovering over the vinyl.
//   - CUE drops the needle at the record's outer edge, where a track
//     actually starts.
//   - END sweeps it in to the label's edge, like a real tonearm playing
//     inward to the end of a song.
// All three are only ever reached via useTurntableAnimation's manual
// requestAnimationFrame tween (see tweenRotate) — never via anime.js's
// animate(). anime.js v4 animates individual transform properties through
// the Web Animations API, which can leave a finished effect attached to the
// element (fill persists) that silently overrides later plain
// `el.style.rotate` writes — the same nominal angle then renders in two
// different places depending on whether a stale WAAPI effect is still
// holding the compositor. Routing every rotate change through one plain
// rAF-driven mechanism sidesteps that entirely.
export const TONEARM_REST_ANGLE = -35
export const TONEARM_CUE_ANGLE = -20
export const TONEARM_END_ANGLE = 4

// Choreography durations (ms).
export const RECORD_DROP_DURATION_MS = 700
export const TONEARM_CUE_DURATION_MS = 900
export const TONEARM_RETURN_DURATION_MS = 600

// Reduced-motion durations — near-instant, but never literally 0 so
// anime.js still fires completion callbacks reliably.
export const REDUCED_MOTION_DURATION_MS = 1
