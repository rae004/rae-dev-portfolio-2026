/**
 * reCAPTCHA Utilities
 *
 * This file contains pure utility functions extracted from the previous complex service implementation.
 * It provides the essential building blocks for reCAPTCHA functionality without state management or
 * singleton patterns, allowing for simpler component-based architecture.
 *
 * Key architectural decisions:
 * - No state management (handled by components)
 * - No singleton pattern (prevents timing issues)
 * - Explicit rendering for full theme control
 * - DaisyUI theme mapping for badge appearance
 * - Aggressive DOM cleanup for theme switching
 *
 * @package RAE_Portfolio
 * @since 2.0.0 (Fresh implementation)
 */

import { getWordPressApiBase } from '../config/environment'

type BadgePosition = 'bottomright' | 'bottomleft' | 'inline'
type ThemeType = 'light' | 'dark'

// Global grecaptcha interface for Google's reCAPTCHA API
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (clientIdOrSiteKey: string | number, options: { action: string }) => Promise<string>
      render: (
        container: string | HTMLElement,
        parameters: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: ThemeType
          size?: 'compact' | 'normal' | 'invisible'
          badge?: BadgePosition
        }
      ) => number
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
    initReCaptcha?: () => void
  }
}

export interface ReCaptchaConfig {
  enabled: boolean
  site_keys: {
    v3: string | null
  }
  threshold: number
  badge_position: BadgePosition
  v3_configured: boolean
}

export interface ReCaptchaVerificationResponse {
  success: boolean
  score?: number
  threshold?: number
  score_passed?: boolean
  challenge_required?: boolean
  challenge_passed?: boolean
  action?: string
  hostname?: string
  timestamp?: string
  error?: string
  message?: string
  google_errors?: string[]
}

export interface ReCaptchaExecutionResult {
  success: boolean
  token?: string
  score?: number
  error?: string
}

/**
 * Fetch reCAPTCHA configuration from WordPress REST API
 *
 * This replaces the previous complex service initialization by directly fetching
 * the WordPress configuration that contains the threshold, site keys, and settings.
 * The configuration includes the WordPress admin-configured threshold that overrides
 * the environment fallback value.
 */
export const fetchReCaptchaConfig = async (): Promise<ReCaptchaConfig> => {
  const apiBase = getWordPressApiBase()
  const response = await fetch(`${apiBase}/?rest_route=/wp/v2/recaptcha/status`)

  if (!response.ok) {
    throw new Error(`Failed to fetch reCAPTCHA configuration: ${response.status}`)
  }

  const config = await response.json()
  console.log('[reCAPTCHA] Configuration loaded:', config)
  return config
}

/**
 * Verify reCAPTCHA token with WordPress backend
 *
 * Sends the Google-generated token to WordPress for verification against Google's API.
 * WordPress handles the secret key and returns the score along with pass/fail status
 * based on the configured threshold.
 */
