import { describe, it, expect } from 'vitest'
import { sortResumeItems } from './resumeSorting'
import type { ResumeItem, EmploymentDates } from '../types/wordpress'

const makeItem = (id: number, title: string, dates: Partial<EmploymentDates>): ResumeItem =>
  ({
    id,
    title: { rendered: title },
    employment_dates: {
      start_date: null,
      end_date: null,
      currently_employed: false,
      start_date_raw: null,
      end_date_raw: null,
      formatted_range: null,
      ...dates,
    },
  }) as unknown as ResumeItem

describe('sortResumeItems', () => {
  it('places "Present" roles before ended roles', () => {
    const present = makeItem(1, 'Current', { end_date: 'Present', start_date_raw: '2024-01-01' })
    const ended = makeItem(2, 'Past', { end_date: 'May 2020', end_date_raw: '2020-05-01' })
    const sorted = [ended, present].sort(sortResumeItems)
    expect(sorted[0].id).toBe(1)
    expect(sorted[1].id).toBe(2)
  })

  it('tie-breaks two Present roles by start_date_raw desc (most recent start wins)', () => {
    const newer = makeItem(1, 'Newer', { end_date: 'Present', start_date_raw: '2026-01-05' })
    const older = makeItem(2, 'Older', { end_date: 'Present', start_date_raw: '2026-01-01' })
    const sorted = [older, newer].sort(sortResumeItems)
    expect(sorted.map(i => i.id)).toEqual([1, 2])
  })

  it('sorts ended roles by end_date_raw desc (most recently ended first)', () => {
    const recent = makeItem(1, 'Recent', { end_date: 'Dec 2025', end_date_raw: '2025-12-31' })
    const ancient = makeItem(2, 'Ancient', { end_date: 'May 2010', end_date_raw: '2010-05-01' })
    const middle = makeItem(3, 'Middle', { end_date: 'Jun 2018', end_date_raw: '2018-06-30' })
    const sorted = [ancient, recent, middle].sort(sortResumeItems)
    expect(sorted.map(i => i.id)).toEqual([1, 3, 2])
  })

  it('handles missing employment_dates gracefully', () => {
    const item = { id: 1, title: { rendered: 'No dates' } } as unknown as ResumeItem
    const present = makeItem(2, 'Current', { end_date: 'Present', start_date_raw: '2024-01-01' })
    const sorted = [item, present].sort(sortResumeItems)
    // Present beats undefined; undefined item ends up after.
    expect(sorted[0].id).toBe(2)
  })

  it('treats Present + missing start_date_raw as equal (stable order preserved)', () => {
    const a = makeItem(1, 'A', { end_date: 'Present', start_date_raw: null })
    const b = makeItem(2, 'B', { end_date: 'Present', start_date_raw: null })
    const sorted = [a, b].sort(sortResumeItems)
    expect(sorted.map(i => i.id)).toEqual([1, 2])
  })

  it('full chronology: MoO + Apollidon Consulting + Apollidon Principal', () => {
    const moo = makeItem(1, 'MoO', { end_date: 'Present', start_date_raw: '2026-01-05' })
    const consulting = makeItem(2, 'Apollidon Consulting', {
      end_date: 'Present',
      start_date_raw: '2026-01-01',
    })
    const principal = makeItem(3, 'Apollidon Principal', {
      end_date: 'December 2025',
      end_date_raw: '2025-12-31',
    })
    // Input is intentionally scrambled to verify the comparator does the work.
    const sorted = [principal, consulting, moo].sort(sortResumeItems)
    expect(sorted.map(i => i.id)).toEqual([1, 2, 3])
  })
})
