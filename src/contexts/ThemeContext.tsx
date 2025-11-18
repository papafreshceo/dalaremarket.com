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

  // 초기 로드 시 테마 적용 (무조건 라이트모드)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/platform/orders'))) {
      // 무조건 라이트모드로 강제 설정
      localStorage.setItem('theme', 'light')
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // DB에서 활성 테마의 CSS 변수 불러와서 적용 (admin/settings 경로에서만)
  useEffect(() => {
    const loadActiveTheme = async () => {
      // 현재 경로 확인
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      const isSettingsPage = pathname.startsWith('/admin/settings')

      if (!isSettingsPage) {
        // settings 페이지가 아니면 theme-enabled 클래스 제거하고 종료
        document.documentElement.classList.remove('theme-enabled')
        // CSS 변수를 원래대로 되돌리지 않고 그대로 둠 (기본 CSS 파일의 값 유지)
        return
      }

      // settings 페이지면 theme-enabled 클래스 추가
      document.documentElement.classList.add('theme-enabled')

      // 현재 경로에 따라 scope 결정
      let scope = 'admin'
      if (pathname.startsWith('/platform/orders')) {
        scope = 'orders'
      } else if (pathname.startsWith('/platform')) {
        scope = 'platform'
      } else if (pathname.startsWith('/admin')) {
        scope = 'admin'
      }

      try {
        const response = await fetch(`/api/design-theme/active?scope=${scope}`)
        const result = await response.json()

        if (result.success && result.data?.css_variables) {
          const cssVars = result.data.css_variables

          // CSS 변수를 :root에 동적으로 적용
          Object.entries(cssVars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string)
          })
        }
      } catch (error) {
        console.error('테마 로드 실패:', error)
      }
    }

    loadActiveTheme()
  }, [])

  // 테마 변경 시 HTML 클래스 업데이트
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/platform/orders'))) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

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
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/platform/orders')) {
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
