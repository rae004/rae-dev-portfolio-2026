import { describe, it, expect } from 'vitest'
import {
  getProjectStateBadge,
  formatReleaseDate,
  formatReleaseYear,
  isValidUrl,
  getDomainFromUrl,
  getFilteredTechSkills,
  getAllProjectSkills,
  groupSkillsByCategory,
  sortSoftwareProjectsByReleaseDate,
} from './softwareProjectUtils'
import type { SoftwareProject, SkillItem } from '../types/wordpress'

const makeSkill = (overrides: Partial<SkillItem> = {}): SkillItem =>
  ({
    id: 1,
    skills_type: 'Languages & Frameworks',
    skills_value: 'TypeScript',
    skills_weight: 0,
    title: { rendered: 'TypeScript' },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    ...overrides,
  }) as SkillItem

const makeProject = (overrides: Partial<SoftwareProject> = {}): SoftwareProject =>
  ({
    id: 1,
    title: { rendered: 'Project' },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    related_skills: [],
    tech_categories: [],
    ...overrides,
  }) as SoftwareProject

describe('getProjectStateBadge', () => {
  it('returns null for null/undefined input', () => {
    expect(getProjectStateBadge()).toBeNull()
    expect(getProjectStateBadge(null)).toBeNull()
  })

  it('maps known states to specific badge classes', () => {
    expect(getProjectStateBadge('Completed')?.className).toBe('badge-success')
    expect(getProjectStateBadge('Ongoing')?.className).toBe('badge-warning')
    expect(getProjectStateBadge('Future')?.className).toBe('badge-info')
  })

  it('falls back to badge-neutral for unknown states', () => {
    expect(getProjectStateBadge('Mystery')?.className).toBe('badge-neutral')
  })

  it('preserves the original state as text', () => {
    expect(getProjectStateBadge('Completed')?.text).toBe('Completed')
  })
})

describe('formatReleaseDate', () => {
  it('formats a valid ISO date as "Mon YYYY"', () => {
    expect(formatReleaseDate('2025-03-15')).toBe('Mar 2025')
  })

  it('returns null for null/undefined/empty input', () => {
    expect(formatReleaseDate()).toBeNull()
    expect(formatReleaseDate(null)).toBeNull()
    expect(formatReleaseDate('')).toBeNull()
  })
})

describe('formatReleaseYear', () => {
  it('extracts the year from a valid date', () => {
    expect(formatReleaseYear('2024-08-01')).toBe('2024')
  })

  it('returns null for missing input', () => {
    expect(formatReleaseYear()).toBeNull()
    expect(formatReleaseYear(null)).toBeNull()
  })
})

describe('isValidUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('rejects non-http(s) protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects null/undefined/malformed input', () => {
    expect(isValidUrl()).toBe(false)
    expect(isValidUrl(null)).toBe(false)
    expect(isValidUrl('not a url')).toBe(false)
  })
})

describe('getDomainFromUrl', () => {
  it('returns the hostname for valid URLs', () => {
    expect(getDomainFromUrl('https://github.com/foo/bar')).toBe('github.com')
  })

  it('returns null for invalid URLs', () => {
    expect(getDomainFromUrl('not a url')).toBeNull()
    expect(getDomainFromUrl()).toBeNull()
  })
})

