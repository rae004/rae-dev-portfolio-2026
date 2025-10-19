import type { SkillItem, ResumeItem } from '../types/wordpress'

// Helper function to group skills by category (skills_type)
export function groupSkillsByCategory(skills: SkillItem[]): Record<string, SkillItem[]> {
  return skills.reduce(
    (groups, skill) => {
      const category = skill.skills_type || 'Uncategorized'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(skill)
      return groups
    },
    {} as Record<string, SkillItem[]>
  )
}

// Helper function to sort skills within categories by weight (descending) then alphabetically
export function sortSkillsInCategories(
  groupedSkills: Record<string, SkillItem[]>
): Record<string, SkillItem[]> {
  const sortedGroups: Record<string, SkillItem[]> = {}

  Object.keys(groupedSkills).forEach(category => {
    sortedGroups[category] = [...groupedSkills[category]].sort((a, b) => {
      // Sort by weight descending
      const weightDiff = b.skills_weight - a.skills_weight
      if (weightDiff !== 0) {
        return weightDiff
      }
      // Then alphabetically by skills_value or title
      const aName = a.skills_value || a.title.rendered
      const bName = b.skills_value || b.title.rendered
      return aName.localeCompare(bName)
    })
  })

  return sortedGroups
}

// Content-based skill matching as fallback for backward compatibility
export function findSkillsInContent(content: string, allSkills: SkillItem[]): SkillItem[] {
  if (!content || !allSkills.length) return []

  const contentLower = content.toLowerCase()
  const matchedSkills = allSkills.filter(skill => {
    const skillName = (skill.skills_value || skill.title.rendered).toLowerCase()
    return contentLower.includes(skillName)
  })

  // Remove duplicates and sort by weight
  const uniqueSkills = matchedSkills.filter(
    (skill, index, array) => array.findIndex(s => s.id === skill.id) === index
  )

  return uniqueSkills.sort((a, b) => {
    const weightDiff = b.skills_weight - a.skills_weight
    if (weightDiff !== 0) {
      return weightDiff
    }
    const aName = a.skills_value || a.title.rendered
    const bName = b.skills_value || b.title.rendered
    return aName.localeCompare(bName)
  })
}

// Get skills for a resume item (preferring explicit relationships, falling back to content matching)
export function getResumeSkills(resumeItem: ResumeItem, allSkills: SkillItem[]): SkillItem[] {
  // If explicit relationships exist, use them
  if (resumeItem.related_skills && resumeItem.related_skills.length > 0) {
    return resumeItem.related_skills
  }

  // Fallback to content-based matching for backward compatibility
  const fullContent = `${resumeItem.title.rendered} ${resumeItem.content.rendered} ${resumeItem.excerpt.rendered}`
  return findSkillsInContent(fullContent, allSkills)
}

// Generate hash-based color class for skill categories (for consistent coloring)
export function getCategoryColorClass(category: string): string {
  const colors = [
    'badge-primary',
    'badge-secondary',
    'badge-accent',
    'badge-neutral',
    'badge-info',
    'badge-success',
    'badge-warning',
    'badge-error',
  ]

  // Simple hash function for consistent color assignment
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}

// Helper to get skill preview (top N skills for list views)
export function getSkillPreview(skills: SkillItem[], maxSkills: number = 3): SkillItem[] {
  return skills.slice(0, maxSkills)
}

// Helper to get remaining skills count for "and X more" display
export function getRemainingSkillsCount(skills: SkillItem[], displayCount: number): number {
  return Math.max(0, skills.length - displayCount)
}
