// List of CSS variables that DaisyUI typically uses for themes
const DAISYUI_CSS_VARIABLES = [
  '--p', '--pf', '--pc', '--s', '--sf', '--sc', '--a', '--af', '--ac',
  '--n', '--nf', '--nc', '--b1', '--b2', '--b3', '--bc', '--in', '--inc',
  '--su', '--suc', '--wa', '--wac', '--er', '--erc', '--rounded-box',
  '--rounded-btn', '--rounded-badge', '--animation-btn', '--animation-input',
  '--btn-text-case', '--btn-focus-scale', '--border-btn', '--tab-border',
  '--tab-radius', '--primary', '--secondary', '--accent', '--neutral',
  '--base-100', '--base-200', '--base-300', '--base-content', '--info',
  '--success', '--warning', '--error'
]

// Utility to debug theme loading and CSS variables
export const inspectCSSVariables = (themeName: string): Record<string, string> => {
  const testEl = document.createElement('div')
  testEl.setAttribute('data-theme', themeName)
  testEl.style.display = 'none'
  document.body.appendChild(testEl)
  
  const computedStyle = window.getComputedStyle(testEl)
  const variables: Record<string, string> = {}
  
  // Check all possible DaisyUI CSS variables
  DAISYUI_CSS_VARIABLES.forEach(varName => {
    const value = computedStyle.getPropertyValue(varName).trim()
    if (value) {
      variables[varName] = value
    }
  })
  
  document.body.removeChild(testEl)
  return variables
}

export const checkThemeSupport = (themeName: string): boolean => {
  const variables = inspectCSSVariables(themeName)
  // Theme is supported if it has any DaisyUI CSS variables
  return Object.keys(variables).length > 0
}

export const getAllSupportedThemes = (themes: string[]): string[] => {
  return themes.filter(theme => checkThemeSupport(theme))
}

export const logThemeDebugInfo = (themes: string[]): void => {
  console.group('🎨 DaisyUI Theme Debug Info')
  console.log('Total themes to check:', themes.length)
  
  // Check a few key themes in detail
  const keyThemes = ['light', 'dark', 'cupcake', 'cyberpunk']
  console.group('🔍 Detailed CSS Variable Inspection')
  keyThemes.forEach(theme => {
    const variables = inspectCSSVariables(theme)
    console.log(`${theme} theme variables:`, variables)
    console.log(`${theme} variable count:`, Object.keys(variables).length)
  })
  console.groupEnd()
  
  const supportedThemes = getAllSupportedThemes(themes)
  const unsupportedThemes = themes.filter(theme => !supportedThemes.includes(theme))
  
  console.log('✅ Supported themes:', supportedThemes)
  console.log('❌ Unsupported themes:', unsupportedThemes)
  console.log(`Support ratio: ${supportedThemes.length}/${themes.length}`)
  
  // Test current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  console.log('Current active theme:', currentTheme)
  console.log('Current theme supported:', checkThemeSupport(currentTheme))
  console.log('Current theme variables:', inspectCSSVariables(currentTheme))
  
  console.groupEnd()
}