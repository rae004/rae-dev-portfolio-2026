import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useMediaProject, useMediaProjectsWithSeparation, useSkills } from '../hooks/useWordPress'
import { isMusicProject, isAudioPostProject } from '../types/wordpress'
import {
  getMediaProjectSkills,
  groupSkillsByCategory,
  sortSkillsInCategories,
} from '../utils/skillMatching'
import MediaProjectMetadata from '../components/MediaProjectMetadata'
import MediaProjectGallery from '../components/MediaProjectGallery'
import ProjectPagination from '../components/ProjectPagination'
import SkillsGroup from '../components/SkillsGroup'
import { decodeHtml } from '../utils/decodeHtml'

const MediaDetailPage: React.FC = () => {
  const { mediaId } = useParams({ from: '/media/$mediaId' })
  const id = Number(mediaId)

  // Get the specific media project
  const { data: mediaProject, isLoading: projectLoading, error: projectError } = useMediaProject(id)

  // Get all media projects for navigation
  const { data: allProjectsData, isLoading: allProjectsLoading } = useMediaProjectsWithSeparation({
    per_page: 100,
  })

  // Get all skills for skills processing
  const { data: allSkills } = useSkills({ per_page: 100 })

  if (projectLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-center items-center min-h-64'>
          <span className='loading loading-spinner loading-lg'></span>
          <span className='ml-3'>Loading project details...</span>
        </div>
      </div>
    )
  }

  if (projectError || !mediaProject) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='alert alert-error'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='stroke-current shrink-0 h-6 w-6'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>Media project not found or could not be loaded.</span>
        </div>
        <Link to='/media' className='btn btn-primary mt-4'>
          Back to Media Projects
        </Link>
      </div>
    )
  }

  // Sort all projects by date for navigation
  const allProjects = allProjectsData?.all || []
  const sortedProjects = allProjects.slice().sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    return bDate.getTime() - aDate.getTime() // Newest first
  })

  // Find previous and next projects
  const currentIndex = sortedProjects.findIndex(item => item.id === mediaProject.id)
  const previousProject = currentIndex > 0 ? sortedProjects[currentIndex - 1] : null
  const nextProject =
    currentIndex < sortedProjects.length - 1 ? sortedProjects[currentIndex + 1] : null

  // Get project type for breadcrumb
  const getProjectTypeLabel = () => {
    if (isMusicProject(mediaProject)) return 'Music Project'
    if (isAudioPostProject(mediaProject)) return 'Audio Post Production'
    return 'Media Project'
  }

  // Process skills for this media project
  const mediaSkills = getMediaProjectSkills(mediaProject, allSkills || [])
  const groupedSkills = sortSkillsInCategories(groupSkillsByCategory(mediaSkills))

  // Create sample gallery images (in real implementation, these would come from WordPress)
  const sampleGalleryImages = [
    {
      id: 1,
      url: 'https://picsum.photos/800/600?random=1',
      alt: 'Project Image 1',
      caption: 'Studio recording session',
    },
    {
      id: 2,
      url: 'https://picsum.photos/800/600?random=2',
      alt: 'Project Image 2',
      caption: 'Equipment setup',
    },
    {
      id: 3,
      url: 'https://picsum.photos/800/600?random=3',
      alt: 'Project Image 3',
      caption: 'Team collaboration',
    },
    {
      id: 4,
      url: 'https://picsum.photos/800/600?random=4',
      alt: 'Project Image 4',
      caption: 'Final mixdown',
    },
    {
      id: 5,
      url: 'https://picsum.photos/800/600?random=5',
      alt: 'Project Image 5',
      caption: 'Post-production work',
    },
    {
      id: 6,
      url: 'https://picsum.photos/800/600?random=6',
      alt: 'Project Image 6',
      caption: 'Client presentation',
    },
    {
      id: 7,
      url: 'https://picsum.photos/800/600?random=7',
      alt: 'Project Image 7',
      caption: 'Behind the scenes',
    },
  ]

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Breadcrumb Navigation */}
      <div className='breadcrumbs text-sm mb-6'>
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/media'>Media Projects</Link>
          </li>
          <li className='font-semibold'>{getProjectTypeLabel()}</li>
          <li className='font-semibold'>{decodeHtml(mediaProject.title.rendered)}</li>
        </ul>
      </div>

      {/* Project Header */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4'>
          <div>
            <h1 className='text-4xl font-bold mb-2'>{decodeHtml(mediaProject.title.rendered)}</h1>
            <div className='flex items-center gap-2'>
              <div
                className={`badge ${isMusicProject(mediaProject) ? 'badge-primary' : 'badge-secondary'}`}
              >
                {isMusicProject(mediaProject) ? 'Music Project' : 'Audio Post Production'}
              </div>
              {mediaProject.date && (
                <div className='badge badge-outline'>
                  {new Date(mediaProject.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content Area */}
        <div className='lg:col-span-2 space-y-8'>
          {/* Project Content */}
          <div className='card bg-base-100 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title text-2xl'>Project Description</h2>
              <div className='divider'></div>
              <div
                className='prose prose-lg max-w-none'
                dangerouslySetInnerHTML={{ __html: mediaProject.content.rendered }}
              />
            </div>
          </div>

          {/* Project Gallery */}
          <MediaProjectGallery
            images={sampleGalleryImages}
            title='Project Gallery'
            imagesPerPage={6}
          />

          {/* Related Skills */}
          {Object.keys(groupedSkills).length > 0 && (
            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h2 className='card-title text-2xl'>Related Skills</h2>
                <div className='divider'></div>
                <SkillsGroup groupedSkills={groupedSkills} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Project Metadata */}
          <MediaProjectMetadata project={mediaProject} layout='detailed' />

          {/* Quick Actions */}
          <div className='card bg-base-100 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title'>Quick Actions</h2>
              <div className='divider'></div>
              <div className='space-y-3'>
                <Link to='/media' className='btn btn-primary btn-block'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  Back to All Projects
                </Link>

                {/* Project type specific actions */}
                {isMusicProject(mediaProject) && (
                  <Link
                    to='/media'
                    search={{ projectType: 'Music' }}
                    className='btn btn-outline btn-primary btn-block'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
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
                    More Music Projects
                  </Link>
                )}

                {isAudioPostProject(mediaProject) && (
                  <Link
                    to='/media'
                    search={{ projectType: 'Audio_Post_Production' }}
                    className='btn btn-outline btn-secondary btn-block'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
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
                    More Audio Post Projects
                  </Link>
                )}

                <button className='btn btn-outline btn-neutral btn-block' disabled>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                    />
                  </svg>
                  Share Project
                </button>
              </div>
            </div>
          </div>

          {/* Related Projects */}
          {!allProjectsLoading && allProjectsData && (
            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h2 className='card-title'>Related Projects</h2>
                <div className='divider'></div>
                <div className='space-y-4'>
                  {/* Show other projects of the same type */}
                  {(() => {
                    const relatedProjects = allProjects
                      .filter(
                        p =>
                          p.id !== mediaProject.id && p.project_type === mediaProject.project_type
                      )
                      .slice(0, 3)

                    if (relatedProjects.length === 0) {
                      return (
                        <p className='text-base-content/60 text-sm'>
                          No other projects of this type found.
                        </p>
                      )
                    }

                    return relatedProjects.map(project => (
                      <div key={project.id} className='border-l-2 border-primary/30 pl-3'>
                        <Link
                          to='/media/$mediaId'
                          params={{ mediaId: project.id.toString() }}
                          className='block hover:bg-base-200/50 rounded p-2 transition-colors'
                        >
                          <h4 className='font-medium text-sm link link-hover'>
                            {decodeHtml(project.title.rendered)}
                          </h4>
                          <p className='text-xs text-base-content/60 mt-1'>
                            {new Date(project.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </Link>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Navigation */}
      <div className='mt-12'>
        <ProjectPagination
          previousItem={previousProject}
          nextItem={nextProject}
          backToPath='/media'
          backToLabel='Back to Media Projects'
          itemTypePath='media'
          paginationWrapperClasses={['flex justify-center items-center gap-24']}
        />
      </div>
    </div>
  )
}

export default MediaDetailPage
