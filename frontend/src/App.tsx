// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'
import { initializeReCaptcha } from './services/recaptcha'
import { devLog } from './config/environment'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  // Initialize reCAPTCHA service on app startup
  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        const initialized = await initializeReCaptcha()
        if (initialized) {
          devLog('reCAPTCHA service initialized successfully')
        } else {
          devLog('reCAPTCHA service not enabled or failed to initialize')
        }
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA service:', error)
      }
    }

    initRecaptcha()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Show React Query devtools in development */}
      {/*{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}*/}
    </QueryClientProvider>
  )
}

export default App
