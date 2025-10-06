import React, { useState, useEffect } from 'react'
import { checkThemeSupport, logThemeDebugInfo } from '../utils/themeDebug'

const themes = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 
  'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 
  'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 
  'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'
]

// Theme color mappings for previews (representing primary, secondary, accent colors)
const themeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  light: { primary: '#570df8', secondary: '#f000b8', accent: '#37cdbe' },
  dark: { primary: '#661ae6', secondary: '#d926aa', accent: '#1fb2a5' },
  cupcake: { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a' },
  bumblebee: { primary: '#e0a82e', secondary: '#f9d72f', accent: '#18d7ed' },
  emerald: { primary: '#66cc8a', secondary: '#377cfb', accent: '#ea5234' },
  corporate: { primary: '#4b6bfb', secondary: '#7b92b2', accent: '#67cba0' },
  synthwave: { primary: '#e779c1', secondary: '#58c7f3', accent: '#f3cc30' },
  retro: { primary: '#ef9995', secondary: '#a4cbb4', accent: '#fbbf24' },
  cyberpunk: { primary: '#ff7598', secondary: '#75d1f0', accent: '#c07eec' },
  valentine: { primary: '#e96d7b', secondary: '#a991f7', accent: '#88dbdd' },
  halloween: { primary: '#f28c18', secondary: '#6d3a9c', accent: '#51a800' },
  garden: { primary: '#5c7f67', secondary: '#ecf4e7', accent: '#9bb86f' },
  forest: { primary: '#1eb854', secondary: '#1fd65f', accent: '#b91c1c' },
  aqua: { primary: '#09ecf3', secondary: '#966fb3', accent: '#ffe999' },
  lofi: { primary: '#0d0d0d', secondary: '#1a1a1a', accent: '#262626' },
  pastel: { primary: '#d1c1d7', secondary: '#f9dcc4', accent: '#fef08a' },
  fantasy: { primary: '#6e0b75', secondary: '#007ebd', accent: '#f471b5' },
  wireframe: { primary: '#b8b8b8', secondary: '#b8b8b8', accent: '#b8b8b8' },
  black: { primary: '#343232', secondary: '#343232', accent: '#343232' },
  luxury: { primary: '#ffffff', secondary: '#152747', accent: '#513448' },
  dracula: { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c' },
  cmyk: { primary: '#179cff', secondary: '#ff0097', accent: '#ffed4e' },
  autumn: { primary: '#8c0327', secondary: '#d85251', accent: '#f3cc30' },
  business: { primary: '#1c4ed8', secondary: '#7c3aed', accent: '#f59e0b' },
  acid: { primary: '#ff00f4', secondary: '#ff7400', accent: '#ffff00' },
  lemonade: { primary: '#519903', secondary: '#e9e92f', accent: '#ffe302' },
  night: { primary: '#38bdf8', secondary: '#818cf8', accent: '#f471b5' },
  coffee: { primary: '#db924b', secondary: '#263e3f', accent: '#10576d' },
  winter: { primary: '#047aed', secondary: '#463aa2', accent: '#c148ac' },
}

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState('light')
  const [isLoading, setIsLoading] = useState(true)
  const [supportedThemes, setSupportedThemes] = useState<string[]>([])

  useEffect(() => {
    // Get the theme that should already be applied by the HTML script
    const savedTheme = localStorage.getItem('theme') || 'light'
    setCurrentTheme(savedTheme)
    
    // Check which themes are actually supported (have CSS variables)
    const availableThemes = themes.filter(theme => checkThemeSupport(theme))
    setSupportedThemes(availableThemes)
    
    // Log debug info in development
    if (process.env.NODE_ENV === 'development') {
      logThemeDebugInfo(themes)
    }
    
    setIsLoading(false)
  }, [])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('theme', theme)
    
    // Apply theme with a small delay to ensure smooth transition
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', theme)
    })
  }

  if (isLoading) {
    return (
      <div className="btn btn-ghost loading">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    )
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost" aria-label="Change theme">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.135-.439 1.573 0l3.712 3.713c.438.438.438 1.135 0 1.573l-2.879 2.879M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
        <span className="hidden sm:inline">Theme</span>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-300 rounded-box w-56 max-h-96 overflow-y-auto">
        <li className="menu-title">
          <span>Choose Theme</span>
        </li>
{(supportedThemes.length > 0 ? supportedThemes : themes).map((theme) => {
          const isActive = currentTheme === theme
          const isSupported = supportedThemes.includes(theme)
          
          return (
            <li key={theme}>
              <button
                className={`flex items-center gap-3 ${isActive ? 'active font-semibold' : ''} ${!isSupported ? 'opacity-50' : ''}`}
                onClick={() => handleThemeChange(theme)}
                aria-label={`Switch to ${theme} theme${!isSupported ? ' (may not be fully supported)' : ''}`}
                disabled={!isSupported && supportedThemes.length > 0}
              >
                <span className="capitalize flex-1 text-left">{theme}</span>
                <div className="flex items-center gap-1">
                  {!isSupported && supportedThemes.length > 0 && (
                    <span className="text-xs opacity-60">⚠️</span>
                  )}
                  {isActive && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ThemeSwitcher