import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Navigation from '../components/Navigation'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
})