import React, { useState, useMemo, useCallback } from 'react'
import {
  useMediaProjectsWithSeparation,
  useMediaProjectFilters,
  useSkills,
} from '../hooks/useWordPress'
import {
  filterMusicProjects,
  filterAudioPostProjects,
  sortProjectsByDate,
  sortMusicProjectsByReleaseDate,
  sortAudioPostProjectsByReleaseDate,
  type MusicProjectFilters,
  type AudioPostProjectFilters,
} from '../utils/mediaProjectUtils'
import {
  getMediaProjectSkills,
  groupSkillsByCategory,
  sortSkillsInCategories,
} from '../utils/skillMatching'
import MediaFilterBar, { type MediaFilterState } from '../components/MediaFilterBar'
import MediaProjectTabs from '../components/MediaProjectTabs'
import SkillsGroup from '../components/SkillsGroup'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import type { MusicProject, AudioPostProject, SkillItem } from '../types/wordpress'

const EnhancedMediaPage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'audioPost'>('all')

  // State for filters
  const [filters, setFilters] = useState<MediaFilterState>({
    projectType: 'all',
    musicArtist: '',
    musicGenre: '',
    musicRecordLabel: '',
    audioDirector: '',
    audioStudio: '',
    audioGenre: '',
    search: '',
  })

  // Fetch media projects with separation
  const {
    data: projectsData,
    isLoading,
    error,
  } = useMediaProjectsWithSeparation({
    per_page: 100,
    orderby: 'date',
    order: 'desc',
  })

  // Get available filter options
  const availableFilters = useMediaProjectFilters({
    per_page: 100,
    orderby: 'date',
    order: 'desc',
  })

  // Fetch all skills for processing
  const { data: allSkills } = useSkills({ per_page: 100 })

  // Apply filters to projects
  const filteredProjects = useMemo(() => {
    if (!projectsData) {
      return {
        musicProjects: [] as MusicProject[],
        audioPostProjects: [] as AudioPostProject[],
        uncategorizedProjects: [],
      }
    }

    let filteredMusic = projectsData.musicProjects
    let filteredAudioPost = projectsData.audioPostProjects

    // Apply music project filters
    if (filters.search || filters.musicArtist || filters.musicGenre || filters.musicRecordLabel) {
      const musicFilters: MusicProjectFilters = {
        search: filters.search || undefined,
        artist: filters.musicArtist || undefined,
        genre: filters.musicGenre || undefined,
        recordLabel: filters.musicRecordLabel || undefined,
      }
      filteredMusic = filterMusicProjects(projectsData.musicProjects, musicFilters)
    }

    // Apply audio post project filters
    if (filters.search || filters.audioDirector || filters.audioStudio || filters.audioGenre) {
      const audioFilters: AudioPostProjectFilters = {
        search: filters.search || undefined,
        director: filters.audioDirector || undefined,
        studio: filters.audioStudio || undefined,
        genre: filters.audioGenre || undefined,
      }
      filteredAudioPost = filterAudioPostProjects(projectsData.audioPostProjects, audioFilters)
    }

    return {
      musicProjects: sortMusicProjectsByReleaseDate(filteredMusic, 'desc'),
      audioPostProjects: sortAudioPostProjectsByReleaseDate(filteredAudioPost, 'desc'),
      uncategorizedProjects: sortProjectsByDate(projectsData.uncategorizedProjects, 'desc'),
    }
  }, [projectsData, filters])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: MediaFilterState) => {
    setFilters(newFilters)

    // Update active tab based on project type filter
    if (newFilters.projectType === 'Music') {
      setActiveTab('music')
    } else if (newFilters.projectType === 'Audio_Post_Production') {
      setActiveTab('audioPost')
    } else if (newFilters.projectType === 'all') {
      setActiveTab('all')
    }
  }, [])

  // Handle tab changes
  const handleTabChange = useCallback(
    (tab: 'all' | 'music' | 'audioPost') => {
      setActiveTab(tab)

      // Update project type filter to match tab
      if (tab === 'music') {
        handleFiltersChange({ ...filters, projectType: 'Music' })
      } else if (tab === 'audioPost') {
        handleFiltersChange({ ...filters, projectType: 'Audio_Post_Production' })
      } else {
        handleFiltersChange({ ...filters, projectType: 'all' })
      }
    },
    [filters, handleFiltersChange]
  )

  // Calculate project counts for display
  const projectCounts = projectsData?.counts || {
    total: 0,
    music: 0,
    audioPost: 0,
    uncategorized: 0,
  }

  // Process dynamic skills from all media projects
  const mediaProjectSkills = useMemo(() => {
    if (!projectsData || !allSkills) {
      return {}
    }

    const allProjects = [
      ...projectsData.musicProjects,
      ...projectsData.audioPostProjects,
      ...projectsData.uncategorizedProjects,
    ]

    // Collect all unique skills from media projects
    const uniqueSkills = new Map<number, SkillItem>()

    allProjects.forEach(project => {
      const projectSkills = getMediaProjectSkills(project, allSkills)
      projectSkills.forEach(skill => {
        uniqueSkills.set(skill.id, skill)
      })
    })

    // Convert to array and group by category
    const skillsArray = Array.from(uniqueSkills.values())
    const groupedSkills = groupSkillsByCategory(skillsArray)
    return sortSkillsInCategories(groupedSkills)
  }, [projectsData, allSkills])

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Page Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-4'>Media Projects</h1>
          <p className='text-lg text-base-content/70 max-w-3xl'>
            From recording and mixing albums to managing world-class studios, my journey in the
            music industry provided foundational skills in project management, attention to detail,
            and creative problem-solving.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner size='lg' message='Loading media projects...' />}

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
            <span>Error loading media projects: {error.message}</span>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Filter Bar */}
            <MediaFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              availableFilters={availableFilters}
              projectCounts={projectCounts}
            />

            {/* Project Tabs */}
            <MediaProjectTabs
              musicProjects={filteredProjects.musicProjects}
              audioPostProjects={filteredProjects.audioPostProjects}
              uncategorizedProjects={filteredProjects.uncategorizedProjects}
              allSkills={allSkills}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isLoading={isLoading}
            />

            {/* Dynamic Skills Section */}
            {Object.keys(mediaProjectSkills).length > 0 && (
              <div className='card bg-base-100 shadow-xl mt-12'>
                <div className='card-body'>
                  <h2 className='card-title text-2xl'>Skills Developed</h2>
                  <p className='text-base-content/70 mb-4'>
                    Skills utilized across all media projects, grouped by category.
                  </p>
                  <div className='divider'></div>
                  <SkillsGroup groupedSkills={mediaProjectSkills} className={'flex-wrap'} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Fallback Content for Empty State */}
        {!isLoading && !error && projectCounts.total === 0 && (
          <div className='card bg-base-100 shadow-xl'>
            <div className='card-body text-center py-12'>
              <div className='text-6xl mb-4'>🎵</div>
              <h2 className='text-2xl font-bold mb-4'>No Media Projects Found</h2>
              <p className='text-base-content/70 mb-6'>
                It looks like there are no media projects in the system yet. Add some projects in
                WordPress to get started!
              </p>
              <div className='flex justify-center gap-4'>
                <button className='btn btn-primary' disabled>
                  Add Your First Project
                </button>
                <button className='btn btn-outline' disabled>
                  Learn More
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedMediaPage
