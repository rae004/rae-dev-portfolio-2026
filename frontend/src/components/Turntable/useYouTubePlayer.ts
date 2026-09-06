import { useCallback, useEffect, useRef, useState } from 'react'
import type { YouTubePlayer, YouTubePlayerEvent } from './youtubeTypes'

const YT_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api'
const YT_SCRIPT_ID = 'youtube-iframe-api'

// Module-level singleton so multiple hook instances (or StrictMode's double
// effect invocation) never inject the script twice or clobber each other's
// window.onYouTubeIframeAPIReady callback.
let apiReadyPromise: Promise<void> | null = null

function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (apiReadyPromise) return apiReadyPromise

  apiReadyPromise = new Promise(resolve => {
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      resolve()
    }

    if (!document.getElementById(YT_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = YT_SCRIPT_ID
      script.src = YT_IFRAME_API_SRC
      document.head.appendChild(script)
    }
  })

  return apiReadyPromise
}

export interface YouTubeProgress {
  currentTime: number
  duration: number
}

export interface UseYouTubePlayerReturn {
  isReady: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  cue: (videoId: string) => void
  play: () => void
  pause: () => void
  stop: () => void
  getProgress: () => YouTubeProgress | null
}

// Wraps the YouTube IFrame Player API: script loading, player lifecycle,
// and simple imperative playback controls. Gated behind an explicit Play
// button click elsewhere, so autoplay-with-sound is not a concern here.
export const useYouTubePlayer = (
  onStateChange?: (state: number) => void,
  onError?: (errorCode: number) => void
): UseYouTubePlayerReturn => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const isReadyRef = useRef(false)
  // Player creation is async (script load + iframe handshake), so calls
  // made before onReady fires would otherwise silently no-op. Queue them
  // and flush in order once the player is actually ready.
  const pendingActionsRef = useRef<Array<() => void>>([])
  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [isReady, setIsReady] = useState(false)

  const callOrQueue = useCallback((action: () => void) => {
    if (isReadyRef.current) {
      action()
    } else {
      pendingActionsRef.current.push(action)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: 200,
        height: 113,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1 },
        events: {
          onReady: () => {
            isReadyRef.current = true
            setIsReady(true)
            const queued = pendingActionsRef.current
            pendingActionsRef.current = []
            queued.forEach(action => action())
          },
          onStateChange: (event: YouTubePlayerEvent) => onStateChangeRef.current?.(event.data),
          onError: (event: YouTubePlayerEvent) => onErrorRef.current?.(event.data),
        },
      })
    })

    return () => {
      cancelled = true
      isReadyRef.current = false
      pendingActionsRef.current = []
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  const cue = useCallback(
    (videoId: string) => {
      callOrQueue(() => playerRef.current?.cueVideoById(videoId))
    },
    [callOrQueue]
  )

  const play = useCallback(() => {
    callOrQueue(() => playerRef.current?.playVideo())
  }, [callOrQueue])

  const pause = useCallback(() => {
    callOrQueue(() => playerRef.current?.pauseVideo())
  }, [callOrQueue])

  const stop = useCallback(() => {
    callOrQueue(() => playerRef.current?.stopVideo())
  }, [callOrQueue])

  const getProgress = useCallback((): YouTubeProgress | null => {
    const player = playerRef.current
    if (!player) return null
    const duration = player.getDuration()
    if (!duration) return null
    return { currentTime: player.getCurrentTime(), duration }
  }, [])

  return { isReady, containerRef, cue, play, pause, stop, getProgress }
}
