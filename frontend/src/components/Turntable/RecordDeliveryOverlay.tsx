import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import RecordLabelArt from './RecordLabelArt'
import { labelInkColor } from './recordLabel'
import type { Song } from './songs'

interface RecordDeliveryOverlayProps {
  sleeveRef: React.RefObject<HTMLDivElement | null>
  recordRef: React.RefObject<HTMLDivElement | null>
  song?: Song
  catalogNumber?: string
}

// Matches TurntableSvg's record: radius 132 with a radius-38 label, so the
// traveling disc and the one that appears on the platter are pixel-identical
// at the moment of hand-off.
const RECORD_R = 132
const LABEL_R = 38

// The sleeve is the album cover. It's sized and positioned imperatively by
// useRecordDelivery (slightly larger than the record, centred on it), and
// rendered *after* the record so it stays in front: the disc is hidden
// inside the jacket until the delivery path carries it out from behind.
// Songs without artwork — or a cover that fails to load — get a plain jacket
// in the song's label colour so the flow never shows a blank square.
const Sleeve = ({ song }: { song?: Song }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const art = song?.albumArt
  const showArt = art && failedUrl !== art.url

  // A new song gets a fresh chance even if a previous cover failed.
  useEffect(() => setFailedUrl(null), [song?.id])

  const base = song?.label.color ?? '#3b2f2f'
  const ink = song ? labelInkColor(base) : '#f2f0e9'

  return (
    <>
      <div
        data-part='sleeve-jacket'
        className='absolute inset-0 flex flex-col items-center justify-center text-center'
        style={{ backgroundColor: base, color: ink, padding: '8%' }}
      >
        {song && (
          <>
            <div style={{ fontSize: '9cqw', fontWeight: 700, lineHeight: 1.1 }}>{song.title}</div>
            <div style={{ fontSize: '5.5cqw', opacity: 0.85, marginTop: '3%' }}>{song.artist}</div>
          </>
        )}
      </div>
      {showArt && (
        <img
          data-part='sleeve-cover'
          src={art.url}
          alt={art.alt}
          draggable={false}
          onError={() => setFailedUrl(art.url)}
          className='absolute inset-0 w-full h-full object-cover'
        />
      )}
    </>
  )
}

// Rendered via a portal straight onto <body>. The sleeve and record need to
// travel in from the actual viewport corner, which is impossible to reach
// from inside the turntable SVG — that content is clipped to the SVG's own
// local coordinate space, however the widget happens to be laid out on the
// page. Living outside that subtree (and outside any ancestor that might
// set a CSS transform, which would otherwise break `position: fixed`) is
// what lets these travel across the real screen.
const RecordDeliveryOverlay = ({
  sleeveRef,
  recordRef,
  song,
  catalogNumber,
}: RecordDeliveryOverlayProps) => {
  return createPortal(
    <div aria-hidden='true' className='fixed inset-0 pointer-events-none z-50'>
      <div
        ref={recordRef}
        className='absolute top-0 left-0 rounded-full'
        style={{
          width: 140,
          height: 140,
          opacity: 0,
          backgroundColor: '#161616',
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Same label art as the on-platter record, in the same proportions,
            so nothing visibly changes when the SVG's record takes over. */}
        <svg
          viewBox={`0 0 ${RECORD_R * 2} ${RECORD_R * 2}`}
          className='absolute inset-0 w-full h-full'
        >
          <RecordLabelArt
            cx={RECORD_R}
            cy={RECORD_R}
            r={LABEL_R}
            song={song}
            catalogNumber={catalogNumber}
          />
        </svg>
      </div>
      {/* After the record in DOM order = in front of it. */}
      <div
        ref={sleeveRef}
        data-part='sleeve'
        className='absolute top-0 left-0 overflow-hidden'
        style={{
          width: 140,
          height: 140,
          opacity: 0,
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          containerType: 'inline-size',
        }}
      >
        <Sleeve song={song} />
      </div>
    </div>,
    document.body
  )
}

export default RecordDeliveryOverlay
