import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

// ── All color tokens for dark and light mode
export const themes = {
  dark: {
    bg:           '#0f0e1a',
    bgCard:       '#1a1830',
    bgCardAlt:    '#1f1d35',
    bgInput:      '#1f1d35',
    border:       '#2a2840',
    borderAlt:    '#3C3489',
    text:         '#f1f0ff',
    textSub:      '#AFA9EC',
    textMuted:    '#534AB7',
    textFaint:    '#3C3489',
    brand:        '#7F77DD',
    brandDark:    '#534AB7',
    gold:         '#fbbf24',
    goldDark:     '#d97706',
    goldText:     '#3a1f00',
    green:        '#22c55e',
    greenBg:      '#052e16',
    greenBorder:  '#166534',
    red:          '#ef4444',
    redBg:        '#2d0a0a',
    redBorder:    '#7f1d1d',
    navBg:        '#1a1830',
    headerBg:     'linear-gradient(135deg, #1a1830, #1f1d35)',
  },
  light: {
    bg:           '#f8f7ff',
    bgCard:       '#ffffff',
    bgCardAlt:    '#f1f0ff',
    bgInput:      '#f8f7ff',
    border:       '#e2e0f0',
    borderAlt:    '#c4bfee',
    text:         '#13112a',
    textSub:      '#4a4580',
    textMuted:    '#7F77DD',
    textFaint:    '#AFA9EC',
    brand:        '#534AB7',
    brandDark:    '#3C3489',
    gold:         '#d97706',
    goldDark:     '#b45309',
    goldText:     '#ffffff',
    green:        '#16a34a',
    greenBg:      '#f0fdf4',
    greenBorder:  '#86efac',
    red:          '#dc2626',
    redBg:        '#fef2f2',
    redBorder:    '#fca5a5',
    navBg:        '#ffffff',
    headerBg:     'linear-gradient(135deg, #ffffff, #f1f0ff)',
  },
}

export const useTheme = () => {
  const { theme } = useAuthStore()

  // Resolve system theme
  const getResolved = () => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return theme
  }

  const resolved = getResolved()
  const t = themes[resolved]

  useEffect(() => {
  document.body.style.background = t.bg
  document.body.style.color      = t.text

  // Inject CSS variables globally
  document.documentElement.style.setProperty('--bg',         t.bg)
  document.documentElement.style.setProperty('--bg-card',    t.bgCard)
  document.documentElement.style.setProperty('--bg-alt',     t.bgCardAlt)
  document.documentElement.style.setProperty('--border',     t.border)
  document.documentElement.style.setProperty('--text',       t.text)
  document.documentElement.style.setProperty('--text-sub',   t.textSub)
  document.documentElement.style.setProperty('--text-muted', t.textMuted)
  document.documentElement.style.setProperty('--brand',      t.brand)
  document.documentElement.style.setProperty('--gold',       t.gold)

  // Update input styles
  const style = document.getElementById('theme-inputs')
  if (style) {
    style.innerHTML = `
      input, select, textarea {
        background: ${t.bgInput} !important;
        border: 1px solid ${t.borderAlt} !important;
        color: ${t.text} !important;
      }
      input::placeholder { color: ${t.textMuted} !important; }
      input:focus, select:focus, textarea:focus {
        border-color: ${t.brand} !important;
        box-shadow: 0 0 0 3px ${t.brand}22 !important;
      }
      .card {
        background: ${t.bgCard} !important;
        border-color: ${t.border} !important;
      }
      body {
        background: ${t.bg} !important;
        color: ${t.text} !important;
      }
    `
  }
}, [theme, resolved])

  return { t, resolved, isDark: resolved === 'dark' }
}
