import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useYouTubePlayer, type UseYouTubePlayerReturn } from './useYouTubePlayer'
import type { YouTubeIframeApi } from './youtubeTypes'

class FakeYouTubePlayer {
  static instances: FakeYouTubePlayer[] = []
  playVideo = vi.fn()
  pauseVideo = vi.fn()
  stopVideo = vi.fn()
  cueVideoById = vi.fn()
  loadVideoById = vi.fn()
  getCurrentTime = vi.fn(() => 42)
  getDuration = vi.fn(() => 210)
  getPlayerState = vi.fn(() => 1)
  destroy = vi.fn()
  private onReady?: (event: { target: FakeYouTubePlayer }) => void

  constructor(
    _el: string | HTMLElement,
    options: { events?: { onReady?: (e: { target: FakeYouTubePlayer }) => void } }
  ) {
    FakeYouTubePlayer.instances.push(this)
    this.onReady = options.events?.onReady
    queueMicrotask(() => this.onReady?.({ target: this }))
  }
}

// Test harness component — needed because the hook's containerRef must be
// attached to a real rendered DOM node before the player can be constructed.
const Harness = ({ onApi }: { onApi: (api: UseYouTubePlayerReturn) => void }) => {
  const api = useYouTubePlayer()
  onApi(api)
  return <div ref={api.containerRef} />
}

describe('useYouTubePlayer', () => {
  let latestApi: UseYouTubePlayerReturn

  beforeEach(() => {
    FakeYouTubePlayer.instances = []
    window.YT = { Player: FakeYouTubePlayer as unknown as YouTubeIframeApi['Player'] }
  })

  afterEach(() => {
    delete window.YT
    delete window.onYouTubeIframeAPIReady
  })

  const renderHarness = () => render(<Harness onApi={api => (latestApi = api)} />)

  it('becomes ready once the player fires onReady', async () => {
    renderHarness()

    await waitFor(() => expect(latestApi.isReady).toBe(true))
  })

  it('play/pause/stop call through to the underlying player', async () => {
    renderHarness()
    await waitFor(() => expect(latestApi.isReady).toBe(true))

    act(() => latestApi.play())
    act(() => latestApi.pause())
    act(() => latestApi.stop())

    const player = FakeYouTubePlayer.instances[0]
    expect(player.playVideo).toHaveBeenCalledTimes(1)
    expect(player.pauseVideo).toHaveBeenCalledTimes(1)
    expect(player.stopVideo).toHaveBeenCalledTimes(1)
  })

  it('getProgress reads currentTime/duration through from the player', async () => {
    renderHarness()
    await waitFor(() => expect(latestApi.isReady).toBe(true))

    expect(latestApi.getProgress()).toEqual({ currentTime: 42, duration: 210 })
  })

  it('destroys the player on unmount', async () => {
    const { unmount } = renderHarness()
    await waitFor(() => expect(latestApi.isReady).toBe(true))

    const player = FakeYouTubePlayer.instances[0]
    unmount()

    expect(player.destroy).toHaveBeenCalledTimes(1)
  })
})
