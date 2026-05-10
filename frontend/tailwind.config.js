/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    darkTheme: 'black',
    // Curated theme list. Grouped (Dark / Color / Light) in ThemeSwitcher.
    // Keep these in sync with ThemeSwitcher.tsx and the inline FOUC-prevention
    // script in index.html.
    themes: [
      // Light (first one is DaisyUI's no-preference default)
      'corporate',
      'cmyk',
      'acid',
      'bumblebee',
      'lofi',
      // Color
      'synthwave',
      'aqua',
      'cyberpunk',
      'retro',
      // Dark
      'black',
      'halloween',
      'forest',
      'dracula',
      'coffee',
    ],
  },
}
