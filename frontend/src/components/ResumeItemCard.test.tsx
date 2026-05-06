import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import ResumeItemCard from './ResumeItemCard'
import type { ResumeItem, SkillItem } from '../types/wordpress'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string
    params?: Record<string, string>
    children: ReactNode
    className?: string
  }) => {
    let href = to
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        href = href.replace(`$${k}`, v)
      })
    }
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
}))

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

const makeResume = (overrides: Partial<ResumeItem> = {}): ResumeItem =>
  ({
    id: 42,
    title: { rendered: 'Senior Engineer' },
    content: { rendered: '<p>Did things</p>', protected: false },
    excerpt: { rendered: '', protected: false },
    related_skills: [],
    ...overrides,
  }) as unknown as ResumeItem

describe('ResumeItemCard', () => {
  it('renders the title as a link to the detail route in summary layout', () => {
    render(<ResumeItemCard resumeItem={makeResume()} />)
    const link = screen.getByRole('link', { name: 'Senior Engineer' })
    expect(link).toHaveAttribute('href', '/resume/42')
  })

  it('renders the title as plain text in detailed layout', () => {
    render(<ResumeItemCard resumeItem={makeResume()} layout='detailed' />)
    expect(screen.queryByRole('link', { name: 'Senior Engineer' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Senior Engineer' })).toBeInTheDocument()
  })

  it('renders formatted_range from employment_dates when provided', () => {
    const resume = makeResume({
      employment_dates: {
        start_date: 'Jan 2020',
        end_date: 'Dec 2023',
        currently_employed: false,
        start_date_raw: '2020-01-01',
        end_date_raw: '2023-12-31',
        formatted_range: 'Jan 2020 - Dec 2023',
      },
    })
    render(<ResumeItemCard resumeItem={resume} />)
    expect(screen.getByText('Jan 2020 - Dec 2023')).toBeInTheDocument()
  })

  it('renders explicit related_skills as the skills preview', () => {
    const resume = makeResume({
      related_skills: [
        makeSkill({ id: 1, skills_value: 'React' }),
        makeSkill({ id: 2, skills_value: 'TypeScript' }),
      ],
    })
    render(<ResumeItemCard resumeItem={resume} />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows "+N more" when there are more skills than maxSkillsPreview', () => {
    const resume = makeResume({
      related_skills: [
        makeSkill({ id: 1, skills_value: 'A' }),
        makeSkill({ id: 2, skills_value: 'B' }),
        makeSkill({ id: 3, skills_value: 'C' }),
        makeSkill({ id: 4, skills_value: 'D' }),
      ],
    })
    render(<ResumeItemCard resumeItem={resume} maxSkillsPreview={2} />)
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('hides the skills section when showSkills is false', () => {
    const resume = makeResume({
      related_skills: [makeSkill({ id: 1, skills_value: 'React' })],
    })
    render(<ResumeItemCard resumeItem={resume} showSkills={false} />)
    expect(screen.queryByText('Skills:')).not.toBeInTheDocument()
  })

  it('renders the "Read details..." link only in summary layout', () => {
    const { rerender } = render(<ResumeItemCard resumeItem={makeResume()} />)
    expect(screen.getByRole('link', { name: /Read details/i })).toBeInTheDocument()

    rerender(<ResumeItemCard resumeItem={makeResume()} layout='detailed' />)
    expect(screen.queryByRole('link', { name: /Read details/i })).not.toBeInTheDocument()
  })
})
