import React, { useEffect } from 'react'
import { devLog } from '../config/environment'

/**
 * Blocked User Page
 *
 * Displays access denied message for users who failed reCAPTCHA verification.
 * Includes security logging for monitoring blocked access attempts.
 */
const BlockedPage: React.FC = () => {
  useEffect(() => {
    // Log blocked access attempt for security monitoring
    devLog('Access blocked - User failed reCAPTCHA verification')

    // Log additional context for security analysis
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      reason: 'reCAPTCHA page_view verification failed',
    }

    devLog('Blocked access details:', logData)
  }, [])

  return (
    <div className='min-h-screen flex items-center justify-center bg-base-200'>
      <div className='max-w-md mx-auto'>
        <div className='card bg-base-100 shadow-xl'>
          <div className='card-body text-center'>
            <div className='mb-4'>
              <svg
                className='w-16 h-16 mx-auto text-error'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>

            <p className='text-base-content/70 mb-6'>
              Sorry, access to this website has been temporarily restricted. This may be due to
              security verification requirements.
            </p>

            <div className='text-sm text-base-content/60'>
              <p>If you believe this is an error, please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockedPage
