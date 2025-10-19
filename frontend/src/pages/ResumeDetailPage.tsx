import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useResumeItem, useResumeItems, useSkills } from '../hooks/useWordPress'
import {
  getResumeSkills,
  groupSkillsByCategory,
  sortSkillsInCategories,
} from '../utils/skillMatching'
import SkillsGroup from '../components/SkillsGroup'

const ResumeDetailPage: React.FC = () => {
  const { resumeId } = useParams({ from: '/resume/$resumeId' })
  const id = Number(resumeId)

  // Get the specific resume item
  const { data: resumeItem, isLoading: resumeLoading, error: resumeError } = useResumeItem(id)

  // Get all resume items for navigation
  const { data: allResumeItems } = useResumeItems({ per_page: 100 })

  // Get all skills for content-based matching fallback
  const { data: allSkills } = useSkills({ per_page: 100 })

  if (resumeLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-center items-center min-h-64'>
          <span className='loading loading-spinner loading-lg'></span>
        </div>
      </div>
    )
  }

  if (resumeError || !resumeItem) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='alert alert-error'>
          <span>Resume item not found or could not be loaded.</span>
        </div>
        <Link to='/resume' className='btn btn-primary mt-4'>
          Back to Resume
        </Link>
      </div>
    )
  }

  // Get skills for this resume item
  const resumeSkills = getResumeSkills(resumeItem, allSkills || [])
  const groupedSkills = sortSkillsInCategories(groupSkillsByCategory(resumeSkills))

  // Find previous and next resume items (chronologically by date)
  const sortedResumes =
    allResumeItems?.slice().sort((a, b) => {
      const aDate = new Date(a.date)
      const bDate = new Date(b.date)
      return bDate.getTime() - aDate.getTime() // Newest first
    }) || []

  const currentIndex = sortedResumes.findIndex(item => item.id === resumeItem.id)
  const previousResume = currentIndex > 0 ? sortedResumes[currentIndex - 1] : null
  const nextResume =
    currentIndex < sortedResumes.length - 1 ? sortedResumes[currentIndex + 1] : null

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Breadcrumb Navigation */}
      <div className='breadcrumbs text-sm mb-6'>
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/resume'>Resume</Link>
          </li>
          <li className='font-semibold'>{resumeItem.title.rendered}</li>
        </ul>
      </div>

      {/* Resume Item Detail Card */}
      <div className='card bg-base-100 shadow-xl mb-8'>
        <div className='card-body'>
          <h1 className='card-title text-3xl mb-4'>{resumeItem.title.rendered}</h1>

          {/* Employment Dates */}
          {resumeItem.employment_dates?.formatted_range && (
            <div className='text-lg text-base-content/70 mb-6'>
              {resumeItem.employment_dates.formatted_range}
            </div>
          )}

          {/* Content */}
          <div
            className='prose prose-lg max-w-none mb-6'
            dangerouslySetInnerHTML={{ __html: resumeItem.content.rendered }}
          />

          {/* Related Skills */}
          {Object.keys(groupedSkills).length > 0 && (
            <div className='mt-8'>
              <h2 className='text-2xl font-bold mb-4'>Related Skills</h2>
              <SkillsGroup groupedSkills={groupedSkills} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {previousResume && nextResume && (
        <div className='flex justify-between items-center'>
          <div>
            {previousResume && (
              <Link
                to='/resume/$resumeId'
                params={{ resumeId: previousResume.id.toString() }}
                className='btn btn-outline btn-primary'
              >
                ← Previous: {previousResume.title.rendered}
              </Link>
            )}
          </div>

          <Link to='/resume' className='btn btn-primary'>
            Back to Resume
          </Link>

          <div>
            {nextResume && (
              <Link
                to='/resume/$resumeId'
                params={{ resumeId: nextResume.id.toString() }}
                className='btn btn-outline btn-primary'
              >
                Next: {nextResume.title.rendered} →
              </Link>
            )}
          </div>
        </div>
      )}
      {previousResume && !nextResume && (
        <div className='flex justify-between items-center'>
          <div>
            {previousResume && (
              <Link
                to='/resume/$resumeId'
                params={{ resumeId: previousResume.id.toString() }}
                className='btn btn-outline btn-primary'
              >
                ← Previous: {previousResume.title.rendered}
              </Link>
            )}
          </div>

          <Link to='/resume' className='btn btn-primary'>
            Back to Resume
          </Link>
        </div>
      )}
      {nextResume && !previousResume && (
        <div className='flex justify-between items-center'>
          <Link to='/resume' className='btn btn-primary'>
            Back to Resume
          </Link>

          <div>
            {nextResume && (
              <Link
                to='/resume/$resumeId'
                params={{ resumeId: nextResume.id.toString() }}
                className='btn btn-outline btn-primary'
              >
                Next: {nextResume.title.rendered} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeDetailPage
