import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Turntable from './Turntable'
import { resetOnboardingVisitDecision } from './useOnboardingEligibility'
import { BRAND_RING_TEXT } from './recordLabel'
import type { Song } from './songs'

const youtubeMock = vi.hoisted(() => ({
  isReady: true,
  containerRef: { current: null },
  cue: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  getProgress: vi.fn(() => ({ currentTime: 0, duration: 100 })),
}))

const animationMock = vi.hoisted(() => ({
  cueRecord: vi.fn(),
  spinStart: vi.fn(),
  spinPause: vi.fn(),
  spinResume: vi.fn(),
  returnTonearm: vi.fn(),
  seekTonearm: vi.fn(),
}))

const useYouTubePlayerMock = vi.hoisted(() => vi.fn())

// Lands the record instantly rather than waiting on a real anime.js
// animation timeline, so tests can assert cueRecord's synchronous effects
// without ticking real animation frames.
const deliverRecordMock = vi.hoisted(() =>
  vi.fn(({ onLanded }: { onLanded: () => void }) => onLanded())
)

vi.mock('./useYouTubePlayer', () => ({
  useYouTubePlayer: useYouTubePlayerMock,
}))

vi.mock('./useTurntableAnimation', () => ({
  useTurntableAnimation: () => animationMock,
}))

vi.mock('./useRecordDelivery', () => ({
  useRecordDelivery: () => ({ deliverRecord: deliverRecordMock }),
}))

const songs: Song[] = [
  {
    id: 'a',
    title: 'Song A',
    artist: 'Artist A',
    youtubeId: 'aaa',
    label: { color: '#c8102e', recordLabel: 'Label A', year: 2001, credit: 'Mixing Engineer' },
  },
  {
    id: 'b',
    title: 'Song B',
    artist: 'Artist B',
    youtubeId: 'bbb',
    label: { color: '#1f5fa8', recordLabel: 'Label B', year: 2002 },
  },
]

const selectSongA = () => act(() => fireEvent.click(screen.getByRole('radio', { name: /Song A/ })))
const completeCue = () => act(() => (animationMock.cueRecord.mock.calls[0][0] as () => void)())
const pressPlay = () => act(() => fireEvent.click(screen.getByRole('button', { name: 'Play' })))

