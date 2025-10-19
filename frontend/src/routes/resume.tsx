import { createFileRoute, Outlet, useMatches as UseMatches } from '@tanstack/react-router'
import ResumePage from '../pages/ResumePage'

export const Route = createFileRoute('/resume')({
  component: () => {
    const matches = UseMatches()

    // Check if we have any child routes active (like /resume/$resumeId)
    const hasChildRoute = matches.some(
      match => match.id !== '/resume' && match.id.startsWith('/resume/')
    )

    // If we have child routes, render the outlet, otherwise render ResumePage
    return hasChildRoute ? <Outlet /> : <ResumePage />
  },
})
