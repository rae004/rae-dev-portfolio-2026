import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Navigation from './Navigation'

// Navigation only needs Link's rendered output here; a full router isn't
// necessary to assert which links exist.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('./ThemeSwitcher', () => ({ default: () => null }))

const featuresMock = vi.hoisted(() => ({ FEATURES: { blog: false } }))
vi.mock('../config/features', () => featuresMock)

describe('Navigation feature flags', () => {
  it('hides the Blog links while the blog feature is off', () => {
    featuresMock.FEATURES.blog = false
    render(<Navigation />)
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull()
    // The rest of the nav is intact (mobile + desktop menus).
    expect(screen.getAllByRole('link', { name: 'Contact' }).length).toBeGreaterThan(0)
  })

  it('shows the Blog links when the feature is on', () => {
    featuresMock.FEATURES.blog = true
    render(<Navigation />)
    expect(screen.getAllByRole('link', { name: 'Blog' }).length).toBeGreaterThan(0)
  })
})
