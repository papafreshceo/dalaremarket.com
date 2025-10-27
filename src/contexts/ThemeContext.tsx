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
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const savedTheme = localStorage.getItem('theme') as Theme
      return savedTheme || 'light'
    }
    return 'light'
  })
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

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
