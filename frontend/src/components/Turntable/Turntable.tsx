import { useCallback, useEffect, useReducer, useRef } from 'react'
import TurntableSvg from './TurntableSvg'
import SongList from './SongList'
import { useYouTubePlayer } from './useYouTubePlayer'
import { useTurntableAnimation } from './useTurntableAnimation'
import { YT_PLAYER_STATE } from './youtubeTypes'
import type { Song } from './songs'

interface TurntableProps {
  songs: Song[]
}

type TurntableState =
  | { status: 'idle' }
  | { status: 'cueing'; songId: string }
  | { status: 'cued'; songId: string }
  | { status: 'playing'; songId: string }
  | { status: 'paused'; songId: string }
  | { status: 'stopping'; songId: string }

type TurntableAction =
  | { type: 'SELECT_SONG'; songId: string }
  | { type: 'CUE_COMPLETE' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'STOP_COMPLETE' }

const reducer = (state: TurntableState, action: TurntableAction): TurntableState => {
  switch (action.type) {
    case 'SELECT_SONG':
      // Selecting a different song while non-idle is treated as an implicit
      // stop-then-recue for this prototype — no dedicated "switch" state.
      if (state.status === 'idle' || state.songId !== action.songId) {
        return { status: 'cueing', songId: action.songId }
      }
      return state
    case 'CUE_COMPLETE':
      return state.status === 'cueing' ? { status: 'cued', songId: state.songId } : state
    case 'PLAY':
      return state.status === 'cued' || state.status === 'paused'
        ? { status: 'playing', songId: state.songId }
        : state
    case 'PAUSE':
      return state.status === 'playing' ? { status: 'paused', songId: state.songId } : state
    case 'STOP':
      // Also valid from 'cueing' so a YouTube error firing before the cue
      // animation finishes (e.g. embedding disabled) doesn't strand the
      // widget mid-cue with no way back to idle.
      return state.status === 'playing' ||
        state.status === 'paused' ||
        state.status === 'cued' ||
        state.status === 'cueing'
        ? { status: 'stopping', songId: state.songId }
        : state
    case 'STOP_COMPLETE':
      return state.status === 'stopping' ? { status: 'idle' } : state
    default:
      return state
  }
}

const statusMessage = (state: TurntableState, songs: Song[]): string => {
  const song = 'songId' in state ? songs.find(s => s.id === state.songId) : undefined
  const label = song ? `${song.title} by ${song.artist}` : ''
  switch (state.status) {
    case 'idle':
      return 'No song selected'
    case 'cueing':
      return `Cueing ${label}…`
    case 'cued':
      return `Ready to play ${label}`
    case 'playing':
      return `Now playing ${label}`
    case 'paused':
      return `Paused — ${label}`
    case 'stopping':
      return `Stopping ${label}…`
    default:
      return ''
  }
}

const Turntable = ({ songs }: TurntableProps) => {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })
  const rootRef = useRef<HTMLDivElement | null>(null)
  const progressFrameRef = useRef<number | null>(null)
  const spinStartedRef = useRef(false)

  const handleYouTubeStateChange = useCallback((ytState: number) => {
    if (ytState === YT_PLAYER_STATE.ENDED) {
      dispatch({ type: 'STOP' })
    }
  }, [])

  const handleYouTubeError = useCallback((errorCode: number) => {
    // Common causes: 101/150 = embedding disabled by the video owner,
    // 100 = video removed/private. Surface this loudly — a silent reset
    // back to idle otherwise looks like a UI bug rather than a bad video ID.
    console.warn(
      `[Turntable] YouTube playback error ${errorCode} — this video may not allow iframe embedding. Falling back to idle.`
    )
    dispatch({ type: 'STOP' })
  }, [])

  const youtube = useYouTubePlayer(handleYouTubeStateChange, handleYouTubeError)
  const animation = useTurntableAnimation(rootRef)

  const selectedSong = 'songId' in state ? songs.find(s => s.id === state.songId) : undefined

  // Drive the tonearm's inward creep purely as a function of YouTube's own
  // playback progress (currentTime / duration) — YouTube's clock is the
  // single source of truth for a/v sync, anime.js just renders it.
  useEffect(() => {
    if (state.status !== 'playing') return

    const tick = () => {
      const progress = youtube.getProgress()
      if (progress && progress.duration > 0) {
        animation.seekTonearm(progress.currentTime / progress.duration)
      }
      progressFrameRef.current = requestAnimationFrame(tick)
    }
    progressFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (progressFrameRef.current !== null) cancelAnimationFrame(progressFrameRef.current)
    }
  }, [state.status, youtube, animation])

  // React to state transitions by driving the animation + YouTube player.
  useEffect(() => {
    if (state.status === 'cueing') {
      youtube.cue(songs.find(s => s.id === state.songId)?.youtubeId ?? '')
      animation.cueRecord(() => dispatch({ type: 'CUE_COMPLETE' }))
    } else if (state.status === 'playing') {
      youtube.play()
      if (spinStartedRef.current) {
        animation.spinResume()
      } else {
        animation.spinStart()
        spinStartedRef.current = true
      }
    } else if (state.status === 'paused') {
      youtube.pause()
      animation.spinPause()
    } else if (state.status === 'stopping') {
      youtube.stop()
      spinStartedRef.current = false
      animation.returnTonearm(() => dispatch({ type: 'STOP_COMPLETE' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const handleSelect = (song: Song) => {
    dispatch({ type: 'SELECT_SONG', songId: song.id })
  }

  const isListDisabled =
    state.status === 'cueing' ||
    state.status === 'playing' ||
    state.status === 'paused' ||
    state.status === 'stopping'
  const canPlay = state.status === 'cued' || state.status === 'paused'
  const canPause = state.status === 'playing'
  const canStop = state.status === 'playing' || state.status === 'paused' || state.status === 'cued'

  return (
    <div
      ref={rootRef}
      className='relative flex flex-col items-center gap-8 w-full max-w-3xl mx-auto'
    >
      <div className='w-full aspect-square'>
        <TurntableSvg className='w-full h-full drop-shadow-xl' />
      </div>

      <div className='flex flex-col gap-4 w-full max-w-2xl'>
        <SongList
          songs={songs}
          selectedSongId={selectedSong?.id ?? null}
          disabled={isListDisabled}
          onSelect={handleSelect}
        />

        <div className='flex gap-2 justify-center'>
          <button
            type='button'
            className='btn btn-primary'
            disabled={!canPlay}
            onClick={() => dispatch({ type: 'PLAY' })}
          >
            Play
          </button>
          <button
            type='button'
            className='btn btn-outline'
            disabled={!canPause}
            onClick={() => dispatch({ type: 'PAUSE' })}
          >
            Pause
          </button>
          <button
            type='button'
            className='btn btn-outline'
            disabled={!canStop}
            onClick={() => dispatch({ type: 'STOP' })}
          >
            Stop
          </button>
        </div>

        <div aria-live='polite' role='status' className='sr-only'>
          {statusMessage(state, songs)}
        </div>
      </div>

      {/* Hidden YouTube player — audio only, no visible chrome. */}
      <div
        ref={youtube.containerRef}
        className='absolute w-px h-px overflow-hidden opacity-0 pointer-events-none'
      />
    </div>
  )
}

export default Turntable
