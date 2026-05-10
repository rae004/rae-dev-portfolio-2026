import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock the utilities the hook depends on.
vi.mock('../utils/recaptcha', () => ({
  fetchReCaptchaConfig: vi.fn(),
  executeReCaptcha: vi.fn(),
  getRecaptchaClientId: vi.fn(),
}))

// Force reCAPTCHA enabled in env so useQuery fires.
vi.mock('../config/environment', () => ({
  config: { recaptcha: { enabled: true } },
}))

import { useReCaptchaForm } from './useReCaptchaForm'
import {
  fetchReCaptchaConfig,
  executeReCaptcha,
  getRecaptchaClientId,
} from '../utils/recaptcha'

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const validWpConfig = {
  enabled: true,
  v3_configured: true,
  threshold: 0.5,
  badge_position: 'bottomright' as const,
  site_keys: { v3: 'test-site-key' },
}

describe('useReCaptchaForm.getToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Stub grecaptcha so `isAvailable` can become true.
    ;(globalThis as unknown as { window: { grecaptcha: unknown } }).window = {
      ...globalThis.window,
      grecaptcha: {},
    } as Window & typeof globalThis
  })

  it('returns a token when the widget is initialized and execute succeeds', async () => {
    vi.mocked(fetchReCaptchaConfig).mockResolvedValue(validWpConfig)
    vi.mocked(getRecaptchaClientId).mockReturnValue(0)
    vi.mocked(executeReCaptcha).mockResolvedValue('happy-token')

    const { result } = renderHook(() => useReCaptchaForm(), { wrapper })

    // Let useQuery resolve so isAvailable flips true.
    await vi.waitFor(() => expect(result.current.isAvailable).toBe(true))

    let token: string | null = null
    await act(async () => {
      token = await result.current.getToken()
    })

    expect(token).toBe('happy-token')
    expect(executeReCaptcha).toHaveBeenCalledWith(0, 'contact_form')
    expect(result.current.error).toBeNull()
  })

  it('returns null and sets error when the widget clientId is not yet ready', async () => {
    vi.mocked(fetchReCaptchaConfig).mockResolvedValue(validWpConfig)
    vi.mocked(getRecaptchaClientId).mockReturnValue(null)

    const { result } = renderHook(() => useReCaptchaForm(), { wrapper })
    await vi.waitFor(() => expect(result.current.isAvailable).toBe(true))

    let token: string | null = 'x'
    await act(async () => {
      token = await result.current.getToken()
    })

    expect(token).toBeNull()
    expect(result.current.error).toMatch(/widget not initialized/i)
    expect(executeReCaptcha).not.toHaveBeenCalled()
  })

  it('returns null when executeReCaptcha resolves to null (token gen failure)', async () => {
    vi.mocked(fetchReCaptchaConfig).mockResolvedValue(validWpConfig)
    vi.mocked(getRecaptchaClientId).mockReturnValue(5)
    vi.mocked(executeReCaptcha).mockResolvedValue(null)

    const { result } = renderHook(() => useReCaptchaForm(), { wrapper })
    await vi.waitFor(() => expect(result.current.isAvailable).toBe(true))

    let token: string | null = 'x'
    await act(async () => {
      token = await result.current.getToken()
    })

    expect(token).toBeNull()
    expect(result.current.error).toMatch(/failed to generate/i)
  })

  it('returns null and sets error when reCAPTCHA is not available (WP disabled)', async () => {
    vi.mocked(fetchReCaptchaConfig).mockResolvedValue({
      ...validWpConfig,
      enabled: false,
    })

    const { result } = renderHook(() => useReCaptchaForm(), { wrapper })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))

    let token: string | null = 'x'
    await act(async () => {
      token = await result.current.getToken()
    })

    expect(token).toBeNull()
    expect(result.current.error).toMatch(/not available/i)
  })
})
