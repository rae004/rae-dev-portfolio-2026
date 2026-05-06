import { memo } from 'react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  center?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const LoadingSpinner = memo(
  ({ className = '', size = 'md', message = 'Loading...', center = true }: LoadingSpinnerProps) => {
    const spinnerContent = (
      <>
        <span className={`loading loading-spinner ${sizeClasses[size]}`}></span>
        {message && <span className='ml-3'>{message}</span>}
      </>
    )

    if (center) {
      return (
        <div className={`flex justify-center items-center py-8 ${className}`}>{spinnerContent}</div>
      )
    }

    return <div className={`flex items-center ${className}`}>{spinnerContent}</div>
  }
)

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