describe('Turntable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    resetOnboardingVisitDecision()
    youtubeMock.getProgress.mockReturnValue({ currentTime: 0, duration: 100 })
    useYouTubePlayerMock.mockReturnValue(youtubeMock)
  })

  it('walks through the full select → cue → play → pause → play → stop flow', () => {
    render(<Turntable songs={songs} />)

    // idle: Play disabled
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()

    // select a song -> cueing
    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song A/ })))
    expect(youtubeMock.cue).toHaveBeenCalledWith('aaa')
    expect(animationMock.cueRecord).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(/Cueing Song A/)

    // simulate the cue animation completing -> cued
    const cueOnComplete = animationMock.cueRecord.mock.calls[0][0] as () => void
    act(() => cueOnComplete())
    expect(screen.getByRole('button', { name: 'Play' })).not.toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Ready to play Song A/)

    // press Play -> playing, spin starts fresh
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Play' })))
    expect(youtubeMock.play).toHaveBeenCalledTimes(1)
    expect(animationMock.spinStart).toHaveBeenCalledTimes(1)
    expect(animationMock.spinResume).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/Now playing Song A/)

    // press Pause -> paused
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Pause' })))
    expect(youtubeMock.pause).toHaveBeenCalledTimes(1)
    expect(animationMock.spinPause).toHaveBeenCalledTimes(1)

    // press Play again -> resumes rather than restarting the spin animation
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Play' })))
    expect(animationMock.spinResume).toHaveBeenCalledTimes(1)
    expect(animationMock.spinStart).toHaveBeenCalledTimes(1)

    // press Stop -> stopping, then STOP_COMPLETE -> idle
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop' })))
    expect(youtubeMock.stop).toHaveBeenCalledTimes(1)
    const stopOnComplete = animationMock.returnTonearm.mock.calls[0][0] as () => void
    act(() => stopOnComplete())
    expect(screen.getByRole('status')).toHaveTextContent(/No song selected/)
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  })

  it('auto-transitions to stopping when YouTube reports the video ended', () => {
    render(<Turntable songs={songs} />)

    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song A/ })))
    act(() => (animationMock.cueRecord.mock.calls[0][0] as () => void)())
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Play' })))

    const onStateChange = useYouTubePlayerMock.mock.calls[0][0] as (state: number) => void
    const YT_ENDED = 0
    act(() => onStateChange(YT_ENDED))

    expect(youtubeMock.stop).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(/Stopping Song A/)
  })

  it('switching songs mid-play stops first, then re-cues the new song', () => {
    render(<Turntable songs={songs} />)

    selectSongA()
    completeCue()
    pressPlay()

    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song B/ })))

    // Old record lifts off and the arm returns before anything new arrives.
    expect(youtubeMock.stop).toHaveBeenCalledTimes(1)
    expect(animationMock.returnTonearm).toHaveBeenCalledTimes(1)
    expect(youtubeMock.cue).toHaveBeenCalledTimes(1) // still only 'aaa'
    expect(screen.getByRole('status')).toHaveTextContent(/Switching to Song B/)

    act(() => (animationMock.returnTonearm.mock.calls[0][0] as () => void)())
    expect(youtubeMock.cue).toHaveBeenLastCalledWith('bbb')
    expect(screen.getByRole('status')).toHaveTextContent(/Cueing Song B/)
  })

  it('switching songs while cued (never played) lifts the old record before delivering the new one', () => {
    render(<Turntable songs={songs} />)

    selectSongA()
    completeCue()
    expect(deliverRecordMock).toHaveBeenCalledTimes(1)

    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song B/ })))

    // No second delivery yet — the old record is still lifting off, and the
    // label on it must still be song A's.
    expect(deliverRecordMock).toHaveBeenCalledTimes(1)
    expect(animationMock.returnTonearm).toHaveBeenCalledTimes(1)
    const labelText = document.querySelector(
      '[data-part="record"] [data-part="record-label-art"]'
    )?.textContent
    expect(labelText).toContain('Song A')
    expect(labelText).not.toContain('Song B')

    act(() => (animationMock.returnTonearm.mock.calls[0][0] as () => void)())
    expect(deliverRecordMock).toHaveBeenCalledTimes(2)
    expect(
      document.querySelector('[data-part="record"] [data-part="record-label-art"]')?.textContent
    ).toContain('Song B')
  })

  it('prints the selected song on the record label (platter and delivery disc alike)', () => {
    render(<Turntable songs={songs} />)
    const labelText = () =>
      [...document.querySelectorAll('[data-part="record-label-art"]')].map(g => g.textContent)

    // Idle: brand ring only, no song facts, on both discs.
    expect(labelText()).toHaveLength(2)
    for (const t of labelText()) {
      expect(t).toContain(BRAND_RING_TEXT)
      expect(t).not.toContain('Song A')
    }

    selectSongA()
    for (const t of labelText()) {
      expect(t).toContain('Song A')
      expect(t).toContain('Artist A')
      expect(t).toContain('Mixing Engineer')
      expect(t).toContain('℗ 2001 LABEL A')
      expect(t).toContain('RD-001')
    }

    // Switching songs re-prints the label; song B has no credit line.
    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song B/ })))
    for (const t of labelText()) {
      expect(t).toContain('Song B')
      expect(t).toContain('RD-002')
      expect(t).not.toContain('Mixing Engineer')
    }
  })

  it('highlights Play only between cueing a song and pressing it', () => {
    render(<Turntable songs={songs} />)
    const attention = () => document.querySelector('[data-attention]')

    expect(attention()).toBeNull()
    selectSongA()
    expect(attention()).toBeNull() // still cueing — Play isn't pressable yet
    completeCue()
    expect(attention()).not.toBeNull()
    pressPlay()
    expect(attention()).toBeNull()

    // Pausing re-enables Play, but the highlight is only for the first press.
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Pause' })))
    expect(attention()).toBeNull()
  })

  describe('onboarding tour', () => {
    it('walks a first-time visitor through select → play, then clears', () => {
      render(<Turntable songs={songs} />)

      // Step 1 on load.
      expect(screen.getByText('Select a song')).toBeInTheDocument()
      expect(screen.queryByText('Now click play')).not.toBeInTheDocument()

      // Selecting hides step 1 immediately; step 2 waits for the cue to
      // finish (Play is disabled until then, and the record delivery
      // animation passes through where the bubble would be).
      selectSongA()
      expect(screen.queryByText('Select a song')).not.toBeInTheDocument()
      expect(screen.queryByText('Now click play')).not.toBeInTheDocument()

      completeCue()
      expect(screen.getByText('Now click play')).toBeInTheDocument()

      // Pressing Play ends the tour for good.
      pressPlay()
      expect(screen.queryByText('Now click play')).not.toBeInTheDocument()
      expect(screen.queryByText('Select a song')).not.toBeInTheDocument()

      // Even after stopping back to idle it stays gone this session.
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop' })))
      act(() => (animationMock.returnTonearm.mock.calls[0][0] as () => void)())
      expect(screen.getByRole('status')).toHaveTextContent(/No song selected/)
      expect(screen.queryByText('Select a song')).not.toBeInTheDocument()
    })

    it('falls back to step 1 if the cued video errors before it ever plays', () => {
      render(<Turntable songs={songs} />)
      selectSongA()
      completeCue()
      expect(screen.getByText('Now click play')).toBeInTheDocument()

      // e.g. embedding disabled on the video — the widget resets to idle,
      // so the tour should point back at the song list, not at Play.
      const onError = useYouTubePlayerMock.mock.calls[0][1] as (code: number) => void
      act(() => onError(150))
      act(() => (animationMock.returnTonearm.mock.calls[0][0] as () => void)())
      expect(screen.getByRole('status')).toHaveTextContent(/No song selected/)
      expect(screen.getByText('Select a song')).toBeInTheDocument()
      expect(screen.queryByText('Now click play')).not.toBeInTheDocument()
    })

    it('does not run for a visitor seen within the last 7 days', () => {
      window.localStorage.setItem(
        'rae-turntable-onboarding-last-visit',
        String(Date.now() - 24 * 60 * 60 * 1000)
      )
      render(<Turntable songs={songs} />)
      expect(screen.queryByText('Select a song')).not.toBeInTheDocument()
      selectSongA()
      completeCue()
      expect(screen.queryByText('Now click play')).not.toBeInTheDocument()
    })
  })
})
