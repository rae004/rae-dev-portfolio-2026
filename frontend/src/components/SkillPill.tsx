import { memo } from 'react'

interface SkillPillProps {
  skillName: string
  category?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  infoUrl?: string // Optional URL to make the skill pill clickable
}

// Category-based badge color assignment using string hash
function getCategoryBadgeClass(category: string): string {
  if (!category) return 'badge-neutral'

  if (category === 'Languages & Frameworks') return 'badge-info'
  if (category === 'Soft Skills') return 'badge-secondary'
  if (category === 'Cloud & DevOps') return 'badge-warning'

  // Simple string hash function for consistent color assignment
  const hash = category.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  // DaisyUI badge color classes - using semantic colors for better distinction
  const colors = [
    'badge-primary',
    'badge-secondary',
    'badge-accent',
    'badge-info',
    'badge-success',
    'badge-warning',
  ]

  return colors[Math.abs(hash) % colors.length]
}

const SkillPill = ({
  skillName,
  category,
  size = 'md',
  className = '',
  infoUrl,
}: SkillPillProps) => {
  const badgeColorClass = getCategoryBadgeClass(category || '')

  const sizeClass = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  }[size]

  // Build title text
  const titleText = category ? `${skillName} (${category})` : skillName
  const finalTitle = infoUrl ? `${titleText} - Click to learn more` : titleText

  // Base badge classes
  const badgeClasses = `badge ${badgeColorClass} ${sizeClass} ${className}`

  // If infoUrl is provided, render as a clickable link
  if (infoUrl) {
    return (
      <a
        href={infoUrl}
        target='_blank'
        rel='noopener noreferrer'
        className={`${badgeClasses} hover:scale-105 transition-transform cursor-pointer no-underline`}
        title={finalTitle}
      >
        {skillName}
      </a>
    )
  }

  // Otherwise, render as a regular span
  return (
    <span className={badgeClasses} title={finalTitle}>
      {skillName}
    </span>
  )
}

export default memo(SkillPill)
