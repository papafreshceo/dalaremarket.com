// src/contexts/ThemeContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  // 적용된 CSS 변수 키를 저장하는 ref
  const appliedCssVarsRef = useRef<string[]>([])

  // 초기 로드 시 테마 적용 (무조건 라이트모드)
  useEffect(() => {
    if (typeof window !== 'undefined' && (pathname?.startsWith('/admin') || pathname?.startsWith('/platform/orders'))) {
      // 무조건 라이트모드로 강제 설정
      localStorage.setItem('theme', 'light')
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }, [pathname])

  // DB 테마 테이블이 삭제되어 더 이상 커스텀 테마를 로드하지 않음
  useEffect(() => {
    // 모든 경로에서 theme-enabled 클래스 제거
    document.documentElement.classList.remove('theme-enabled')

    // 이전에 적용된 CSS 변수들을 모두 제거
    appliedCssVarsRef.current.forEach(key => {
      document.documentElement.style.removeProperty(key)
    })
    appliedCssVarsRef.current = []
  }, [pathname])

  // 테마 변경 시 HTML 클래스 업데이트
  useEffect(() => {
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/platform/orders')) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme, pathname])

  useEffect(() => {
    // 사용자 ID 로드 (테마는 무조건 light로 고정)
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // DB의 테마도 light로 강제 설정
        await supabase
          .from('users')
          .update({ theme_preference: 'light' })
          .eq('id', user.id)
      }
    }
    loadUser()
  }, [])

  const toggleTheme = async () => {
    // 관리자 및 발주관리 화면에서만 테마 토글 작동
    if (!pathname?.startsWith('/admin') && !pathname?.startsWith('/platform/orders')) {
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
