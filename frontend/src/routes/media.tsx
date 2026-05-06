import { createFileRoute, Outlet, useMatches as UseMatches } from '@tanstack/react-router'
import EnhancedMediaPage from '../pages/EnhancedMediaPage'

export const Route = createFileRoute('/media')({
  component: () => {
    const matches = UseMatches()

    // Check if we have any child routes active (like /media/$mediaId)
    const hasChildRoute = matches.some(
      match => match.id !== '/media' && match.id.startsWith('/media/')
    )

    // If we have child routes, render the outlet, otherwise render EnhancedMediaPage
    return hasChildRoute ? <Outlet /> : <EnhancedMediaPage />
  },
})
