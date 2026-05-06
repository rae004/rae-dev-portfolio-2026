import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StreamingLinks from './StreamingLinks'
import type { StreamingLink } from '../types/wordpress'

describe('StreamingLinks', () => {
  it('renders nothing when given no links', () => {
    const { container } = render(<StreamingLinks links={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an external link per platform', () => {
    const links: StreamingLink[] = [
      { platform: 'Spotify', url: 'https://open.spotify.com/x', type: 'audio' },
      { platform: 'YouTube', url: 'https://youtube.com/watch?v=x', type: 'video' },
    ]
    render(<StreamingLinks links={links} />)

    const spotify = screen.getByRole('link', { name: /Spotify/ })
    expect(spotify).toHaveAttribute('href', 'https://open.spotify.com/x')
    expect(spotify).toHaveAttribute('target', '_blank')
    expect(spotify).toHaveAttribute('rel', 'noopener noreferrer')

    expect(screen.getByRole('link', { name: /YouTube/ })).toHaveAttribute(
      'href',
      'https://youtube.com/watch?v=x'
    )
  })

  it('uses the provided card title', () => {
    const links: StreamingLink[] = [
      { platform: 'Spotify', url: 'https://example.com', type: 'audio' },
    ]
    render(<StreamingLinks links={links} title='Hear it here' />)
    expect(screen.getByRole('heading', { name: 'Hear it here' })).toBeInTheDocument()
  })

  it('summarizes audio vs video link counts with correct pluralization', () => {
    const links: StreamingLink[] = [
      { platform: 'Spotify', url: 'https://example.com/1', type: 'audio' },
      { platform: 'Apple Music', url: 'https://example.com/2', type: 'audio' },
      { platform: 'YouTube', url: 'https://example.com/3', type: 'video' },
    ]
    render(<StreamingLinks links={links} />)
    expect(screen.getByText(/Audio available on 2 platforms/)).toBeInTheDocument()
    expect(screen.getByText(/Video available on 1 platform$/)).toBeInTheDocument()
  })
})
