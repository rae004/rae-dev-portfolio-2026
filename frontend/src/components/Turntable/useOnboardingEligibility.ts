import { useState } from 'react'

export const ONBOARDING_LAST_VISIT_KEY = 'rae-turntable-onboarding-last-visit'
export const ONBOARDING_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

// Pure decision so it can be unit-tested without touching real storage:
// the tour is due on a first visit (no stamp), or when the last visit is
// older than the retention window. A malformed stamp counts as "never".
export const isOnboardingDue = (lastVisit: string | null, now: number): boolean => {
  if (!lastVisit) return true
  const last = Number(lastVisit)
  if (!Number.isFinite(last)) return true
  return now - last > ONBOARDING_STALE_AFTER_MS
}

const readLastVisit = (): string | null => {
  try {
    return window.localStorage.getItem(ONBOARDING_LAST_VISIT_KEY)
  } catch {
    // Private mode / blocked storage — treat as a first visit rather than
    // crashing the hero.
    return null
  }
}

// Decided once per page load, not per component mount. The read and the
// stamp write happen back-to-back here, so a later remount of the consumer
// (StrictMode, a gate/layout re-render that recreates the subtree, HMR)
// can't re-read the stamp it just wrote and conclude "seen recently" —
// which would silently end the tour mid-visit.
let visitDecision: boolean | null = null

const decideForThisVisit = (): boolean => {
  if (visitDecision !== null) return visitDecision
  const now = Date.now()
  visitDecision = isOnboardingDue(readLastVisit(), now)
  try {
    window.localStorage.setItem(ONBOARDING_LAST_VISIT_KEY, String(now))
  } catch {
    // Private mode / blocked storage — the decision above already stands.
  }
  return visitDecision
}

// Test-only: lets each test start from a fresh visit.
export const resetOnboardingVisitDecision = () => {
  visitDecision = null
}

// Whether the onboarding tour should run this visit, refreshing the
// last-visit stamp as a side effect. The stamp updates on *every* visit,
// not just when the tour fires: "hasn't visited in 7 days" means 7 days
// since they were last here, so a daily visitor (who clearly knows the
// drill) never sees it again, while someone who drops off for a week gets
// the reminder.
export const useOnboardingEligibility = (): boolean => {
  const [eligible] = useState(decideForThisVisit)
  return eligible
}
