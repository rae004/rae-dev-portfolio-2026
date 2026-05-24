import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Navigation from './Navigation'

export const RootComponent = () => (
  <div className='min-h-screen'>
    <Navigation />
    <main>
      <Outlet />
    </main>
    <TanStackRouterDevtools />
  </div>
)
