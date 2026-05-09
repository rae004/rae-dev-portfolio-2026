import React from 'react'
import { Link } from '@tanstack/react-router'
import type { SoftwareProject } from '../types/wordpress'
import {
  getProjectStateBadge,
  formatReleaseDate,
  getFilteredTechSkills,
  isValidUrl,
  getDomainFromUrl,
} from '../utils/softwareProjectUtils'
import SkillPill from './SkillPill'
import { decodeHtml } from '../utils/decodeHtml'

interface SoftwareProjectCardProps {
  project: SoftwareProject
  layout?: 'summary' | 'detailed'
  showMetadata?: boolean
  showSkills?: boolean
  maxSkillsPreview?: number
}

const SoftwareProjectCard: React.FC<SoftwareProjectCardProps> = ({
  project,
  layout = 'summary',
  showMetadata = true,
  showSkills = true,
  maxSkillsPreview = 6,
}) => {
  const isDetailed = layout === 'detailed'

  // Get filtered tech skills based on selected categories
  const techSkills = getFilteredTechSkills(project, maxSkillsPreview)
  const projectState = getProjectStateBadge(project.project_state)
  const releaseDate = formatReleaseDate(project.project_release_date)

  // Helper function to render project metadata
  const renderProjectMetadata = () => (
    <div className='flex flex-wrap gap-2 text-sm text-base-content/70'>
      {project.project_demo_link && isValidUrl(project.project_demo_link) && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
            />
          </svg>
          Demo: {getDomainFromUrl(project.project_demo_link)}
        </span>
      )}
      {project.project_repo_link && isValidUrl(project.project_repo_link) && (
        <span className='flex items-center gap-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
            />
          </svg>
          Code: {getDomainFromUrl(project.project_repo_link)}
        </span>
      )}
    </div>
  )

  return (
    <div className={!isDetailed ? 'card-body' : `border-l-4 border-primary pl-6 pb-6`}>
      <div className='flex flex-col space-y-3'>
        {/* Title, State Badge and Date */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'>
          <div className='flex flex-col gap-2'>
            <h2 className={`${isDetailed ? 'text-2xl font-semibold' : 'card-title'}`}>
              {!isDetailed && (
                <Link
                  to='/projects/$projectId'
                  params={{ projectId: project.id.toString() }}
                  className='hover:link hover:link-primary'
                >
                  {decodeHtml(project.title.rendered)}
                </Link>
              )}
            </h2>
            <div className='flex items-center gap-2'>
              {releaseDate && !isDetailed && (
                <div className='badge badge-outline badge-sm'>{releaseDate}</div>
              )}
            </div>
          </div>
        </div>

        {/* Project metadata */}
        {showMetadata && <div className='space-y-2'>{renderProjectMetadata()}</div>}

        {/* Content/Excerpt - REQUIREMENT 4: Use Post Excerpt as card body */}
        <div
          className={`text-sm text-base-content/70 ${!isDetailed ? 'mb-4' : ''} ${isDetailed ? 'prose prose-lg max-w-none' : ''}`}
          dangerouslySetInnerHTML={{
            __html: isDetailed ? project.content.rendered : project.excerpt.rendered,
          }}
        />

        {/* Technologies Section - REQUIREMENT 5: Skills sorted by weight with category filtering */}
        {showSkills && techSkills.length > 0 && !isDetailed && (
          <div className='mb-4'>
            <h3 className='font-semibold mb-2'>Technologies:</h3>
            <div className='flex flex-wrap gap-1'>
              {techSkills.map(skill => (
                <span key={skill.id} className='badge badge-outline badge-sm'>
                  {skill.skills_value || skill.title.rendered}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Technologies Section for Detailed View */}
        {showSkills && techSkills.length > 0 && isDetailed && (
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm text-base-content/60 font-medium'>Technologies:</span>
            {techSkills.map(skill => (
              <SkillPill
                key={skill.id}
                skillName={skill.skills_value || skill.title.rendered}
                category={skill.skills_type}
                size='sm'
                infoUrl={skill.skills_info_url}
              />
            ))}
          </div>
        )}

        {/* External Links for Detailed View */}
        {isDetailed && (
          <div className='flex gap-3 mt-4'>
            {project.project_demo_link && isValidUrl(project.project_demo_link) && (
              <a
                href={project.project_demo_link}
                target='_blank'
                rel='noopener noreferrer'
                className='btn btn-sm btn-primary'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                  />
                </svg>
                Live Demo
              </a>
            )}
          </div>
        )}

        {/* Card Actions for Summary Layout - REQUIREMENT 6 */}
        {!isDetailed && (
          <div className='card-actions justify-between items-center'>
            {projectState && (
              <span className={`badge ${projectState.className}`}>{projectState.text}</span>
            )}
            <Link
              to='/projects/$projectId'
              params={{ projectId: project.id.toString() }}
              className='btn btn-primary btn-sm'
            >
              View Details
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default SoftwareProjectCard
