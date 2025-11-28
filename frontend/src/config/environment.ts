/**
 * Environment Configuration
 *
 * Provides robust, type-safe environment detection and configuration
 * for three environments: local, development, and production.
 */

export type Environment = 'local' | 'development' | 'production'

export interface EnvironmentConfig {
  name: Environment
  wpApiBase: string
  isDevelopment: boolean
  isProduction: boolean
  isLocal: boolean
  recaptcha: {
    enabled: boolean
    siteKeyV3?: string
    siteKeyV2?: string
    threshold: number
    badgePosition: 'bottomright' | 'bottomleft' | 'inline'
  }
}

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS: Record<
  Environment,
  Omit<EnvironmentConfig, 'isDevelopment' | 'isProduction' | 'isLocal'>
> = {
  local: {
    name: 'local',
    wpApiBase: 'http://localhost:8080',
    recaptcha: {
      enabled: true, // Enabled for local testing
      threshold: 0.1,
      badgePosition: 'bottomright',
    },
  },
  development: {
    name: 'development',
    wpApiBase: 'https://api-dev.rae-dev.com',
    recaptcha: {
      enabled: true, // Will be dynamically loaded from WordPress
      threshold: 0.1, // Default, will be overridden by WordPress settings
      badgePosition: 'bottomright',
    },
  },
  production: {
    name: 'production',
    wpApiBase: 'https://api.rae-dev.com',
    recaptcha: {
      enabled: true, // Will be dynamically loaded from WordPress
      threshold: 0.1, // Default, will be overridden by WordPress settings
      badgePosition: 'bottomright',
    },
  },
}

/**
 * Detect current environment from build-time constants
 */
function detectEnvironment(): Environment {
  // Check for compile-time environment variable (set by Vite define)
  if (typeof __APP_ENV__ !== 'undefined') {
    const env = __APP_ENV__ as string
    if (env === 'local' || env === 'development' || env === 'production') {
      return env
    }
  }

  // Fallback to runtime detection for development
  if (import.meta.env.DEV) {
    return 'local'
  }

  // Default to production for builds
  return 'production'
}

/**
 * Create complete environment configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment()
  const baseConfig = ENVIRONMENT_CONFIGS[env]

  return {
    ...baseConfig,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isLocal: env === 'local',
  }
}

// Export singleton configuration
export const config = createEnvironmentConfig()

/**
 * Utility functions for environment checking
 */
export const isLocal = () => config.isLocal
export const isDevelopment = () => config.isDevelopment
export const isProduction = () => config.isProduction

/**
 * Get WordPress API base URL for current environment
 */
export const getWordPressApiBase = () => config.wpApiBase

/**
 * Development logging utility
 */
export const devLog = (...args: unknown[]) => {
  if (config.isLocal || config.isDevelopment) {
    console.log(`[${config.name.toUpperCase()}]`, ...args)
  }
}

/**
 * Get reCAPTCHA configuration for current environment
 */
export const getReCaptchaConfig = () => config.recaptcha

/**
 * Check if reCAPTCHA is enabled in current environment
 */
export const isReCaptchaEnabled = () => config.recaptcha.enabled

/**
 * Get reCAPTCHA badge position for current environment
 */
export const getReCaptchaBadgePosition = () => config.recaptcha.badgePosition

/**
 * Validate environment configuration at startup
 */
export const validateEnvironment = () => {
  const { name, wpApiBase, recaptcha } = config

  devLog('Environment detected:', name)
  devLog('WordPress API Base:', wpApiBase)
  devLog('reCAPTCHA enabled:', recaptcha.enabled)

  // Validate API URL format
  try {
    new URL(wpApiBase)
  } catch (error) {
    console.error('Invalid WordPress API base URL:', wpApiBase, error)
    throw new Error(`Invalid WordPress API configuration for environment: ${name}`)
  }

  // Warn about localhost in non-local environments
  if (!config.isLocal && wpApiBase.includes('localhost')) {
    console.warn('⚠️  Using localhost API URL in non-local environment!')
  }

  // reCAPTCHA configuration validation
  if (recaptcha.enabled && !config.isLocal) {
    devLog('reCAPTCHA configuration will be loaded from WordPress API')
  }

  return config
}
