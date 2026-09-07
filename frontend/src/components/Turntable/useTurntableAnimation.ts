import { useEffect, useRef, useCallback } from 'react'
import { animate, createScope } from 'animejs'
import type { Scope, JSAnimation } from 'animejs'
import {
  TONEARM_REST_ANGLE,
  TONEARM_CUE_ANGLE,
  TONEARM_END_ANGLE,
  RECORD_DROP_DURATION_MS,
  TONEARM_CUE_DURATION_MS,
  TONEARM_RETURN_DURATION_MS,
  PLATTER_REVOLUTION_MS,
  REDUCED_MOTION_DURATION_MS,
} from './turntableConfig'

export interface UseTurntableAnimationReturn {
  cueRecord: (onComplete: () => void) => void
  spinStart: () => void
  spinPause: () => void
  spinResume: () => void
  returnTonearm: (onComplete: () => void) => void
  seekTonearm: (progress: number) => void
}

const easeInOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// Plain requestAnimationFrame tween writing `rotate` directly — deliberately
// never anime.js's animate(). anime.js v4 animates individual transform
// properties via the Web Animations API, which can leave a finished effect
// attached to the element (fill persists past completion) that silently
// overrides later plain style writes to the same property. Mixing the two
// mechanisms on `tonearm-pivot` caused the same nominal angle to render
// differently depending on whether a stale WAAPI effect was still holding
// the compositor. Using one plain-write mechanism for every rotate change
// (cue, return, and per-frame seek) avoids that class of bug entirely.
const tweenRotate = (
  el: HTMLElement,
  from: number,
  to: number,
  duration: number,
  onComplete?: () => void
): (() => void) => {
  let raf = 0
  const start = performance.now()
  const step = (now: number) => {
    const t = duration <= 0 ? 1 : Math.min((now - start) / duration, 1)
    el.style.rotate = `${from + (to - from) * easeInOutQuad(t)}deg`
    if (t < 1) {
      raf = requestAnimationFrame(step)
    } else {
      onComplete?.()
    }
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}

// Wraps anime.js v4's createScope + self.add() React pattern:
// https://animejs.com/documentation/getting-started/using-with-react
export const useTurntableAnimation = (
  rootRef: React.RefObject<HTMLDivElement | null>
): UseTurntableAnimationReturn => {
  const scopeRef = useRef<Scope | null>(null)
  const spinAnimRef = useRef<JSAnimation | null>(null)
  const cancelRotateTweenRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cueDuration = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : TONEARM_CUE_DURATION_MS
    const returnDuration = prefersReducedMotion
      ? REDUCED_MOTION_DURATION_MS
      : TONEARM_RETURN_DURATION_MS
    const dropDuration = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : RECORD_DROP_DURATION_MS

    scopeRef.current = createScope({ root: rootRef.current ?? undefined }).add(self => {
      // anime.js types this callback's param as optional (it's never
      // actually undefined when invoked via .add()), so narrow it once here.
      if (!self) return
      // String selectors passed to animate() inside a scope callback are
      // automatically scoped to this scope's root element.
      const TONEARM_PIVOT = '[data-part="tonearm-pivot"]'
      const RECORD = '[data-part="record"]'
      const PLATTER = '[data-part="platter"]'

      self.add('cueRecord', (onComplete: () => void) => {
        animate(RECORD, {
          translateY: [-30, 0],
          opacity: [0, 1],
          duration: dropDuration,
          ease: 'outQuad',
        })
        const pivot = rootRef.current?.querySelector<HTMLElement>(TONEARM_PIVOT)
        cancelRotateTweenRef.current?.()
        if (pivot) {
          cancelRotateTweenRef.current = tweenRotate(
            pivot,
            TONEARM_REST_ANGLE,
            TONEARM_CUE_ANGLE,
            cueDuration,
            onComplete
          )
        } else {
          onComplete()
        }
      })

      self.add('spinStart', () => {
        if (prefersReducedMotion) return
        spinAnimRef.current = animate([PLATTER, RECORD], {
          rotate: '360deg',
          duration: PLATTER_REVOLUTION_MS,
          loop: true,
          ease: 'linear',
        })
      })

      self.add('spinPause', () => {
        spinAnimRef.current?.pause()
      })

      self.add('spinResume', () => {
        spinAnimRef.current?.resume()
      })

      self.add('returnTonearm', (onComplete: () => void) => {
        // .revert() (not .pause()) so the platter/record rotation resets to
        // its pre-spin baseline instead of freezing mid-turn. Without this,
        // the next song's spinStart() would animate from that leftover
        // angle toward a literal '360deg' target — covering less than a
        // full revolution in the same PLATTER_REVOLUTION_MS duration, which
        // reads as the platter spinning at reduced (and inconsistent)
        // speed on every play after the first.
        spinAnimRef.current?.revert()
        spinAnimRef.current = null
        const pivot = rootRef.current?.querySelector<HTMLElement>(TONEARM_PIVOT)
        cancelRotateTweenRef.current?.()
        if (pivot) {
          const parsedAngle = parseFloat(pivot.style.rotate)
          const currentAngle = Number.isNaN(parsedAngle) ? TONEARM_CUE_ANGLE : parsedAngle
          cancelRotateTweenRef.current = tweenRotate(
            pivot,
            currentAngle,
            TONEARM_REST_ANGLE,
            returnDuration,
            onComplete
          )
        } else {
          onComplete()
        }
      })

      self.add('seekTonearm', (progress: number) => {
        // Not a tween — this fires every animation frame during playback
        // (potentially hundreds of times per song), scrubbing to a value
        // derived from real playback progress rather than easing toward it.
        cancelRotateTweenRef.current?.()
        const clamped = Math.min(Math.max(progress, 0), 1)
        // Linear-in-time interpolation reaches a visually "near the end"
        // pose partway through the song and then looks frozen there for the
        // rest of playback. Easing the mapping so motion concentrates later
        // keeps the needle visibly near the outer edge for most of the
        // song, only sweeping in noticeably as it actually nears the end.
        const eased = clamped * clamped
        const angle = TONEARM_CUE_ANGLE + (TONEARM_END_ANGLE - TONEARM_CUE_ANGLE) * eased
        const pivot = rootRef.current?.querySelector<HTMLElement>(TONEARM_PIVOT)
        if (pivot) pivot.style.rotate = `${angle}deg`
      })
    })

    return () => scopeRef.current?.revert()
  }, [rootRef])

  const cueRecord = useCallback((onComplete: () => void) => {
    scopeRef.current?.methods.cueRecord(onComplete)
  }, [])

  const spinStart = useCallback(() => {
    scopeRef.current?.methods.spinStart()
  }, [])

  const spinPause = useCallback(() => {
    scopeRef.current?.methods.spinPause()
  }, [])

  const spinResume = useCallback(() => {
    scopeRef.current?.methods.spinResume()
  }, [])

  const returnTonearm = useCallback((onComplete: () => void) => {
    scopeRef.current?.methods.returnTonearm(onComplete)
  }, [])

  const seekTonearm = useCallback((progress: number) => {
    scopeRef.current?.methods.seekTonearm(progress)
  }, [])

  return { cueRecord, spinStart, spinPause, spinResume, returnTonearm, seekTonearm }
}
