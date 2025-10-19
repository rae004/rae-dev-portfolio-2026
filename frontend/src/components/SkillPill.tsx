import React from 'react'

interface SkillPillProps {
  skillName: string
  category?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
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

const SkillPill: React.FC<SkillPillProps> = ({
  skillName,
  category,
  size = 'md',
  className = '',
}) => {
  const badgeColorClass = getCategoryBadgeClass(category || '')

  const sizeClass = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  }[size]

  return (
    <span
      className={`badge ${badgeColorClass} ${sizeClass} ${className}`}
      title={category ? `${skillName} (${category})` : skillName}
    >
      {skillName}
    </span>
  )
}

export default SkillPill
