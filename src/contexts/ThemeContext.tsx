// src/contexts/ThemeContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // 사용자 정보 및 테마 불러오기
    const loadTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        // DB에서 사용자의 테마 설정 불러오기
        const { data, error } = await supabase
          .from('users')
          .select('theme_preference')
          .eq('id', user.id)
          .single()

        if (error) {
          // DB 에러 시 로컬 스토리지 사용 (theme_preference 컬럼이 없을 경우 대비)
          console.warn('Failed to load theme from DB, using localStorage:', error)
          const savedTheme = localStorage.getItem('theme') as Theme
          const fallbackTheme = savedTheme || 'light'
          setTheme(fallbackTheme)
          document.documentElement.classList.toggle('dark', fallbackTheme === 'dark')
        } else {
          const userTheme = (data?.theme_preference as Theme) || 'light'
          setTheme(userTheme)
          document.documentElement.classList.toggle('dark', userTheme === 'dark')
        }
      } else {
        // 로그인하지 않은 경우 로컬 스토리지 사용
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme) {
          setTheme(savedTheme)
          document.documentElement.classList.toggle('dark', savedTheme === 'dark')
        }
      }
    }

    loadTheme()
  }, [])

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')

    if (userId) {
      // DB에 저장
      const { error } = await supabase
        .from('users')
        .update({ theme_preference: newTheme })
        .eq('id', userId)

      if (error) {
        // DB 저장 실패 시 로컬 스토리지에 저장
        console.warn('Failed to save theme to DB, using localStorage:', error)
        localStorage.setItem('theme', newTheme)
      }
    } else {
      // 로그인하지 않은 경우 로컬 스토리지에 저장
      localStorage.setItem('theme', newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
