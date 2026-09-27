import { createPortal } from 'react-dom'
import RecordLabelArt from './RecordLabelArt'
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
        ref={sleeveRef}
        className='absolute top-0 left-0'
        style={{
          width: 140,
          height: 140,
          opacity: 0,
          backgroundColor: '#3b2f2f',
          border: '3px solid #6b5b56',
          borderRadius: 6,
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 10,
            border: '1px solid #55433f',
            borderRadius: 3,
          }}
        />
      </div>
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
    </div>,
    document.body
  )
}

export default RecordDeliveryOverlay