describe('getFilteredTechSkills', () => {
  const skills = [
    makeSkill({
      id: 1,
      skills_type: 'Languages & Frameworks',
      skills_weight: 5,
      skills_value: 'TypeScript',
    }),
    makeSkill({
      id: 2,
      skills_type: 'Cloud & DevOps',
      skills_weight: 10,
      skills_value: 'AWS',
    }),
    makeSkill({
      id: 3,
      skills_type: 'Soft Skills',
      skills_weight: 1,
      skills_value: 'Empathy',
    }),
  ]

  it('returns an empty array when no skills are attached', () => {
    expect(getFilteredTechSkills(makeProject({ related_skills: [] }))).toEqual([])
  })

  it('returns an empty array when no tech_categories are configured', () => {
    expect(
      getFilteredTechSkills(makeProject({ related_skills: skills, tech_categories: [] }))
    ).toEqual([])
  })

  it('filters by tech_categories and sorts by weight desc', () => {
    const project = makeProject({
      related_skills: skills,
      tech_categories: ['Languages & Frameworks', 'Cloud & DevOps'],
    })
    expect(getFilteredTechSkills(project).map(s => s.id)).toEqual([2, 1])
  })

  it('respects the maxSkills cap', () => {
    const project = makeProject({
      related_skills: skills,
      tech_categories: ['Languages & Frameworks', 'Cloud & DevOps'],
    })
    expect(getFilteredTechSkills(project, 1).map(s => s.id)).toEqual([2])
  })
})

describe('getAllProjectSkills', () => {
  it('returns all skills sorted by weight desc, then name', () => {
    const project = makeProject({
      related_skills: [
        makeSkill({ id: 1, skills_value: 'Zed', skills_weight: 5 }),
        makeSkill({ id: 2, skills_value: 'Aaa', skills_weight: 10 }),
        makeSkill({ id: 3, skills_value: 'Mid', skills_weight: 5 }),
      ],
    })
    expect(getAllProjectSkills(project).map(s => s.id)).toEqual([2, 3, 1])
  })

  it('returns empty array when there are no related skills', () => {
    expect(getAllProjectSkills(makeProject({ related_skills: [] }))).toEqual([])
  })
})

describe('groupSkillsByCategory (software)', () => {
  it('groups by skills_type with categories sorted alphabetically', () => {
    const skills = [
      makeSkill({ id: 1, skills_type: 'Cloud & DevOps' }),
      makeSkill({ id: 2, skills_type: 'Languages & Frameworks' }),
      makeSkill({ id: 3, skills_type: 'Languages & Frameworks' }),
    ]
    const grouped = groupSkillsByCategory(skills)
    expect(Object.keys(grouped)).toEqual(['Cloud & DevOps', 'Languages & Frameworks'])
    expect(grouped['Languages & Frameworks']).toHaveLength(2)
  })

  it('uses "Other" when skills_type is missing', () => {
    const grouped = groupSkillsByCategory([makeSkill({ id: 1, skills_type: '' })])
    expect(grouped.Other).toHaveLength(1)
  })
})

describe('sortSoftwareProjectsByReleaseDate', () => {
  it('sorts most recent first by default (desc)', () => {
    const old = makeProject({ id: 1, project_release_date: '2022-01-01' })
    const mid = makeProject({ id: 2, project_release_date: '2024-06-15' })
    const recent = makeProject({ id: 3, project_release_date: '2026-05-08' })
    expect(sortSoftwareProjectsByReleaseDate([old, recent, mid]).map(p => p.id)).toEqual([3, 2, 1])
  })

  it('sorts oldest first when asc requested', () => {
    const old = makeProject({ id: 1, project_release_date: '2022-01-01' })
    const recent = makeProject({ id: 2, project_release_date: '2026-05-08' })
    expect(sortSoftwareProjectsByReleaseDate([recent, old], 'asc').map(p => p.id)).toEqual([1, 2])
  })

  it('places projects without a release date at the end (desc)', () => {
    const dated = makeProject({ id: 1, project_release_date: '2025-01-01' })
    const undated = makeProject({ id: 2, project_release_date: null })
    expect(sortSoftwareProjectsByReleaseDate([undated, dated]).map(p => p.id)).toEqual([1, 2])
  })

  it('does not mutate the input array', () => {
    const input = [
      makeProject({ id: 1, project_release_date: '2022-01-01' }),
      makeProject({ id: 2, project_release_date: '2026-01-01' }),
    ]
    const before = input.map(p => p.id)
    sortSoftwareProjectsByReleaseDate(input)
    expect(input.map(p => p.id)).toEqual(before)
  })
})
