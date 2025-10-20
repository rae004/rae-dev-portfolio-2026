import type { ResumeItem } from '../types/wordpress'
import { Link } from '@tanstack/react-router'

interface ResumeItemPaginationProps {
  nextResume: ResumeItem | null
  previousResume: ResumeItem | null
  paginationWrapperClasses?: string[]
}

const ResumeItemPagination = (props: ResumeItemPaginationProps) => {
  const { nextResume, previousResume, paginationWrapperClasses } = props
  const defaultClasses = 'flex justify-between items-center'
  const propClassNames = paginationWrapperClasses?.join(' ')
  const paginationClasses = propClassNames ? propClassNames : defaultClasses

  return (
    <>
      {/* Navigation */}
      {previousResume && nextResume && (
        <div className={paginationClasses}>
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
        <div className={paginationClasses}>
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
        <div className={paginationClasses}>
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
      {!nextResume && !previousResume && (
        <div className='flex justify-center items-center'>
          <Link to='/resume' className='btn btn-primary'>
            Back to Resume
          </Link>
        </div>
      )}
    </>
  )
}

export default ResumeItemPagination
