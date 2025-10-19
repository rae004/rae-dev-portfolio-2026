import { useMemo } from 'react'
import type { SkillItem } from '../types/wordpress'

/**
 * Custom hook to group skills by their category (skills_type)
 * Returns a Record<string, string[]> where keys are categories and values are skill names
 */
export function useGroupedSkills(skills: SkillItem[]): Record<string, string[]> {
  return useMemo(() => {
    const grouped: Record<string, string[]> = {}

    skills.forEach(skill => {
      // Use skills_type as category, fallback to "Other" if not specified
      const category = skill.skills_type?.trim() || 'Other'

      // Initialize category array if it doesn't exist
      if (!grouped[category]) {
        grouped[category] = []
      }

      // Add skill value if it exists and isn't already in the category
      if (skill.skills_value?.trim()) {
        const skillValue = skill.skills_value.trim()
        if (!grouped[category].includes(skillValue)) {
          grouped[category].push(skillValue)
        }
      }
    })

    // Sort skills within each category alphabetically
    Object.keys(grouped).forEach(category => {
      grouped[category].sort()
    })

    return grouped
  }, [skills])
}

/**
 * Hook to get skills filtered by category
 */
export function useSkillsByCategory(skills: SkillItem[], category: string): string[] {
  return useMemo(() => {
    return skills
      .filter(skill => skill.skills_type === category)
      .map(skill => skill.skills_value)
      .filter(Boolean)
      .sort()
  }, [skills, category])
}

/**
 * Hook to get all unique categories from skills
 */
export function useSkillCategories(skills: SkillItem[]): string[] {
  return useMemo(() => {
    const categories = skills
      .map(skill => skill.skills_type)
      .filter(Boolean)
      .filter((category, index, array) => array.indexOf(category) === index)

    return categories.sort()
  }, [skills])
}
