import React, { useState } from 'react'
import type { UseMediaProjectFiltersResult } from '../hooks/useWordPress'

export interface MediaFilterState {
  projectType: 'all' | 'Music' | 'Audio_Post_Production'
  // Music filters
  musicArtist: string
  musicGenre: string
  musicRecordLabel: string
  // Audio post filters
  audioDirector: string
  audioStudio: string
  audioGenre: string
  // Common filters
  search: string
}

interface MediaFilterBarProps {
  filters: MediaFilterState
  onFiltersChange: (filters: MediaFilterState) => void
  availableFilters: UseMediaProjectFiltersResult
  projectCounts?: {
    total: number
    music: number
    audioPost: number
    uncategorized: number
  }
}

const MediaFilterBar: React.FC<MediaFilterBarProps> = ({
  filters,
  onFiltersChange,
  availableFilters,
}) => {
  // State for collapsible filter section
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof MediaFilterState, value: string) => {
    // When changing project type, clear type-specific filters
    if (key === 'projectType') {
      const newProjectType = value as 'all' | 'Music' | 'Audio_Post_Production'
      onFiltersChange({
        ...filters,
        projectType: newProjectType,
        // Clear music filters
        musicArtist: '',
        musicGenre: '',
        musicRecordLabel: '',
        // Clear audio post filters
        audioDirector: '',
        audioStudio: '',
        audioGenre: '',
      })
    } else {
      onFiltersChange({
        ...filters,
        [key]: value,
      })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({
      projectType: 'all',
      musicArtist: '',
      musicGenre: '',
      musicRecordLabel: '',
      audioDirector: '',
      audioStudio: '',
      audioGenre: '',
      search: '',
    })
  }

  const hasActiveFilters =
    filters.projectType !== 'all' ||
    filters.search ||
    filters.musicArtist ||
    filters.musicGenre ||
    filters.musicRecordLabel ||
    filters.audioDirector ||
    filters.audioStudio ||
    filters.audioGenre

  return (
    <div className='card bg-base-100 shadow-xl mb-6'>
      <div className='card-body'>
        {/* Header with Toggle Button */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
          <div className='flex items-center gap-3'>
            <h2 className='card-title'>Filter Projects</h2>
            {hasActiveFilters && (
              <div className='badge badge-primary badge-sm'>
                {Object.values(filters).filter(val => val && val !== 'all').length} active
              </div>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className='btn btn-sm btn-ghost'>
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='btn btn-sm btn-outline btn-primary'
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Hide filters' : 'Show filters'}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
              {isExpanded ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='space-y-4'>
            {/* Search */}
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>Search Projects</span>
              </label>
              <input
                type='text'
                placeholder='Search by title, content, artist, director...'
                className='input input-bordered'
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
              />
            </div>

            {/* Dynamic Filters Based on Project Type */}
            {(filters.projectType === 'all' || filters.projectType === 'Music') && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Artist</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.musicArtist}
                    onChange={e => updateFilter('musicArtist', e.target.value)}
                  >
                    <option value=''>All Artists</option>
                    {availableFilters.musicFilters.artists.map(artist => (
                      <option key={artist} value={artist}>
                        {artist}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Music Genre</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.musicGenre}
                    onChange={e => updateFilter('musicGenre', e.target.value)}
                  >
                    <option value=''>All Genres</option>
                    {availableFilters.musicFilters.genres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Record Label</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.musicRecordLabel}
                    onChange={e => updateFilter('musicRecordLabel', e.target.value)}
                  >
                    <option value=''>All Labels</option>
                    {availableFilters.musicFilters.recordLabels.map(label => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(filters.projectType === 'all' || filters.projectType === 'Audio_Post_Production') && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Director</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.audioDirector}
                    onChange={e => updateFilter('audioDirector', e.target.value)}
                  >
                    <option value=''>All Directors</option>
                    {availableFilters.audioPostFilters.directors.map(director => (
                      <option key={director} value={director}>
                        {director}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Studio</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.audioStudio}
                    onChange={e => updateFilter('audioStudio', e.target.value)}
                  >
                    <option value=''>All Studios</option>
                    {availableFilters.audioPostFilters.studios.map(studio => (
                      <option key={studio} value={studio}>
                        {studio}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Audio Genre</span>
                  </label>
                  <select
                    className='select select-bordered'
                    value={filters.audioGenre}
                    onChange={e => updateFilter('audioGenre', e.target.value)}
                  >
                    <option value=''>All Genres</option>
                    {availableFilters.audioPostFilters.genres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaFilterBar
