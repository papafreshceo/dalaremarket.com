// ===========================
// src/components/ui/Tabs.tsx
// ===========================
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export function Tabs({ 
  tabs, 
  activeTab, 
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className 
}: TabsProps) {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5'
  }

  const baseStyles = cn(
    'inline-flex items-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    sizeStyles[size]
  )

  const variantStyles = {
    default: {
      container: 'border-b border-gray-200',
      tab: cn(baseStyles, 'border-b-2 -mb-px'),
      active: 'border-blue-600 text-blue-600 font-semibold',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-xl inline-flex',
      tab: cn(baseStyles, 'rounded-lg'),
      active: 'bg-white text-blue-600 shadow-md font-semibold',
      inactive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    },
    underline: {
      container: '',
      tab: cn(baseStyles, 'relative'),
      active: 'text-blue-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-blue-400',
      inactive: 'text-gray-500 hover:text-gray-700'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className={cn(styles.container, className)}>
      <nav className={cn('flex', fullWidth ? 'w-full' : '', variant === 'pills' ? 'gap-1' : 'gap-4')}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              styles.tab,
              activeTab === tab.key ? styles.active : styles.inactive,
              tab.disabled && 'opacity-50 cursor-not-allowed',
              fullWidth && 'flex-1 justify-center'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}