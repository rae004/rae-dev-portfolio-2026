import { describe, it, expect, beforeEach } from 'vitest'
import { setRecaptchaClientId, getRecaptchaClientId } from './recaptcha'

describe('recaptcha clientId module cache', () => {
  beforeEach(() => {
    // Reset module state between tests so each starts from a known baseline.
    setRecaptchaClientId(null)
  })

  it('returns null before anything is set', () => {
    expect(getRecaptchaClientId()).toBeNull()
  })

  it('stores and returns a numeric clientId', () => {
    setRecaptchaClientId(7)
    expect(getRecaptchaClientId()).toBe(7)
  })

  it('handles clientId 0 (a valid Google reCAPTCHA clientId) — not coerced to null', () => {
    setRecaptchaClientId(0)
    expect(getRecaptchaClientId()).toBe(0)
  })

  it('can be reset back to null', () => {
    setRecaptchaClientId(42)
    setRecaptchaClientId(null)
    expect(getRecaptchaClientId()).toBeNull()
  })

  it('overwrites a prior value on second set', () => {
    setRecaptchaClientId(1)
    setRecaptchaClientId(2)
    expect(getRecaptchaClientId()).toBe(2)
  })
})
