import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Turntable from './Turntable'
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

vi.mock('./useYouTubePlayer', () => ({
  useYouTubePlayer: useYouTubePlayerMock,
}))

vi.mock('./useTurntableAnimation', () => ({
  useTurntableAnimation: () => animationMock,
}))

const songs: Song[] = [
  { id: 'a', title: 'Song A', artist: 'Artist A', youtubeId: 'aaa' },
  { id: 'b', title: 'Song B', artist: 'Artist B', youtubeId: 'bbb' },
]

describe('Turntable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
