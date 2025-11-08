import React, { useEffect } from 'react'
import type { SocialLink, SocialLinksQueryParams, SocialPlatform } from '../types/wordpress'
import { useSocialLinks } from '../hooks/useWordPress'

interface SocialLinksProps {
  className?: string
  maxDisplay?: number
  showLabels?: boolean
  enabledOnly?: boolean
  onLinkClick?: (link: SocialLink) => void
  onEmpty?: (isEmpty: boolean) => void
}

const SocialLinks: React.FC<SocialLinksProps> = ({
  className = '',
  maxDisplay = 6,
  showLabels = true,
  enabledOnly = true,
  onLinkClick,
  onEmpty,
}) => {
  // Build query parameters
  const queryParams: SocialLinksQueryParams = {
    enabled_only: enabledOnly,
    limit: maxDisplay,
  }

  // Fetch social links using React Query hook
  const { data, isLoading, error, refetch } = useSocialLinks(queryParams)

  // Notify parent component when empty state changes
  useEffect(() => {
    if (!isLoading && onEmpty) {
      const isEmpty = !data?.social_links?.length
      onEmpty(isEmpty)
    }
  }, [data?.social_links?.length, isLoading, onEmpty])

  // Platform icon mapping using SVG for better scalability and customization
  const getPlatformIcon = (platform: SocialPlatform): JSX.Element => {
    const iconProps = {
      className: 'w-5 h-5',
      fill: 'currentColor',
      'aria-hidden': 'true',
    }

    switch (platform) {
      case 'linkedin':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
          </svg>
        )

      case 'github':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
          </svg>
        )

      case 'twitter':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
          </svg>
        )

      case 'facebook':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
          </svg>
        )

      case 'instagram':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
          </svg>
        )

      case 'youtube':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
          </svg>
        )

      case 'email':
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
          </svg>
        )

      case 'generic':
      default:
        return (
          <svg {...iconProps} viewBox='0 0 24 24'>
            <path d='M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z' />
          </svg>
        )
    }
  }

  // Get platform-specific styling
  const getPlatformStyling = (platform: SocialPlatform): string => {
    const baseClasses = 'hover:opacity-80 transition-opacity'

    switch (platform) {
      case 'linkedin':
        return `${baseClasses} text-blue-600 hover:text-blue-700`
      case 'github':
        return `${baseClasses} text-gray-800 hover:text-gray-900`
      case 'twitter':
        return `${baseClasses} text-blue-500 hover:text-blue-600`
      case 'facebook':
        return `${baseClasses} text-blue-600 hover:text-blue-700`
      case 'instagram':
        return `${baseClasses} text-pink-500 hover:text-pink-600`
      case 'youtube':
        return `${baseClasses} text-red-600 hover:text-red-700`
      case 'email':
        return `${baseClasses} text-green-600 hover:text-green-700`
      case 'generic':
      default:
        return `${baseClasses} text-primary hover:text-primary-focus`
    }
  }

  // Handle link click
  const handleLinkClick = (link: SocialLink) => {
    onLinkClick?.(link)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className='space-y-4'>
          {[...Array(3)].map((_, index) => (
            <div key={index} className='flex items-center space-x-3 animate-pulse'>
              <div className='w-5 h-5 bg-base-300 rounded'></div>
              <div className='h-4 bg-base-300 rounded w-32'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div className='text-center py-4'>
          <div className='text-error mb-2'>
            <svg className='w-8 h-8 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <p className='text-sm text-base-content/70 mb-2'>Unable to load social links</p>
          <button onClick={() => refetch()} className='btn btn-xs btn-outline'>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!data?.social_links?.length) {
    return (
      <div className={className}>
        <div className='text-center py-4'>
          <div className='text-base-content/50 mb-2'>
            <svg className='w-8 h-8 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
              />
            </svg>
          </div>
          <p className='text-sm text-base-content/70'>No social links configured</p>
        </div>
      </div>
    )
  }

  // Render social links
  return (
    <div className={className}>
      <div className='space-y-4'>
        {data.social_links.map(link => (
          <div key={link.id} className='flex items-center space-x-3'>
            <span className={getPlatformStyling(link.platform as SocialPlatform)}>
              {getPlatformIcon(link.platform as SocialPlatform)}
            </span>
            <a
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => handleLinkClick(link)}
              className='link link-primary hover:link-hover'
              aria-label={`Visit ${link.label}`}
            >
              {showLabels ? link.label : link.platform}
            </a>
          </div>
        ))}
      </div>

      {/* Optional: Display total count if truncated */}
      {data.total > data.social_links.length && (
        <div className='text-xs text-base-content/50 mt-2'>
          Showing {data.social_links.length} of {data.total} links
        </div>
      )}
    </div>
  )
}

export default SocialLinks
