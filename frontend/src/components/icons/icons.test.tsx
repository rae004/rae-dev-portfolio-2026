import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  ChevronLeft,
  ChevronRight,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  UserIcon,
  BuildingIcon,
  AwardIcon,
  VideoIcon,
  MusicIcon,
  AudioIcon,
  ExternalLinkIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  LanguageIcon,
  SuccessIcon,
  WarningIcon,
  ErrorIcon,
  LoadingSpinner,
  PaletteIcon,
} from './index'
import {
  SpotifyIcon,
  AppleMusicIcon,
  YouTubeIcon,
  SoundCloudIcon,
  GenericMusicIcon,
} from './SocialIcons'

const allIcons = [
  ['ChevronLeft', ChevronLeft],
  ['ChevronRight', ChevronRight],
  ['MenuIcon', MenuIcon],
  ['CloseIcon', CloseIcon],
  ['SearchIcon', SearchIcon],
  ['UserIcon', UserIcon],
  ['BuildingIcon', BuildingIcon],
  ['AwardIcon', AwardIcon],
  ['VideoIcon', VideoIcon],
  ['MusicIcon', MusicIcon],
  ['AudioIcon', AudioIcon],
  ['ExternalLinkIcon', ExternalLinkIcon],
  ['CalendarIcon', CalendarIcon],
  ['ClockIcon', ClockIcon],
  ['TagIcon', TagIcon],
  ['LanguageIcon', LanguageIcon],
  ['SuccessIcon', SuccessIcon],
  ['WarningIcon', WarningIcon],
  ['ErrorIcon', ErrorIcon],
  ['LoadingSpinner', LoadingSpinner],
  ['PaletteIcon', PaletteIcon],
  ['SpotifyIcon', SpotifyIcon],
  ['AppleMusicIcon', AppleMusicIcon],
  ['YouTubeIcon', YouTubeIcon],
  ['SoundCloudIcon', SoundCloudIcon],
  ['GenericMusicIcon', GenericMusicIcon],
] as const

describe('icons', () => {
  it.each(allIcons)('%s renders an <svg> element', (_name, Icon) => {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('applies the requested size class', () => {
    const { container } = render(<MenuIcon size='lg' />)
    expect(container.querySelector('svg')).toHaveClass('w-8', 'h-8')
  })

  it('forwards a custom className', () => {
    const { container } = render(<UserIcon className='custom-x' />)
    expect(container.querySelector('svg')).toHaveClass('custom-x')
  })

  it('applies a custom stroke color when provided (non-social icons)', () => {
    const { container } = render(<UserIcon color='#123456' />)
    expect(container.querySelector('svg')).toHaveAttribute('stroke', '#123456')
  })
})
