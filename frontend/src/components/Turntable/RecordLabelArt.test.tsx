import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RecordLabelArt from './RecordLabelArt'
import { labelInkColor } from './recordLabel'
import { catalogNumberFor, TURNTABLE_SONGS } from './songs'
import type { Song } from './songs'

const song: Song = {
  id: 'x',
  title: 'A Very Long Song Title That Needs Squeezing',
  artist: 'Artist',
  youtubeId: 'x',
  label: { color: '#1a1a1a', recordLabel: 'Some Label', year: 1999, credit: 'Engineer' },
}

describe('labelInkColor', () => {
  it('uses light ink on dark bases and dark ink on light bases', () => {
    expect(labelInkColor('#1a1a1a')).toBe('#f2f0e9')
    expect(labelInkColor('#c8102e')).toBe('#f2f0e9')
    expect(labelInkColor('#f2f0e9')).toBe('#1a1a1a')
    expect(labelInkColor('#f2b705')).toBe('#1a1a1a')
  })

  it('falls back to dark ink for a malformed colour', () => {
    expect(labelInkColor('red')).toBe('#1a1a1a')
  })
})

describe('RecordLabelArt', () => {
  it('renders the brand ring, song facts, credit and the rights holder line', () => {
    const { container } = render(
      <svg>
        <RecordLabelArt cx={50} cy={50} r={38} song={song} catalogNumber='RD-007' />
      </svg>
    )
    const text = container.textContent
    expect(text).toContain('RAE DEV · ENGINEERING CREDITS')
    expect(text).toContain(song.title)
    expect(text).toContain('Artist')
    expect(text).toContain('Engineer')
    expect(text).toContain('℗ 1999 SOME LABEL')
    expect(text).toContain('RD-007')
    expect(text).toContain('33⅓ RPM')
    // The only ℗ on the disc belongs to the real label.
    expect(text?.split('℗')).toHaveLength(2)
    // Base colour comes from the song; ink is derived for contrast.
    expect(container.querySelector('[data-part="record-label"]')).toHaveAttribute('fill', '#1a1a1a')
  })

  it('squeezes over-long text to the label width instead of overflowing', () => {
    const { container } = render(
      <svg>
        <RecordLabelArt cx={50} cy={50} r={38} song={song} />
      </svg>
    )
    const title = [...container.querySelectorAll('text')].find(t => t.textContent === song.title)
    expect(title).toHaveAttribute('lengthAdjust', 'spacingAndGlyphs')
    const artist = [...container.querySelectorAll('text')].find(t => t.textContent === 'Artist')
    expect(artist).not.toHaveAttribute('lengthAdjust')
  })

  it('renders only the brand ring and spindle hole with no song', () => {
    const { container } = render(
      <svg>
        <RecordLabelArt cx={50} cy={50} r={38} />
      </svg>
    )
    expect(container.textContent).toBe('RAE DEV · ENGINEERING CREDITS')
    expect(container.querySelector('[data-part="spindle-hole"]')).not.toBeNull()
  })
})

describe('catalogNumberFor', () => {
  it('derives zero-padded numbers from list position', () => {
    expect(catalogNumberFor(TURNTABLE_SONGS, TURNTABLE_SONGS[0].id)).toBe('RD-001')
    expect(catalogNumberFor(TURNTABLE_SONGS, TURNTABLE_SONGS[7].id)).toBe('RD-008')
    expect(catalogNumberFor(TURNTABLE_SONGS, 'nope')).toBeUndefined()
  })
})
