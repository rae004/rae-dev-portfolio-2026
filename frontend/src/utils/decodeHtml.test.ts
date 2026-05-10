import { describe, it, expect } from 'vitest'
import { decodeHtml } from './decodeHtml'

describe('decodeHtml', () => {
  it('returns an empty string for null/undefined/empty input', () => {
    expect(decodeHtml(null)).toBe('')
    expect(decodeHtml(undefined)).toBe('')
    expect(decodeHtml('')).toBe('')
  })

  it('decodes WordPress numeric ampersand entity (&#038;)', () => {
    expect(decodeHtml('Bread &#038; Butter')).toBe('Bread & Butter')
  })

  it('decodes the named ampersand entity (&amp;)', () => {
    expect(decodeHtml('A &amp; B')).toBe('A & B')
  })

  it('decodes en-dash and em-dash numeric entities', () => {
    expect(decodeHtml('Q1 &#8211; Q4')).toBe('Q1 – Q4')
    expect(decodeHtml('Q1 &#8212; Q4')).toBe('Q1 — Q4')
  })

  it('decodes the curly apostrophe (&#8217;)', () => {
    expect(decodeHtml("Ain&#8217;t Nobody Worryin&#8217;")).toBe('Ain’t Nobody Worryin’')
  })

  it('passes through plain text unchanged', () => {
    expect(decodeHtml('Just plain text')).toBe('Just plain text')
  })

  it('handles strings with multiple distinct entities', () => {
    expect(decodeHtml('Mutual of Omaha &#038; Co. &#8211; Engineer')).toBe(
      'Mutual of Omaha & Co. – Engineer',
    )
  })
})
