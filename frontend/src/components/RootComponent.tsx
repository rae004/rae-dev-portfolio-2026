import { lazy, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import Navigation from './Navigation'

// Dev-only, lazy-loaded: in production builds `import.meta.env.DEV` is a
// compile-time `false`, so the devtools module is never imported and its
// code is dropped from the bundle (it previously shipped to prod and
// rendered its badge on the live site).
const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/router-devtools').then(m => ({ default: m.TanStackRouterDevtools }))
    )
  : () => null

export const RootComponent = () => (
  <div className='min-h-screen'>
    <Navigation />
    <main>
      <Outlet />
    </main>
    <Suspense fallback={null}>
      <TanStackRouterDevtools />
    </Suspense>
  </div>
)
