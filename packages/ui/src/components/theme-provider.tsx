import React, { createContext, useContext, useEffect, useState } from 'react'
import { type Theme, applyTheme, getStoredTheme } from '@/lib/themes'

interface ThemeContextType {
  theme: Theme
  mode: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setMode: (mode: 'light' | 'dark') => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultMode?: 'light' | 'dark'
  enableSystem?: boolean
}

export const ThemeProvider = ({
  children,
  defaultTheme = 'default',
  defaultMode = 'light',
  enableSystem = true,
}: ThemeProviderProps) => {
  // Initialize from localStorage or defaults
  const stored = getStoredTheme()
  const [theme, setThemeState] = useState<Theme>(stored.theme || defaultTheme)
  const [mode, setModeState] = useState<'light' | 'dark'>(stored.mode || defaultMode)

  // Apply theme on mount and when theme/mode changes
  useEffect(() => {
    applyTheme(theme, mode)

    // Apply dark class to html element for dark mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, mode])

  // Listen for system theme changes if enabled
  useEffect(() => {
    if (!enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no stored preference
      if (!localStorage.getItem('theme-mode')) {
        setModeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Set initial mode based on system preference if no stored preference
    if (!localStorage.getItem('theme-mode')) {
      setModeState(mediaQuery.matches ? 'dark' : 'light')
    }

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystem])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
