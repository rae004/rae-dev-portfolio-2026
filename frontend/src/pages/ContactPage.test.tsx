import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock TanStack Router's Link (same pattern as other component tests).
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

// SocialLinks hits the WP API in real life — short-circuit it for this test.
vi.mock('../components/SocialLinks', () => ({
  default: () => <div data-testid='social-links-stub' />,
}))

// Mock the reCAPTCHA hook so we can control token issuance per test.
const getTokenMock = vi.fn<() => Promise<string | null>>()
vi.mock('../hooks/useReCaptchaForm', () => ({
  useReCaptchaForm: () => ({ getToken: getTokenMock }),
}))

// Pin the env config so the page sees a known contactApiUrl.
vi.mock('../config/environment', () => ({
  config: {
    name: 'local',
    wpApiBase: 'http://localhost:8080',
    contactApiUrl: 'https://api.test/contact',
    recaptcha: { enabled: true, threshold: 0.1, badgePosition: 'bottomright' },
    isLocal: true,
    isDevelopment: false,
    isProduction: false,
  },
}))

import ContactPage from './ContactPage'

const fillAndSubmit = async () => {
  fireEvent.input(screen.getByPlaceholderText(/your name/i), {
    target: { value: 'Jane Tester' },
  })
  fireEvent.input(screen.getByPlaceholderText(/your.email@example.com/i), {
    target: { value: 'jane@example.com' },
  })
  fireEvent.input(screen.getByPlaceholderText(/^subject$/i), {
    target: { value: 'Hello there' },
  })
  fireEvent.input(screen.getByPlaceholderText(/your message/i), {
    target: { value: 'This is a test message body.' },
  })

  fireEvent.click(screen.getByRole('button', { name: /send message/i }))
}

describe('ContactPage submit flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('posts to the contact API and shows success when the Lambda returns 200', async () => {
    getTokenMock.mockResolvedValue('valid-token')
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )

    render(<ContactPage />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument()
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/contact',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"recaptchaToken":"valid-token"'),
      }),
    )
  })

  it('shows captcha_failed when getToken returns null', async () => {
    getTokenMock.mockResolvedValue(null)

    render(<ContactPage />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/security verification failed/i)).toBeInTheDocument()
    })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('shows captcha_failed when the Lambda returns 403', async () => {
    getTokenMock.mockResolvedValue('valid-token')
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'reCAPTCHA verification failed' }), { status: 403 }),
    )

    render(<ContactPage />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/security verification failed/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when the Lambda returns 5xx', async () => {
    getTokenMock.mockResolvedValue('valid-token')
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 }),
    )

    render(<ContactPage />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when fetch itself rejects (network error)', async () => {
    getTokenMock.mockResolvedValue('valid-token')
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('network down'))

    render(<ContactPage />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
    })
  })
})
