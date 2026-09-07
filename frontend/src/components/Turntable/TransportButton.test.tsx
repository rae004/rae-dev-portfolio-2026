import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TransportButton from './TransportButton'

describe('TransportButton', () => {
  it('renders a single Play control in single mode', () => {
    render(
      <TransportButton
        mode='single'
        isPlaying={false}
        canPlay
        canPause={false}
        canStop={false}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStop={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
  })

  it('calls onPlay when the Play button is clicked', () => {
    const onPlay = vi.fn()
    render(
      <TransportButton
        mode='single'
        isPlaying={false}
        canPlay
        canPause={false}
        canStop={false}
        onPlay={onPlay}
        onPause={vi.fn()}
        onStop={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('disables Play when canPlay is false', () => {
    render(
      <TransportButton
        mode='single'
        isPlaying={false}
        canPlay={false}
        canPause={false}
        canStop={false}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStop={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  })

  it('renders Pause and Stop controls in split mode while playing', () => {
    render(
      <TransportButton
        mode='split'
        isPlaying
        canPlay={false}
        canPause
        canStop
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStop={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('calls onPause and onStop independently in split mode while playing', () => {
    const onPause = vi.fn()
    const onStop = vi.fn()
    render(
      <TransportButton
        mode='split'
        isPlaying
        canPlay={false}
        canPause
        canStop
        onPlay={vi.fn()}
        onPause={onPause}
        onStop={onStop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('shows Play (resume) and Stop controls in split mode while paused', () => {
    render(
      <TransportButton
        mode='split'
        isPlaying={false}
        canPlay
        canPause={false}
        canStop
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStop={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('calls onPlay (resume) and onStop independently in split mode while paused', () => {
    const onPlay = vi.fn()
    const onStop = vi.fn()
    render(
      <TransportButton
        mode='split'
        isPlaying={false}
        canPlay
        canPause={false}
        canStop
        onPlay={onPlay}
        onPause={vi.fn()}
        onStop={onStop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
