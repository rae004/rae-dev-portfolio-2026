import { useId } from 'react'
import { BRAND_RING_TEXT, labelInkColor } from './recordLabel'
import type { Song } from './songs'

interface RecordLabelArtProps {
  cx: number
  cy: number
  r: number
  song?: Song
  catalogNumber?: string
}

// SVG text has no wrapping; long titles/artists get squeezed to the label
// width instead of spilling off the disc. Width is estimated (no layout
// measurement available at render), so only genuinely long strings get
// `textLength` applied — short ones keep natural glyph spacing.
const fitText = (text: string, fontSize: number, maxWidth: number) => {
  const estimated = text.length * fontSize * 0.56
  return estimated > maxWidth
    ? { textLength: maxWidth, lengthAdjust: 'spacingAndGlyphs' as const }
    : {}
}

// Shared between TurntableSvg's on-platter record and the traveling record in
// RecordDeliveryOverlay, so the disc that lands is visibly the same disc.
// Renders in the caller's coordinate space around (cx, cy) with radius r.
const RecordLabelArt = ({ cx, cy, r, song, catalogNumber }: RecordLabelArtProps) => {
  const id = useId()
  const topArcId = `${id}-top`
  const bottomArcId = `${id}-bottom`
  const s = r / 38 // all sizes were tuned at r=38 (TurntableSvg's label)

  const base = song?.label.color ?? '#f2f0e9'
  const ink = labelInkColor(base)
  const ringR = r - 6 * s
  const textMax = r * 1.55

  const bottomText = song ? `℗ ${song.label.year} ${song.label.recordLabel}`.toUpperCase() : ''

  return (
    <g data-part='record-label-art'>
      <defs>
        {/* Top arc: left → right over the top (clockwise on screen), so the
            glyphs stand upright on the outside of the ring. */}
        <path
          id={topArcId}
          d={`M ${cx - ringR} ${cy} A ${ringR} ${ringR} 0 0 1 ${cx + ringR} ${cy}`}
        />
        {/* Bottom arc: left → right under the bottom (counter-clockwise), so
            the text reads left-to-right and upright rather than inverted. */}
        <path
          id={bottomArcId}
          d={`M ${cx - ringR} ${cy} A ${ringR} ${ringR} 0 0 0 ${cx + ringR} ${cy}`}
        />
      </defs>

      <circle data-part='record-label' cx={cx} cy={cy} r={r} fill={base} stroke='#cfcabb' />
      {/* Thin inner ring separates the arc text from the centre block. */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 11 * s}
        fill='none'
        stroke={ink}
        strokeOpacity={0.35}
        strokeWidth={0.5 * s}
      />

      <text
        fontFamily='sans-serif'
        fontSize={3.6 * s}
        fontWeight='bold'
        letterSpacing={0.6 * s}
        fill={ink}
      >
        <textPath href={`#${topArcId}`} startOffset='50%' textAnchor='middle'>
          {BRAND_RING_TEXT}
        </textPath>
      </text>

      {song && (
        <>
          <text
            x={cx}
            y={cy - 9 * s}
            textAnchor='middle'
            fontFamily='sans-serif'
            fontSize={6 * s}
            fontWeight='bold'
            fill={ink}
            {...fitText(song.title, 6 * s, textMax)}
          >
            {song.title}
          </text>
          <text
            x={cx}
            y={cy - 3.5 * s}
            textAnchor='middle'
            fontFamily='sans-serif'
            fontSize={4.2 * s}
            fill={ink}
            {...fitText(song.artist, 4.2 * s, textMax)}
          >
            {song.artist}
          </text>
          {song.label.credit && (
            <text
              x={cx}
              y={cy + 10 * s}
              textAnchor='middle'
              fontFamily='sans-serif'
              fontSize={3.4 * s}
              fontStyle='italic'
              fill={ink}
              {...fitText(song.label.credit, 3.4 * s, textMax)}
            >
              {song.label.credit}
            </text>
          )}
          {catalogNumber && (
            <text
              x={cx - r + 14 * s}
              y={cy + 18 * s}
              fontFamily='sans-serif'
              fontSize={3 * s}
              fill={ink}
              fillOpacity={0.8}
            >
              {catalogNumber}
            </text>
          )}
          <text
            x={cx + r - 14 * s}
            y={cy + 18 * s}
            textAnchor='end'
            fontFamily='sans-serif'
            fontSize={3 * s}
            fill={ink}
            fillOpacity={0.8}
          >
            33⅓ RPM
          </text>
          <text fontFamily='sans-serif' fontSize={3.2 * s} fill={ink} letterSpacing={0.3 * s}>
            <textPath href={`#${bottomArcId}`} startOffset='50%' textAnchor='middle'>
              {bottomText}
            </textPath>
          </text>
        </>
      )}

      <circle data-part='spindle-hole' cx={cx} cy={cy} r={3 * s} fill='#111' />
    </g>
  )
}

export default RecordLabelArt
