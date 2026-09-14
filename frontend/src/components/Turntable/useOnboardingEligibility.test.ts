import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ONBOARDING_LAST_VISIT_KEY,
  ONBOARDING_STALE_AFTER_MS,
  isOnboardingDue,
  resetOnboardingVisitDecision,
  useOnboardingEligibility,
} from './useOnboardingEligibility'

const NOW = new Date('2026-09-13T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

describe('isOnboardingDue', () => {
  it('is due on a first visit (no stamp)', () => {
    expect(isOnboardingDue(null, NOW)).toBe(true)
  })

  it('is due when the last visit is older than 7 days', () => {
    expect(isOnboardingDue(String(NOW - ONBOARDING_STALE_AFTER_MS - 1), NOW)).toBe(true)
    expect(isOnboardingDue(String(NOW - 8 * DAY), NOW)).toBe(true)
  })

  it('is not due when the last visit is within 7 days', () => {
    expect(isOnboardingDue(String(NOW - 1 * DAY), NOW)).toBe(false)
    expect(isOnboardingDue(String(NOW - ONBOARDING_STALE_AFTER_MS), NOW)).toBe(false)
  })

  it('treats a malformed stamp as a first visit', () => {
    expect(isOnboardingDue('not-a-number', NOW)).toBe(true)
  })
})

describe('useOnboardingEligibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetOnboardingVisitDecision()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('is eligible on a first visit and records the visit', () => {
    const { result } = renderHook(() => useOnboardingEligibility())
    expect(result.current).toBe(true)
    expect(window.localStorage.getItem(ONBOARDING_LAST_VISIT_KEY)).toBe(String(NOW))
  })

  it('is not eligible on a recent return visit but still refreshes the stamp', () => {
    window.localStorage.setItem(ONBOARDING_LAST_VISIT_KEY, String(NOW - 2 * DAY))
    const { result } = renderHook(() => useOnboardingEligibility())
    expect(result.current).toBe(false)
    // A daily visitor's window keeps sliding — they never see the tour again.
    expect(window.localStorage.getItem(ONBOARDING_LAST_VISIT_KEY)).toBe(String(NOW))
  })

  it('is eligible again after 7 days away', () => {
    window.localStorage.setItem(ONBOARDING_LAST_VISIT_KEY, String(NOW - 9 * DAY))
    const { result } = renderHook(() => useOnboardingEligibility())
    expect(result.current).toBe(true)
  })

  it('keeps the same decision for the whole visit even if the hook remounts', () => {
    const first = renderHook(() => useOnboardingEligibility())
    expect(first.result.current).toBe(true)
    first.unmount()
    // The stamp is now fresh, but this is still the same page load.
    const second = renderHook(() => useOnboardingEligibility())
    expect(second.result.current).toBe(true)
  })

  it('falls back to eligible when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useOnboardingEligibility())
    expect(result.current).toBe(true)
  })
})
