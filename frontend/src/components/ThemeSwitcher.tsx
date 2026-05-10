import React, { useEffect, useState } from 'react'

type ThemeOption = { id: string; label: string }

// Keep in sync with tailwind.config.js daisyui.themes and the inline
// FOUC-prevention script in index.html.
const themeGroups: { category: string; themes: ThemeOption[] }[] = [
  {
    category: 'Dark',
    themes: [
      { id: 'black', label: 'Black' },
      { id: 'halloween', label: 'Halloween' },
      { id: 'forest', label: 'Forest' },
      { id: 'dracula', label: 'Dracula' },
      { id: 'coffee', label: 'Coffee' },
    ],
  },
  {
    category: 'Color',
    themes: [
      { id: 'synthwave', label: 'Synthwave' },
      { id: 'aqua', label: 'Aqua' },
      { id: 'cyberpunk', label: 'Cyberpunk' },
      { id: 'retro', label: 'Retro' },
    ],
  },
  {
    category: 'Light',
    themes: [
      { id: 'cmyk', label: 'CMYK' },
      { id: 'acid', label: 'Acid' },
      { id: 'bumblebee', label: 'Bumblebee' },
      { id: 'corporate', label: 'Corporate' },
      { id: 'lofi', label: 'LoFi' },
    ],
  },
]

const allThemeIds = themeGroups.flatMap(g => g.themes.map(t => t.id))

function getDefaultTheme(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'corporate'
}

function getInitialTheme(): string {
  const saved = localStorage.getItem('theme')
  if (saved && allThemeIds.includes(saved)) {
    return saved
  }
  return getDefaultTheme()
}

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme)

  useEffect(() => {
    // Migrate stale localStorage values from the pre-curation theme list.
    const saved = localStorage.getItem('theme')
    if (saved && !allThemeIds.includes(saved)) {
      const fallback = getDefaultTheme()
      localStorage.setItem('theme', fallback)
      setCurrentTheme(fallback)
      document.documentElement.setAttribute('data-theme', fallback)
    }
  }, [])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('theme', theme)
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', theme)
    })
  }

  return (
    <div className='dropdown dropdown-end'>
      <div tabIndex={0} role='button' className='btn btn-ghost' aria-label='Change theme'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='w-5 h-5'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.135-.439 1.573 0l3.712 3.713c.438.438.438 1.135 0 1.573l-2.879 2.879M6.75 17.25h.008v.008H6.75v-.008z'
          />
        </svg>
        <span className='hidden sm:inline'>Theme</span>
      </div>
      <div
        tabIndex={0}
        className='dropdown-content z-[1] p-3 shadow-2xl bg-base-300 rounded-box w-max max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto'
      >
        <div className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center'>
          {themeGroups.map(group => (
            <React.Fragment key={group.category}>
              <span className='font-semibold text-sm'>{group.category}:</span>
              <div className='flex flex-wrap gap-1'>
                {group.themes.map(theme => {
                  const isActive = currentTheme === theme.id
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`btn btn-xs ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                      aria-label={`Switch to ${theme.label} theme`}
                      aria-pressed={isActive}
                    >
                      {theme.label}
                    </button>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ThemeSwitcher
