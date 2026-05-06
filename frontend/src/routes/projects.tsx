import { createFileRoute, Outlet, useMatches as UseMatches } from '@tanstack/react-router'
import ProjectsPage from '../pages/ProjectsPage'

export const Route = createFileRoute('/projects')({
  component: () => {
    const matches = UseMatches()

    // Check if we have any child routes active (like /projects/$projectId)
    const hasChildRoute = matches.some(
      match => match.id !== '/projects' && match.id.startsWith('/projects/')
    )

    // If we have child routes, render the outlet, otherwise render ProjectsPage
    return hasChildRoute ? <Outlet /> : <ProjectsPage />
  },
})
