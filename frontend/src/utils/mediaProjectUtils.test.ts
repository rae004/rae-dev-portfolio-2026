import { describe, it, expect } from 'vitest'
import {
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
} from './mediaProjectUtils'
import type { MediaProject, MusicProject, AudioPostProject } from '../types/wordpress'

const makeMedia = (overrides: Partial<MediaProject> = {}): MediaProject =>
  ({
    id: 1,
    date: '2025-01-01T00:00:00',
    title: { rendered: 'Project' },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    project_type: null,
    related_skills: [],
    ...overrides,
  }) as MediaProject

const makeMusic = (overrides: Partial<MusicProject> = {}): MusicProject =>
  makeMedia({
    project_type: 'Music',
    music_artist_name: 'Artist A',
    music_genre: 'Rock',
    music_record_label: 'Label A',
    music_release_date: '2025-06-01',
    ...overrides,
  }) as MusicProject

const makeAudioPost = (overrides: Partial<AudioPostProject> = {}): AudioPostProject =>
  makeMedia({
    project_type: 'Audio_Post_Production',
    audio_director: 'Director A',
    audio_studios: ['Studio A'],
    audio_genre: 'Drama',
    audio_release_date: '2025-04-01',
    ...overrides,
  }) as AudioPostProject

describe('separateProjectsByType', () => {
  it('splits projects into music / audio post / uncategorized', () => {
    const projects: MediaProject[] = [
      makeMusic({ id: 1 }),
      makeAudioPost({ id: 2 }),
      makeMedia({ id: 3, project_type: null }),
    ]
    const result = separateProjectsByType(projects)
    expect(result.musicProjects.map(p => p.id)).toEqual([1])
    expect(result.audioPostProjects.map(p => p.id)).toEqual([2])
    expect(result.uncategorizedProjects.map(p => p.id)).toEqual([3])
  })
})

describe('getMusicProjectFilters', () => {
  it('returns deduped, sorted lists of artists/genres/labels', () => {
    const projects = [
      makeMusic({
        id: 1,
        music_artist_name: 'B',
        music_genre: 'Jazz',
        music_record_label: 'Z',
      }),
      makeMusic({
        id: 2,
        music_artist_name: 'A',
        music_genre: 'Jazz',
        music_record_label: 'A',
      }),
    ]
    expect(getMusicProjectFilters(projects)).toEqual({
      artists: ['A', 'B'],
      genres: ['Jazz'],
      recordLabels: ['A', 'Z'],
    })
  })

  it('skips falsy fields', () => {
    const projects = [
      makeMusic({
        id: 1,
        music_artist_name: null,
        music_genre: null,
        music_record_label: null,
      }),
    ]
    expect(getMusicProjectFilters(projects)).toEqual({
      artists: [],
      genres: [],
      recordLabels: [],
    })
  })
})

describe('getAudioPostProjectFilters', () => {
  it('flattens audio_studios across projects', () => {
    const projects = [
      makeAudioPost({ id: 1, audio_studios: ['A', 'B'] }),
      makeAudioPost({ id: 2, audio_studios: ['B', 'C'] }),
    ]
    const result = getAudioPostProjectFilters(projects)
    expect(result.studios).toEqual(['A', 'B', 'C'])
  })
})

describe('filterMusicProjects', () => {
  const projects = [
    makeMusic({
      id: 1,
      music_artist_name: 'A',
      music_genre: 'Rock',
      music_record_label: 'Label1',
      title: { rendered: 'Album One' },
      content: { rendered: 'about cats', protected: false },
      music_album_names: ['First'],
    }),
    makeMusic({
      id: 2,
      music_artist_name: 'B',
      music_genre: 'Jazz',
      music_record_label: 'Label2',
      title: { rendered: 'Album Two' },
      content: { rendered: 'about dogs', protected: false },
      music_album_names: ['Second'],
    }),
  ]

  it('filters by artist exact match', () => {
    expect(filterMusicProjects(projects, { artist: 'A' }).map(p => p.id)).toEqual([1])
  })

  it('filters by genre and record label', () => {
    expect(filterMusicProjects(projects, { genre: 'Jazz' }).map(p => p.id)).toEqual([2])
    expect(filterMusicProjects(projects, { recordLabel: 'Label1' }).map(p => p.id)).toEqual([1])
  })

  it('search matches across title, content, artist, and album names', () => {
    expect(filterMusicProjects(projects, { search: 'cats' }).map(p => p.id)).toEqual([1])
    expect(filterMusicProjects(projects, { search: 'second' }).map(p => p.id)).toEqual([2])
    expect(filterMusicProjects(projects, { search: 'album' }).map(p => p.id)).toEqual([1, 2])
  })

  it('returns empty when no project matches', () => {
    expect(filterMusicProjects(projects, { search: 'reptiles' })).toEqual([])
  })
})

