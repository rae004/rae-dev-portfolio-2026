interface TurntableSvgProps {
  className?: string
}

// Pure presentational top-down turntable illustration, modeled on a
// Technics SL-1200MK3. No animation logic lives here — useTurntableAnimation
// targets these groups via `[data-part="..."]` selectors scoped to the
// anime.js createScope root in Turntable.tsx.
//
// Layout landmarks (viewBox 0 0 400 400): platter centered at (180, 200),
// tonearm pivot at (330, 90). Both the platter and record groups share the
// platter's center as their rotation origin so the continuous spin and the
// record drop-in animation can target either independently.
const TurntableSvg = ({ className = '' }: TurntableSvgProps) => {
  const platterCenter = { x: 180, y: 200 }
  const platterRadius = 150

  const rimTicks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 2 * Math.PI
    const innerR = platterRadius - 14
    const outerR = platterRadius - 6
    const x1 = platterCenter.x + innerR * Math.cos(angle)
    const y1 = platterCenter.y + innerR * Math.sin(angle)
    const x2 = platterCenter.x + outerR * Math.cos(angle)
    const y2 = platterCenter.y + outerR * Math.sin(angle)
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={i % 5 === 0 ? '#f5f5f5' : '#9a9a9a'}
        strokeWidth={i % 5 === 0 ? 2 : 1}
      />
    )
  })

  return (
    <svg
      viewBox='0 0 400 400'
      className={className}
      role='img'
      aria-label='Illustration of a Technics turntable'
    >
      {/* Base / chassis */}
      <rect
        data-part='base'
        x={10}
        y={10}
        width={380}
        height={380}
        rx={10}
        fill='#d4d5d7'
        stroke='#3a3a3a'
        strokeWidth={3}
      />

      <circle data-part='strobe-window' cx={40} cy={40} r={14} fill='#555a5e' stroke='#2a2a2a' />
      <circle data-part='indicator-light' cx={210} cy={35} r={4} fill='#111' />

      {/* Platter — rotates continuously while playing */}
      <g
        data-part='platter'
        style={{ transformOrigin: `${platterCenter.x}px ${platterCenter.y}px` }}
      >
        <circle
          cx={platterCenter.x}
          cy={platterCenter.y}
          r={platterRadius}
          fill='#b7b8ba'
          stroke='#8a8b8d'
          strokeWidth={2}
        />
        <g data-part='platter-rim-ticks'>{rimTicks}</g>
      </g>

      {/* Record — drop-in target; rotates alongside the platter while playing */}
      <g
        data-part='record'
        style={{ transformOrigin: `${platterCenter.x}px ${platterCenter.y}px` }}
      >
        <circle cx={platterCenter.x} cy={platterCenter.y} r={132} fill='#161616' />
        <circle
          data-part='record-label'
          cx={platterCenter.x}
          cy={platterCenter.y}
          r={38}
          fill='#f2f0e9'
          stroke='#cfcabb'
        />
        <circle
          data-part='spindle-hole'
          cx={platterCenter.x}
          cy={platterCenter.y}
          r={3}
          fill='#111'
        />
      </g>

      {/* Pitch fader */}
      <g data-part='pitch-fader'>
        <rect x={345} y={140} width={10} height={110} rx={4} fill='#8c8d8f' />
        <rect x={339} y={185} width={22} height={10} rx={2} fill='#e4e4e4' stroke='#555' />
      </g>

      {/* Quartz pitch-reset knob + start/stop + speed selector cluster */}
      <circle data-part='quartz-knob' cx={55} cy={300} r={16} fill='#222' stroke='#555' />
      <rect
        data-part='start-stop-button'
        x={28}
        y={330}
        width={50}
        height={24}
        rx={3}
        fill='#cfcfcf'
        stroke='#555'
      />
      <rect
        data-part='speed-selector'
        x={90}
        y={330}
        width={44}
        height={24}
        rx={3}
        fill='#cfcfcf'
        stroke='#555'
      />
      <line x1={112} y1={330} x2={112} y2={354} stroke='#888' />

      {/* Tonearm assembly */}
      <g data-part='tonearm-assembly'>
        <circle data-part='tonearm-rest-peg' cx={300} cy={55} r={4} fill='#444' />
        <g data-part='tonearm-pivot' style={{ transformOrigin: '330px 90px' }}>
          <circle cx={330} cy={90} r={28} fill='#2c2c2c' stroke='#555' strokeWidth={2} />
          <circle
            cx={330}
            cy={90}
            r={19}
            fill='none'
            stroke='#777'
            strokeWidth={2}
            strokeDasharray='2 3'
          />
          <path
            data-part='tonearm-arm'
            d='M 322,98 C 300,120 262,150 250,190 C 245,205 240,215 234,222'
            stroke='#e0e0e0'
            strokeWidth={6}
            strokeLinecap='round'
            fill='none'
          />
          <rect
            data-part='headshell'
            x={222}
            y={216}
            width={20}
            height={11}
            rx={2}
            fill='#141414'
            transform='rotate(20 232 221)'
          />
        </g>
      </g>
    </svg>
  )
}

export default TurntableSvg
