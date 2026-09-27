import { render, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RecordDeliveryOverlay from './RecordDeliveryOverlay'
import type { Song } from './songs'

const base: Song = {
  id: 'x',
  title: 'Song X',
  artist: 'Artist X',
  youtubeId: 'x',
  label: { color: '#1f5fa8', recordLabel: 'Label X', year: 2010 },
}

const withArt: Song = {
  ...base,
  albumArt: { url: 'https://example.test/x.webp', alt: 'Album cover for Song X by Artist X' },
}

const renderOverlay = (song?: Song) =>
  render(
    <RecordDeliveryOverlay
      sleeveRef={{ current: null }}
      recordRef={{ current: null }}
      song={song}
    />
  )

describe('RecordDeliveryOverlay sleeve', () => {
  it('shows the album cover in front of the record', () => {
    renderOverlay(withArt)
    const cover = document.querySelector<HTMLImageElement>('[data-part="sleeve-cover"]')
    expect(cover).not.toBeNull()
    expect(cover?.src).toBe(withArt.albumArt?.url)
    expect(cover?.alt).toBe(withArt.albumArt?.alt)

    // Sleeve comes after the record in DOM order → painted on top.
    const sleeve = document.querySelector('[data-part="sleeve"]')!
    const record = document
      .querySelector('[data-part="record-label-art"]')!
      .closest('.rounded-full')!
    expect(record.compareDocumentPosition(sleeve) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('falls back to a colour-matched jacket when a song has no artwork', () => {
    renderOverlay(base)
    expect(document.querySelector('[data-part="sleeve-cover"]')).toBeNull()
    const jacket = document.querySelector<HTMLElement>('[data-part="sleeve-jacket"]')!
    expect(jacket.style.backgroundColor).toBe('rgb(31, 95, 168)')
    expect(jacket.textContent).toContain('Song X')
    expect(jacket.textContent).toContain('Artist X')
  })

  it('falls back to the jacket if the cover fails to load', () => {
    renderOverlay(withArt)
    const cover = document.querySelector('[data-part="sleeve-cover"]')!
    fireEvent.error(cover)
    expect(document.querySelector('[data-part="sleeve-cover"]')).toBeNull()
    expect(document.querySelector('[data-part="sleeve-jacket"]')?.textContent).toContain('Song X')
  })

  it('retries the cover for a different song after a failure', () => {
    const { rerender } = renderOverlay(withArt)
    fireEvent.error(document.querySelector('[data-part="sleeve-cover"]')!)
    expect(document.querySelector('[data-part="sleeve-cover"]')).toBeNull()

    const other: Song = {
      ...withArt,
      id: 'y',
      albumArt: { url: 'https://example.test/y.webp', alt: 'y' },
    }
    rerender(
      <RecordDeliveryOverlay
        sleeveRef={{ current: null }}
        recordRef={{ current: null }}
        song={other}
      />
    )
    expect(document.querySelector('[data-part="sleeve-cover"]')).not.toBeNull()
  })

  it('renders an empty jacket with no song', () => {
    renderOverlay(undefined)
    expect(document.querySelector('[data-part="sleeve-cover"]')).toBeNull()
    expect(document.querySelector('[data-part="sleeve-jacket"]')?.textContent).toBe('')
  })
})
