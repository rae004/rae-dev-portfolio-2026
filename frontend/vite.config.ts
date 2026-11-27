/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The release version lives in git tags only; package.json carries a 0.0.0
// placeholder. Deploys pass the tag in as APP_VERSION (see
// .github/workflows/deploy-frontend.yml). Local builds show the placeholder.
const appVersion = process.env.APP_VERSION || '0.0.0'

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
      // Release version from the deploy (the git tag). Preview builds append
      // a suffix like "-rc.142.a1b2c3d" so the footer badge on dev says
      // exactly which PR/commit is live there.
      __APP_VERSION__: JSON.stringify(`${appVersion}${process.env.APP_VERSION_SUFFIX ?? ''}`),
      // Legacy support
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/routeTree.gen.ts',
          'src/test/**',
          'src/**/*.d.ts',
          'src/vite-env.d.ts',
        ],
      },
    },
  }
})
