import React from 'react'
import type { MediaProject, MusicProject, AudioPostProject } from '../types/wordpress'
import { isMusicProject, isAudioPostProject } from '../types/wordpress'
import StreamingLinks from './StreamingLinks'

interface MediaProjectMetadataProps {
  project: MediaProject
  layout?: 'detailed' | 'compact'
}

const MediaProjectMetadata: React.FC<MediaProjectMetadataProps> = ({ project }) => {
  const renderMusicMetadata = (musicProject: MusicProject) => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Basic Info */}
        <div className='space-y-3'>
          {musicProject.music_artist_name && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Artist:</span>
                <div className='font-medium'>{musicProject.music_artist_name}</div>
              </div>
            </div>
          )}

          {musicProject.music_genre && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Genre:</span>
                <div className='font-medium'>{musicProject.music_genre}</div>
              </div>
            </div>
          )}

          {musicProject.music_record_label && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Label:</span>
                <div className='font-medium'>{musicProject.music_record_label}</div>
              </div>
            </div>
          )}

          {musicProject.music_release_date && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Release Date:</span>
                <div className='font-medium'>
                  {new Date(musicProject.music_release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className='space-y-3'>
          {musicProject.music_duration && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Duration:</span>
                <div className='font-medium'>{musicProject.music_duration}</div>
              </div>
            </div>
          )}

          {musicProject.music_studio && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Studio:</span>
                <div className='font-medium'>{musicProject.music_studio}</div>
              </div>
            </div>
          )}

          {musicProject.music_producer && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Producer:</span>
                <div className='font-medium'>{musicProject.music_producer}</div>
              </div>
            </div>
          )}

          {musicProject.music_artist_website && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Artist Website:</span>
                <div>
                  <a
                    href={musicProject.music_artist_website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='link link-primary'
                  >
                    Visit Artist Site
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Albums and Songs */}
      {(musicProject.music_album_names?.length || musicProject.music_songs_list?.length) && (
        <div className='divider'></div>
      )}

      {musicProject.music_album_names && musicProject.music_album_names.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Albums</h4>
          <div className='flex flex-wrap gap-2'>
            {musicProject.music_album_names.map((album, index) => (
              <span key={index} className='badge badge-primary badge-outline'>
                {album}
              </span>
            ))}
          </div>
        </div>
      )}

      {musicProject.music_songs_list && musicProject.music_songs_list.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Songs</h4>
          <div className='flex flex-wrap gap-2'>
            {musicProject.music_songs_list.map((song, index) => (
              <span key={index} className='badge badge-secondary badge-outline'>
                {song}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collaborators */}
      {musicProject.music_collaborators && musicProject.music_collaborators.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Collaborators</h4>
          <div className='flex flex-wrap gap-2'>
            {musicProject.music_collaborators.map((collaborator, index) => (
              <span key={index} className='badge badge-neutral badge-outline'>
                {collaborator}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderAudioPostMetadata = (audioProject: AudioPostProject) => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Basic Info */}
        <div className='space-y-3'>
          {audioProject.audio_project_name && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Project Name:</span>
                <div className='font-medium'>{audioProject.audio_project_name}</div>
              </div>
            </div>
          )}

          {audioProject.audio_director && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
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
              <div>
                <span className='text-sm text-base-content/60'>Director:</span>
                <div className='font-medium'>{audioProject.audio_director}</div>
              </div>
            </div>
          )}

          {audioProject.audio_genre && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Genre:</span>
                <div className='font-medium'>{audioProject.audio_genre}</div>
              </div>
            </div>
          )}

          {audioProject.audio_project_type && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Type:</span>
                <div className='font-medium'>{audioProject.audio_project_type}</div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className='space-y-3'>
          {audioProject.audio_release_date && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Release Date:</span>
                <div className='font-medium'>
                  {new Date(audioProject.audio_release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}

          {audioProject.audio_duration && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Duration:</span>
                <div className='font-medium'>{audioProject.audio_duration}</div>
              </div>
            </div>
          )}

          {audioProject.audio_language && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Language:</span>
                <div className='font-medium'>{audioProject.audio_language}</div>
              </div>
            </div>
          )}

          {audioProject.audio_awards && (
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-secondary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                />
              </svg>
              <div>
                <span className='text-sm text-base-content/60'>Awards:</span>
                <div className='font-medium'>{audioProject.audio_awards}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Lists */}
      {(audioProject.audio_writers?.length ||
        audioProject.audio_producers?.length ||
        audioProject.audio_actors?.length ||
        audioProject.audio_studios?.length) && <div className='divider'></div>}

      {audioProject.audio_writers && audioProject.audio_writers.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Writers</h4>
          <div className='flex flex-wrap gap-2'>
            {audioProject.audio_writers.map((writer, index) => (
              <span key={index} className='badge badge-primary badge-outline'>
                {writer}
              </span>
            ))}
          </div>
        </div>
      )}

      {audioProject.audio_producers && audioProject.audio_producers.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Producers</h4>
          <div className='flex flex-wrap gap-2'>
            {audioProject.audio_producers.map((producer, index) => (
              <span key={index} className='badge badge-secondary badge-outline'>
                {producer}
              </span>
            ))}
          </div>
        </div>
      )}

      {audioProject.audio_actors && audioProject.audio_actors.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Cast</h4>
          <div className='flex flex-wrap gap-2'>
            {audioProject.audio_actors.map((actor, index) => (
              <span key={index} className='badge badge-accent badge-outline'>
                {actor}
              </span>
            ))}
          </div>
        </div>
      )}

      {audioProject.audio_studios && audioProject.audio_studios.length > 0 && (
        <div>
          <h4 className='font-semibold mb-2'>Studios</h4>
          <div className='flex flex-wrap gap-2'>
            {audioProject.audio_studios.map((studio, index) => (
              <span key={index} className='badge badge-neutral badge-outline'>
                {studio}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Team */}
      {(audioProject.audio_engineer || audioProject.audio_sound_designer) && (
        <>
          <div className='divider'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {audioProject.audio_engineer && (
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-secondary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                  />
                </svg>
                <div>
                  <span className='text-sm text-base-content/60'>Audio Engineer:</span>
                  <div className='font-medium'>{audioProject.audio_engineer}</div>
                </div>
              </div>
            )}

            {audioProject.audio_sound_designer && (
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-secondary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
                  />
                </svg>
                <div>
                  <span className='text-sm text-base-content/60'>Sound Designer:</span>
                  <div className='font-medium'>{audioProject.audio_sound_designer}</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Distribution */}
      {audioProject.audio_distribution && (
        <>
          <div className='divider'></div>
          <div className='flex items-center gap-2'>
            <svg
              className='w-5 h-5 text-secondary'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9'
              />
            </svg>
            <div>
              <span className='text-sm text-base-content/60'>Distribution:</span>
              <div className='font-medium'>{audioProject.audio_distribution}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (!project.project_type) {
    return (
      <div className='card bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title'>Project Information</h2>
          <div className='divider'></div>
          <div className='text-center py-4 text-base-content/60'>
            No project type specified for this media project.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Main Metadata Card */}
      <div className='card bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='flex flex-wrap card-title'>
            Project Details
            <div
              className={`badge ${isMusicProject(project) ? 'badge-primary' : 'badge-secondary'} text-nowrap`}
            >
              {isMusicProject(project) ? 'Music' : 'Audio Post Production'}
            </div>
          </h2>
          <div className='divider'></div>

          {isMusicProject(project) && renderMusicMetadata(project)}
          {isAudioPostProject(project) && renderAudioPostMetadata(project)}
        </div>
      </div>

      {/* Streaming Links for Music Projects */}
      {isMusicProject(project) &&
        project.music_online_links &&
        project.music_online_links.length > 0 && (
          <StreamingLinks links={project.music_online_links} />
        )}
    </div>
  )
}

export default MediaProjectMetadata
