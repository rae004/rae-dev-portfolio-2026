// House identity on the ring; the song's own facts in the middle. Deliberately
// a *credit* sheet, not an imprint: the only ℗ on the disc belongs to the
// real rights holder on the bottom arc, and our ring never claims one.
export const BRAND_RING_TEXT = 'RAE DEV · ENGINEERING CREDITS'

// Relative luminance (sRGB) → pick dark or light ink for a given base colour
// so song data only ever has to specify the colour itself.
export const labelInkColor = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#1a1a1a'
  const n = parseInt(m[1], 16)
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const lum =
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  return lum > 0.4 ? '#1a1a1a' : '#f2f0e9'
}
