import { Link } from '@tanstack/react-router'
import type { ResumeItem, MediaProject } from '../types/wordpress'

type PaginationItem = ResumeItem | MediaProject

interface ProjectPaginationProps {
  previousItem: PaginationItem | null
  nextItem: PaginationItem | null
  backToPath: string
  backToLabel: string
  itemTypePath: 'resume' | 'media'
  paginationWrapperClasses?: string[]
}

const ProjectPagination = ({
  previousItem,
  nextItem,
  backToPath,
  backToLabel,
  itemTypePath,
  paginationWrapperClasses,
}: ProjectPaginationProps) => {
  const defaultClasses = 'flex justify-between items-center'
  const propClassNames = paginationWrapperClasses?.join(' ')
  const paginationClasses = propClassNames ? propClassNames : defaultClasses

  const getItemRoute = (item: PaginationItem) => {
    if (itemTypePath === 'resume') {
      return {
        to: '/resume/$resumeId' as const,
        params: { resumeId: item.id.toString() },
      }
    } else {
      return {
        to: '/media/$mediaId' as const,
        params: { mediaId: item.id.toString() },
      }
    }
  }

  return (
    <>
      {/* Navigation with both previous and next */}
      {previousItem && nextItem && (
        <div className={paginationClasses}>
          <div>
            <Link {...getItemRoute(previousItem)} className='btn btn-outline btn-primary'>
              ← Previous: {previousItem.title.rendered}
            </Link>
          </div>

          <Link to={backToPath} className='btn btn-primary'>
            {backToLabel}
          </Link>

          <div>
            <Link {...getItemRoute(nextItem)} className='btn btn-outline btn-primary'>
              Next: {nextItem.title.rendered} →
            </Link>
          </div>
        </div>
      )}

      {/* Navigation with only previous */}
      {previousItem && !nextItem && (
        <div className={paginationClasses}>
          <div>
            <Link {...getItemRoute(previousItem)} className='btn btn-outline btn-primary'>
              ← Previous: {previousItem.title.rendered}
            </Link>
          </div>

          <Link to={backToPath} className='btn btn-primary'>
            {backToLabel}
          </Link>
        </div>
      )}

      {/* Navigation with only next */}
      {nextItem && !previousItem && (
        <div className={paginationClasses}>
          <Link to={backToPath} className='btn btn-primary'>
            {backToLabel}
          </Link>

          <div>
            <Link {...getItemRoute(nextItem)} className='btn btn-outline btn-primary'>
              Next: {nextItem.title.rendered} →
            </Link>
          </div>
        </div>
      )}

      {/* Navigation with no items (only back button) */}
      {!nextItem && !previousItem && (
        <div className='flex justify-center items-center'>
          <Link to={backToPath} className='btn btn-primary'>
            {backToLabel}
          </Link>
        </div>
      )}
    </>
  )
}

export default ProjectPagination
