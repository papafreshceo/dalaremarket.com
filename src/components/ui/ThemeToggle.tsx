// src/components/ui/ThemeToggle.tsx
'use client'

import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        border: '1px solid',
        borderColor: theme === 'dark' ? '#334155' : '#bfdbfe',
        borderRadius: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        color: theme === 'dark' ? '#f1f5f9' : '#1d4ed8',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#eff6ff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme === 'dark' ? '#1e293b' : '#ffffff'
      }}
    >
      {theme === 'dark' ? (
        <>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          다크
        </>
      ) : (
        <>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
          라이트
        </>
      )}
    </button>
  )
}
