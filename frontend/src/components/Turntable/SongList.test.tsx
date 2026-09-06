import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SongList from './SongList'
import type { Song } from './songs'

const songs: Song[] = [
  { id: 'a', title: 'Song A', artist: 'Artist A', youtubeId: 'aaa' },
  { id: 'b', title: 'Song B', artist: 'Artist B', youtubeId: 'bbb' },
]

describe('SongList', () => {
  it('renders every song as a selectable radio option', () => {
    render(<SongList songs={songs} selectedSongId={null} disabled={false} onSelect={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /Song A/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Song B/ })).toBeInTheDocument()
  })

  it('marks the selected song as checked', () => {
    render(<SongList songs={songs} selectedSongId='b' disabled={false} onSelect={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /Song A/ })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Song B/ })).toBeChecked()
  })

  it('calls onSelect with the chosen song on click', () => {
    const onSelect = vi.fn()
    render(<SongList songs={songs} selectedSongId={null} disabled={false} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('radio', { name: /Song A/ }))

    expect(onSelect).toHaveBeenCalledWith(songs[0])
  })

  it('disables all options when disabled is true', () => {
    render(<SongList songs={songs} selectedSongId={null} disabled={true} onSelect={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /Song A/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Song B/ })).toBeDisabled()
  })
})
