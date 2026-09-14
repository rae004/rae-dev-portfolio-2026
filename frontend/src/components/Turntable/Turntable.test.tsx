import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Turntable from './Turntable'
import { resetOnboardingVisitDecision } from './useOnboardingEligibility'
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
  { id: 'a', title: 'Song A', artist: 'Artist A', youtubeId: 'aaa' },
  { id: 'b', title: 'Song B', artist: 'Artist B', youtubeId: 'bbb' },
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

  it('switching songs mid-play implicitly re-cues for the new song', () => {
    render(<Turntable songs={songs} />)

    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song A/ })))
    act(() => (animationMock.cueRecord.mock.calls[0][0] as () => void)())
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Play' })))

    act(() => fireEvent.click(screen.getByRole('radio', { name: /Song B/ })))

    expect(youtubeMock.cue).toHaveBeenLastCalledWith('bbb')
    expect(screen.getByRole('status')).toHaveTextContent(/Cueing Song B/)
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
