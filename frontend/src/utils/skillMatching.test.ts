import { describe, it, expect } from 'vitest'
import {
  groupSkillsByCategory,
  sortSkillsInCategories,
  findSkillsInContent,
  getResumeSkills,
  getMediaProjectSkills,
  getSkillPreview,
  getRemainingSkillsCount,
} from './skillMatching'
import type { SkillItem, ResumeItem, MediaProject } from '../types/wordpress'

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

describe('groupSkillsByCategory', () => {
  it('groups skills by skills_type', () => {
    const skills = [
      makeSkill({ id: 1, skills_type: 'Languages & Frameworks' }),
      makeSkill({ id: 2, skills_type: 'Cloud & DevOps' }),
      makeSkill({ id: 3, skills_type: 'Languages & Frameworks' }),
    ]
    const grouped = groupSkillsByCategory(skills)
    expect(Object.keys(grouped).sort()).toEqual(['Cloud & DevOps', 'Languages & Frameworks'])
    expect(grouped['Languages & Frameworks']).toHaveLength(2)
    expect(grouped['Cloud & DevOps']).toHaveLength(1)
  })

  it('falls back to "Uncategorized" when skills_type is missing', () => {
    const skills = [makeSkill({ id: 1, skills_type: '' })]
    const grouped = groupSkillsByCategory(skills)
    expect(grouped.Uncategorized).toHaveLength(1)
  })

  it('returns an empty object for an empty input', () => {
    expect(groupSkillsByCategory([])).toEqual({})
  })
})

describe('sortSkillsInCategories', () => {
  it('sorts by weight descending, then alphabetically', () => {
    const grouped = {
      Languages: [
        makeSkill({ id: 1, skills_value: 'Python', skills_weight: 5 }),
        makeSkill({ id: 2, skills_value: 'Go', skills_weight: 10 }),
        makeSkill({ id: 3, skills_value: 'Ruby', skills_weight: 5 }),
      ],
    }
    const sorted = sortSkillsInCategories(grouped)
    expect(sorted.Languages.map(s => s.skills_value)).toEqual(['Go', 'Python', 'Ruby'])
  })

  it('does not mutate the input arrays', () => {
    const original = [
      makeSkill({ id: 1, skills_value: 'A', skills_weight: 1 }),
      makeSkill({ id: 2, skills_value: 'B', skills_weight: 2 }),
    ]
    const grouped = { Cat: original }
    sortSkillsInCategories(grouped)
    expect(original.map(s => s.id)).toEqual([1, 2])
  })

  it('falls back to title.rendered when skills_value is empty', () => {
    const grouped = {
      Cat: [
        makeSkill({
          id: 1,
          skills_value: '',
          title: { rendered: 'Z-skill' },
          skills_weight: 5,
        }),
        makeSkill({
          id: 2,
          skills_value: '',
          title: { rendered: 'A-skill' },
          skills_weight: 5,
        }),
      ],
    }
    const sorted = sortSkillsInCategories(grouped)
    expect(sorted.Cat.map(s => s.title.rendered)).toEqual(['A-skill', 'Z-skill'])
  })
})

describe('findSkillsInContent', () => {
  const allSkills = [
    makeSkill({ id: 1, skills_value: 'React', skills_weight: 10 }),
    makeSkill({ id: 2, skills_value: 'TypeScript', skills_weight: 5 }),
    makeSkill({ id: 3, skills_value: 'Rust', skills_weight: 1 }),
  ]

  it('returns skills mentioned in the content (case-insensitive)', () => {
    const result = findSkillsInContent('I built it in REACT and typescript', allSkills)
    expect(result.map(s => s.skills_value)).toEqual(['React', 'TypeScript'])
  })

  it('returns an empty array for empty content or no skills', () => {
    expect(findSkillsInContent('', allSkills)).toEqual([])
    expect(findSkillsInContent('react', [])).toEqual([])
  })

  it('sorts results by weight then alphabetically', () => {
    const skills = [
      makeSkill({ id: 1, skills_value: 'Apple', skills_weight: 5 }),
      makeSkill({ id: 2, skills_value: 'Banana', skills_weight: 10 }),
      makeSkill({ id: 3, skills_value: 'Avocado', skills_weight: 5 }),
    ]
    const result = findSkillsInContent('Apple Banana Avocado', skills)
    expect(result.map(s => s.skills_value)).toEqual(['Banana', 'Apple', 'Avocado'])
  })
})

describe('getResumeSkills', () => {
  const allSkills = [makeSkill({ id: 99, skills_value: 'React' })]

  const baseResume = (overrides: Partial<ResumeItem> = {}): ResumeItem =>
    ({
      id: 1,
      title: { rendered: 'Engineer' },
      content: { rendered: '', protected: false },
      excerpt: { rendered: '', protected: false },
      related_skills: [],
      ...overrides,
    }) as ResumeItem

  it('prefers explicit related_skills when present', () => {
    const explicit = makeSkill({ id: 42, skills_value: 'Python' })
    const resume = baseResume({ related_skills: [explicit] })
    const result = getResumeSkills(resume, allSkills)
    expect(result.map(s => s.id)).toEqual([42])
  })

  it('falls back to content matching when related_skills is empty', () => {
    const resume = baseResume({
      content: { rendered: 'Worked on a React project', protected: false },
    })
    const result = getResumeSkills(resume, allSkills)
    expect(result.map(s => s.id)).toEqual([99])
  })
})

describe('getMediaProjectSkills', () => {
  const allSkills = [makeSkill({ id: 7, skills_value: 'Logic Pro' })]

  const baseProject = (overrides: Partial<MediaProject> = {}): MediaProject =>
    ({
      id: 1,
      title: { rendered: 'Album' },
      content: { rendered: '', protected: false },
      excerpt: { rendered: '', protected: false },
      project_type: 'Music',
      related_skills: [],
      ...overrides,
    }) as MediaProject

  it('uses explicit related_skills when present', () => {
    const explicit = makeSkill({ id: 100, skills_value: 'Pro Tools' })
    const project = baseProject({ related_skills: [explicit] })
    expect(getMediaProjectSkills(project, allSkills).map(s => s.id)).toEqual([100])
  })

  it('falls back to content matching when none are present', () => {
    const project = baseProject({
      excerpt: { rendered: 'Mixed in Logic Pro', protected: false },
    })
    expect(getMediaProjectSkills(project, allSkills).map(s => s.id)).toEqual([7])
  })
})

describe('getSkillPreview / getRemainingSkillsCount', () => {
  const skills = [
    makeSkill({ id: 1 }),
    makeSkill({ id: 2 }),
    makeSkill({ id: 3 }),
    makeSkill({ id: 4 }),
    makeSkill({ id: 5 }),
  ]

  it('returns the first N skills (default 3)', () => {
    expect(getSkillPreview(skills).map(s => s.id)).toEqual([1, 2, 3])
  })

  it('respects a custom max', () => {
    expect(getSkillPreview(skills, 2).map(s => s.id)).toEqual([1, 2])
  })

  it('returns the count beyond the displayed slice (clamped at 0)', () => {
    expect(getRemainingSkillsCount(skills, 3)).toBe(2)
    expect(getRemainingSkillsCount(skills, 10)).toBe(0)
  })
})
