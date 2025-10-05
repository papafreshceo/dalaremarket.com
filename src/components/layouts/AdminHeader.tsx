// src/components/layouts/AdminHeader.tsx
'use client'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AdminHeader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      zIndex: 1000,
      padding: '20px'
    }}>
      <ThemeToggle />
    </div>
  )
}
