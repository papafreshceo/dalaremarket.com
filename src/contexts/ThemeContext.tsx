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

  // 초기 로드 시 테마 적용 (이미 FOUC 방지 스크립트에서 적용되었으므로 state만 동기화)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/platform/orders'))) {
      const savedTheme = localStorage.getItem('theme') as Theme
      const initialTheme = savedTheme || 'light'

      // state만 설정하고 DOM은 건드리지 않음 (이미 layout.tsx의 스크립트에서 처리됨)
      setTheme(initialTheme)
    }
  }, [])

  // DB에서 활성 테마의 CSS 변수 불러와서 적용 (admin/settings 경로에서만)
  useEffect(() => {
    const loadActiveTheme = async () => {
      // admin/settings 경로 체크
      const isSettingsPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/settings')

      if (!isSettingsPage) {
        // settings 페이지가 아니면 theme-enabled 클래스 제거하고 종료
        document.documentElement.classList.remove('theme-enabled')
        // CSS 변수를 원래대로 되돌리지 않고 그대로 둠 (기본 CSS 파일의 값 유지)
        return
      }

      // settings 페이지면 theme-enabled 클래스 추가
      document.documentElement.classList.add('theme-enabled')

      try {
        const response = await fetch('/api/design-theme/active')
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
    // 사용자 ID 및 테마 설정 로드
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // DB에서 사용자 테마 설정 가져오기
        const { data: userData } = await supabase
          .from('users')
          .select('theme_preference')
          .eq('id', user.id)
          .single()

        if (userData?.theme_preference) {
          const dbTheme = userData.theme_preference as Theme
          // DB의 테마를 localStorage에 동기화
          localStorage.setItem('theme', dbTheme)
          setTheme(dbTheme)

          // HTML 클래스 적용 (admin과 platform/orders에서만)
          const path = window.location.pathname
          if (path.startsWith('/admin') || path.startsWith('/platform/orders')) {
            if (dbTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          } else {
            // 다른 페이지에서는 무조건 라이트모드
            document.documentElement.classList.remove('dark')
          }
        }
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
