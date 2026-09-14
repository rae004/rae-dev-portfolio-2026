import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { animate, svg } from 'animejs'
import type { JSAnimation } from 'animejs'
import { computeCoachMarkLayout } from './coachMarkLayout'
import type { CoachMarkLayout } from './coachMarkLayout'

interface CoachMarkProps {
  // Resolved lazily on every measurement rather than passed as a ref: the
  // targets live inside components this one doesn't own (SongList,
  // TransportButton), and TransportButton in particular re-creates its
  // button element when it switches modes.
  getTarget: () => Element | null
  text: string
  // Shown instead of `text` while the target is entirely below the fold.
  offscreenText?: string
}

const STROKE_WIDTH = 6
// fill → drain → fill: the arrow "pours" toward the target, empties back
// to the bubble, then pours again and stays full.
const FILL_MS = 700
const DRAIN_MS = 550

// A text bubble pinned to the viewport edge plus a curved arrow pointing
// inward at a target element. Portaled onto <body> for the same reason as
// RecordDeliveryOverlay: it has to position itself in real viewport pixels,
// outside the hero's own layout and clear of any transformed ancestor.
//
// Positioning is derived purely from getBoundingClientRect() and re-run on
// resize, scroll (the overlay is fixed, the page isn't) and any size change
// of the target or the page body — the song list re-wraps as the viewport
// narrows, so the first song's rect genuinely moves around.
const CoachMark = ({ getTarget, text, offscreenText }: CoachMarkProps) => {
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const fillPathRef = useRef<SVGPathElement | null>(null)
  const fillAnimRef = useRef<JSAnimation | null>(null)
  const [layout, setLayout] = useState<CoachMarkLayout | null>(null)
  const markerId = useId()

  useLayoutEffect(() => {
    let frame: number | null = null

    const measure = () => {
      frame = null
      const target = getTarget()
      const bubble = bubbleRef.current
      if (!target || !bubble) {
        setLayout(null)
        return
      }
      const next = computeCoachMarkLayout(
        target.getBoundingClientRect(),
        { width: bubble.offsetWidth, height: bubble.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight }
      )
      setLayout(prev =>
        prev &&
        prev.mode === next.mode &&
        prev.arrowPath === next.arrowPath &&
        prev.bubble.x === next.bubble.x &&
        prev.bubble.y === next.bubble.y &&
        prev.targetBelowFold === next.targetBelowFold
          ? prev
          : next
      )
    }

    // Coalesce bursts of scroll/resize events into one measurement per frame.
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { capture: true, passive: true })

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      observer.observe(document.body)
      const target = getTarget()
      if (target) observer.observe(target)
    }

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, { capture: true })
      observer?.disconnect()
    }
  }, [getTarget])

  // One-time attention animation on the solid "fill" stroke once we have a
  // real path. The translucent track underneath (and the arrowhead) are
  // always visible, so the arrow never vanishes — the fill just pours along
  // it. Reverted on completion so anime.js's dash attributes don't linger
  // and clip the path if a later resize changes its length. Reduced-motion
  // users (and jsdom, which has no SVG geometry) get the full arrow at once.
  const hasAnimatedRef = useRef(false)
  useEffect(() => {
    const path = fillPathRef.current
    if (!layout || !path || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || typeof path.getTotalLength !== 'function') return

    const anim = animate(svg.createDrawable(path), {
      draw: [
        { to: '0 1', duration: FILL_MS, ease: 'inOutQuad' },
        { to: '0 0', duration: DRAIN_MS, ease: 'inOutQuad' },
        { to: '0 1', duration: FILL_MS, ease: 'inOutQuad' },
      ],
      onComplete: () => queueMicrotask(() => anim.revert()),
    })
    fillAnimRef.current = anim
    return () => {
      fillAnimRef.current?.revert()
      fillAnimRef.current = null
    }
    // Only the first non-null layout should trigger the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout !== null])

  const label = layout?.targetBelowFold && offscreenText ? offscreenText : text

  return createPortal(
    <div className='fixed inset-0 pointer-events-none z-40' data-coach-mark>
      <svg
        aria-hidden='true'
        className='absolute inset-0 w-full h-full overflow-visible'
        style={{ opacity: layout ? 1 : 0 }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth={16}
            markerHeight={16}
            refX={13}
            refY={8}
            orient='auto'
            markerUnits='userSpaceOnUse'
          >
            <path d='M 0 0 L 16 8 L 0 16 z' className='fill-primary' />
          </marker>
        </defs>
        {/* Track: always visible, carries the arrowhead. */}
        <path
          d={layout?.arrowPath ?? ''}
          fill='none'
          className='stroke-primary'
          strokeOpacity={0.3}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap='round'
          markerEnd={`url(#${markerId})`}
        />
        {/* Fill: the animated solid stroke that pours along the track. */}
        <path
          ref={fillPathRef}
          d={layout?.arrowPath ?? ''}
          fill='none'
          className='stroke-primary'
          strokeWidth={STROKE_WIDTH}
          strokeLinecap='round'
        />
      </svg>
      <div
        ref={bubbleRef}
        className='absolute max-w-[220px] rounded-full bg-primary text-primary-content px-4 py-2 text-sm font-semibold shadow-lg whitespace-nowrap transition-opacity duration-300'
        style={{
          transform: layout ? `translate(${layout.bubble.x}px, ${layout.bubble.y}px)` : undefined,
          opacity: layout ? 1 : 0,
        }}
      >
        {label}
      </div>
    </div>,
    document.body
  )
}

export default CoachMark
