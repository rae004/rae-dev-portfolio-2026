// Minimal ambient types for the slice of the YouTube IFrame Player API this
// widget actually uses. Not pulling in a full @types/youtube dependency for
// a handful of methods.

export const YT_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
} as const

export interface YouTubePlayer {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  cueVideoById(videoId: string): void
  loadVideoById(videoId: string): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  destroy(): void
}

export interface YouTubePlayerEvent {
  target: YouTubePlayer
  data: number
}

export interface YouTubePlayerOptions {
  height?: string | number
  width?: string | number
  videoId?: string
  playerVars?: Record<string, number | string>
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void
    onStateChange?: (event: YouTubePlayerEvent) => void
    onError?: (event: YouTubePlayerEvent) => void
  }
}

export interface YouTubeIframeApi {
  Player: new (elementId: string | HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi
    onYouTubeIframeAPIReady?: () => void
  }
}
