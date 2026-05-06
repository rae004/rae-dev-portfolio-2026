import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import SoftwareProjectCard from './SoftwareProjectCard'
import type { SoftwareProject, SkillItem } from '../types/wordpress'

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
    skills_weight: 5,
    title: { rendered: 'TypeScript' },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    ...overrides,
  }) as SkillItem

const makeProject = (overrides: Partial<SoftwareProject> = {}): SoftwareProject =>
  ({
    id: 11,
    title: { rendered: 'My Project' },
    content: { rendered: '<p>Long content</p>', protected: false },
    excerpt: { rendered: '<p>Short excerpt</p>', protected: false },
    related_skills: [],
    tech_categories: [],
    ...overrides,
  }) as unknown as SoftwareProject

describe('SoftwareProjectCard', () => {
  it('renders title as a route link and "View Details" CTA in summary layout', () => {
    render(<SoftwareProjectCard project={makeProject()} />)
    const titleLink = screen.getByRole('link', { name: 'My Project' })
    expect(titleLink).toHaveAttribute('href', '/projects/11')
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
      'href',
      '/projects/11'
    )
  })

  it('shows the project state badge when set', () => {
    render(<SoftwareProjectCard project={makeProject({ project_state: 'Ongoing' })} />)
    expect(screen.getByText('Ongoing')).toHaveClass('badge-warning')
  })

  it('renders the release date as "Mon YYYY" badge when provided', () => {
    render(<SoftwareProjectCard project={makeProject({ project_release_date: '2025-03-15' })} />)
    expect(screen.getByText('Mar 2025')).toBeInTheDocument()
  })

  it('renders filtered tech skills (filtered by tech_categories)', () => {
    const project = makeProject({
      related_skills: [
        makeSkill({ id: 1, skills_value: 'TypeScript', skills_type: 'Languages & Frameworks' }),
        makeSkill({ id: 2, skills_value: 'AWS', skills_type: 'Cloud & DevOps' }),
        makeSkill({ id: 3, skills_value: 'Empathy', skills_type: 'Soft Skills' }),
      ],
      tech_categories: ['Languages & Frameworks', 'Cloud & DevOps'],
    })
    render(<SoftwareProjectCard project={project} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('AWS')).toBeInTheDocument()
    expect(screen.queryByText('Empathy')).not.toBeInTheDocument()
  })

  it('hides skills entirely when no tech_categories are configured', () => {
    const project = makeProject({
      related_skills: [makeSkill({ id: 1, skills_value: 'TypeScript' })],
      tech_categories: [],
    })
    render(<SoftwareProjectCard project={project} />)
    expect(screen.queryByText('Technologies:')).not.toBeInTheDocument()
  })

  it('renders the demo and repo domains when both URLs are valid', () => {
    const project = makeProject({
      project_demo_link: 'https://demo.example.com/path',
      project_repo_link: 'https://github.com/org/repo',
    })
    render(<SoftwareProjectCard project={project} />)
    expect(screen.getByText(/demo.example.com/)).toBeInTheDocument()
    expect(screen.getByText(/github.com/)).toBeInTheDocument()
  })

  it('renders an external "Live Demo" link in detailed layout', () => {
    const project = makeProject({
      project_demo_link: 'https://demo.example.com',
    })
    render(<SoftwareProjectCard project={project} layout='detailed' />)
    const link = screen.getByRole('link', { name: /Live Demo/ })
    expect(link).toHaveAttribute('href', 'https://demo.example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
