import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SLEEVE_TO_RECORD_RATIO, useRecordDelivery } from './useRecordDelivery'

const animateMock = vi.hoisted(() => vi.fn())

vi.mock('animejs', () => ({
  animate: animateMock,
}))

describe('useRecordDelivery', () => {
  beforeEach(() => {
    animateMock.mockReset()
    animateMock.mockImplementation(() => ({ revert: vi.fn() }))
  })

  it('sizes the sleeve just larger than the record and starts both fully off-screen', () => {
    const sleeve = document.createElement('div')
    const record = document.createElement('div')
    const { result } = renderHook(() => useRecordDelivery({ current: sleeve }, { current: record }))

    // A 600px-wide platter on screen.
    const targetRect = { left: 400, top: 100, width: 600, height: 600 } as DOMRect
    result.current.deliverRecord({ targetRect, onLanded: vi.fn() })

    const recordDiameter = 600 * (132 / 150)
    const sleeveSize = recordDiameter * SLEEVE_TO_RECORD_RATIO
    expect(record.style.width).toBe(`${recordDiameter}px`)
    expect(sleeve.style.width).toBe(`${sleeveSize}px`)
    expect(sleeve.style.height).toBe(`${sleeveSize}px`)

    // First leg: sleeve and record travel together, centred on each other,
    // beginning entirely beyond the bottom-left corner of the viewport.
    const sleeveLeg = animateMock.mock.calls.find(([el]) => el === sleeve)![1]
    const recordLeg = animateMock.mock.calls.find(([el]) => el === record)![1]
    const sleeveStartCenter = {
      x: sleeveLeg.translateX[0] + sleeveSize / 2,
      y: sleeveLeg.translateY[0] + sleeveSize / 2,
    }
    const recordStartCenter = {
      x: recordLeg.translateX[0] + recordDiameter / 2,
      y: recordLeg.translateY[0] + recordDiameter / 2,
    }
    expect(recordStartCenter.x).toBeCloseTo(sleeveStartCenter.x, 6)
    expect(recordStartCenter.y).toBeCloseTo(sleeveStartCenter.y, 6)
    expect(sleeveLeg.translateX[0] + sleeveSize).toBeLessThan(0)
    expect(sleeveLeg.translateY[0]).toBeGreaterThan(window.innerHeight)

    // …and stops fully inside the bottom-left corner so the cover is seen,
    // with the record still centred behind it.
    const sleeveEnd = { x: sleeveLeg.translateX[1], y: sleeveLeg.translateY[1] }
    expect(sleeveEnd.x).toBeGreaterThanOrEqual(0)
    expect(sleeveEnd.y + sleeveSize).toBeLessThanOrEqual(window.innerHeight)
    expect(recordLeg.translateX[1] + recordDiameter / 2).toBeCloseTo(
      sleeveEnd.x + sleeveSize / 2,
      6
    )
    expect(recordLeg.translateY[1] + recordDiameter / 2).toBeCloseTo(
      sleeveEnd.y + sleeveSize / 2,
      6
    )
  })

  it('lands immediately when the overlay elements are missing', () => {
    const onLanded = vi.fn()
    const { result } = renderHook(() => useRecordDelivery({ current: null }, { current: null }))
    result.current.deliverRecord({
      targetRect: { left: 0, top: 0, width: 100, height: 100 } as DOMRect,
      onLanded,
    })
    expect(onLanded).toHaveBeenCalledTimes(1)
    expect(animateMock).not.toHaveBeenCalled()
  })
})
