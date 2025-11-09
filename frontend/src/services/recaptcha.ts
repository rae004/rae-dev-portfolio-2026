/**
 * reCAPTCHA Service
 * Handles Google reCAPTCHA v3 integration with WordPress backend
 */

import { devLog } from '../config/environment'

// Global grecaptcha interface
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      render: (
        container: string | HTMLElement,
        parameters: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark'
          size?: 'compact' | 'normal'
        }
      ) => number
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
  }
}

export interface ReCaptchaConfig {
  enabled: boolean
  site_keys: {
    v3: string | null
  }
  threshold: number
  badge_position: string
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

export class ReCaptchaService {
  private static instance: ReCaptchaService | null = null
  private config: ReCaptchaConfig | null = null
  private v3Ready = false
  private scriptsLoaded = false
  private scriptLoadPromise: Promise<void> | null = null

  /**
   * Get singleton instance
   */
  public static getInstance(): ReCaptchaService {
    if (!ReCaptchaService.instance) {
      ReCaptchaService.instance = new ReCaptchaService()
    }
    return ReCaptchaService.instance
  }

  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Private constructor
  }

  /**
   * Initialize reCAPTCHA service with configuration from WordPress
   */
  public async initialize(): Promise<boolean> {
    try {
      // Fetch configuration from WordPress API
      this.config = await this.fetchConfigFromWordPress()

      if (!this.config?.enabled) {
        devLog('reCAPTCHA is disabled')
        return false
      }

      // Load Google scripts if enabled
      await this.loadGoogleScripts()

      devLog('reCAPTCHA service initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA service:', error)
      return false
    }
  }

  /**
   * Check if reCAPTCHA is available and ready
   */
  public isAvailable(): boolean {
    return this.config?.enabled === true && this.scriptsLoaded && this.v3Ready
  }

  /**
   * Execute reCAPTCHA v3 and handle the complete verification flow
   */
  public async executeAndVerify(
    action: string = 'contact_form'
  ): Promise<ReCaptchaExecutionResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'reCAPTCHA service not available',
        }
      }

      // Execute v3 reCAPTCHA
      const v3Token = await this.executeV3(action)

      if (!v3Token) {
        return {
          success: false,
          error: 'Failed to generate reCAPTCHA v3 token',
        }
      }

      // Verify with WordPress backend
      const verification = await this.verifyWithWordPress(v3Token, action)

      if (!verification.success) {
        return {
          success: false,
          error: verification.message || 'reCAPTCHA verification failed',
        }
      }

      // V3 verification passed
      return {
        success: true,
        token: v3Token,
        score: verification.score,
      }
    } catch (error) {
      console.error('reCAPTCHA execution error:', error)
      return {
        success: false,
        error: 'reCAPTCHA execution failed',
      }
    }
  }

  /**
   * Execute reCAPTCHA v3 (invisible)
   */
  public async executeV3(action: string): Promise<string | null> {
    return new Promise(resolve => {
      if (!this.isAvailable() || !this.config?.site_keys?.v3) {
        resolve(null)
        return
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(this.config!.site_keys.v3!, { action })
          .then((token: string) => {
            devLog('reCAPTCHA v3 token generated for action:', action)
            resolve(token)
          })
          .catch((error: unknown) => {
            console.error('reCAPTCHA v3 execution failed:', error)
            resolve(null)
          })
      })
    })
  }

  /**
   * Get current configuration
   */
  public getConfig(): ReCaptchaConfig | null {
    return this.config
  }

  /**
   * Fetch reCAPTCHA configuration from WordPress API
   */
  private async fetchConfigFromWordPress(): Promise<ReCaptchaConfig> {
    const apiBase = import.meta.env.VITE_WP_API_BASE || 'http://localhost:8080'
    const response = await fetch(`${apiBase}/?rest_route=/wp/v2/recaptcha/status`)

    if (!response.ok) {
      throw new Error(`Failed to fetch reCAPTCHA configuration: ${response.status}`)
    }

    const config = await response.json()
    devLog('reCAPTCHA configuration loaded:', config)

    return config
  }

  /**
   * Verify token with WordPress backend
   */
  private async verifyWithWordPress(
    token: string,
    action: string
  ): Promise<ReCaptchaVerificationResponse> {
    const apiBase = import.meta.env.VITE_WP_API_BASE || 'http://localhost:8080'
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
   * Load Google reCAPTCHA scripts
   */
  private async loadGoogleScripts(): Promise<void> {
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise
    }

    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      try {
        // Check if already loaded
        if (window.grecaptcha) {
          this.setupRecaptcha()
          resolve()
          return
        }

        // Create script element for v3 (primary)
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${this.config?.site_keys?.v3 || ''}`
        script.async = true
        script.defer = true

        script.onload = () => {
          devLog('Google reCAPTCHA scripts loaded successfully')
          devLog('Script src:', script.src)
          devLog('grecaptcha available:', !!window.grecaptcha)
          this.setupRecaptcha()
          resolve()
        }

        script.onerror = () => {
          reject(new Error('Failed to load Google reCAPTCHA scripts'))
        }

        document.head.appendChild(script)
      } catch (error) {
        reject(error)
      }
    })

    return this.scriptLoadPromise
  }

  /**
   * Setup reCAPTCHA after scripts are loaded
   */
  private setupRecaptcha(): void {
    if (!window.grecaptcha) {
      return
    }

    this.scriptsLoaded = true

    window.grecaptcha.ready(() => {
      this.v3Ready = true
      devLog('reCAPTCHA v3 ready')

      // Check if badge exists in DOM
      const badge = document.querySelector('.grecaptcha-badge')
      devLog('reCAPTCHA badge found in DOM:', !!badge)
      if (badge) {
        devLog('Badge element:', badge)
        devLog('Badge computed style:', window.getComputedStyle(badge))
      }
    })
  }
}

/**
 * Convenience function to get reCAPTCHA service instance
 */
export const getReCaptchaService = (): ReCaptchaService => {
  return ReCaptchaService.getInstance()
}

/**
 * Initialize reCAPTCHA service (call this in your app startup)
 */
export const initializeReCaptcha = async (): Promise<boolean> => {
  const service = getReCaptchaService()
  return await service.initialize()
}

export default ReCaptchaService
