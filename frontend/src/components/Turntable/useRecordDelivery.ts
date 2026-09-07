import { useCallback, useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { JSAnimation } from 'animejs'

const SLEEVE_SIZE = 140
// Real record radius (132) / platter radius (150) from turntableConfig's
// viewBox proportions — sizes the traveling record to match the platter's
// actual on-screen size at landing, so the handoff to the SVG's own record
// doesn't visibly jump in scale.
const RECORD_TO_PLATTER_RATIO = 132 / 150
// However far offscreen is enough to clear the corner regardless of
// viewport size — the sleeve/record start fully hidden beyond it.
const OFFSCREEN_MARGIN = 60

export interface DeliverRecordOptions {
  targetRect: DOMRect
  onLanded: () => void
}

export interface UseRecordDeliveryReturn {
  deliverRecord: (options: DeliverRecordOptions) => void
}

// Flies a record (in its sleeve) in from the farthest bottom-left corner of
// the viewport toward the turntable. A third of the way there the sleeve
// stops and falls back; the record continues alone onto the platter. Lives
// outside useTurntableAnimation's anime.js scope (which is bound to the
// turntable's own DOM subtree) since these elements are portaled onto
// <body> instead, travelling in real viewport pixels rather than the SVG's
// local coordinate space.
export const useRecordDelivery = (
  sleeveRef: React.RefObject<HTMLDivElement | null>,
  recordRef: React.RefObject<HTMLDivElement | null>
): UseRecordDeliveryReturn => {
  const sleeveAnimRef = useRef<JSAnimation | null>(null)
  const recordAnimRef = useRef<JSAnimation | null>(null)

  useEffect(() => {
    return () => {
      sleeveAnimRef.current?.revert()
      recordAnimRef.current?.revert()
    }
  }, [])

  const deliverRecord = useCallback(
    ({ targetRect, onLanded }: DeliverRecordOptions) => {
      const sleeve = sleeveRef.current
      const record = recordRef.current
      if (!sleeve || !record) {
        onLanded()
        return
      }

      // .revert() any still-running delivery before starting a new one —
      // the same defensive pattern used throughout useTurntableAnimation:
      // an animate() call finishing normally leaves its WAAPI effect
      // attached (fill persists), which can silently override a later
      // plain style write on the same property. Reverting first guarantees
      // the explicit from/to values below actually take effect.
      sleeveAnimRef.current?.revert()
      recordAnimRef.current?.revert()

      const recordDiameter = targetRect.width * RECORD_TO_PLATTER_RATIO
      record.style.width = `${recordDiameter}px`
      record.style.height = `${recordDiameter}px`

      const targetCenter = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
      }
      // Farthest bottom-left corner of the viewport, not just the widget.
      const start = {
        x: -SLEEVE_SIZE - OFFSCREEN_MARGIN,
        y: window.innerHeight + OFFSCREEN_MARGIN,
      }
      // A third of the way from the corner to the platter — where the
      // sleeve stops and the record continues on alone.
      const mid = {
        x: start.x + (targetCenter.x - start.x) / 3,
        y: start.y + (targetCenter.y - start.y) / 3,
      }

      const topLeft = (center: { x: number; y: number }, size: number) => ({
        x: center.x - size / 2,
        y: center.y - size / 2,
      })

      const sleeveStart = topLeft(start, SLEEVE_SIZE)
      const sleeveMid = topLeft(mid, SLEEVE_SIZE)
      const recordStart = topLeft(start, recordDiameter)
      const recordMid = topLeft(mid, recordDiameter)
      const recordTarget = topLeft(targetCenter, recordDiameter)

      sleeve.style.opacity = '1'
      record.style.opacity = '1'

      // Phase 1: sleeve and record travel together for the first third.
      sleeveAnimRef.current = animate(sleeve, {
        translateX: [sleeveStart.x, sleeveMid.x],
        translateY: [sleeveStart.y, sleeveMid.y],
        duration: 450,
        ease: 'outQuad',
      })

      recordAnimRef.current = animate(record, {
        translateX: [recordStart.x, recordMid.x],
        translateY: [recordStart.y, recordMid.y],
        duration: 450,
        ease: 'outQuad',
        onComplete: () => {
          // Phase 2: record continues alone to the platter; sleeve holds.
          recordAnimRef.current = animate(record, {
            translateX: [recordMid.x, recordTarget.x],
            translateY: [recordMid.y, recordTarget.y],
            duration: 700,
            ease: 'inOutQuad',
            onComplete: () => {
              onLanded()
              // Instant hide, not a fade — onLanded() reveals the SVG's own
              // record (identical size/position) via an equally instant
              // plain-style write on the same frame. A timed crossfade here
              // depended on two independent animations — this one portaled
              // outside the SVG entirely — starting on the exact same
              // frame, and any scheduling jitter between them let the slip
              // mat flash through underneath both. Swapping instantly
              // between two identical-looking elements leaves no such gap.
              record.style.opacity = '0'
              // Phase 3: sleeve falls back to the corner it came from.
              sleeveAnimRef.current = animate(sleeve, {
                translateX: [sleeveMid.x, sleeveStart.x],
                translateY: [sleeveMid.y, sleeveStart.y],
                duration: 450,
                ease: 'inQuad',
              })
            },
          })
        },
      })
    },
    [sleeveRef, recordRef]
  )

  return { deliverRecord }
}
