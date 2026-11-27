import type { ResumeItem } from '../types/wordpress'
import { Link } from '@tanstack/react-router'
import { decodeHtml } from '../utils/decodeHtml'

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

  // With no siblings there is only the back button, centred.
  const wrapperClasses =
    previousResume || nextResume ? paginationClasses : 'flex justify-center items-center'

  return (
    <div className={wrapperClasses}>
      {previousResume && (
        <div>
          <Link
            to='/resume/$resumeId'
            params={{ resumeId: previousResume.id.toString() }}
            className='btn btn-outline btn-primary'
          >
            ← Previous: {decodeHtml(previousResume.title.rendered)}
          </Link>
        </div>
      )}

      <Link to='/resume' className='btn btn-primary'>
        Back to Resume
      </Link>

      {nextResume && (
        <div>
          <Link
            to='/resume/$resumeId'
            params={{ resumeId: nextResume.id.toString() }}
            className='btn btn-outline btn-primary'
          >
            Next: {decodeHtml(nextResume.title.rendered)} →
          </Link>
        </div>
      )}
    </div>
  )
}

export default ResumeItemPagination