export const verifyReCaptchaToken = async (
  token: string,
  action: string
): Promise<ReCaptchaVerificationResponse> => {
  const apiBase = getWordPressApiBase()
  const url = `${apiBase}/?rest_route=/wp/v2/recaptcha/verify`

  const body = { token, action }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Verification failed: ${response.status}`)
  }

  return await response.json()
}

/**
 * Load Google reCAPTCHA scripts with explicit rendering
 *
 * Uses explicit rendering (render=explicit) instead of auto-rendering to maintain
 * full control over when and how the reCAPTCHA badge is created. This is essential
 * for theme switching functionality as it allows us to recreate widgets with new
 * theme parameters.
 */
export const loadGoogleReCaptchaScript = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Check if already loaded
      if (window.grecaptcha) {
        resolve()
        return
      }

      // Set up global callback for explicit rendering
      window.initReCaptcha = () => {
        console.log('[reCAPTCHA] Script loaded successfully')
        resolve()
      }

      // Create script element with explicit rendering
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&onload=initReCaptcha'
      script.async = true
      script.defer = true

      script.onerror = () => {
        reject(new Error('Failed to load Google reCAPTCHA scripts'))
      }

      console.log('[reCAPTCHA] Loading scripts with explicit rendering')
      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Detect current DaisyUI theme and map to Google's light/dark
 *
 * Google reCAPTCHA only supports 'light' and 'dark' themes, but DaisyUI has 29+ themes.
 * This function maps the dark-looking DaisyUI themes to 'dark' and everything else to 'light'.
 * The mapping ensures the badge appearance matches the overall site theme automatically.
 */
export const detectCurrentTheme = (): ThemeType => {
  const htmlElement = document.documentElement
  const currentTheme = htmlElement.getAttribute('data-theme') || 'light'

  // These DaisyUI themes have dark backgrounds and should use Google's dark badge
  const darkThemes = [
    'dark',
    'night',
    'forest',
    'black',
    'luxury',
    'dracula',
    'synthwave',
    'halloween',
    'coffee',
    'dim',
    'sunset',
    'business',
    'cyberpunk',
  ]

  const theme = darkThemes.includes(currentTheme) ? 'dark' : 'light'
  console.log('[reCAPTCHA] Detected DaisyUI theme:', currentTheme, '→ reCAPTCHA theme:', theme)

  return theme
}

/**
 * Remove all existing reCAPTCHA badge elements from DOM
 *
 * When switching themes, we need to completely remove the old badge and iframe elements
 * because Google's API caches the styling. This aggressive cleanup ensures that when we
 * recreate the widget, it uses the new theme without any cached styling artifacts.
 */
export const removeBadgeElements = (): void => {
  // Remove all Google reCAPTCHA badge elements
  const badges = document.querySelectorAll('.grecaptcha-badge')
  badges.forEach(badge => {
    if (badge.parentNode) {
      badge.parentNode.removeChild(badge)
    }
  })

  // Remove any iframe elements that might be lingering
  const iframes = document.querySelectorAll('iframe[src*="recaptcha"]')
  iframes.forEach(iframe => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  })

  console.log('[reCAPTCHA] Removed existing badge elements')
}

/**
 * Create fresh container element for reCAPTCHA badge
 *
 * Creates a new DOM container for the reCAPTCHA badge. The container is positioned
 * fixed in the bottom-right corner and has high z-index to ensure visibility.
 * A fresh container is needed each time we switch themes to avoid styling conflicts.
 */
export const createBadgeContainer = (): HTMLElement => {
  const container = document.createElement('div')
  container.id = 'recaptcha-badge-container'
  container.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 1000;'

  console.log('[reCAPTCHA] Created badge container')
  document.body.appendChild(container)

  return container
}

/**
 * Execute reCAPTCHA v3 and get token for specified action
 *
 * Uses the clientId from explicit rendering to execute reCAPTCHA for a specific action.
 * Different actions ('page_view', 'contact_form') allow WordPress to apply different
 * scoring policies. This is a pure function that just handles the Google API call.
 */
export const executeReCaptcha = async (
  clientId: number,
  action: string
): Promise<string | null> => {
  return new Promise(resolve => {
    if (!window.grecaptcha || clientId === null) {
      resolve(null)
      return
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(clientId, { action })
        .then((token: string) => {
          console.log('[reCAPTCHA] Token generated for action:', action, 'clientId:', clientId)
          resolve(token)
        })
        .catch((error: unknown) => {
          console.error('[reCAPTCHA] Execution failed:', error)
          resolve(null)
        })
    })
  })
}

/**
 * Shared clientId from ReCaptchaGate's explicit render. Other parts of the app
 * (e.g. useReCaptchaForm) need this clientId to call grecaptcha.execute() —
 * passing the site key directly only works in auto-render mode, which we
 * don't use. ReCaptchaGate is responsible for keeping this in sync.
 */
let recaptchaClientId: number | null = null

export const setRecaptchaClientId = (id: number | null): void => {
  recaptchaClientId = id
}

export const getRecaptchaClientId = (): number | null => {
  return recaptchaClientId
}

export { type ThemeType, type BadgePosition }
