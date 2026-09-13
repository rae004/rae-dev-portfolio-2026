import { useCallback, useEffect, useState } from 'react'
import CoachMark from './CoachMark'
import { useOnboardingEligibility } from './useOnboardingEligibility'
import type { TurntableStatus } from './Turntable'

interface OnboardingTourProps {
  status: TurntableStatus
  rootRef: React.RefObject<HTMLDivElement | null>
  firstSongId: string | undefined
}

// Two-step coach-mark walkthrough of the core loop: pick a song, press
// Play. Driven entirely by the turntable's own state machine rather than
// by DOM click listeners on the targets — the only way those states are
// reached is via the exact clicks the tour asks for, and deriving from
// state also covers keyboard users (arrow keys on the radio group, Enter
// on Play) and gracefully falls back to step 1 if a cue fails and the
// widget returns to idle.
//
// Step 2 waits for `cued`, not the song click itself: Play is disabled
// during the ~2.5s cue choreography, and the record sleeve flies in
// through the bottom-left corner where a side-docked bubble would sit.
// Letting the animation *be* the feedback for the click, then pointing at
// Play once it's actually pressable, avoids both problems with no timers.
const OnboardingTour = ({ status, rootRef, firstSongId }: OnboardingTourProps) => {
  const eligible = useOnboardingEligibility()
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (status === 'playing') setCompleted(true)
  }, [status])

  const getSongTarget = useCallback(() => {
    if (!firstSongId) return null
    // The label wrapping the radio is the visible pill — point at that,
    // not the input hidden inside it.
    const input = document.getElementById(`turntable-song-${firstSongId}`)
    return input?.closest('label') ?? input
  }, [firstSongId])

  const getPlayTarget = useCallback(
    () => rootRef.current?.querySelector('button[aria-label="Play"]') ?? null,
    [rootRef]
  )

  if (!eligible || completed) return null

  if (status === 'idle') {
    return (
      <CoachMark
        getTarget={getSongTarget}
        text='Select a song'
        offscreenText='Scroll down and select a song'
      />
    )
  }
  if (status === 'cued') {
    return <CoachMark getTarget={getPlayTarget} text='Now click play' />
  }
  return null
}

export default OnboardingTour
