/**
 * reCAPTCHA Gate Component
 *
 * A simple component that wraps the entire application with reCAPTCHA protection.
 * This replaces the complex Provider/Context/Hook architecture with a single component
 * that handles all site-wide reCAPTCHA functionality.
 *
 * Key Features:
 * - Loads WordPress reCAPTCHA configuration
 * - Executes single page_view verification with 5-minute cache
 * - Blocks users with low scores by rendering BlockedPage
 * - Provides dynamic theme switching for reCAPTCHA badge
 * - Uses explicit rendering for full control over badge appearance
 *
 * Architecture Decision:
 * Instead of complex state management across multiple hooks and providers,
 * this component encapsulates all protection logic in one place. It either
 * renders the blocked page or the children (entire app).
 *
 * @package RAE_Portfolio
 * @since 2.0.0 (Fresh implementation)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { config } from '../config/environment'
import {
  fetchReCaptchaConfig,
  verifyReCaptchaToken,
  loadGoogleReCaptchaScript,
  detectCurrentTheme,
  removeBadgeElements,
  createBadgeContainer,
  executeReCaptcha,
  type ReCaptchaConfig,
  type ThemeType,
} from '../utils/recaptcha'
import BlockedPage from '../pages/BlockedPage'

interface ReCaptchaGateProps {
  children: React.ReactNode
  /**
   * Cache duration in minutes for page_view verification
   * Default: 5 minutes
   */
  cacheDuration?: number
}

interface VerificationCache {
  score: number
  timestamp: Date
  isValid: boolean
}

/**
 * reCAPTCHA Gate Component
 *
 * Protects the entire application with reCAPTCHA verification.
 * Either renders the children (app) or the blocked page based on user score.
 */
