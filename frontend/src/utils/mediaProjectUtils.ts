import type { MediaProject, MusicProject, AudioPostProject } from '../types/wordpress'
import { isMusicProject, isAudioPostProject } from '../types/wordpress'

// Project type separation utilities
export function separateProjectsByType(projects: MediaProject[]) {
  const musicProjects: MusicProject[] = []
  const audioPostProjects: AudioPostProject[] = []
  const uncategorizedProjects: MediaProject[] = []

  projects.forEach(project => {
    if (isMusicProject(project)) {
      musicProjects.push(project)
    } else if (isAudioPostProject(project)) {
      audioPostProjects.push(project)
    } else {
      uncategorizedProjects.push(project)
    }
  })

  return {
    musicProjects,
    audioPostProjects,
    uncategorizedProjects,
  }
}

// Get unique filter values for dynamic filter generation
export function getMusicProjectFilters(projects: MusicProject[]) {
  const artists = new Set<string>()
  const genres = new Set<string>()
  const recordLabels = new Set<string>()

  projects.forEach(project => {
    if (project.music_artist_name) {
      artists.add(project.music_artist_name)
    }
    if (project.music_genre) {
      genres.add(project.music_genre)
    }
    if (project.music_record_label) {
      recordLabels.add(project.music_record_label)
    }
  })

  return {
    artists: Array.from(artists).sort(),
    genres: Array.from(genres).sort(),
    recordLabels: Array.from(recordLabels).sort(),
  }
}

export function getAudioPostProjectFilters(projects: AudioPostProject[]) {
  const directors = new Set<string>()
  const studios = new Set<string>()
  const genres = new Set<string>()

  projects.forEach(project => {
    if (project.audio_director) {
      directors.add(project.audio_director)
    }
    if (project.audio_studios) {
      project.audio_studios.forEach(studio => studios.add(studio))
    }
    if (project.audio_genre) {
      genres.add(project.audio_genre)
    }
  })

  return {
    directors: Array.from(directors).sort(),
    studios: Array.from(studios).sort(),
    genres: Array.from(genres).sort(),
  }
}

// Project filtering functions
export interface MusicProjectFilters {
  artist?: string
  genre?: string
  recordLabel?: string
  search?: string
}

export interface AudioPostProjectFilters {
  director?: string
  studio?: string
  genre?: string
  search?: string
}

export function filterMusicProjects(
  projects: MusicProject[],
  filters: MusicProjectFilters
): MusicProject[] {
  return projects.filter(project => {
    // Artist filter
    if (filters.artist && project.music_artist_name !== filters.artist) {
      return false
    }

    // Genre filter
    if (filters.genre && project.music_genre !== filters.genre) {
      return false
    }

    // Record label filter
    if (filters.recordLabel && project.music_record_label !== filters.recordLabel) {
      return false
    }

    // Search filter (searches title, content, artist, album names)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const title = project.title.rendered.toLowerCase()
      const content = project.content.rendered.toLowerCase()
      const artist = project.music_artist_name?.toLowerCase() || ''
      const albums = project.music_album_names?.join(' ').toLowerCase() || ''

      if (
        !title.includes(searchTerm) &&
        !content.includes(searchTerm) &&
        !artist.includes(searchTerm) &&
        !albums.includes(searchTerm)
      ) {
        return false
      }
    }

    return true
  })
}

export function filterAudioPostProjects(
  projects: AudioPostProject[],
  filters: AudioPostProjectFilters
): AudioPostProject[] {
  return projects.filter(project => {
    // Director filter
    if (filters.director && project.audio_director !== filters.director) {
      return false
    }

    // Studio filter
    if (filters.studio && !project.audio_studios?.includes(filters.studio)) {
      return false
    }

    // Genre filter
    if (filters.genre && project.audio_genre !== filters.genre) {
      return false
    }

    // Search filter (searches title, content, director, project name)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const title = project.title.rendered.toLowerCase()
      const content = project.content.rendered.toLowerCase()
      const director = project.audio_director?.toLowerCase() || ''
      const projectName = project.audio_project_name?.toLowerCase() || ''

      if (
        !title.includes(searchTerm) &&
        !content.includes(searchTerm) &&
        !director.includes(searchTerm) &&
        !projectName.includes(searchTerm)
      ) {
        return false
      }
    }

    return true
  })
}

// Project sorting utilities
export function sortProjectsByDate(projects: MediaProject[], order: 'asc' | 'desc' = 'desc') {
  return [...projects].sort((a, b) => {
    const aDate = new Date(a.date).getTime()
    const bDate = new Date(b.date).getTime()
    return order === 'desc' ? bDate - aDate : aDate - bDate
  })
}

export function sortMusicProjectsByReleaseDate(
  projects: MusicProject[],
  order: 'asc' | 'desc' = 'desc'
) {
  return [...projects].sort((a, b) => {
    const aDate = a.music_release_date ? new Date(a.music_release_date).getTime() : 0
    const bDate = b.music_release_date ? new Date(b.music_release_date).getTime() : 0
    return order === 'desc' ? bDate - aDate : aDate - bDate
  })
}

export function sortAudioPostProjectsByReleaseDate(
  projects: AudioPostProject[],
  order: 'asc' | 'desc' = 'desc'
) {
  return [...projects].sort((a, b) => {
    const aDate = a.audio_release_date ? new Date(a.audio_release_date).getTime() : 0
    const bDate = b.audio_release_date ? new Date(b.audio_release_date).getTime() : 0
    return order === 'desc' ? bDate - aDate : aDate - bDate
  })
}

// Project counting utilities
export function getProjectCounts(projects: MediaProject[]) {
  const { musicProjects, audioPostProjects, uncategorizedProjects } =
    separateProjectsByType(projects)

  return {
    total: projects.length,
    music: musicProjects.length,
    audioPost: audioPostProjects.length,
    uncategorized: uncategorizedProjects.length,
  }
}

// Validation utilities
export function validateProjectData(project: MediaProject): string[] {
  const warnings: string[] = []

  if (!project.project_type) {
    warnings.push('Missing project type')
  }

  if (isMusicProject(project)) {
    if (!project.music_artist_name) {
      warnings.push('Missing artist name for music project')
    }
  }

  if (isAudioPostProject(project)) {
    if (!project.audio_director) {
      warnings.push('Missing director for audio post production project')
    }
  }

  return warnings
}

// Export all utility functions
export const mediaProjectUtils = {
  separateProjectsByType,
  getMusicProjectFilters,
  getAudioPostProjectFilters,
  filterMusicProjects,
  filterAudioPostProjects,
  sortProjectsByDate,
  sortMusicProjectsByReleaseDate,
  sortAudioPostProjectsByReleaseDate,
  getProjectCounts,
  validateProjectData,
}
