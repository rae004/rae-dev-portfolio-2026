import { memo } from 'react'
import { sizeClasses, type IconProps } from './iconUtils'

// Base SVG wrapper component
const IconBase = ({
  children,
  className = '',
  size = 'md',
  color = 'currentColor',
}: IconProps & { children: React.ReactNode }) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill='none'
    stroke={color}
    viewBox='0 0 24 24'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth={2}
  >
    {children}
  </svg>
)

// Navigation Icons
export const ChevronLeft = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M15 19l-7-7 7-7' />
  </IconBase>
))

export const ChevronRight = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M9 5l7 7-7 7' />
  </IconBase>
))

export const MenuIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <line x1='3' y1='6' x2='21' y2='6' />
    <line x1='3' y1='12' x2='21' y2='12' />
    <line x1='3' y1='18' x2='21' y2='18' />
  </IconBase>
))

export const CloseIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </IconBase>
))

export const SearchIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.35-4.35' />
  </IconBase>
))

// User & Business Icons
export const UserIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
  </IconBase>
))

export const BuildingIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
  </IconBase>
))

export const AwardIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
  </IconBase>
))

// Media Icons
export const VideoIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
  </IconBase>
))

export const MusicIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' />
  </IconBase>
))

export const AudioIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' />
  </IconBase>
))

export const ExternalLinkIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
  </IconBase>
))

// Time & Organization Icons
export const CalendarIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
  </IconBase>
))

export const ClockIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
  </IconBase>
))

export const TagIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z' />
  </IconBase>
))

export const LanguageIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' />
  </IconBase>
))

// Status Icons
export const SuccessIcon = memo(({ className, size, color = '#10B981' }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
  </IconBase>
))

export const WarningIcon = memo(({ className, size, color = '#F59E0B' }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
  </IconBase>
))

export const ErrorIcon = memo(({ className, size, color = '#EF4444' }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
  </IconBase>
))

// Loading Spinner
export const LoadingSpinner = memo(({ className, size }: IconProps) => (
  <svg
    className={`${sizeClasses[size || 'md']} animate-spin ${className}`}
    fill='none'
    viewBox='0 0 24 24'
  >
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path
      className='opacity-75'
      fill='currentColor'
      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    />
  </svg>
))

// Theme/Palette Icon
export const PaletteIcon = memo(({ className, size, color }: IconProps) => (
  <IconBase className={className} size={size} color={color}>
    <path d='M7 21a4 4 0 01-4-4 4 4 0 014-4h.5a.5.5 0 01.5.5v2a1.5 1.5 0 003 0V9a4 4 0 114 4v1.5a1.5 1.5 0 003 0V9.5a.5.5 0 01.5-.5h.5a4 4 0 014 4 4 4 0 01-4 4H7z' />
  </IconBase>
))
