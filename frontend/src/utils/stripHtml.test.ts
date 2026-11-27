import { describe, it, expect } from 'vitest'
import { stripHtml } from './stripHtml'

describe('stripHtml', () => {
  it('returns an empty string for null/undefined/empty input', () => {
    expect(stripHtml(null)).toBe('')
    expect(stripHtml(undefined)).toBe('')
    expect(stripHtml('')).toBe('')
  })

  it('removes tags and keeps their text', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('decodes entities, as a WordPress excerpt contains them', () => {
    expect(stripHtml('<p>Ain&#8217;t it &amp; more [&hellip;]</p>')).toBe('Ain’t it & more […]')
  })

  it('leaves no markup behind for nested or broken tags', () => {
    expect(stripHtml('<scr<script>ipt>alert(1)</script>')).not.toContain('<script')
    expect(stripHtml('<div><a href="x">link</a')).toBe('link')
  })

  it('returns plain text unchanged', () => {
    expect(stripHtml('just text')).toBe('just text')
  })
})
