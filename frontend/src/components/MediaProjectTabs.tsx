import React from 'react'
import type { MusicProject, AudioPostProject, MediaProject, SkillItem } from '../types/wordpress'
import MediaProjectCard from './MediaProjectCard'

interface MediaProjectTabsProps {
  musicProjects: MusicProject[]
  audioPostProjects: AudioPostProject[]
  uncategorizedProjects: MediaProject[]
  allSkills?: SkillItem[]
  activeTab: 'music' | 'audioPost' | 'all'
  onTabChange: (tab: 'music' | 'audioPost' | 'all') => void
  isLoading?: boolean
}

const MediaProjectTabs: React.FC<MediaProjectTabsProps> = ({
  musicProjects,
  audioPostProjects,
  uncategorizedProjects,
  allSkills = [],
  activeTab,
  onTabChange,
  isLoading = false,
}) => {
  const totalProjects =
    musicProjects.length + audioPostProjects.length + uncategorizedProjects.length

  const renderProjects = (projects: MediaProject[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className='flex justify-center items-center py-8'>
          <span className='loading loading-spinner loading-lg'></span>
          <span className='ml-3'>Loading projects...</span>
        </div>
      )
    }

    if (projects.length === 0) {
      return (
        <div className='text-center py-8'>
          <p className='text-base-content/70'>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className='space-y-8'>
        {projects.map(project => (
          <MediaProjectCard
            key={project.id}
            project={project}
            allSkills={allSkills}
            layout='summary'
            showSkills={true}
            maxSkillsPreview={4}
          />
        ))}
      </div>
    )
  }

  return (
    <div className='w-full'>
      {/* Tab Navigation */}
      <div className='tabs tabs-bordered mb-6'>
        <button
          className={`tab tab-lg ${activeTab === 'all' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          All Projects
          <span className='ml-2 badge badge-neutral badge-sm'>{totalProjects}</span>
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'music' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('music')}
        >
          Music Projects
          <span className='ml-2 badge badge-primary badge-sm'>{musicProjects.length}</span>
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'audioPost' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('audioPost')}
        >
          Audio Post Production
          <span className='ml-2 badge badge-secondary badge-sm'>{audioPostProjects.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className='min-h-[400px]'>
        {activeTab === 'all' && (
          <div className='space-y-8'>
            {/* Show all projects mixed together, already sorted by their respective release dates */}
            {renderProjects(
              [...musicProjects, ...audioPostProjects, ...uncategorizedProjects],
              'No projects found. Create some media projects in WordPress to get started.'
            )}
          </div>
        )}

        {activeTab === 'music' && (
          <div>
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-base-content/80'>
                Music Projects ({musicProjects.length})
              </h3>
              <p className='text-sm text-base-content/60'>
                Artist collaborations, album work, and studio projects
              </p>
            </div>
            {renderProjects(
              musicProjects,
              'No music projects found. Add some music projects in WordPress.'
            )}
          </div>
        )}

        {activeTab === 'audioPost' && (
          <div>
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-base-content/80'>
                Audio Post Production ({audioPostProjects.length})
              </h3>
              <p className='text-sm text-base-content/60'>
                Film, TV, podcast, and documentary audio work
              </p>
            </div>
            {renderProjects(
              audioPostProjects,
              'No audio post production projects found. Add some audio projects in WordPress.'
            )}
          </div>
        )}

        {/* Show uncategorized projects if any exist */}
        {uncategorizedProjects.length > 0 && (
          <div className='mt-8'>
            <div className='divider'>
              <span className='text-base-content/60'>Uncategorized Projects</span>
            </div>
            <div className='space-y-8'>
              {uncategorizedProjects.map(project => (
                <MediaProjectCard
                  key={project.id}
                  project={project}
                  allSkills={allSkills}
                  layout='summary'
                  showSkills={true}
                  maxSkillsPreview={4}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaProjectTabs
