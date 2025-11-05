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
  // localStorage에서 초기 테마 읽기 (관리자 화면에서만)
  const [theme, setTheme] = useState<Theme>('light')
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // 초기 로드 시 테마 적용
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const savedTheme = localStorage.getItem('theme') as Theme
      const initialTheme = savedTheme || 'light'

      setTheme(initialTheme)

      // HTML 클래스 적용
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // 테마 변경 시 HTML 클래스 업데이트
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  useEffect(() => {
    // 사용자 ID만 로드
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    loadUser()
  }, [])

  const toggleTheme = async () => {
    // 관리자 화면에서만 테마 토글 작동
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      return
    }

    const newTheme = theme === 'light' ? 'dark' : 'light'

    setTheme(newTheme)

    // HTML 클래스 적용
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // localStorage에 저장
    localStorage.setItem('theme', newTheme)

    if (userId) {
      // DB에 저장
      const { error } = await supabase
        .from('users')
        .update({ theme_preference: newTheme })
        .eq('id', userId)

      if (error) {
        console.warn('Failed to save theme to DB:', error)
      }
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
