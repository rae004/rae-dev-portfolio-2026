import React from 'react'
import { Link } from '@tanstack/react-router'
import type { ResumeItem, SkillItem } from '../types/wordpress'
import { getResumeSkills, getSkillPreview, getRemainingSkillsCount } from '../utils/skillMatching'
import SkillPill from './SkillPill'

interface ResumeItemCardProps {
  resumeItem: ResumeItem
  allSkills?: SkillItem[]
  layout?: 'summary' | 'detailed'
  showSkills?: boolean
  maxSkillsPreview?: number
}

const ResumeItemCard: React.FC<ResumeItemCardProps> = ({
  resumeItem,
  allSkills = [],
  layout = 'summary',
  showSkills = true,
  maxSkillsPreview = 3,
}) => {
  // Get skills for this resume item
  const resumeSkills = getResumeSkills(resumeItem, allSkills)
  const skillsPreview = getSkillPreview(resumeSkills, maxSkillsPreview)
  const remainingCount = getRemainingSkillsCount(resumeSkills, maxSkillsPreview)

  const isDetailed = layout === 'detailed'

  return (
    <div
      className={`border-l-4 border-primary pl-6 pb-6 ${!isDetailed ? 'hover:bg-base-200/50 transition-colors' : ''}`}
    >
      <div className='flex flex-col space-y-3'>
        {/* Title and Date */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'>
          <h3 className={`font-semibold ${isDetailed ? 'text-2xl' : 'text-xl'}`}>
            {isDetailed ? (
              resumeItem.title.rendered
            ) : (
              <Link
                to='/resume/$resumeId'
                params={{ resumeId: resumeItem.id.toString() }}
                className='hover:link hover:link-primary'
              >
                {resumeItem.title.rendered}
              </Link>
            )}
          </h3>

          {resumeItem.employment_dates?.formatted_range && (
            <div
              className={`text-base-content/70 ${isDetailed ? 'text-lg' : 'text-sm'} whitespace-nowrap`}
            >
              {resumeItem.employment_dates.formatted_range}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`prose max-w-none ${isDetailed ? 'prose-lg' : 'prose-sm'}`}
          dangerouslySetInnerHTML={{ __html: resumeItem.content.rendered }}
        />

        {/* Skills Preview */}
        {showSkills && skillsPreview.length > 0 && (
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm text-base-content/60 font-medium'>Skills:</span>
            {skillsPreview.map(skill => (
              <SkillPill
                key={skill.id}
                skillName={skill.skills_value || skill.title.rendered}
                category={skill.skills_type}
                size='sm'
                infoUrl={skill.skills_info_url}
              />
            ))}
            {remainingCount > 0 && (
              <span className='text-sm text-base-content/60'>+{remainingCount} more</span>
            )}
          </div>
        )}

        {/* Read Details Link for Summary Layout */}
        {!isDetailed && (
          <div className='flex justify-between items-center mt-4'>
            <Link
              to='/resume/$resumeId'
              params={{ resumeId: resumeItem.id.toString() }}
              className='btn btn-sm btn-outline btn-primary'
            >
              Read details...
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumeItemCard
