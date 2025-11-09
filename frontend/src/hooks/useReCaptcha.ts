/**
 * useReCaptcha Hook
 * React hook for integrating Google reCAPTCHA v3 with TanStack Query
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReCaptchaService,
  type ReCaptchaConfig,
  type ReCaptchaExecutionResult,
} from '../services/recaptcha'
import { isReCaptchaEnabled } from '../config/environment'
import { devLog } from '../config/environment'

export interface UseReCaptchaOptions {
  /**
   * Action name for reCAPTCHA v3 (default: 'contact_form')
   */
  action?: string

  /**
   * Auto-initialize the service when hook mounts (default: true)
   */
  autoInitialize?: boolean

  /**
   * Enable automatic execution on mount (default: false)
   */
  autoExecute?: boolean
}

export interface UseReCaptchaReturn {
  // State
  isReady: boolean
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  config: ReCaptchaConfig | null

  // v3 Methods
  executeV3: (action?: string) => Promise<string | null>

  // Combined flow (v3 only)
  executeAndVerify: (action?: string) => Promise<ReCaptchaExecutionResult>

  // Utility methods
  isAvailable: () => boolean
  refresh: () => void
}

/**
 * React hook for reCAPTCHA integration
 */
export const useReCaptcha = (options: UseReCaptchaOptions = {}): UseReCaptchaReturn => {
  const { action = 'contact_form', autoInitialize = true, autoExecute = false } = options

  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get reCAPTCHA service instance
  const recaptchaService = getReCaptchaService()

  // Query for reCAPTCHA configuration
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['recaptcha-config'],
    queryFn: async () => {
      if (!isReCaptchaEnabled()) {
        return null
      }
      return recaptchaService.getConfig()
    },
    enabled: isReCaptchaEnabled(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  })

  // Initialization mutation
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!isReCaptchaEnabled()) {
        throw new Error('reCAPTCHA is disabled in current environment')
      }

      const success = await recaptchaService.initialize()
      if (!success) {
        throw new Error('Failed to initialize reCAPTCHA service')
      }
      return success
    },
    onSuccess: () => {
      setIsInitialized(true)
      setError(null)
      devLog('reCAPTCHA service initialized via hook')

      // Invalidate config query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['recaptcha-config'] })
    },
    onError: (error: Error) => {
      setError(error.message)
      devLog('reCAPTCHA initialization failed:', error.message)
    },
  })

  // v3 execution mutation
  const v3ExecutionMutation = useMutation({
    mutationFn: async (executionAction: string) => {
      if (!isInitialized) {
        throw new Error('reCAPTCHA service not initialized')
      }
      return await recaptchaService.executeV3(executionAction)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Combined execution and verification mutation
  const executeAndVerifyMutation = useMutation({
    mutationFn: async (executionAction: string) => {
      if (!isInitialized) {
        throw new Error('reCAPTCHA service not initialized')
      }
      return await recaptchaService.executeAndVerify(executionAction)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Initialize service on mount (only if reCAPTCHA is enabled)
  useEffect(() => {
    if (autoInitialize && !isInitialized && !initializeMutation.isPending && isReCaptchaEnabled()) {
      initializeMutation.mutate()
    }
  }, [autoInitialize, isInitialized, initializeMutation, initializeMutation.isPending])

  // Placeholder for auto-execute (moved after executeV3 declaration)

  // Handle configuration errors
  useEffect(() => {
    if (configError) {
      setError(configError.message || 'Failed to load reCAPTCHA configuration')
    }
  }, [configError])

  // Memoized methods
  const executeV3 = useCallback(
    async (executionAction: string = action): Promise<string | null> => {
      const result = await v3ExecutionMutation.mutateAsync(executionAction)
      return result
    },
    [v3ExecutionMutation, action]
  )

  // Auto-execute if enabled (moved here after executeV3 declaration)
  useEffect(() => {
    if (autoExecute && isInitialized && config?.enabled && isReCaptchaEnabled()) {
      executeV3(action)
    }
  }, [autoExecute, isInitialized, config?.enabled, action, executeV3])

  const executeAndVerify = useCallback(
    async (executionAction: string = action): Promise<ReCaptchaExecutionResult> => {
      const result = await executeAndVerifyMutation.mutateAsync(executionAction)
      return result
    },
    [executeAndVerifyMutation, action]
  )

  const isAvailable = useCallback((): boolean => {
    return isInitialized && recaptchaService.isAvailable()
  }, [isInitialized, recaptchaService])

  const refresh = useCallback((): void => {
    setError(null)
    refetchConfig()
    if (!isInitialized) {
      initializeMutation.mutate()
    }
  }, [refetchConfig, isInitialized, initializeMutation])

  // Calculate loading state
  const isLoading =
    isConfigLoading ||
    initializeMutation.isPending ||
    v3ExecutionMutation.isPending ||
    executeAndVerifyMutation.isPending

  return {
    // State
    isReady: isInitialized && !isLoading,
    isInitialized,
    isLoading,
    error,
    config: config || null,

    // Methods
    executeV3,
    executeAndVerify,
    isAvailable,
    refresh,
  }
}

/**
 * Hook specifically for form submissions with reCAPTCHA
 */
export const useReCaptchaForm = (action: string = 'contact_form') => {
  const recaptcha = useReCaptcha({
    action,
    autoInitialize: isReCaptchaEnabled(), // Only auto-initialize if enabled
    autoExecute: false,
  })

  /**
   * Execute full reCAPTCHA flow for form submission
   */
  const executeForSubmission = useCallback(async (): Promise<{
    success: boolean
    canProceed: boolean
    error?: string
  }> => {
    try {
      if (!recaptcha.isAvailable()) {
        return {
          success: true,
          canProceed: true, // Graceful degradation
        }
      }

      // Execute v3 and verify
      const result = await recaptcha.executeAndVerify(action)

      if (!result.success) {
        return {
          success: false,
          canProceed: false,
          error: result.error,
        }
      }

      // Can proceed with submission
      return {
        success: true,
        canProceed: true,
      }
    } catch (error: unknown) {
      return {
        success: false,
        canProceed: false,
        error: error instanceof Error ? error.message : 'reCAPTCHA verification failed',
      }
    }
  }, [recaptcha, action])

  return {
    ...recaptcha,

    // Form-specific methods
    executeForSubmission,
  }
}

export default useReCaptcha
