import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/recaptcha.css'
import './styles/turntable.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
console.log('VITE_WP_API_BASE:', import.meta.env.VITE_WP_API_BASE)
