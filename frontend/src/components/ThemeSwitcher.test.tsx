import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeSwitcher from './ThemeSwitcher'

function mockMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockMatchMedia(false)
    // Run requestAnimationFrame callbacks synchronously so click side-effects
    // are observable without waitFor.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0)
      return 0
    })
  })

  it('renders the three category labels (Dark / Color / Light)', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByText('Dark:')).toBeInTheDocument()
    expect(screen.getByText('Color:')).toBeInTheDocument()
    expect(screen.getByText('Light:')).toBeInTheDocument()
  })

  it('renders all 14 theme buttons with their display labels', () => {
    render(<ThemeSwitcher />)
    const expected = [
      'Black',
      'Halloween',
      'Forest',
      'Dracula',
      'Coffee',
      'Synthwave',
      'Aqua',
      'Cyberpunk',
      'Retro',
      'CMYK',
      'Acid',
      'Bumblebee',
      'Corporate',
      'LoFi',
    ]
    for (const label of expected) {
      expect(screen.getByRole('button', { name: `Switch to ${label} theme` })).toBeInTheDocument()
    }
  })

  it('marks the saved theme as active with btn-primary + aria-pressed', () => {
    localStorage.setItem('theme', 'dracula')
    render(<ThemeSwitcher />)
    const dracula = screen.getByRole('button', { name: 'Switch to Dracula theme' })
    expect(dracula).toHaveClass('btn-primary')
    expect(dracula).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies a clicked theme to localStorage and the html data-theme attribute', () => {
    render(<ThemeSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to Synthwave theme' }))
    expect(localStorage.getItem('theme')).toBe('synthwave')
    expect(document.documentElement.getAttribute('data-theme')).toBe('synthwave')
  })

  it('uses corporate as the default for prefers-color-scheme: light', () => {
    mockMatchMedia(false)
    render(<ThemeSwitcher />)
    expect(screen.getByRole('button', { name: 'Switch to Corporate theme' })).toHaveClass(
      'btn-primary',
    )
  })

  it('uses black as the default for prefers-color-scheme: dark', () => {
    mockMatchMedia(true)
    render(<ThemeSwitcher />)
    expect(screen.getByRole('button', { name: 'Switch to Black theme' })).toHaveClass('btn-primary')
  })

  it('migrates a stale saved theme onto the OS-preferred default', () => {
    localStorage.setItem('theme', 'pastel') // removed from the curated list
    mockMatchMedia(false)
    render(<ThemeSwitcher />)
    expect(localStorage.getItem('theme')).toBe('corporate')
    expect(document.documentElement.getAttribute('data-theme')).toBe('corporate')
  })

  it('migrates stale saved theme to black under prefers-color-scheme: dark', () => {
    localStorage.setItem('theme', 'pastel')
    mockMatchMedia(true)
    render(<ThemeSwitcher />)
    expect(localStorage.getItem('theme')).toBe('black')
  })
})
