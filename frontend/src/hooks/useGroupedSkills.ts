import { useMemo } from 'react'
import type { SkillItem } from '../types/wordpress'

/**
 * Custom hook to group skills by their category (skills_type)
 * Returns a Record<string, string[]> where keys are categories and values are skill names
 * Skills are sorted by weight (descending) then alphabetically
 */
export function useGroupedSkills(skills: SkillItem[]): Record<string, string[]> {
  return useMemo(() => {
    const grouped: Record<string, string[]> = {}

    // Create a map to store skill objects with their weights for sorting
    const skillsWithWeights: Record<string, Array<{ name: string; weight: number }>> = {}

    skills.forEach(skill => {
      // Use skills_type as category, fallback to "Other" if not specified
      const category = skill.skills_type?.trim() || 'Other'

      // Initialize category arrays if they don't exist
      if (!grouped[category]) {
        grouped[category] = []
        skillsWithWeights[category] = []
      }

      // Add skill value if it exists and isn't already in the category
      if (skill.skills_value?.trim()) {
        const skillValue = skill.skills_value.trim()
        const skillWeight = skill.skills_weight || 0

        // Check if skill already exists in this category
        const existingIndex = skillsWithWeights[category].findIndex(s => s.name === skillValue)

        if (existingIndex === -1) {
          // Add new skill
          skillsWithWeights[category].push({ name: skillValue, weight: skillWeight })
        } else {
          // Update weight if this instance has a higher weight
          if (skillWeight > skillsWithWeights[category][existingIndex].weight) {
            skillsWithWeights[category][existingIndex].weight = skillWeight
          }
        }
      }
    })

    // Sort skills within each category by weight (desc) then alphabetically (asc)
    Object.keys(skillsWithWeights).forEach(category => {
      const sortedSkills = skillsWithWeights[category].sort((a, b) => {
        // First sort by weight (higher numbers first)
        const weightDiff = b.weight - a.weight
        if (weightDiff !== 0) {
          return weightDiff
        }
        // Then sort alphabetically for same weights
        return a.name.localeCompare(b.name)
      })

      // Extract just the skill names for the final grouped object
      grouped[category] = sortedSkills.map(skill => skill.name)
    })

    return grouped
  }, [skills])
}

/**
 * Hook to get skills filtered by category with weight-based sorting
 */
export function useSkillsByCategory(skills: SkillItem[], category: string): string[] {
  return useMemo(() => {
    const categorySkills = skills
      .filter(skill => skill.skills_type === category)
      .filter(skill => skill.skills_value?.trim())
      .map(skill => ({
        name: skill.skills_value.trim(),
        weight: skill.skills_weight || 0,
      }))

    // Remove duplicates and keep the highest weight for each skill
    const uniqueSkills = new Map<string, number>()
    categorySkills.forEach(skill => {
      const existingWeight = uniqueSkills.get(skill.name) || 0
      if (skill.weight > existingWeight) {
        uniqueSkills.set(skill.name, skill.weight)
      }
    })

    // Sort by weight (desc) then alphabetically (asc)
    return Array.from(uniqueSkills.entries())
      .sort(([nameA, weightA], [nameB, weightB]) => {
        const weightDiff = weightB - weightA
        return weightDiff !== 0 ? weightDiff : nameA.localeCompare(nameB)
      })
      .map(([name]) => name)
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
