// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'
import ReCaptchaGate from './components/ReCaptchaGate'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReCaptchaGate cacheDuration={5}>
        <RouterProvider router={router} />
        {/* Show React Query devtools in development */}
        {/*{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}*/}
      </ReCaptchaGate>
    </QueryClientProvider>
  )
}

export default App
