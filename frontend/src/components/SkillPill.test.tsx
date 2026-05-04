import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkillPill from './SkillPill'

describe('SkillPill', () => {
  it('renders the skill name', () => {
    render(<SkillPill skillName='React' />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('renders as a span when no infoUrl is provided', () => {
    render(<SkillPill skillName='Vite' />)
    expect(screen.getByText('Vite').tagName).toBe('SPAN')
  })

  it('renders as an external link when infoUrl is provided', () => {
    render(<SkillPill skillName='React' infoUrl='https://react.dev' />)
    const link = screen.getByRole('link', { name: 'React' })
    expect(link).toHaveAttribute('href', 'https://react.dev')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies the explicit category color for known categories', () => {
    render(<SkillPill skillName='TypeScript' category='Languages & Frameworks' />)
    expect(screen.getByText('TypeScript')).toHaveClass('badge-info')
  })

  it('applies a deterministic hashed badge color for unknown categories', () => {
    const { rerender } = render(<SkillPill skillName='Foo' category='Some Other Category' />)
    const first = screen.getByText('Foo').className
    rerender(<SkillPill skillName='Foo' category='Some Other Category' />)
    const second = screen.getByText('Foo').className
    expect(first).toBe(second)
    expect(first).toMatch(/badge-(primary|secondary|accent|info|success|warning)/)
  })

  it('uses the requested size class', () => {
    render(<SkillPill skillName='Tailwind' size='lg' />)
    expect(screen.getByText('Tailwind')).toHaveClass('badge-lg')
  })
})
