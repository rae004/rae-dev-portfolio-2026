// Icon utility constants and types
export interface IconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

export interface SocialIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

export const socialSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}
