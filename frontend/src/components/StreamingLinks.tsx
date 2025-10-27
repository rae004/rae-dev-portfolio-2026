import type { StreamingLink } from '../types/wordpress'
import {
  SpotifyIcon,
  AppleMusicIcon,
  YouTubeIcon,
  SoundCloudIcon,
  GenericMusicIcon,
} from './icons/SocialIcons'
import { MusicIcon, VideoIcon } from './icons'

interface StreamingLinksProps {
  links: StreamingLink[]
  title?: string
}

const StreamingLinks = ({ links, title = 'Listen Online' }: StreamingLinksProps) => {
  if (!links || links.length === 0) {
    return null
  }

  // Platform-specific icons and styling
  const getPlatformInfo = (platform: string) => {
    const platformLower = platform.toLowerCase()

    if (platformLower.includes('spotify')) {
      return {
        icon: <SpotifyIcon size='md' />,
        className: 'btn-success',
        color: 'text-green-600',
      }
    }

    if (platformLower.includes('apple') || platformLower.includes('itunes')) {
      return {
        icon: <AppleMusicIcon size='md' />,
        className: 'btn-neutral',
        color: 'text-gray-600',
      }
    }

    if (platformLower.includes('youtube')) {
      return {
        icon: <YouTubeIcon size='md' />,
        className: 'btn-error',
        color: 'text-red-600',
      }
    }

    if (platformLower.includes('soundcloud')) {
      return {
        icon: <SoundCloudIcon size='md' />,
        className: 'btn-warning',
        color: 'text-orange-600',
      }
    }

    // Default for other platforms
    return {
      icon: <GenericMusicIcon size='md' />,
      className: 'btn-primary',
      color: 'text-primary',
    }
  }

  return (
    <div className='card bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title text-xl mb-4'>{title}</h2>
        <div className='divider'></div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {links.map((link, index) => {
            const platformInfo = getPlatformInfo(link.platform)

            return (
              <a
                key={index}
                href={link.url}
                target='_blank'
                rel='noopener noreferrer'
                className={`btn ${platformInfo.className} btn-outline flex items-center gap-2 justify-start`}
              >
                <span className={platformInfo.color}>{platformInfo.icon}</span>
                <span className='truncate'>{link.platform}</span>
                {link.type === 'video' && <VideoIcon className='ml-auto' size='sm' />}
              </a>
            )
          })}
        </div>

        <div className='mt-4 text-sm text-base-content/60'>
          {links.filter(link => link.type === 'audio').length > 0 && (
            <div className='flex items-center gap-1'>
              <MusicIcon size='sm' />
              <span>
                Audio available on {links.filter(link => link.type === 'audio').length} platform
                {links.filter(link => link.type === 'audio').length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {links.filter(link => link.type === 'video').length > 0 && (
            <div className='flex items-center gap-1 mt-1'>
              <VideoIcon size='sm' />
              <span>
                Video available on {links.filter(link => link.type === 'video').length} platform
                {links.filter(link => link.type === 'video').length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StreamingLinks
