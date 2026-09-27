import { useCallback, useEffect, useReducer, useRef } from 'react'
import TurntableSvg from './TurntableSvg'
import SongList from './SongList'
import TransportButton from './TransportButton'
import RecordDeliveryOverlay from './RecordDeliveryOverlay'
import OnboardingTour from './OnboardingTour'
import { useYouTubePlayer } from './useYouTubePlayer'
import { useTurntableAnimation } from './useTurntableAnimation'
import { useRecordDelivery } from './useRecordDelivery'
import { YT_PLAYER_STATE } from './youtubeTypes'
import { catalogNumberFor } from './songs'
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
  // `nextSongId` is set when the stop is the first half of a song switch:
  // once the old record has lifted off and the arm is back at rest, we
  // re-cue that song instead of settling at idle.
  | { status: 'stopping'; songId: string; nextSongId?: string }

export type TurntableStatus = TurntableState['status']

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
      if (state.status === 'idle') {
        return { status: 'cueing', songId: action.songId }
      }
      if (state.songId === action.songId) return state
      // A different song while a record is already on the platter: stop
      // first (record lifts off, arm returns), *then* cue the new one.
      // Jumping straight to `cueing` left the old record visible on the
      // platter — instantly re-labelled as the new song — while a duplicate
      // flew in from the corner. Mid-cue the record hasn't landed yet, so
      // there's nothing to lift; re-cue directly (the list is disabled
      // during cueing anyway, so this is only reachable programmatically).
      if (state.status === 'cueing') {
        return { status: 'cueing', songId: action.songId }
      }
      if (state.status === 'stopping') {
        return { ...state, nextSongId: action.songId }
      }
      return { status: 'stopping', songId: state.songId, nextSongId: action.songId }
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
      if (state.status !== 'stopping') return state
      return state.nextSongId ? { status: 'cueing', songId: state.nextSongId } : { status: 'idle' }
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
    case 'stopping': {
      const next = state.nextSongId ? songs.find(s => s.id === state.nextSongId) : undefined
      return next ? `Switching to ${next.title} by ${next.artist}…` : `Stopping ${label}…`
    }
    default:
      return ''
  }
}

const Turntable = ({ songs }: TurntableProps) => {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })
  const rootRef = useRef<HTMLDivElement | null>(null)
  const progressFrameRef = useRef<number | null>(null)
  const spinStartedRef = useRef(false)
  const sleeveRef = useRef<HTMLDivElement | null>(null)
  const deliveryRecordRef = useRef<HTMLDivElement | null>(null)

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
  const { deliverRecord } = useRecordDelivery(sleeveRef, deliveryRecordRef)

  const selectedSong = 'songId' in state ? songs.find(s => s.id === state.songId) : undefined
  const catalogNumber = selectedSong ? catalogNumberFor(songs, selectedSong.id) : undefined

  // Drive the tonearm's inward creep purely as a function of YouTube's own
  // playback progress (currentTime / duration) — YouTube's clock is the
  // single source of truth for a/v sync, anime.js just renders it.
  useEffect(() => {
    if (state.status !== 'playing') return
    let cancelled = false

    const tick = () => {
      // Defensive guard: cancelAnimationFrame should make this unreachable
      // once we leave 'playing', but a stray/delayed callback here would
      // otherwise fight returnTonearm's animation back to rest with a stale
      // seekTonearm() call — never let this loop touch the tonearm once
      // something else has taken over.
      if (cancelled) return
      const progress = youtube.getProgress()
      if (progress && progress.duration > 0) {
        animation.seekTonearm(progress.currentTime / progress.duration)
      }
      progressFrameRef.current = requestAnimationFrame(tick)
    }
    progressFrameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (progressFrameRef.current !== null) cancelAnimationFrame(progressFrameRef.current)
    }
  }, [state.status, youtube, animation])

  // React to state transitions by driving the animation + YouTube player.
  useEffect(() => {
    // Plain style write, not a React prop — TurntableSvg is memoized so
    // anime.js's imperative DOM mutations elsewhere (tonearm rotate, record
    // opacity) survive reducer-driven re-renders; a prop that changes with
    // playback state would force it to re-render and reset those.
    const strobe = rootRef.current?.querySelector<HTMLElement>('[data-part="strobe-light"]')
    if (strobe) {
      strobe.style.opacity = state.status === 'playing' || state.status === 'paused' ? '1' : '0'
    }

    if (state.status === 'cueing') {
      youtube.cue(songs.find(s => s.id === state.songId)?.youtubeId ?? '')
      const platter = rootRef.current?.querySelector('[data-part="platter"]')
      const startCueRecord = () => animation.cueRecord(() => dispatch({ type: 'CUE_COMPLETE' }))
      if (platter) {
        // Deliver the record from the viewport corner first — the tonearm
        // shouldn't swing toward the platter until there's actually a
        // record on it. cueRecord (record reveal + tonearm cue-in) starts
        // only once it lands.
        deliverRecord({ targetRect: platter.getBoundingClientRect(), onLanded: startCueRecord })
      } else {
        startCueRecord()
      }
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
      <div className='relative w-full aspect-square'>
        <TurntableSvg
          className='w-full h-full drop-shadow-xl'
          song={selectedSong}
          catalogNumber={catalogNumber}
        />
        <TransportButton
          mode={state.status === 'playing' || state.status === 'paused' ? 'split' : 'single'}
          isPlaying={state.status === 'playing'}
          canPlay={canPlay}
          canPause={canPause}
          canStop={canStop}
          attention={state.status === 'cued'}
          onPlay={() => dispatch({ type: 'PLAY' })}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onStop={() => dispatch({ type: 'STOP' })}
        />
      </div>

      <div className='flex flex-col gap-4 w-full max-w-2xl'>
        <SongList
          songs={songs}
          selectedSongId={selectedSong?.id ?? null}
          disabled={isListDisabled}
          onSelect={handleSelect}
        />

        <div aria-live='polite' role='status' className='sr-only'>
          {statusMessage(state, songs)}
        </div>
      </div>

      <RecordDeliveryOverlay
        sleeveRef={sleeveRef}
        recordRef={deliveryRecordRef}
        song={selectedSong}
        catalogNumber={catalogNumber}
      />
      <OnboardingTour status={state.status} rootRef={rootRef} firstSongId={songs[0]?.id} />

      {/* Hidden YouTube player — audio only, no visible chrome. */}
      <div
        ref={youtube.containerRef}
        className='absolute w-px h-px overflow-hidden opacity-0 pointer-events-none'
      />
    </div>
  )
}

export default Turntable
