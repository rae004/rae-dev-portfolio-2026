import React from 'react'
import SkillPill from './SkillPill'
import type { SkillItem } from '../types/wordpress'

interface SkillsGroupProps {
  groupedSkills: Record<string, SkillItem[]>
  layout?: 'grid' | 'inline'
  pillSize?: 'sm' | 'md' | 'lg'
  className?: string
}

const SkillsGroup: React.FC<SkillsGroupProps> = ({
  groupedSkills,
  layout = 'grid',
  pillSize = 'md',
  className = '',
}) => {
  const categories = Object.keys(groupedSkills).sort()

  if (categories.length === 0) {
    return (
      <div className='text-center py-4'>
        <p className='text-base-content/70'>
          No skills found. Please add some skills in WordPress.
        </p>
      </div>
    )
  }

  if (layout === 'inline') {
    // Inline layout - all skills in a single row with category indicators
    const allSkills = categories.flatMap(category =>
      groupedSkills[category].map(skill => ({
        skill,
        category,
      }))
    )

    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {allSkills.map(({ skill, category }, index) => (
          <SkillPill
            key={`${category}-${skill.id}-${index}`}
            skillName={skill.skills_value || skill.title.rendered}
            category={category}
            size={pillSize}
            infoUrl={skill.skills_info_url}
          />
        ))}
      </div>
    )
  }

  // Grid layout - grouped by category
  return (
    <div className={`flex flex-row items-baseline justify-around space-y-6 ${className}`}>
      {categories.map(category => (
        <div key={category} className='space-y-3 space-x-6'>
          <h3 className='text-lg font-semibold text-base-content text-center'>{category}</h3>
          <div className='flex flex-wrap gap-2'>
            {groupedSkills[category].map((skill, index) => (
              <SkillPill
                key={`${category}-${skill.id}-${index}`}
                skillName={skill.skills_value || skill.title.rendered}
                category={category}
                size={pillSize}
                infoUrl={skill.skills_info_url}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkillsGroup
