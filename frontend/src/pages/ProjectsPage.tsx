import React from 'react'
import { useSoftwareProjects } from '../hooks/useWordPress'
import SoftwareProjectCard from '../components/SoftwareProjectCard'

const ProjectsPage: React.FC = () => {
  const {
    data: softwareProjects,
    isLoading,
    error,
  } = useSoftwareProjects({
    per_page: 20,
    orderby: 'date',
    order: 'desc',
  })

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Software Projects</h1>

        {/* Loading State */}
        {isLoading && (
          <div className='flex justify-center items-center py-12'>
            <span className='loading loading-spinner loading-lg'></span>
            <span className='ml-3'>Loading projects...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='alert alert-error mb-8'>
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
            <span>
              Unable to load projects from WordPress CMS.{' '}
              {error.message || 'Please try again later.'}
            </span>
          </div>
        )}

        {/* Projects Grid - REQUIREMENT 4: Maintain card layout */}
        {!isLoading && !error && softwareProjects && (
          <>
            {softwareProjects.length === 0 ? (
              <div className='text-center py-12'>
                <div className='text-6xl mb-4'>🚀</div>
                <h2 className='text-2xl font-semibold mb-2'>No projects yet</h2>
                <p className='text-base-content/70'>
                  Software projects will appear here once they're added to the CMS.
                </p>
              </div>
            ) : (
              <div className='space-y-8'>
                <div className='text-sm text-base-content/70 mb-6'>
                  Showing {softwareProjects.length} project
                  {softwareProjects.length !== 1 ? 's' : ''}
                </div>

                {/* Project Cards in Grid Layout - maintain original 3-column design */}
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {softwareProjects.map(project => (
                    <div key={project.id} className='card bg-base-100 shadow-xl'>
                      <SoftwareProjectCard
                        project={project}
                        layout='summary'
                        showMetadata={true}
                        showSkills={true}
                        maxSkillsPreview={4}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectsPage
