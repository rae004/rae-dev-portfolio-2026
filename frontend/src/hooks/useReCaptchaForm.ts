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
import {
  fetchReCaptchaConfig,
  verifyReCaptchaToken,
  type ReCaptchaExecutionResult,
} from '../utils/recaptcha'

interface UseReCaptchaFormReturn {
  /**
   * Execute fresh reCAPTCHA verification for contact form
   * Always generates new token, never uses cache
   */
  verify: () => Promise<ReCaptchaExecutionResult>

  /**
   * Loading state during verification
   */
  isLoading: boolean

  /**
   * Any error that occurred during verification
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
   * Execute fresh reCAPTCHA verification for contact form
   *
   * This function generates a fresh token specifically for the 'contact_form' action
   * and verifies it with WordPress. It does not use any caching since form submissions
   * should always have fresh verification.
   */
  const verify = useCallback(async (): Promise<ReCaptchaExecutionResult> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if reCAPTCHA is available
      if (!isAvailable) {
        throw new Error('reCAPTCHA service not available')
      }

      // Check if Google scripts are loaded
      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA scripts not loaded')
      }

      console.log('[reCAPTCHA Form] Executing fresh contact_form verification')

      // Execute reCAPTCHA v3 for contact form
      const token = await new Promise<string | null>(resolve => {
        window.grecaptcha.ready(() => {
          // Use the site key directly for contact form verification
          // This is independent of the badge widget created by ReCaptchaGate
          window.grecaptcha
            .execute(wpConfig!.site_keys.v3!, { action: 'contact_form' })
            .then((token: string) => {
              console.log('[reCAPTCHA Form] Token generated for contact_form')
              resolve(token)
            })
            .catch((error: unknown) => {
              console.error('[reCAPTCHA Form] Token generation failed:', error)
              resolve(null)
            })
        })
      })

      if (!token) {
        throw new Error('Failed to generate reCAPTCHA token')
      }

      // Verify token with WordPress
      const result = await verifyReCaptchaToken(token, 'contact_form')
      console.log('[reCAPTCHA Form] Verification result:', result)

      if (!result.success) {
        throw new Error(result.message || 'Contact form verification failed')
      }

      // Return success result
      return {
        success: true,
        token,
        score: result.score,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'reCAPTCHA verification failed'
      console.error('[reCAPTCHA Form] Verification error:', errorMessage)
      setError(errorMessage)

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable, wpConfig])

  return {
    verify,
    isLoading: isLoading || isConfigLoading,
    error,
    isAvailable,
  }
}

export default useReCaptchaForm
