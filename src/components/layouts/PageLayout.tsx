// src/components/layouts/PageLayout.tsx
'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface PageLayoutProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  showBack?: boolean
  description?: string
}

export function PageLayout({ title, children, actions, showBack = false, description }: PageLayoutProps) {
  const router = useRouter()
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <div className="dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950" style={{
      minHeight: '100vh',
      background: isDark ? undefined : 'linear-gradient(180deg, #eff6ff, #ffffff 15%)',
      position: 'relative'
    }}>
      <div style={{ padding: '20px' }}>
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {showBack && (
                <button
                  onClick={() => router.back()}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: '#1d4ed8',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff'
                  }}
                >
                  ← 뒤로
                </button>
              )}
              <h1 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#1d4ed8',
                margin: 0
              }}>{title}</h1>
            </div>
            {description && (
              <p style={{
                margin: '6px 0 0',
                color: '#64748b',
                fontSize: '14px'
              }}>{description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {actions}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
