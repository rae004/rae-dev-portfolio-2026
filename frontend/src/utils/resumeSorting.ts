import type { ResumeItem } from '../types/wordpress'

// Sort comparator for resume items. Currently-employed roles ("Present") come
// first. Among concurrent Present roles, the most recently started wins.
// Otherwise sort by end_date_raw desc so the most recently ended role appears
// nearest the top.
export function sortResumeItems(a: ResumeItem, b: ResumeItem): number {
  const aPresent = a.employment_dates?.end_date === 'Present'
  const bPresent = b.employment_dates?.end_date === 'Present'

  if (aPresent && !bPresent) return -1
  if (bPresent && !aPresent) return 1

  if (aPresent && bPresent) {
    const aStart = a.employment_dates?.start_date_raw || ''
    const bStart = b.employment_dates?.start_date_raw || ''
    return bStart.localeCompare(aStart)
  }

  const aEnd = a.employment_dates?.end_date_raw || ''
  const bEnd = b.employment_dates?.end_date_raw || ''
  return bEnd.localeCompare(aEnd)
}
