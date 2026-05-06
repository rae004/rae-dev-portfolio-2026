import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import MediaProjectCard from './MediaProjectCard'
import type { MediaProject, MusicProject, AudioPostProject, SkillItem } from '../types/wordpress'

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
    skills_type: 'Audio',
    skills_value: 'Logic Pro',
    skills_weight: 5,
    title: { rendered: 'Logic Pro' },
    content: { rendered: '', protected: false },
    excerpt: { rendered: '', protected: false },
    ...overrides,
  }) as SkillItem

const makeMedia = (overrides: Partial<MediaProject> = {}): MediaProject =>
  ({
    id: 21,
    title: { rendered: 'Untitled' },
    content: { rendered: '<p>Content</p>', protected: false },
    excerpt: { rendered: '<p>Excerpt</p>', protected: false },
    project_type: null,
    related_skills: [],
    ...overrides,
  }) as unknown as MediaProject

const makeMusic = (overrides: Partial<MusicProject> = {}): MediaProject =>
  makeMedia({
    project_type: 'Music',
    music_artist_name: 'Beethoven',
    music_genre: 'Classical',
    music_release_date: '2025-06-15',
    ...overrides,
  } as Partial<MediaProject>)

const makeAudioPost = (overrides: Partial<AudioPostProject> = {}): MediaProject =>
  makeMedia({
    project_type: 'Audio_Post_Production',
    audio_director: 'Director X',
    audio_genre: 'Drama',
    audio_studios: ['Studio Alpha'],
    audio_release_date: '2025-04-10',
    ...overrides,
  } as Partial<MediaProject>)

describe('MediaProjectCard', () => {
  it('renders the title as a route link in summary layout', () => {
    render(<MediaProjectCard project={makeMusic({ id: 21 })} />)
    expect(screen.getByRole('link', { name: 'Untitled' })).toHaveAttribute('href', '/media/21')
  })

  it('renders a "Music" type badge for music projects', () => {
    render(<MediaProjectCard project={makeMusic()} />)
    expect(screen.getByText('Music')).toHaveClass('badge-primary')
  })

  it('renders an "Audio Post" type badge for audio post projects', () => {
    render(<MediaProjectCard project={makeAudioPost()} />)
    expect(screen.getByText('Audio Post')).toHaveClass('badge-secondary')
  })

  it('renders a "Project" badge for uncategorized projects', () => {
    render(<MediaProjectCard project={makeMedia({ project_type: null })} />)
    expect(screen.getByText('Project')).toHaveClass('badge-neutral')
  })

  it('shows artist + genre metadata for music projects', () => {
    render(
      <MediaProjectCard
        project={makeMusic({
          music_artist_name: 'Test Artist',
          music_genre: 'Jazz',
        })}
      />
    )
    expect(screen.getByText(/Artist: Test Artist/)).toBeInTheDocument()
    expect(screen.getByText('Jazz')).toBeInTheDocument()
  })

  it('shows director + studios metadata for audio post projects', () => {
    render(
      <MediaProjectCard
        project={makeAudioPost({
          audio_director: 'Jane Doe',
          audio_studios: ['Studio One', 'Studio Two'],
        })}
      />
    )
    expect(screen.getByText(/Director: Jane Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Studios: Studio One, Studio Two/)).toBeInTheDocument()
  })

  it('renders related skills as preview pills', () => {
    const project = makeMusic({
      related_skills: [
        makeSkill({ id: 1, skills_value: 'Pro Tools' }),
        makeSkill({ id: 2, skills_value: 'Logic Pro' }),
      ],
    })
    render(<MediaProjectCard project={project} />)
    expect(screen.getByText('Pro Tools')).toBeInTheDocument()
    expect(screen.getByText('Logic Pro')).toBeInTheDocument()
  })

  it('renders the "Discover More" CTA only in summary layout', () => {
    const { rerender } = render(<MediaProjectCard project={makeMusic()} />)
    expect(screen.getByRole('link', { name: /Discover More/ })).toBeInTheDocument()

    rerender(<MediaProjectCard project={makeMusic()} layout='detailed' />)
    expect(screen.queryByRole('link', { name: /Discover More/ })).not.toBeInTheDocument()
  })
})
