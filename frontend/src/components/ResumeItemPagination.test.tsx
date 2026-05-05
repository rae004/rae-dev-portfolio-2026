import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import ResumeItemPagination from './ResumeItemPagination'
import type { ResumeItem } from '../types/wordpress'

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

const makeResume = (id: number, title: string): ResumeItem =>
  ({
    id,
    title: { rendered: title },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    related_skills: [],
  }) as unknown as ResumeItem

describe('ResumeItemPagination', () => {
  it('shows previous + back + next when both siblings exist', () => {
    render(
      <ResumeItemPagination
        previousResume={makeResume(1, 'First')}
        nextResume={makeResume(3, 'Third')}
      />
    )
    expect(screen.getByRole('link', { name: /Previous: First/ })).toHaveAttribute(
      'href',
      '/resume/1'
    )
    expect(screen.getByRole('link', { name: /Next: Third/ })).toHaveAttribute('href', '/resume/3')
    expect(screen.getByRole('link', { name: 'Back to Resume' })).toBeInTheDocument()
  })

  it('renders only the back button when no siblings exist', () => {
    render(<ResumeItemPagination previousResume={null} nextResume={null} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('renders only previous + back when nextResume is null', () => {
    render(<ResumeItemPagination previousResume={makeResume(1, 'Older')} nextResume={null} />)
    expect(screen.queryByRole('link', { name: /Next:/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Previous: Older/ })).toBeInTheDocument()
  })

  it('renders only next + back when previousResume is null', () => {
    render(<ResumeItemPagination previousResume={null} nextResume={makeResume(2, 'Newer')} />)
    expect(screen.queryByRole('link', { name: /Previous:/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Next: Newer/ })).toBeInTheDocument()
  })
})
