import React, { useState, useCallback } from 'react'
import { useForm } from '@tanstack/react-form'
import SocialLinks from '../components/SocialLinks'
import { useReCaptchaForm } from '../hooks/useReCaptchaForm'
import { isReCaptchaEnabled } from '../config/environment'
import {
  submitContactForm,
  ContactServiceError,
  sanitizeContactFormData,
  validateContactFormData,
} from '../services/contact'
import type { ContactFormData, ContactSubmissionStatus } from '../types/contact'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <div className='label'>
          <span className='label-text-alt text-error'>{field.state.meta.errors[0]}</span>
        </div>
      ) : null}
    </>
  )
}

const ContactPage: React.FC = () => {
  const [submitStatus, setSubmitStatus] = useState<ContactSubmissionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSocialLinks, setShowSocialLinks] = useState(true)

  // reCAPTCHA integration for form submission (always fresh verification)
  const { verify: verifyReCaptcha } = useReCaptchaForm()

  // Memoized callback to prevent infinite loops
  const handleSocialLinksEmpty = useCallback((isEmpty: boolean) => {
    setShowSocialLinks(!isEmpty)
  }, [])

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    } as ContactFormData,
    onSubmit: async ({ value }) => {
      setSubmitStatus('idle')
      setErrorMessage('')
      setIsSubmitting(true)

      try {
        let recaptchaToken = ''

        // Only verify reCAPTCHA if it's enabled in current environment
        if (isReCaptchaEnabled()) {
          const recaptchaResult = await verifyReCaptcha()

          if (!recaptchaResult.success) {
            setSubmitStatus('captcha_failed')
            setErrorMessage('Security verification failed. Please try again later.')
            console.error('reCAPTCHA verification failed:', recaptchaResult.error)
            return
          }

          recaptchaToken = recaptchaResult.token!
        } else {
          console.log('[Contact] reCAPTCHA disabled for local development')
          recaptchaToken = 'development-bypass'
        }

        // Proceed with form submission
        await submitForm(value, recaptchaToken)
      } catch (error) {
        console.error('Form submission error:', error)
        setSubmitStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  /**
   * Actual form submission logic
   */
  const submitForm = async (formData: ContactFormData, recaptchaToken: string) => {
    try {
      // Client-side validation
      const validationErrors = validateContactFormData({
        ...formData,
        recaptcha_token: recaptchaToken,
      })
      if (Object.keys(validationErrors).length > 0) {
        setSubmitStatus('error')
        setErrorMessage('Please check your form data and try again.')
        return
      }

      // Sanitize and prepare submission data
      const submissionData = sanitizeContactFormData({
        ...formData,
        recaptcha_token: recaptchaToken,
      })

      // Submit to WordPress API
      const response = await submitContactForm(submissionData)

      if (response.success) {
        setSubmitStatus('success')
        setErrorMessage('')
        console.log('Contact form submitted successfully:', response.data?.submission_id)

        // Reset form after successful submission
        form.reset()
      } else {
        setSubmitStatus('error')
        setErrorMessage(response.message || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)

      if (error instanceof ContactServiceError) {
        setSubmitStatus('error')

        // Handle specific error types
        if (error.code === 'recaptcha_failed') {
          setSubmitStatus('captcha_failed')
          setErrorMessage('Security verification failed. Please try again.')
        } else if (error.code === 'contact_disabled') {
          setSubmitStatus('disabled')
          setErrorMessage('Contact form is currently disabled. Please try again later.')
        } else if (error.validationErrors) {
          setErrorMessage('Please check your form data and try again.')
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setSubmitStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again later.')
      }
    }
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Contact</h1>

        <div className='grid md:grid-cols-2 gap-8'>
          <div className='card bg-base-100 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title text-2xl mb-6'>Get In Touch</h2>

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className='alert alert-success mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='stroke-current shrink-0 h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span>Message sent successfully! I'll get back to you soon.</span>
                </div>
              )}

              {/* Error Messages */}
              {(submitStatus === 'error' || submitStatus === 'disabled') && (
                <div className='alert alert-error mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='stroke-current shrink-0 h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span>{errorMessage || 'Failed to send message. Please try again.'}</span>
                </div>
              )}

              {/* reCAPTCHA Error Message */}
              {submitStatus === 'captcha_failed' && (
                <div className='alert alert-warning mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='stroke-current shrink-0 h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                  <span>
                    {errorMessage || 'Security verification failed. Please try again later.'}
                  </span>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className='space-y-4'
              >
                {/* Name Field */}
                <form.Field
                  name='name'
                  validators={{
                    onChange: ({ value }) =>
                      !value || value.length < 2 ? 'Name must be at least 2 characters' : undefined,
                  }}
                  children={field => (
                    <div className='form-control'>
                      <label className='label'>
                        <span className='label-text'>Name *</span>
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        type='text'
                        placeholder='Your name'
                        className={`input input-bordered w-full ${
                          field.state.meta.isTouched && field.state.meta.errors.length
                            ? 'input-error'
                            : ''
                        }`}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                {/* Email Field */}
                <form.Field
                  name='email'
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Email is required'
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return 'Please enter a valid email address'
                      }
                      return undefined
                    },
                  }}
                  children={field => (
                    <div className='form-control'>
                      <label className='label'>
                        <span className='label-text'>Email *</span>
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        type='email'
                        placeholder='your.email@example.com'
                        className={`input input-bordered w-full ${
                          field.state.meta.isTouched && field.state.meta.errors.length
                            ? 'input-error'
                            : ''
                        }`}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                {/* Subject Field */}
                <form.Field
                  name='subject'
                  validators={{
                    onChange: ({ value }) =>
                      !value || value.length < 3
                        ? 'Subject must be at least 3 characters'
                        : undefined,
                  }}
                  children={field => (
                    <div className='form-control'>
                      <label className='label'>
                        <span className='label-text'>Subject *</span>
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        type='text'
                        placeholder='Subject'
                        className={`input input-bordered w-full ${
                          field.state.meta.isTouched && field.state.meta.errors.length
                            ? 'input-error'
                            : ''
                        }`}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                {/* Message Field */}
                <form.Field
                  name='message'
                  validators={{
                    onChange: ({ value }) =>
                      !value || value.length < 10
                        ? 'Message must be at least 10 characters'
                        : undefined,
                  }}
                  children={field => (
                    <div className='form-control'>
                      <label className='label'>
                        <span className='label-text'>Message *</span>
                      </label>
                      <textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        className={`textarea textarea-bordered h-32 ${
                          field.state.meta.isTouched && field.state.meta.errors.length
                            ? 'textarea-error'
                            : ''
                        }`}
                        placeholder='Your message...'
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <div className='form-control mt-6'>
                  <form.Subscribe
                    selector={state => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isFormSubmitting]) => (
                      <button
                        type='submit'
                        disabled={!canSubmit || isSubmitting || submitStatus === 'disabled'}
                        className={`btn btn-primary ${isSubmitting || isFormSubmitting ? 'loading' : ''}`}
                      >
                        {isSubmitting || isFormSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    )}
                  />
                </div>
              </form>
            </div>
          </div>

          <div className='space-y-6'>
            {showSocialLinks && (
              <div className='card bg-base-100 shadow-xl'>
                <div className='card-body'>
                  <h3 className='card-title'>Connect With Me</h3>
                  <SocialLinks
                    className='space-y-4'
                    showLabels={true}
                    maxDisplay={6}
                    enabledOnly={true}
                    onEmpty={handleSocialLinksEmpty}
                  />
                </div>
              </div>
            )}

            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h3 className='card-title'>Collaboration</h3>
                <p className='text-sm'>
                  I'm always interested in discussing new opportunities, whether it's consulting on
                  cloud architecture, full-stack development, or sharing experiences from my diverse
                  career journey.
                </p>
              </div>
            </div>

            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h3 className='card-title'>Response Time</h3>
                <p className='text-sm'>
                  I typically respond to messages within 24-48 hours. For urgent matters, please
                  mention it in your subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