const ReCaptchaGate: React.FC<ReCaptchaGateProps> = ({ children, cacheDuration = 5 }) => {
  // State for reCAPTCHA functionality
  const [isInitialized, setIsInitialized] = useState(false)
  const [clientId, setClientId] = useState<number | null>(null)
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light')
  const [verification, setVerification] = useState<VerificationCache | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for cleanup and monitoring
  const containerRef = useRef<HTMLElement | null>(null)
  const themeObserverRef = useRef<MutationObserver | null>(null)

  /**
   * Load WordPress reCAPTCHA configuration
   */
  const {
    data: wpConfig,
    isLoading: isConfigLoading,
    error: configError,
  } = useQuery({
    queryKey: ['recaptcha-config'],
    queryFn: fetchReCaptchaConfig,
    enabled: config.recaptcha.enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  })

  /**
   * Check if verification cache is still valid
   */
  const isCacheValid = useCallback(
    (cache: VerificationCache | null): boolean => {
      if (!cache) return false

      const expirationTime = new Date(cache.timestamp)
      expirationTime.setMinutes(expirationTime.getMinutes() + cacheDuration)

      return new Date() < expirationTime
    },
    [cacheDuration]
  )

  /**
   * Get threshold from WordPress config with environment fallback
   */
  const getThreshold = useCallback((wpConfig: ReCaptchaConfig | undefined): number => {
    return wpConfig?.threshold ?? config.recaptcha.threshold
  }, [])

  /**
   * Re-render reCAPTCHA badge with new theme
   */
  const rerenderBadgeWithNewTheme = useCallback(
    (newTheme: ThemeType): void => {
      if (!isInitialized || clientId === null || !wpConfig) {
        return
      }

      try {
        // Reset the current widget
        window.grecaptcha.reset(clientId)

        // Remove existing badge elements to force fresh render
        removeBadgeElements()

        // Remove and recreate container
        if (containerRef.current?.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current)
        }
        containerRef.current = createBadgeContainer()

        console.log('[reCAPTCHA] Re-rendering badge with new theme:', newTheme)

        // Re-render with new theme
        const newClientId = window.grecaptcha.render(containerRef.current, {
          sitekey: wpConfig.site_keys.v3!,
          size: 'invisible',
          badge: wpConfig.badge_position || 'bottomright',
          theme: newTheme,
        })

        setClientId(newClientId)
        console.log('[reCAPTCHA] Badge re-rendered with clientId:', newClientId, 'theme:', newTheme)
      } catch (error) {
        console.error('[reCAPTCHA] Failed to re-render badge with new theme:', error)
      }
    },
    [isInitialized, clientId, wpConfig]
  )

  /**
   * Start monitoring for theme changes
   */
  const startThemeMonitoring = useCallback((): void => {
    if (themeObserverRef.current) {
      return // Already monitoring
    }

    themeObserverRef.current = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = detectCurrentTheme()
          if (newTheme !== currentTheme) {
            console.log('[reCAPTCHA] Theme change detected:', currentTheme, '→', newTheme)
            setCurrentTheme(newTheme)
            rerenderBadgeWithNewTheme(newTheme)
          }
        }
      })
    })

    // Start observing the html element for data-theme changes
    themeObserverRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    console.log('[reCAPTCHA] Started monitoring theme changes')
  }, [currentTheme, rerenderBadgeWithNewTheme])

  /**
   * Initialize reCAPTCHA service
   */
  const initializeReCaptcha = useCallback(async (): Promise<void> => {
    if (!wpConfig?.enabled || !wpConfig?.site_keys?.v3) {
      console.log('[reCAPTCHA] Service disabled or not configured')
      return
    }

    try {
      // Load Google scripts
      await loadGoogleReCaptchaScript()

      // Wait for grecaptcha to be ready
      await new Promise<void>(resolve => {
        window.grecaptcha.ready(() => resolve())
      })

      // Create container and render widget
      containerRef.current = createBadgeContainer()
      const theme = detectCurrentTheme()
      setCurrentTheme(theme)

      console.log('[reCAPTCHA] Rendering widget with theme:', theme)

      const newClientId = window.grecaptcha.render(containerRef.current, {
        sitekey: wpConfig.site_keys.v3!,
        size: 'invisible',
        badge: wpConfig.badge_position || 'bottomright',
        theme: theme,
      })

      setClientId(newClientId)
      setIsInitialized(true)

      // Start monitoring theme changes
      startThemeMonitoring()

      console.log('[reCAPTCHA] Initialization complete, clientId:', newClientId)
    } catch (error) {
      console.error('[reCAPTCHA] Initialization failed:', error)
      setError('Failed to initialize reCAPTCHA service')
    }
  }, [wpConfig?.badge_position, wpConfig?.enabled, wpConfig?.site_keys.v3, startThemeMonitoring])

  /**
   * Execute page_view verification
   */
  const executeVerification = useCallback(async (): Promise<void> => {
    if (!isInitialized || clientId === null || !wpConfig) {
      return
    }

    // Check if cache is still valid
    if (verification && isCacheValid(verification)) {
      console.log('[reCAPTCHA] Using cached verification, score:', verification.score)
      return
    }

    try {
      console.log('[reCAPTCHA] Executing page_view verification')

      // Execute reCAPTCHA v3
      const token = await executeReCaptcha(clientId, 'page_view')
      if (!token) {
        throw new Error('Failed to generate reCAPTCHA token')
      }

      // Verify with WordPress
      const result = await verifyReCaptchaToken(token, 'page_view')
      console.log('[reCAPTCHA] Verification result:', result)

      if (result.success && result.score !== undefined) {
        const newVerification: VerificationCache = {
          score: result.score,
          timestamp: new Date(),
          isValid: true,
        }

        setVerification(newVerification)

        // Check if user should be blocked
        const threshold = getThreshold(wpConfig)
        if (result.score < threshold) {
          console.log(
            '[reCAPTCHA] Blocking user - score below threshold:',
            result.score,
            '<',
            threshold
          )
          setIsBlocked(true)
        } else {
          console.log(
            '[reCAPTCHA] User verified - allowing access, score:',
            result.score,
            '>=',
            threshold
          )
          setIsBlocked(false)
        }
      } else {
        throw new Error(result.message || 'Verification failed')
      }
    } catch (error) {
      console.error('[reCAPTCHA] Verification failed:', error)
      setError('reCAPTCHA verification failed')
    }
  }, [isInitialized, clientId, wpConfig, verification, isCacheValid, getThreshold])

  /**
   * Initialize when config loads
   */
  useEffect(() => {
    if (wpConfig && !isInitialized) {
      initializeReCaptcha()
    }
  }, [wpConfig, isInitialized, initializeReCaptcha])

  /**
   * Execute verification after initialization
   */
  useEffect(() => {
    if (isInitialized && !verification) {
      executeVerification()
    }
  }, [isInitialized, verification, executeVerification])

  /**
   * Handle configuration errors
   */
  useEffect(() => {
    if (configError) {
      setError('Failed to load reCAPTCHA configuration')
    }
  }, [configError])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Stop theme monitoring
      if (themeObserverRef.current) {
        themeObserverRef.current.disconnect()
      }

      // Remove container
      if (containerRef.current?.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current)
      }

      // Clean up global callback
      if (window.initReCaptcha) {
        delete window.initReCaptcha
      }

      console.log('[reCAPTCHA] Cleanup complete')
    }
  }, [])

  // Handle loading state
  if (isConfigLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='loading loading-spinner loading-lg'></div>
      </div>
    )
  }

  // Handle errors
  if (error) {
    console.error('[reCAPTCHA] Gate error:', error)
    // Allow access if reCAPTCHA fails (graceful degradation)
    return <>{children}</>
  }

  // Handle disabled reCAPTCHA
  if (!config.recaptcha.enabled || !wpConfig?.enabled) {
    console.log('[reCAPTCHA] Service disabled, allowing access')
    return <>{children}</>
  }

  // Block user if score is too low
  if (isBlocked) {
    return <BlockedPage />
  }

  // Allow access if verified or still verifying
  return <>{children}</>
}

export default ReCaptchaGate
