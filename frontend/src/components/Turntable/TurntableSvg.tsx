import { memo } from 'react'
import { TONEARM_REST_ANGLE } from './turntableConfig'

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
//
// memo() here isn't just a perf nicety — it's load-bearing. Once mounted,
// anime.js owns this subtree's `rotate`/`translateY`/`opacity` styles via
// direct DOM manipulation. `className` never actually changes, but without
// memo, every reducer-driven re-render in Turntable.tsx would still cause
// React to reconcile this component's JSX and reset the tonearm's inline
// `rotate` back to TONEARM_REST_ANGLE mid-animation, fighting anime.js.
const TurntableSvgBase = ({ className = '' }: TurntableSvgProps) => {
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
      <defs>
        {/* stopOpacity alone controls fade — previously the color also
            carried an alpha channel (#ff3b3089) on top of it, so the two
            multiplied together into an effective ~0.48/~0.24/0 fade. These
            values reproduce that same look through one control. */}
        <radialGradient id='strobeGlow' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#ff3b30' stopOpacity={0.48} />
          <stop offset='60%' stopColor='#ff3b30' stopOpacity={0.24} />
          <stop offset='100%' stopColor='#ff3b30' stopOpacity={0} />
        </radialGradient>
      </defs>

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

      {/* Slip mat — always visible under the record, printed with two
          mirrored "Technics" logos (real slipmats are symmetric so they read
          correctly from either side) matching the reference mat. */}
      <g data-part='slip-mat'>
        {/* Matches the record's own radius (132) so it never encroaches on
            the platter-rim-ticks band (136-144) — that gap is what makes
            the platter's spin visible/realistic while the record covers it. */}
        <circle cx={platterCenter.x} cy={platterCenter.y} r={132} fill='#161616' />
        <circle
          cx={platterCenter.x}
          cy={platterCenter.y}
          r={122}
          fill='none'
          stroke='#4a4a4a'
          strokeWidth={1}
        />
        <text
          x={platterCenter.x}
          y={platterCenter.y - 10}
          textAnchor='middle'
          fontFamily='sans-serif'
          fontWeight='bold'
          fontSize={22}
          textLength={160}
          lengthAdjust='spacingAndGlyphs'
          fill='#c7cbd0'
          transform={`rotate(-40 ${platterCenter.x} ${platterCenter.y})`}
        >
          Technics
        </text>
        <text
          x={platterCenter.x}
          y={platterCenter.y - 10}
          textAnchor='middle'
          fontFamily='sans-serif'
          fontWeight='bold'
          fontSize={22}
          textLength={160}
          lengthAdjust='spacingAndGlyphs'
          fill='#8a83ab'
          transform={`rotate(140 ${platterCenter.x} ${platterCenter.y})`}
        >
          Technics
        </text>
        <circle cx={platterCenter.x} cy={platterCenter.y} r={2.5} fill='#f2f0e9' />
      </g>

      {/* Record — drop-in target; hidden until a song is cued, revealing the
          slip mat above at rest. Rotates alongside the platter while playing. */}
      <g
        data-part='record'
        style={{ transformOrigin: `${platterCenter.x}px ${platterCenter.y}px`, opacity: 0 }}
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
        <rect x={361} y={220} width={10} height={115} rx={4} fill='#8c8d8f' />
        <rect x={355} y={272} width={22} height={10} rx={2} fill='#e4e4e4' stroke='#555' />
      </g>

      {/* Brand plate — sits in the gap between the record's lower-right edge
          and the pitch fader, matching the real SL-1200MK3's badge position. */}
      <text
        data-part='brand-plate'
        x={255.5}
        y={360}
        fontFamily='sans-serif'
        fontSize={6}
        fill='#333'
        textLength={64}
        lengthAdjust='spacingAndGlyphs'
      >
        <tspan fontWeight='bold'>Technics</tspan> <tspan fontStyle='italic'>Quartz</tspan>
      </text>
      <text
        data-part='brand-plate'
        x={256}
        y={365}
        fontFamily='sans-serif'
        fontSize={4}
        fill='#333'
        textLength={85}
        lengthAdjust='spacingAndGlyphs'
      >
        Direct Drive Turntable System SL-1200MK3
      </text>

      <rect
        data-part='start-stop-button'
        x={28}
        y={337}
        width={50}
        height={38}
        rx={3}
        fill='#cfcfcf'
        stroke='#555'
      />

      <rect
        data-part='speed-selector'
        x={95}
        y={365}
        width={44}
        height={10}
        rx={3}
        fill='#cfcfcf'
        stroke='#555'
      />
      <line x1={117} y1={365} x2={117} y2={375} stroke='#888' />

      {/* Tonearm assembly */}
      <g data-part='tonearm-assembly'>
        <circle data-part='tonearm-rest-peg' cx={300} cy={55} r={4} fill='#444' />
        <g
          data-part='tonearm-pivot'
          style={{ transformOrigin: '330px 90px', rotate: `${TONEARM_REST_ANGLE}deg` }}
        >
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
            d='M 320,100 C 293,127 247,164 232,213 C 226,231 220,243 212,252'
            stroke='#e0e0e0'
            strokeWidth={6}
            strokeLinecap='round'
            fill='none'
          />
          <rect
            data-part='headshell'
            x={200}
            y={245}
            width={20}
            height={11}
            rx={2}
            fill='#141414'
            stroke='#f2f0e9'
            strokeWidth={0.75}
            strokeOpacity={0.6}
            transform='rotate(20 210 250)'
          />
          {/* Stylus tip — the headshell (#141414) is nearly the same color
              as the record (#161616), so it all but vanishes once it's over
              the vinyl. A small light dot at the leading edge, with a dark
              outline so it also reads against the light chassis at rest,
              stays visible in both contexts without changing the
              headshell's own realistic dark color. */}
          <circle
            cx={200}
            cy={250.5}
            r={2}
            fill='#f2f0e9'
            stroke='#333'
            strokeWidth={0.5}
            transform='rotate(20 210 250)'
          />
        </g>
      </g>
      {/* Strobe light — real SL-1200s illuminate the platter's edge dots so
      you can visually check rotational speed; ours just glows red
      while the platter's actually spinning (playing) or paused
      mid-song, off at rest. A small lamp near the quartz knob (its real
      position) plus a soft glow projected onto the nearest tick marks,
      rather than an animated beam — the effect reads fine as a static
      glow, and this stays a plain opacity toggle Turntable.tsx can
      drive imperatively like everything else, with no re-render risk.
      Default opacity here is 0 (off) — Turntable.tsx overrides it to 1
      while playing/paused, but this element must default to *off*, not
      rely solely on that effect running, so a future refactor that ever
      failed to find it fails safe (dark) instead of stuck visibly glowing. */}
      <g data-part='strobe-light' style={{ opacity: 0 }}>
        <defs>
          {/* Defines a wedge/cone pointing up and slightly right toward the platter */}
          {/* Origin starts near the lamp center (55, 299) and widens outward */}
          <clipPath id='strobe-cone'>
            <polygon points='50,302 60,260 130,285' />
          </clipPath>
        </defs>

        {/* The soft glow is constrained to only shine toward the platter */}
        <g clip-path='url(#strobe-cone)'>
          <circle cx={60} cy={295} r={15} fill='url(#strobeGlow)' />
        </g>
      </g>
      {/* Quartz pitch-reset knob + start/stop + speed selector cluster */}
      <circle data-part='quartz-knob' cx={45} cy={310} r={16} fill='#222' stroke='#555' />
    </svg>
  )
}

const TurntableSvg = memo(TurntableSvgBase)

export default TurntableSvg
