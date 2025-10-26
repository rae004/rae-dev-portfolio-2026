import React from 'react'
import { Link } from '@tanstack/react-router'
import type { MediaProject, MusicProject, AudioPostProject, SkillItem } from '../types/wordpress'
import { isMusicProject, isAudioPostProject } from '../types/wordpress'
import { getMediaProjectSkills, getSkillPreview, getRemainingSkillsCount } from '../utils/skillMatching'
import SkillPill from './SkillPill'

interface MediaProjectCardProps {
  project: MediaProject
  allSkills?: SkillItem[]
  layout?: 'summary' | 'detailed'
  showMetadata?: boolean
  showSkills?: boolean
  maxSkillsPreview?: number
}

const MediaProjectCard: React.FC<MediaProjectCardProps> = ({
  project,
  allSkills = [],
  layout = 'summary',
  showMetadata = true,
  showSkills = true,
  maxSkillsPreview = 3,
}) => {
  const isDetailed = layout === 'detailed'

  // Get skills for this media project
  const projectSkills = getMediaProjectSkills(project, allSkills)
  const skillsPreview = getSkillPreview(projectSkills, maxSkillsPreview)
  const remainingCount = getRemainingSkillsCount(projectSkills, maxSkillsPreview)

  // Helper function to get release date for display
  const getReleaseDate = (): string | null => {
    if (isMusicProject(project)) {
      return project.music_release_date || null
    }
    if (isAudioPostProject(project)) {
      return project.audio_release_date || null
    }
    return null
  }

  // Helper function to get project type badge
  const getProjectTypeBadge = () => {
    if (isMusicProject(project)) {
      return <div className='badge badge-primary badge-sm'>Music</div>
    }
    if (isAudioPostProject(project)) {
      return <div className='badge badge-secondary badge-sm'>Audio Post</div>
    }
    return <div className='badge badge-neutral badge-sm'>Project</div>
  }

  // Helper function to render music project metadata
  const renderMusicMetadata = (musicProject: MusicProject) => (
    <div className='flex flex-wrap gap-2 text-sm text-base-content/70'>
      {musicProject.music_artist_name && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
            />
          </svg>
          Artist: {musicProject.music_artist_name}
        </span>
      )}
      {musicProject.music_genre && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z'
            />
          </svg>
          {musicProject.music_genre}
        </span>
      )}
      {musicProject.music_record_label && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
            />
          </svg>
          {musicProject.music_record_label}
        </span>
      )}
    </div>
  )

  // Helper function to render audio post metadata
  const renderAudioPostMetadata = (audioProject: AudioPostProject) => (
    <div className='flex flex-wrap gap-2 text-sm text-base-content/70'>
      {audioProject.audio_director && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
            />
          </svg>
          Director: {audioProject.audio_director}
        </span>
      )}
      {audioProject.audio_genre && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z'
            />
          </svg>
          {audioProject.audio_genre}
        </span>
      )}
      {audioProject.audio_studios && audioProject.audio_studios.length > 0 && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
            />
          </svg>
          Studios: {audioProject.audio_studios.join(', ')}
        </span>
      )}
    </div>
  )

  const releaseDate = getReleaseDate()

  return (
    <div
      className={`border-l-4 border-primary pl-6 pb-6 ${!isDetailed ? 'hover:bg-base-200/50 transition-colors' : ''}`}
    >
      <div className='flex flex-col space-y-3'>
        {/* Title, Type Badge and Date */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'>
          <div className='flex flex-col gap-2'>
            <h3 className={`font-semibold ${isDetailed ? 'text-2xl' : 'text-xl'}`}>
              {isDetailed ? (
                project.title.rendered
              ) : (
                <Link
                  to='/media/$mediaId'
                  params={{ mediaId: project.id.toString() }}
                  className='hover:link hover:link-primary'
                >
                  {project.title.rendered}
                </Link>
              )}
            </h3>
            <div className='flex items-center gap-2'>
              {getProjectTypeBadge()}
              {releaseDate && (
                <div className='badge badge-outline badge-sm'>
                  {new Date(releaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </div>
              )}
            </div>
          </div>

          {releaseDate && (
            <div
              className={`text-base-content/70 ${isDetailed ? 'text-lg' : 'text-sm'} whitespace-nowrap`}
            >
              {new Date(releaseDate).getFullYear()}
            </div>
          )}
        </div>

        {/* Project-specific metadata */}
        {showMetadata && (
          <div className='space-y-2'>
            {isMusicProject(project) && renderMusicMetadata(project)}
            {isAudioPostProject(project) && renderAudioPostMetadata(project)}
          </div>
        )}

        {/* Content/Excerpt */}
        <div
          className={`prose max-w-none ${isDetailed ? 'prose-lg' : 'prose-sm'}`}
          dangerouslySetInnerHTML={{
            __html: isDetailed ? project.content.rendered : project.excerpt.rendered,
          }}
        />

        {/* Skills Preview */}
        {showSkills && skillsPreview.length > 0 && (
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm text-base-content/60 font-medium'>Skills:</span>
            {skillsPreview.map(skill => (
              <SkillPill
                key={skill.id}
                skillName={skill.skills_value || skill.title.rendered}
                category={skill.skills_type}
                size='sm'
                infoUrl={skill.skills_info_url}
              />
            ))}
            {remainingCount > 0 && (
              <span className='text-sm text-base-content/60'>+{remainingCount} more</span>
            )}
          </div>
        )}

        {/* Discover More Link for Summary Layout */}
        {!isDetailed && (
          <div className='flex justify-between items-center mt-4'>
            <Link
              to='/media/$mediaId'
              params={{ mediaId: project.id.toString() }}
              className='btn btn-sm btn-outline btn-primary'
            >
              Discover More...
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaProjectCard
