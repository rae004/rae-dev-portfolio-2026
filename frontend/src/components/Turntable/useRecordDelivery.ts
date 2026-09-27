import { useCallback, useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { JSAnimation } from 'animejs'

// Real record radius (132) / platter radius (150) from turntableConfig's
// viewBox proportions — sizes the traveling record to match the platter's
// actual on-screen size at landing, so the handoff to the SVG's own record
// doesn't visibly jump in scale.
const RECORD_TO_PLATTER_RATIO = 132 / 150
// The sleeve (album cover) is a touch larger than the record so it fully
// hides the disc until the path carries it out — a sliver of jacket edge
// past the vinyl reads as a real 12" sleeve rather than a same-size tile.
export const SLEEVE_TO_RECORD_RATIO = 1.04
// However far offscreen is enough to clear the corner regardless of
// viewport size — the sleeve/record start fully hidden beyond it.
const OFFSCREEN_MARGIN = 60
// Where the sleeve stops to show off the cover: tucked fully inside the
// bottom-left corner of the viewport with this much breathing room.
const SHOWCASE_MARGIN = 24
// Overall tempo of the delivery. 1 = the original timing; >1 is slower.
// Every leg below scales with it so the choreography keeps its proportions.
const TEMPO = 1.15
// Sleeve + record slide in; record slides out to the platter; sleeve drops
// back. Base values were tuned by eye at TEMPO 1.
const SLIDE_IN_MS = 450 * TEMPO
const RECORD_TO_PLATTER_MS = 700 * TEMPO
const SLEEVE_RETURN_MS = 450 * TEMPO
// Beat between the sleeve arriving and the record leaving it, so the cover
// actually registers before the disc slides out.
const SHOWCASE_HOLD_MS = 150 * TEMPO

export interface DeliverRecordOptions {
  targetRect: DOMRect
  onLanded: () => void
}

export interface UseRecordDeliveryReturn {
  deliverRecord: (options: DeliverRecordOptions) => void
}

// Flies a record (in its album-cover sleeve) in from beyond the bottom-left
// corner of the viewport. The sleeve slides just far enough to sit fully in
// view in that corner and stops there to show the cover; the record then
// slides out from behind it and travels alone onto the platter, after which
// the sleeve drops back out of the corner it came from. Lives
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
      const sleeveSize = recordDiameter * SLEEVE_TO_RECORD_RATIO
      sleeve.style.width = `${sleeveSize}px`
      sleeve.style.height = `${sleeveSize}px`

      const targetCenter = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
      }
      // Farthest bottom-left corner of the viewport, not just the widget.
      // Offset by the sleeve's own size so it starts fully hidden however
      // large the platter (and therefore the sleeve) is on this screen.
      const start = {
        x: -sleeveSize - OFFSCREEN_MARGIN,
        y: window.innerHeight + sleeveSize / 2 + OFFSCREEN_MARGIN,
      }
      // The showcase spot: sleeve fully inside the bottom-left corner. Not a
      // fraction of the path — with a platter-sized cover, "a third of the
      // way" from beyond the corner left most of the art off-screen.
      const mid = {
        x: SHOWCASE_MARGIN + sleeveSize / 2,
        y: window.innerHeight - SHOWCASE_MARGIN - sleeveSize / 2,
      }

      const topLeft = (center: { x: number; y: number }, size: number) => ({
        x: center.x - size / 2,
        y: center.y - size / 2,
      })

      const sleeveStart = topLeft(start, sleeveSize)
      const sleeveMid = topLeft(mid, sleeveSize)
      const recordStart = topLeft(start, recordDiameter)
      const recordMid = topLeft(mid, recordDiameter)
      const recordTarget = topLeft(targetCenter, recordDiameter)

      sleeve.style.opacity = '1'
      record.style.opacity = '1'

      // Phase 1: sleeve and record slide in together to the showcase spot.
      sleeveAnimRef.current = animate(sleeve, {
        translateX: [sleeveStart.x, sleeveMid.x],
        translateY: [sleeveStart.y, sleeveMid.y],
        duration: SLIDE_IN_MS,
        ease: 'outQuad',
      })

      recordAnimRef.current = animate(record, {
        translateX: [recordStart.x, recordMid.x],
        translateY: [recordStart.y, recordMid.y],
        duration: SLIDE_IN_MS,
        ease: 'outQuad',
        onComplete: () => {
          // Phase 2: after a beat, the record slides out from behind the
          // cover and continues alone to the platter; sleeve holds.
          recordAnimRef.current = animate(record, {
            translateX: [recordMid.x, recordTarget.x],
            translateY: [recordMid.y, recordTarget.y],
            delay: SHOWCASE_HOLD_MS,
            duration: RECORD_TO_PLATTER_MS,
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
                duration: SLEEVE_RETURN_MS,
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
