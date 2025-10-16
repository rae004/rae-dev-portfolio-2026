/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Build-time environment constants injected by Vite
declare const __APP_ENV__: string | undefined
