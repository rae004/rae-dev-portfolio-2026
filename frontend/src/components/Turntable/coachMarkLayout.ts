// Pure geometry for a coach mark: where the text bubble sits along the
// viewport edge, and the curved arrow path from it to the target. Kept
// free of DOM access so the placement rules are unit-testable with plain
// rectangles.

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export type CoachMarkMode = 'side' | 'dock-bottom' | 'dock-top'

export interface CoachMarkLayout {
  mode: CoachMarkMode
  bubble: Point // top-left corner, viewport pixels
  arrowPath: string // SVG path data in viewport pixels
  // The target is entirely below the fold — the arrow still points at it,
  // but the bubble sits up where it's actually seen and copy can say
  // "scroll down".
  targetBelowFold: boolean
}

// Breathing room between the bubble and the viewport edge.
export const EDGE_MARGIN = 16
// Gap between the arrowhead and the target so it points *at* the element
// rather than touching/overlapping it.
const TIP_GAP = 10
// How far the arrow's control point bows away from the straight line, as a
// fraction of the arrow's length — what makes it read as a hand-drawn curve.
const BOW = 0.35
// Minimum vertical run a docked arrow needs between the target and the
// bubble to still read as "pointing" rather than touching.
const MIN_ARROW_ROOM = 48
// Where a side bubble sits (as a fraction of viewport height) when its
// target is below the fold — high enough to be read on first paint rather
// than clamped down against the bottom edge.
const BELOW_FOLD_BUBBLE_Y = 0.4
// A target whose center is below this fraction of the viewport counts as
// "below the fold": it's either fully offscreen or just peeking in at the
// bottom edge, and either way the visitor needs to scroll to reach it.
const FOLD_LINE = 0.85

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const quadraticPath = (start: Point, end: Point, bowSign: 1 | -1): string => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  // Perpendicular to the start→end line, scaled by the bow amount.
  const px = -dy * BOW * bowSign
  const py = dx * BOW * bowSign
  const cx = start.x + dx / 2 + px
  const cy = start.y + dy / 2 + py
  const fmt = (n: number) => Math.round(n * 10) / 10
  return `M ${fmt(start.x)} ${fmt(start.y)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(end.x)} ${fmt(end.y)}`
}

// Placement rule, in priority order:
//   1. 'side' — desktop-style: bubble in the left viewport gutter, level
//      with the target, arrow curving inward. Used whenever there's room
//      left of the target for the bubble without overlapping content.
//   2. Otherwise (narrow viewport, no side gutter) dock the bubble to the
//      bottom viewport edge with the arrow reaching up to the target — the
//      bottom edge is the one that never collides with a sticky navbar.
//      Only when the target sits so low that there's no room for an arrow
//      between it and a bottom bubble does it dock to the top instead.
export const computeCoachMarkLayout = (
  target: Rect,
  bubble: Size,
  viewport: Size
): CoachMarkLayout => {
  const targetCenter = {
    x: target.left + target.width / 2,
    y: target.top + target.height / 2,
  }

  const targetBelowFold = targetCenter.y > viewport.height * FOLD_LINE

  const sideRoom = bubble.width + EDGE_MARGIN * 2
  if (target.left >= sideRoom) {
    const preferredY = targetBelowFold
      ? viewport.height * BELOW_FOLD_BUBBLE_Y - bubble.height / 2
      : targetCenter.y - bubble.height / 2
    const bubbleTopLeft = {
      x: EDGE_MARGIN,
      y: clamp(preferredY, EDGE_MARGIN, viewport.height - bubble.height - EDGE_MARGIN),
    }
    // Level with the target: leave from the bubble's right edge and arc
    // gently upward. Target far below: leave from the bubble's bottom
    // center and bow the other way, so the arrow drops down the gutter and
    // sweeps in instead of cutting across the turntable.
    const start = targetBelowFold
      ? { x: bubbleTopLeft.x + bubble.width / 2, y: bubbleTopLeft.y + bubble.height }
      : { x: bubbleTopLeft.x + bubble.width, y: bubbleTopLeft.y + bubble.height / 2 }
    const end = { x: target.left - TIP_GAP, y: targetCenter.y }
    const bowSign = targetBelowFold ? 1 : -1
    return {
      mode: 'side',
      bubble: bubbleTopLeft,
      arrowPath: quadraticPath(start, end, bowSign),
      targetBelowFold,
    }
  }

  const bottomBubbleTop = viewport.height - bubble.height - EDGE_MARGIN
  const dockBottom = target.top + target.height + TIP_GAP + MIN_ARROW_ROOM <= bottomBubbleTop

  const bubbleX = clamp(
    targetCenter.x - bubble.width / 2,
    EDGE_MARGIN,
    viewport.width - bubble.width - EDGE_MARGIN
  )

  // A docked arrow runs mostly vertically, so its bow goes sideways —
  // always toward the viewport's horizontal center, never out past the
  // nearer edge where it would be clipped.
  const bowTowardCenter = (start: Point, end: Point): 1 | -1 => {
    const towardCenter = targetCenter.x < viewport.width / 2 ? 1 : -1
    const perpX = -(end.y - start.y) // x component of the +1 bow direction
    return Math.sign(perpX) === towardCenter ? 1 : -1
  }

  if (dockBottom) {
    const bubbleTopLeft = { x: bubbleX, y: bottomBubbleTop }
    const start = { x: bubbleTopLeft.x + bubble.width / 2, y: bubbleTopLeft.y }
    const end = { x: targetCenter.x, y: target.top + target.height + TIP_GAP }
    return {
      mode: 'dock-bottom',
      bubble: bubbleTopLeft,
      arrowPath: quadraticPath(start, end, bowTowardCenter(start, end)),
      targetBelowFold,
    }
  }

  const bubbleTopLeft = { x: bubbleX, y: EDGE_MARGIN }
  const start = { x: bubbleTopLeft.x + bubble.width / 2, y: bubbleTopLeft.y + bubble.height }
  const end = { x: targetCenter.x, y: target.top - TIP_GAP }
  return {
    mode: 'dock-top',
    bubble: bubbleTopLeft,
    arrowPath: quadraticPath(start, end, bowTowardCenter(start, end)),
    targetBelowFold,
  }
}
