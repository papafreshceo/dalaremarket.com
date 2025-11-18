import React from 'react'

interface MinimalPageLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function MinimalPageLayout({
  title,
  description,
  children,
  actions
}: MinimalPageLayoutProps) {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div>
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
