/**
 * useReCaptchaForm Hook
 *
 * Simple hook for contact form reCAPTCHA verification.
 * This hook handles fresh verification for form submissions, independent of
 * the site-wide protection provided by ReCaptchaGate.
 *
 * Key Features:
 * - Always generates fresh tokens for form submissions
 * - Uses existing Google scripts (loaded by ReCaptchaGate)
 * - Handles 'contact_form' action specifically
 * - Returns simple verify function with loading/error states
 *
 * Architecture Decision:
 * This hook focuses solely on form verification and doesn't handle theme switching
 * or badge management. The ReCaptchaGate component handles all the complex
 * badge/theming logic for the site-wide instance.
 *
 * @package RAE_Portfolio
 * @since 2.0.0 (Fresh implementation)
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { config } from '../config/environment'
import { fetchReCaptchaConfig, executeReCaptcha, getRecaptchaClientId } from '../utils/recaptcha'

interface UseReCaptchaFormReturn {
  /**
   * Generate a fresh reCAPTCHA v3 token for the 'contact_form' action.
   * The token is single-use; the contact-form Lambda re-verifies it
   * server-side as part of the email send. Returns null if reCAPTCHA is
   * unavailable or token generation fails.
   */
  getToken: () => Promise<string | null>

  /**
   * Loading state during token generation
   */
  isLoading: boolean

  /**
   * Any error that occurred during token generation
   */
  error: string | null

  /**
   * Whether reCAPTCHA is available for use
   */
  isAvailable: boolean
}

/**
 * Hook for reCAPTCHA form verification
 *
 * Provides a simple verify() function for contact form submissions.
 * This hook is independent of the site-wide protection and always
 * generates fresh tokens for each form submission.
 */
export const useReCaptchaForm = (): UseReCaptchaFormReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load WordPress reCAPTCHA configuration
   * This should already be cached from ReCaptchaGate
   */
  const { data: wpConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ['recaptcha-config'],
    queryFn: fetchReCaptchaConfig,
    enabled: config.recaptcha.enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  /**
   * Check if reCAPTCHA is available for form verification
   */
  const isAvailable = !!wpConfig?.enabled && !!wpConfig?.site_keys?.v3 && !!window.grecaptcha

  /**
   * Generate a fresh reCAPTCHA v3 token for the 'contact_form' action.
   *
   * The token is one-time-use and is verified server-side by the contact
   * Lambda as part of the email send (not by WordPress). This avoids the
   * "token already consumed" error that would occur if we verified twice.
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      if (!isAvailable) throw new Error('reCAPTCHA service not available')
      if (!window.grecaptcha) throw new Error('reCAPTCHA scripts not loaded')

      // The site-wide ReCaptchaGate renders the widget via `?render=explicit`
      // mode and stashes its clientId in the shared module. We must call
      // execute() with that clientId — passing the raw site key only works
      // in auto-render mode.
      const clientId = getRecaptchaClientId()
      if (clientId === null) {
        throw new Error('reCAPTCHA widget not initialized yet — refresh and retry')
      }

      const token = await executeReCaptcha(clientId, 'contact_form')
      if (!token) throw new Error('Failed to generate reCAPTCHA token')
      return token
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'reCAPTCHA token generation failed'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable])

  return {
    getToken,
    isLoading: isLoading || isConfigLoading,
    error,
    isAvailable,
  }
}

export default useReCaptchaForm
