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
      execute: (clientIdOrSiteKey: string | number, options: { action: string }) => Promise<string>
      render: (
        container: string | HTMLElement,
        parameters: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark'
          size?: 'compact' | 'normal' | 'invisible'
          badge?: 'bottomright' | 'bottomleft' | 'inline'
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
  private clientId: number | null = null
  private containerElement: HTMLElement | null = null
  private themeObserver: MutationObserver | null = null
  private currentTheme: 'light' | 'dark' = 'light'

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
    return (
      this.config?.enabled === true && this.scriptsLoaded && this.v3Ready && this.clientId !== null
    )
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
   * Execute reCAPTCHA v3 (invisible) using explicit rendering clientId
   */
  public async executeV3(action: string): Promise<string | null> {
    return new Promise(resolve => {
      if (!this.isAvailable() || this.clientId === null) {
        resolve(null)
        return
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(this.clientId!, { action })
          .then((token: string) => {
            devLog('reCAPTCHA v3 token generated for action:', action, 'clientId:', this.clientId)
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
   * Load Google reCAPTCHA scripts with explicit rendering
   */
  private async loadGoogleScripts(): Promise<void> {
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise
    }

    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      try {
        // Check if already loaded
        if (window.grecaptcha) {
          this.setupExplicitRendering()
          resolve()
          return
        }

        // Set up global callback for explicit rendering
        window.initReCaptcha = () => {
          devLog('reCAPTCHA onload callback triggered')
          this.setupExplicitRendering()
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

        devLog('Loading reCAPTCHA scripts with explicit rendering')
        devLog('Script src:', script.src)
        document.head.appendChild(script)
      } catch (error) {
        reject(error)
      }
    })

    return this.scriptLoadPromise
  }

  /**
   * Setup explicit reCAPTCHA rendering with theme and badge control
   */
  private setupExplicitRendering(): void {
    if (!window.grecaptcha || !this.config?.site_keys?.v3) {
      return
    }

    this.scriptsLoaded = true

    window.grecaptcha.ready(() => {
      try {
        // Create container for badge if needed
        this.createBadgeContainer()

        // Detect current theme
        const theme = this.detectTheme()
        const badgePosition = this.getBadgePosition()

        devLog('Setting up explicit reCAPTCHA rendering:', {
          theme,
          badgePosition,
          siteKey: this.config!.site_keys.v3,
        })

        // Render reCAPTCHA with explicit parameters
        this.clientId = window.grecaptcha.render(this.containerElement!, {
          sitekey: this.config!.site_keys.v3!,
          size: 'invisible',
          badge: badgePosition,
          theme: theme,
        })

        this.v3Ready = true
        this.currentTheme = theme
        devLog('reCAPTCHA v3 explicitly rendered with clientId:', this.clientId)

        // Start monitoring theme changes
        this.startThemeMonitoring()

        // Check badge in DOM
        setTimeout(() => {
          const badge = document.querySelector('.grecaptcha-badge')
          devLog('reCAPTCHA badge found in DOM:', !!badge)
          if (badge) {
            devLog('Badge theme applied:', theme)
            devLog('Badge position applied:', badgePosition)
          }
        }, 100)
      } catch (error) {
        console.error('Failed to setup explicit reCAPTCHA rendering:', error)
      }
    })
  }

  /**
   * Create container element for reCAPTCHA badge
   */
  private createBadgeContainer(): void {
    if (this.containerElement) {
      return // Already exists
    }

    this.containerElement = document.createElement('div')
    this.containerElement.id = 'recaptcha-badge-container'
    this.containerElement.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 1000;'

    devLog('Created reCAPTCHA badge container')
    document.body.appendChild(this.containerElement)
  }

  /**
   * Detect current DaisyUI theme and map to Google's light/dark
   */
  private detectTheme(): 'light' | 'dark' {
    const htmlElement = document.documentElement
    const currentTheme = htmlElement.getAttribute('data-theme') || 'light'

    // Map DaisyUI dark themes to 'dark', everything else to 'light'
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
    devLog('Detected DaisyUI theme:', currentTheme, '→ reCAPTCHA theme:', theme)

    return theme
  }

  /**
   * Get badge position from configuration or default
   */
  private getBadgePosition(): 'bottomright' | 'bottomleft' | 'inline' {
    // Default to bottomright, could be extended to read from config
    const position = 'bottomright'
    devLog('Badge position:', position)
    return position
  }

  /**
   * Start monitoring for theme changes
   */
  private startThemeMonitoring(): void {
    if (this.themeObserver) {
      return // Already monitoring
    }

    this.themeObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = this.detectTheme()
          if (newTheme !== this.currentTheme) {
            devLog('Theme change detected:', this.currentTheme, '→', newTheme)
            this.currentTheme = newTheme
            this.rerenderBadgeWithNewTheme(newTheme)
          }
        }
      })
    })

    // Start observing the html element for data-theme changes
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    devLog('Started monitoring theme changes')
  }

  /**
   * Re-render reCAPTCHA badge with new theme
   */
  private rerenderBadgeWithNewTheme(newTheme: 'light' | 'dark'): void {
    if (!this.isAvailable() || this.clientId === null) {
      return
    }

    try {
      // Reset the current widget
      window.grecaptcha.reset(this.clientId)

      // Remove existing badge elements to force fresh render
      this.removeBadgeElements()

      // Recreate container to ensure clean slate
      this.recreateContainer()

      // Re-render with new theme
      const badgePosition = this.getBadgePosition()

      devLog('Re-rendering reCAPTCHA badge with new theme:', newTheme)

      this.clientId = window.grecaptcha.render(this.containerElement!, {
        sitekey: this.config!.site_keys.v3!,
        size: 'invisible',
        badge: badgePosition,
        theme: newTheme,
      })

      devLog('reCAPTCHA badge re-rendered with clientId:', this.clientId, 'theme:', newTheme)

      // Verify the theme was applied
      setTimeout(() => {
        const badge = document.querySelector('.grecaptcha-badge')
        if (badge) {
          devLog('Badge theme verification - expected:', newTheme, 'badge found:', !!badge)
        }
      }, 200)
    } catch (error) {
      console.error('Failed to re-render reCAPTCHA badge with new theme:', error)
    }
  }

  /**
   * Remove all existing reCAPTCHA badge elements from DOM
   */
  private removeBadgeElements(): void {
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

    devLog('Removed existing reCAPTCHA badge elements')
  }

  /**
   * Recreate container element for fresh rendering
   */
  private recreateContainer(): void {
    // Remove existing container
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement)
    }

    // Create new container
    this.containerElement = document.createElement('div')
    this.containerElement.id = 'recaptcha-badge-container'
    this.containerElement.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 1000;'

    document.body.appendChild(this.containerElement)
    devLog('Recreated reCAPTCHA badge container')
  }

  /**
   * Stop monitoring theme changes
   */
  private stopThemeMonitoring(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect()
      this.themeObserver = null
      devLog('Stopped monitoring theme changes')
    }
  }

  /**
   * Clean up container and reset state
   */
  public cleanup(): void {
    // Stop theme monitoring
    this.stopThemeMonitoring()

    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement)
    }

    this.containerElement = null
    this.clientId = null
    this.v3Ready = false

    // Clean up global callback
    if (window.initReCaptcha) {
      delete window.initReCaptcha
    }

    devLog('reCAPTCHA service cleaned up')
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
