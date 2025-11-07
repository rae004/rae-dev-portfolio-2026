import type { SoftwareProject, SkillItem } from '../types/wordpress'

/**
 * Get project state badge styling based on state
 */
export function getProjectStateBadge(state?: string | null) {
  if (!state) return null

  const badgeMap = {
    Completed: 'badge-success',
    Ongoing: 'badge-warning',
    Future: 'badge-info',
  } as const

  return {
    text: state,
    className: badgeMap[state as keyof typeof badgeMap] || 'badge-neutral',
  }
}

/**
 * Format release date for display
 */
export function formatReleaseDate(date?: string | null): string | null {
  if (!date) return null

  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  } catch {
    return null
  }
}

/**
 * Format release year for display
 */
export function formatReleaseYear(date?: string | null): string | null {
  if (!date) return null

  try {
    return new Date(date).getFullYear().toString()
  } catch {
    return null
  }
}

/**
 * Validate and format external links
 */
export function isValidUrl(url?: string | null): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Get domain name from URL for display
 */
export function getDomainFromUrl(url?: string | null): string | null {
  if (!url || !isValidUrl(url)) return null

  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Filter skills by selected tech categories and sort by weight
 */
export function getFilteredTechSkills(
  project: SoftwareProject,
  maxSkills: number = 6
): SkillItem[] {
  const { related_skills, tech_categories } = project

  if (!related_skills?.length) return []

  // If no tech categories are selected, return empty array
  if (!tech_categories?.length) return []

  // Filter skills by selected categories
  const filteredSkills = related_skills.filter(skill => tech_categories.includes(skill.skills_type))

  // Sort by weight (descending), then by name
  const sortedSkills = filteredSkills.sort((a, b) => {
    const weightDiff = b.skills_weight - a.skills_weight
    if (weightDiff !== 0) return weightDiff
    return (a.skills_value || a.title.rendered).localeCompare(b.skills_value || b.title.rendered)
  })

  // Limit to max skills
  return sortedSkills.slice(0, maxSkills)
}

/**
 * Get all related skills for detail page (not filtered by tech categories)
 */
export function getAllProjectSkills(project: SoftwareProject): SkillItem[] {
  if (!project.related_skills?.length) return []

  // Sort by weight (descending), then by name
  return project.related_skills.sort((a, b) => {
    const weightDiff = b.skills_weight - a.skills_weight
    if (weightDiff !== 0) return weightDiff
    return (a.skills_value || a.title.rendered).localeCompare(b.skills_value || b.title.rendered)
  })
}

/**
 * Group skills by category for detail page display
 */
export function groupSkillsByCategory(skills: SkillItem[]): Record<string, SkillItem[]> {
  const grouped = skills.reduce(
    (acc, skill) => {
      const category = skill.skills_type || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(skill)
      return acc
    },
    {} as Record<string, SkillItem[]>
  )

  // Sort categories alphabetically
  const sortedCategories = Object.keys(grouped).sort()
  const sortedGrouped: Record<string, SkillItem[]> = {}

  sortedCategories.forEach(category => {
    sortedGrouped[category] = grouped[category]
  })

  return sortedGrouped
}
