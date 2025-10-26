import React from 'react'
import type { StreamingLink } from '../types/wordpress'

interface StreamingLinksProps {
  links: StreamingLink[]
  title?: string
}

const StreamingLinks: React.FC<StreamingLinksProps> = ({ links, title = 'Listen Online' }) => {
  if (!links || links.length === 0) {
    return null
  }

  // Platform-specific icons and styling
  const getPlatformInfo = (platform: string) => {
    const platformLower = platform.toLowerCase()

    if (platformLower.includes('spotify')) {
      return {
        icon: (
          <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.559.3z' />
          </svg>
        ),
        className: 'btn-success',
        color: 'text-green-600',
      }
    }

    if (platformLower.includes('apple') || platformLower.includes('itunes')) {
      return {
        icon: (
          <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701' />
          </svg>
        ),
        className: 'btn-neutral',
        color: 'text-gray-600',
      }
    }

    if (platformLower.includes('youtube')) {
      return {
        icon: (
          <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
          </svg>
        ),
        className: 'btn-error',
        color: 'text-red-600',
      }
    }

    if (platformLower.includes('soundcloud')) {
      return {
        icon: (
          <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.255-2.154c-.009-.057-.049-.1-.099-.1m1.33.104c-.058 0-.106.053-.113.115l-.193 2.005.193 2.058c.007.064.055.13.113.13.061 0 .11-.059.122-.13l.211-2.058-.211-2.005c-.012-.062-.061-.115-.122-.115m1.286.107c-.064 0-.114.056-.126.127l-.176 1.893.176 2.033c.012.07.062.132.126.132.062 0 .112-.062.123-.132l.194-2.033-.194-1.893c-.011-.071-.061-.127-.123-.127m1.257.127c-.071 0-.12.063-.134.139l-.144 1.766.144 2.015c.014.077.063.144.134.144.069 0 .119-.067.132-.144l.159-2.015-.159-1.766c-.013-.076-.063-.139-.132-.139m1.27.139c-.075 0-.129.067-.144.148l-.127 1.627.127 1.994c.015.082.069.156.144.156.077 0 .131-.074.149-.156l.139-1.994-.139-1.627c-.018-.081-.072-.148-.149-.148m1.292.144c-.081 0-.139.072-.157.158l-.105 1.483.105 1.975c.018.086.076.165.157.165.082 0 .14-.079.159-.165l.115-1.975-.115-1.483c-.019-.086-.077-.158-.159-.158m1.315.158c-.087 0-.147.079-.169.172l-.084 1.325.084 1.956c.022.094.082.179.169.179.089 0 .15-.085.171-.179l.092-1.956-.092-1.325c-.021-.093-.082-.172-.171-.172m1.353.179c-.093 0-.156.085-.178.186l-.063 1.146.063 1.938c.022.101.085.194.178.194.092 0 .155-.093.179-.194l.069-1.938-.069-1.146c-.024-.101-.087-.186-.179-.186m1.353.186c-.101 0-.168.091-.191.203l-.048.96.048 1.92c.023.112.09.212.191.212.102 0 .168-.1.192-.212l.054-1.92-.054-.96c-.024-.112-.09-.203-.192-.203m1.371.203c-.107 0-.176.096-.2.212l-.031.745.031 1.902c.024.117.093.22.2.22.108 0 .177-.103.202-.22l.036-1.902-.036-.745c-.025-.116-.094-.212-.202-.212m1.395.22c-.113 0-.185.103-.209.228l-.016.525.016 1.883c.024.125.096.237.209.237.112 0 .184-.112.207-.237l.02-1.883-.02-.525c-.023-.125-.095-.228-.207-.228m1.398.237c-.118 0-.192.109-.218.24l-.001.288.001 1.864c.026.131.1.249.218.249.119 0 .194-.118.219-.249l.005-1.864-.005-.288c-.025-.131-.1-.24-.219-.24m1.436.249c-.124 0-.202.116-.228.26v1.604c.026.144.104.268.228.268.125 0 .203-.124.229-.268v-1.604c-.026-.144-.104-.26-.229-.26' />
          </svg>
        ),
        className: 'btn-warning',
        color: 'text-orange-600',
      }
    }

    // Default for other platforms
    return {
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
          />
        </svg>
      ),
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
                {link.type === 'video' && (
                  <svg
                    className='w-4 h-4 ml-auto'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                )}
              </a>
            )
          })}
        </div>

        <div className='mt-4 text-sm text-base-content/60'>
          {links.filter(link => link.type === 'audio').length > 0 && (
            <div className='flex items-center gap-1'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                />
              </svg>
              <span>
                Audio available on {links.filter(link => link.type === 'audio').length} platform
                {links.filter(link => link.type === 'audio').length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {links.filter(link => link.type === 'video').length > 0 && (
            <div className='flex items-center gap-1 mt-1'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
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
