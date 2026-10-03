import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MediaProjectGallery from './MediaProjectGallery'
import type { GalleryImage } from '../types/wordpress'

const image = (id: number, overrides: Partial<GalleryImage> = {}): GalleryImage => ({
  id,
  url: `https://cdn.example/full-${id}.jpg`,
  thumbnail_url: `https://cdn.example/thumb-${id}.jpg`,
  alt: `Image ${id}`,
  ...overrides,
})

describe('MediaProjectGallery', () => {
  it('renders nothing when there are no images', () => {
    const { container } = render(<MediaProjectGallery images={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('uses the thumbnail in the grid and the full image in the lightbox', () => {
    render(<MediaProjectGallery images={[image(1)]} />)

    const thumb = screen.getByRole('img', { name: 'Image 1' })
    expect(thumb).toHaveAttribute('src', 'https://cdn.example/thumb-1.jpg')

    fireEvent.click(thumb)
    const full = screen
      .getAllByRole('img', { name: 'Image 1' })
      .find(img => img.getAttribute('src') === 'https://cdn.example/full-1.jpg')
    expect(full).toBeDefined()
  })

  it('falls back to the full URL when no thumbnail is provided', () => {
    render(<MediaProjectGallery images={[image(2, { thumbnail_url: undefined })]} />)
    expect(screen.getByRole('img', { name: 'Image 2' })).toHaveAttribute(
      'src',
      'https://cdn.example/full-2.jpg'
    )
  })

  it('paginates according to imagesPerPage', () => {
    const images = [1, 2, 3].map(id => image(id))
    render(<MediaProjectGallery images={images} imagesPerPage={2} />)

    expect(screen.getAllByRole('img')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('img', { name: 'Image 3' })).toBeInTheDocument()
  })
})
