import { describe, expect, it } from 'vitest'
import { computeCoachMarkLayout, EDGE_MARGIN } from './coachMarkLayout'

const bubble = { width: 160, height: 40 }
const desktop = { width: 1440, height: 900 }
const phone = { width: 400, height: 780 }

const pathEnd = (d: string) => {
  const nums = d
    .split(/[\sMQ]+/)
    .filter(Boolean)
    .map(Number)
  return { x: nums[nums.length - 2], y: nums[nums.length - 1] }
}

describe('computeCoachMarkLayout', () => {
  it('uses the left gutter when there is room beside the target', () => {
    const target = { left: 500, top: 700, width: 96, height: 72 }
    const layout = computeCoachMarkLayout(target, bubble, desktop)

    expect(layout.mode).toBe('side')
    expect(layout.bubble.x).toBe(EDGE_MARGIN)
    // Vertically centered on the target.
    expect(layout.bubble.y).toBe(700 + 36 - 20)
    // Arrow lands just short of the target's left edge, at its vertical center.
    const end = pathEnd(layout.arrowPath)
    expect(end.x).toBeLessThan(target.left)
    expect(end.x).toBeGreaterThan(target.left - 20)
    expect(end.y).toBe(736)
  })

  it('lifts a side bubble up the page when the target is below the fold', () => {
    // First song pill on a tall desktop load: the list hasn't scrolled
    // into view yet. Bubble should sit high (not hug the bottom edge) and
    // flag the target as offscreen so the copy can say "scroll down".
    const target = { left: 500, top: 1000, width: 96, height: 72 }
    const layout = computeCoachMarkLayout(target, bubble, desktop)

    expect(layout.mode).toBe('side')
    expect(layout.targetBelowFold).toBe(true)
    expect(layout.bubble.y).toBe(desktop.height * 0.4 - bubble.height / 2)
    // Arrow leaves from the bubble's bottom center…
    const [startX, startY] = layout.arrowPath
      .split(/[\sMQ]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(Number)
    expect(startX).toBe(layout.bubble.x + bubble.width / 2)
    expect(startY).toBe(layout.bubble.y + bubble.height)
    // …and still ends at the (offscreen) target.
    expect(pathEnd(layout.arrowPath).y).toBe(1036)
  })

  it('treats a target just peeking in at the bottom edge as below the fold', () => {
    // Real first-load case on a 963px-tall window: the pill's top is at
    // ~940px, technically on screen, but nobody can use it there.
    const target = { left: 500, top: 940, width: 96, height: 72 }
    const layout = computeCoachMarkLayout(target, bubble, { width: 1440, height: 963 })
    expect(layout.targetBelowFold).toBe(true)
    expect(layout.bubble.y).toBeLessThan(963 * 0.5)
  })

  it('reports an in-view target as not below the fold', () => {
    const target = { left: 500, top: 700, width: 96, height: 72 }
    expect(computeCoachMarkLayout(target, bubble, desktop).targetBelowFold).toBe(false)
  })

  it('clamps a side bubble inside the viewport for targets near an edge', () => {
    const target = { left: 500, top: 5, width: 96, height: 20 }
    const layout = computeCoachMarkLayout(target, bubble, desktop)
    expect(layout.mode).toBe('side')
    expect(layout.bubble.y).toBe(EDGE_MARGIN)
  })

  it('docks to the bottom edge on narrow viewports when the target is in the upper half', () => {
    // Play button near the bottom-left of a full-width turntable: no gutter.
    const target = { left: 28, top: 300, width: 46, height: 36 }
    const layout = computeCoachMarkLayout(target, bubble, phone)

    expect(layout.mode).toBe('dock-bottom')
    expect(layout.bubble.y).toBe(phone.height - bubble.height - EDGE_MARGIN)
    // Horizontally follows the target but never leaves the viewport.
    expect(layout.bubble.x).toBe(EDGE_MARGIN)
    const end = pathEnd(layout.arrowPath)
    expect(end.x).toBe(51)
    expect(end.y).toBeGreaterThan(target.top + target.height)
  })

  it('still docks to the bottom for a lower-half target as long as the arrow has room', () => {
    // First song pill on a phone: below the turntable, but well clear of
    // the bottom edge. Bottom docking keeps the bubble off the navbar.
    const target = { left: 107, top: 524, width: 181, height: 62 }
    const layout = computeCoachMarkLayout(target, bubble, phone)
    expect(layout.mode).toBe('dock-bottom')
  })

  it('docks to the top edge only when the target is nearly touching the bottom', () => {
    const target = { left: 20, top: 700, width: 360, height: 56 }
    const layout = computeCoachMarkLayout(target, bubble, phone)

    expect(layout.mode).toBe('dock-top')
    expect(layout.bubble.y).toBe(EDGE_MARGIN)
    const end = pathEnd(layout.arrowPath)
    expect(end.y).toBeLessThan(target.top)
  })

  it('bows a docked arrow toward the viewport center, never off the near edge', () => {
    const controlX = (d: string) => Number(d.split(/[\sMQ]+/).filter(Boolean)[2])
    // Play button hugging the left edge: bow must go right (positive x).
    const leftTarget = { left: 28, top: 440, width: 46, height: 36 }
    const left = computeCoachMarkLayout(leftTarget, bubble, phone)
    expect(left.mode).toBe('dock-bottom')
    expect(controlX(left.arrowPath)).toBeGreaterThan(leftTarget.left + leftTarget.width / 2)
    // Same target mirrored to the right edge: bow must go left.
    const rightTarget = { left: 326, top: 440, width: 46, height: 36 }
    const right = computeCoachMarkLayout(rightTarget, bubble, phone)
    expect(controlX(right.arrowPath)).toBeLessThan(rightTarget.left + rightTarget.width / 2)
  })

  it('keeps a docked bubble inside the right viewport edge', () => {
    const target = { left: 340, top: 100, width: 50, height: 30 }
    const layout = computeCoachMarkLayout(target, bubble, phone)
    expect(layout.bubble.x + bubble.width).toBeLessThanOrEqual(phone.width - EDGE_MARGIN)
  })
})
