/**
 * Contact Form Service
 * Handles contact form submissions to WordPress API
 */

import { getWordPressApiBase, devLog } from '../config/environment'
import type {
  ContactSubmissionData,
  ContactAPIResponse,
  WordPressContactError,
} from '../types/contact'

// WordPress API configuration
const WP_API_BASE = getWordPressApiBase()
const CONTACT_ENDPOINT = '/?rest_route=/wp/v2/contact'

/**
 * Contact service error class
 */
export class ContactServiceError extends Error {
  public code: string
  public status?: number
  public validationErrors?: Record<string, string>

  constructor(
    message: string,
    code: string,
    status?: number,
    validationErrors?: Record<string, string>
  ) {
    super(message)
    this.name = 'ContactServiceError'
    this.code = code
    this.status = status
    this.validationErrors = validationErrors
  }
}

/**
 * Submit contact form to WordPress API
 */
export async function submitContactForm(data: ContactSubmissionData): Promise<ContactAPIResponse> {
  const url = `${WP_API_BASE}${CONTACT_ENDPOINT}`

  devLog('Submitting contact form to:', url)
  devLog('Contact form data:', {
    name: data.name,
    email: data.email,
    subject: data.subject,
    messageLength: data.message.length,
    hasReCaptcha: !!data.recaptcha_token,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    })

    devLog('Contact form response status:', response.status)

    // Parse response body
    let responseData: ContactAPIResponse | WordPressContactError
    try {
      responseData = await response.json()
    } catch (parseError) {
      throw new ContactServiceError(
        `Invalid response format from server: ${parseError}`,
        'invalid_response',
        response.status
      )
    }

    // Handle HTTP error status codes
    if (!response.ok) {
      const errorData = responseData as WordPressContactError

      // Handle validation errors specifically
      if (response.status === 400 && errorData.data?.errors) {
        // Map WordPress validation errors to a simpler format to ensure a Record<string, string> structure
        const validationErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(errorData.data.errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            validationErrors[field] = messages[0]
          }
        }

        throw new ContactServiceError(
          errorData.message || 'Form validation failed',
          errorData.code || 'validation_error',
          response.status,
          validationErrors
        )
      }

      // Handle other error cases
      throw new ContactServiceError(
        errorData.message || 'Contact form submission failed',
        errorData.code || 'submission_failed',
        response.status
      )
    }

    const successData = responseData as ContactAPIResponse

    // Verify response structure
    if (!successData.success) {
      throw new ContactServiceError(
        successData.message || 'Contact form submission failed',
        'submission_failed',
        response.status
      )
    }

    devLog('Contact form submitted successfully:', {
      submissionId: successData.data?.submission_id,
      timestamp: successData.data?.timestamp,
    })

    return successData
  } catch (error) {
    // Re-throw ContactServiceError as-is
    if (error instanceof ContactServiceError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError || (error as { code: string }).code === 'NETWORK_ERROR') {
      throw new ContactServiceError(
        'Network error. Please check your internet connection and try again.',
        'network_error'
      )
    }

    // Handle other unknown errors
    devLog('Unexpected contact form error:', error)
    throw new ContactServiceError(
      'An unexpected error occurred. Please try again later.',
      'unknown_error'
    )
  }
}

/**
 * Validate contact form data on the client side
 */
export function validateContactFormData(
  data: Partial<ContactSubmissionData>
): Record<string, string> {
  const errors: Record<string, string> = {}

  // Name validation
  if (!data.name?.trim()) {
    errors.name = 'Name is required'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long'
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be less than 100 characters'
  }

  // Email validation
  if (!data.email?.trim()) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address'
    } else if (data.email.trim().length > 254) {
      errors.email = 'Email address is too long'
    }
  }

  // Subject validation
  if (!data.subject?.trim()) {
    errors.subject = 'Subject is required'
  } else if (data.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters long'
  } else if (data.subject.trim().length > 200) {
    errors.subject = 'Subject must be less than 200 characters'
  }

  // Message validation
  if (!data.message?.trim()) {
    errors.message = 'Message is required'
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long'
  } else if (data.message.trim().length > 5000) {
    errors.message = 'Message must be less than 5000 characters'
  }

  // reCAPTCHA validation (skip for development bypass)
  if (!data.recaptcha_token?.trim()) {
    errors.recaptcha_token = 'reCAPTCHA verification is required'
  } else if (data.recaptcha_token.trim() === 'development-bypass') {
    // Allow development bypass token
    console.log('[Contact] Using development bypass token')
  }

  return errors
}

/**
 * Sanitize contact form data
 */
export function sanitizeContactFormData(data: ContactSubmissionData): ContactSubmissionData {
  return {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    subject: data.subject.trim(),
    message: data.message.trim(),
    recaptcha_token: data.recaptcha_token.trim(),
  }
}
