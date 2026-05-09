import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useSoftwareProject, useSoftwareProjects } from '../hooks/useWordPress'
import {
  getAllProjectSkills,
  groupSkillsByCategory,
  getProjectStateBadge,
  formatReleaseDate,
  isValidUrl,
} from '../utils/softwareProjectUtils'
import SoftwareProjectCard from '../components/SoftwareProjectCard'
import SkillsGroup from '../components/SkillsGroup'
import { decodeHtml } from '../utils/decodeHtml'

const SoftwareProjectDetailPage: React.FC = () => {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const id = Number(projectId)

  // Get the specific software project
  const {
    data: softwareProject,
    isLoading: projectLoading,
    error: projectError,
  } = useSoftwareProject(id)

  // Get all software projects for navigation
  const { data: allProjects, isLoading: allProjectsLoading } = useSoftwareProjects({
    per_page: 100,
    orderby: 'date',
    order: 'desc',
  })

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

  if (projectError || !softwareProject) {
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
          <span>{projectError?.message || 'Software project not found.'}</span>
        </div>
        <div className='mt-6'>
          <Link to='/projects' className='btn btn-outline'>
            ← Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  // Get all skills for this project (not filtered by tech categories)
  const projectSkills = getAllProjectSkills(softwareProject)
  const groupedSkills = groupSkillsByCategory(projectSkills)
  const projectState = getProjectStateBadge(softwareProject.project_state)
  const releaseDate = formatReleaseDate(softwareProject.project_release_date)

  // Navigation helpers
  const currentIndex = allProjects?.findIndex(p => p.id === softwareProject.id) ?? -1
  const previousProject = allProjects && currentIndex > 0 ? allProjects[currentIndex - 1] : null
  const nextProject =
    allProjects && currentIndex < allProjects.length - 1 && currentIndex !== -1
      ? allProjects[currentIndex + 1]
      : null

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Breadcrumb Navigation */}
        <nav className='text-sm breadcrumbs mb-6'>
          <ul>
            <li>
              <Link to='/projects' className='link link-hover'>
                Software Projects
              </Link>
            </li>
            <li>
              <span className='text-base-content/70'>{decodeHtml(softwareProject.title.rendered)}</span>
            </li>
          </ul>
        </nav>

        {/* Project Header */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4'>
            <div>
              <h1 className='text-3xl lg:text-4xl font-bold mb-3'>
                {decodeHtml(softwareProject.title.rendered)}
              </h1>
              <div className='flex flex-wrap items-center gap-3'>
                {projectState && (
                  <div className={`badge ${projectState.className}`}>{projectState.text}</div>
                )}
                {releaseDate && <div className='badge badge-outline'>Released: {releaseDate}</div>}
              </div>
            </div>

            {/* External Links */}
            <div className='flex gap-3 lg:flex-col lg:items-end'>
              {softwareProject.project_demo_link &&
                isValidUrl(softwareProject.project_demo_link) && (
                  <a
                    href={softwareProject.project_demo_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-primary'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
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
              {softwareProject.project_repo_link &&
                isValidUrl(softwareProject.project_repo_link) && (
                  <a
                    href={softwareProject.project_repo_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-outline'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                      />
                    </svg>
                    View Code
                  </a>
                )}
            </div>
          </div>
        </div>

        {/* Main Project Content */}
        <div className='grid lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-8'>
            {/* Project Details Card */}
            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <SoftwareProjectCard
                  project={softwareProject}
                  layout='detailed'
                  showMetadata={true}
                  showSkills={false} // We'll show skills separately below
                />
              </div>
            </div>

            {/* Related Skills Section */}
            {Object.keys(groupedSkills).length > 0 && (
              <div className='card bg-base-100 shadow-xl'>
                <div className='card-body'>
                  <h2 className='card-title text-2xl mb-4'>Technologies & Skills</h2>
                  <div className='space-y-6'>
                    <SkillsGroup groupedSkills={groupedSkills} layout='grid' pillSize='md' />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='sticky top-8 space-y-6'>
              {/* Project Navigation */}
              {!allProjectsLoading && (previousProject || nextProject) && (
                <div className='card bg-base-100 shadow-xl'>
                  <div className='card-body'>
                    <h3 className='card-title text-lg'>Navigate Projects</h3>
                    <div className='space-y-3'>
                      {previousProject && (
                        <Link
                          to='/projects/$projectId'
                          params={{ projectId: previousProject.id.toString() }}
                          className='block p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors'
                        >
                          <div className='text-sm text-base-content/70'>← Previous</div>
                          <div className='font-medium'>{decodeHtml(previousProject.title.rendered)}</div>
                        </Link>
                      )}
                      {nextProject && (
                        <Link
                          to='/projects/$projectId'
                          params={{ projectId: nextProject.id.toString() }}
                          className='block p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors'
                        >
                          <div className='text-sm text-base-content/70'>Next →</div>
                          <div className='font-medium'>{decodeHtml(nextProject.title.rendered)}</div>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Back to Projects */}
              <div className='card bg-base-100 shadow-xl'>
                <div className='card-body'>
                  <Link to='/projects' className='btn btn-outline w-full'>
                    ← Back to All Projects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SoftwareProjectDetailPage
