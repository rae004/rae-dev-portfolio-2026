/**
 * Contact Form Types
 * TypeScript interfaces for contact form data and API responses
 */

/**
 * Contact form data structure
 */
export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

/**
 * Contact form submission payload (includes reCAPTCHA token)
 */
export interface ContactSubmissionData extends ContactFormData {
  recaptcha_token: string
}

/**
 * Contact form API response from WordPress
 */
export interface ContactAPIResponse {
  success: boolean
  message: string
  data?: {
    submission_id: string
    timestamp: string
  }
}

/**
 * Contact form submission states
 */
export type ContactSubmissionStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error'
  | 'captcha_failed'
  | 'disabled'

/**
 * Contact form error structure
 */
export interface ContactFormError {
  code: string
  message: string
  field?: keyof ContactFormData
}

/**
 * Contact form validation errors
 */
export interface ContactFormValidationErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
  recaptcha_token?: string
}

/**
 * WordPress API error response structure
 */
export interface WordPressContactError {
  code: string
  message: string
  data?: {
    status: number
    errors?: ContactFormValidationErrors
  }
}
