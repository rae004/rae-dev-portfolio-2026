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

// Wraps anime.js v4's createScope + self.add() React pattern:
// https://animejs.com/documentation/getting-started/using-with-react
export const useTurntableAnimation = (
  rootRef: React.RefObject<HTMLDivElement | null>
): UseTurntableAnimationReturn => {
  const scopeRef = useRef<Scope | null>(null)
  const spinAnimRef = useRef<JSAnimation | null>(null)

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
        animate(TONEARM_PIVOT, {
          rotate: [TONEARM_REST_ANGLE, TONEARM_CUE_ANGLE],
          duration: cueDuration,
          ease: 'inOutQuad',
          onComplete: () => onComplete(),
        })
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
        spinAnimRef.current?.pause()
        spinAnimRef.current = null
        animate(TONEARM_PIVOT, {
          rotate: TONEARM_REST_ANGLE,
          duration: returnDuration,
          ease: 'inOutQuad',
          onComplete: () => onComplete(),
        })
      })

      self.add('seekTonearm', (progress: number) => {
        const angle = TONEARM_CUE_ANGLE + (TONEARM_END_ANGLE - TONEARM_CUE_ANGLE) * progress
        animate(TONEARM_PIVOT, { rotate: angle, duration: 0 })
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
