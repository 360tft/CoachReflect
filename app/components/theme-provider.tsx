'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({
  children,
  defaultTheme = 'system'
}: {
  children: React.ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from localStorage on mount, then sync with database
  useEffect(() => {
    const loadTheme = async () => {
      // First check localStorage for immediate render
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored) {
        setThemeState(stored)
      } else {
        // Default to system if nothing stored
        setThemeState('system')
      }

      // Then sync with database
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .single()

          if (profile?.theme_preference) {
            setThemeState(profile.theme_preference as Theme)
            localStorage.setItem('theme', profile.theme_preference)
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error)
      }

      setIsLoading(false)
    }

    loadTheme()
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(getSystemTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Resolve the actual theme to apply
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme())
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  // Apply resolved theme class to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    // Save to database
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
