export type TransportMode = 'single' | 'split'

interface TransportButtonProps {
  mode: TransportMode
  // Only meaningful in 'split' mode: while actually playing, the left half
  // is Pause; while paused, it becomes Play (resume) so Stop stays reachable
  // without switching back to single mode.
  isPlaying: boolean
  canPlay: boolean
  canPause: boolean
  canStop: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

// Overlays TurntableSvg's decorative start-stop-button rect (x=28 y=337
// width=50 height=38 in a 400x400 viewBox) with a real interactive control,
// expressed as percentages so it stays aligned as the square SVG container
// scales responsively.
const BUTTON_BOUNDS = { left: '7%', top: '84.25%', width: '12.5%', height: '9.5%' }

const buttonClasses =
  'flex items-center justify-center h-full transition-colors enabled:hover:bg-black/5 enabled:active:bg-black/10 disabled:cursor-not-allowed'

const PlayIcon = () => (
  <svg viewBox='0 0 24 24' className='w-2/5 h-2/5' aria-hidden='true'>
    <path d='M7 4v16l14-8z' fill='#2a2a2a' />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox='0 0 24 24' className='w-2/5 h-2/5' aria-hidden='true'>
    <rect x='4' y='3' width='6' height='18' fill='#2a2a2a' />
    <rect x='14' y='3' width='6' height='18' fill='#2a2a2a' />
  </svg>
)

const StopIcon = () => (
  <svg viewBox='0 0 24 24' className='w-2/5 h-2/5' aria-hidden='true'>
    <rect x='4' y='4' width='16' height='16' fill='#2a2a2a' />
  </svg>
)

// The turntable's own illustrated start-stop button, made functional: a
// single Play affordance before/between songs, splitting into a left half
// (Pause while playing, Play/resume while paused) and a Stop right half
// once a song has actually been started.
const TransportButton = ({
  mode,
  isPlaying,
  canPlay,
  canPause,
  canStop,
  onPlay,
  onPause,
  onStop,
}: TransportButtonProps) => {
  return (
    <div className='absolute rounded-sm overflow-hidden' style={BUTTON_BOUNDS}>
      {mode === 'split' ? (
        <div className='relative flex w-full h-full'>
          {isPlaying ? (
            <button
              type='button'
              aria-label='Pause'
              disabled={!canPause}
              onClick={onPause}
              className={`flex-1 ${buttonClasses}`}
            >
              <PauseIcon />
            </button>
          ) : (
            <button
              type='button'
              aria-label='Play'
              disabled={!canPlay}
              onClick={onPlay}
              className={`flex-1 ${buttonClasses}`}
            >
              <PlayIcon />
            </button>
          )}
          {/* Divider — inset from top/bottom so it doesn't touch the button's outline. */}
          <div
            aria-hidden='true'
            className='absolute left-1/2 -translate-x-1/2'
            style={{ top: '15%', bottom: '15%', width: '1px', backgroundColor: '#555' }}
          />
          <button
            type='button'
            aria-label='Stop'
            disabled={!canStop}
            onClick={onStop}
            className={`flex-1 ${buttonClasses}`}
          >
            <StopIcon />
          </button>
        </div>
      ) : (
        <button
          type='button'
          aria-label='Play'
          disabled={!canPlay}
          onClick={onPlay}
          className={`w-full ${buttonClasses}`}
        >
          <PlayIcon />
        </button>
      )}
    </div>
  )
}

export default TransportButton
