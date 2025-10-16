import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Determine app environment from various sources
  const getAppEnvironment = (): string => {
    // 1. Check explicit APP_ENV environment variable
    if (process.env.APP_ENV) {
      return process.env.APP_ENV
    }

    // 2. Check for specific build modes
    if (mode === 'development') {
      return 'local' // dev server = local Docker environment
    }

    // 3. Check VITE_ENV for production builds with specific targets
    if (process.env.VITE_ENV === 'development') {
      return 'development' // AWS dev environment
    }

    if (process.env.VITE_ENV === 'production') {
      return 'production' // AWS production environment
    }

    // 4. Default fallback based on NODE_ENV
    return process.env.NODE_ENV === 'development' ? 'local' : 'production'
  }

  const appEnv = getAppEnvironment()

  console.log(`[Vite] Building for environment: ${appEnv}`)
  console.log(`[Vite] Mode: ${mode}, NODE_ENV: ${process.env.NODE_ENV}`)

  return {
    plugins: [react()],

    // Environment variables configuration
    envPrefix: ['VITE_'],

    // Define config - inject build-time constants
    define: {
      // App environment for runtime detection
      __APP_ENV__: JSON.stringify(appEnv),
      // Legacy support
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    },
  }
})
