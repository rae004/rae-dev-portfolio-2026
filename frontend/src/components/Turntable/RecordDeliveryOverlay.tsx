import { createPortal } from 'react-dom'

interface RecordDeliveryOverlayProps {
  sleeveRef: React.RefObject<HTMLDivElement | null>
  recordRef: React.RefObject<HTMLDivElement | null>
}

// Rendered via a portal straight onto <body>. The sleeve and record need to
// travel in from the actual viewport corner, which is impossible to reach
// from inside the turntable SVG — that content is clipped to the SVG's own
// local coordinate space, however the widget happens to be laid out on the
// page. Living outside that subtree (and outside any ancestor that might
// set a CSS transform, which would otherwise break `position: fixed`) is
// what lets these travel across the real screen.
const RecordDeliveryOverlay = ({ sleeveRef, recordRef }: RecordDeliveryOverlayProps) => {
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
        <div
          className='absolute rounded-full'
          style={{
            top: '35.5%',
            left: '35.5%',
            width: '29%',
            height: '29%',
            backgroundColor: '#f2f0e9',
            border: '1px solid #cfcabb',
          }}
        />
        {/* Spindle hole — matches the SVG record's, so it doesn't visibly
            appear only once the traveling record fades into the real one. */}
        <div
          className='absolute rounded-full'
          style={{
            top: '50%',
            left: '50%',
            width: '2.3%',
            height: '2.3%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#111',
          }}
        />
      </div>
    </div>,
    document.body
  )
}

export default RecordDeliveryOverlay
