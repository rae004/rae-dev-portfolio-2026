import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TurntableSvg from './TurntableSvg'

describe('TurntableSvg', () => {
  it('renders without throwing and includes every expected landmark part', () => {
    const { container } = render(<TurntableSvg />)

    const expectedParts = [
      'base',
      'strobe-window',
      'indicator-light',
      'platter',
      'platter-rim-ticks',
      'record',
      'record-label',
      'spindle-hole',
      'pitch-fader',
      'quartz-knob',
      'start-stop-button',
      'speed-selector',
      'tonearm-assembly',
      'tonearm-pivot',
      'tonearm-arm',
      'headshell',
      'tonearm-rest-peg',
    ]

    for (const part of expectedParts) {
      expect(container.querySelector(`[data-part="${part}"]`)).not.toBeNull()
    }
  })
})
