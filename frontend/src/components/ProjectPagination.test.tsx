import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import ProjectPagination from './ProjectPagination'
import type { ResumeItem, MediaProject } from '../types/wordpress'

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

const makeMedia = (id: number, title: string): MediaProject =>
  ({
    id,
    title: { rendered: title },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    project_type: 'Music',
    related_skills: [],
  }) as unknown as MediaProject

describe('ProjectPagination', () => {
  it('renders previous, back, and next when both items exist (resume)', () => {
    render(
      <ProjectPagination
        previousItem={makeResume(1, 'Old Job')}
        nextItem={makeResume(3, 'New Job')}
        backToPath='/resume'
        backToLabel='Back to Resume'
        itemTypePath='resume'
      />
    )
    expect(screen.getByRole('link', { name: /Previous: Old Job/ })).toHaveAttribute(
      'href',
      '/resume/1'
    )
    expect(screen.getByRole('link', { name: /Next: New Job/ })).toHaveAttribute('href', '/resume/3')
    expect(screen.getByRole('link', { name: 'Back to Resume' })).toHaveAttribute('href', '/resume')
  })

  it('renders only previous + back when nextItem is null', () => {
    render(
      <ProjectPagination
        previousItem={makeResume(1, 'Old Job')}
        nextItem={null}
        backToPath='/resume'
        backToLabel='Back'
        itemTypePath='resume'
      />
    )
    expect(screen.getByRole('link', { name: /Previous: Old Job/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Next:/ })).not.toBeInTheDocument()
  })

  it('renders only back when both items are null', () => {
    render(
      <ProjectPagination
        previousItem={null}
        nextItem={null}
        backToPath='/media'
        backToLabel='Back to Media'
        itemTypePath='media'
      />
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Back to Media' })).toBeInTheDocument()
  })

  it('uses the media route for media items', () => {
    render(
      <ProjectPagination
        previousItem={null}
        nextItem={makeMedia(7, 'Album')}
        backToPath='/media'
        backToLabel='Back'
        itemTypePath='media'
      />
    )
    expect(screen.getByRole('link', { name: /Next: Album/ })).toHaveAttribute('href', '/media/7')
  })
})
