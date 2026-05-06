import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkillsGroup from './SkillsGroup'
import type { SkillItem } from '../types/wordpress'

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

describe('SkillsGroup', () => {
  it('renders an empty-state message when there are no categories', () => {
    render(<SkillsGroup groupedSkills={{}} />)
    expect(screen.getByText(/no skills found/i)).toBeInTheDocument()
  })

  it('renders each category header in grid layout (default)', () => {
    const grouped = {
      'Languages & Frameworks': [makeSkill({ id: 1, skills_value: 'TypeScript' })],
      'Cloud & DevOps': [makeSkill({ id: 2, skills_value: 'AWS' })],
    }
    render(<SkillsGroup groupedSkills={grouped} />)
    expect(screen.getByRole('heading', { name: 'Languages & Frameworks' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cloud & DevOps' })).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('AWS')).toBeInTheDocument()
  })

  it('omits category headers in inline layout', () => {
    const grouped = {
      'Languages & Frameworks': [makeSkill({ id: 1, skills_value: 'TypeScript' })],
    }
    render(<SkillsGroup groupedSkills={grouped} layout='inline' />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Languages & Frameworks' })
    ).not.toBeInTheDocument()
  })
})