describe('filterAudioPostProjects', () => {
  const projects = [
    makeAudioPost({
      id: 1,
      audio_director: 'X',
      audio_genre: 'Drama',
      audio_studios: ['Alpha'],
      title: { rendered: 'Show One' },
      audio_project_name: 'Pilot',
    }),
    makeAudioPost({
      id: 2,
      audio_director: 'Y',
      audio_genre: 'Comedy',
      audio_studios: ['Beta', 'Gamma'],
      title: { rendered: 'Show Two' },
      audio_project_name: 'Finale',
    }),
  ]

  it('filters by director, genre, and studio (array contains)', () => {
    expect(filterAudioPostProjects(projects, { director: 'X' }).map(p => p.id)).toEqual([1])
    expect(filterAudioPostProjects(projects, { genre: 'Comedy' }).map(p => p.id)).toEqual([2])
    expect(filterAudioPostProjects(projects, { studio: 'Gamma' }).map(p => p.id)).toEqual([2])
  })

  it('search matches across title, director, and project name', () => {
    expect(filterAudioPostProjects(projects, { search: 'pilot' }).map(p => p.id)).toEqual([1])
    expect(filterAudioPostProjects(projects, { search: 'finale' }).map(p => p.id)).toEqual([2])
  })
})

describe('sortProjectsByDate', () => {
  const projects = [
    makeMedia({ id: 1, date: '2025-01-01T00:00:00' }),
    makeMedia({ id: 2, date: '2026-01-01T00:00:00' }),
    makeMedia({ id: 3, date: '2024-01-01T00:00:00' }),
  ]

  it('sorts descending by default', () => {
    expect(sortProjectsByDate(projects).map(p => p.id)).toEqual([2, 1, 3])
  })

  it('sorts ascending when requested', () => {
    expect(sortProjectsByDate(projects, 'asc').map(p => p.id)).toEqual([3, 1, 2])
  })

  it('does not mutate input', () => {
    const input = [...projects]
    sortProjectsByDate(input)
    expect(input.map(p => p.id)).toEqual([1, 2, 3])
  })
})

describe('sortMusicProjectsByReleaseDate', () => {
  it('sorts by music_release_date, treating missing as epoch 0', () => {
    const projects = [
      makeMusic({ id: 1, music_release_date: '2025-06-01' }),
      makeMusic({ id: 2, music_release_date: null }),
      makeMusic({ id: 3, music_release_date: '2026-06-01' }),
    ]
    expect(sortMusicProjectsByReleaseDate(projects).map(p => p.id)).toEqual([3, 1, 2])
  })
})

describe('sortAudioPostProjectsByReleaseDate', () => {
  it('sorts by audio_release_date', () => {
    const projects = [
      makeAudioPost({ id: 1, audio_release_date: '2024-12-01' }),
      makeAudioPost({ id: 2, audio_release_date: '2025-04-01' }),
    ]
    expect(sortAudioPostProjectsByReleaseDate(projects, 'asc').map(p => p.id)).toEqual([1, 2])
  })
})

describe('getProjectCounts', () => {
  it('returns totals split by type', () => {
    const projects = [
      makeMusic({ id: 1 }),
      makeMusic({ id: 2 }),
      makeAudioPost({ id: 3 }),
      makeMedia({ id: 4, project_type: null }),
    ]
    expect(getProjectCounts(projects)).toEqual({
      total: 4,
      music: 2,
      audioPost: 1,
      uncategorized: 1,
    })
  })
})

describe('validateProjectData', () => {
  it('flags missing project_type', () => {
    const warnings = validateProjectData(makeMedia({ project_type: null }))
    expect(warnings).toContain('Missing project type')
  })

  it('flags missing artist for music', () => {
    const project = makeMusic({ music_artist_name: null })
    expect(validateProjectData(project)).toContain('Missing artist name for music project')
  })

  it('flags missing director for audio post', () => {
    const project = makeAudioPost({ audio_director: null })
    expect(validateProjectData(project)).toContain(
      'Missing director for audio post production project'
    )
  })

  it('returns no warnings for a complete music project', () => {
    expect(validateProjectData(makeMusic())).toEqual([])
  })
})
