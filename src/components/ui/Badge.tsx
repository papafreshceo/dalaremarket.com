// src/components/ui/Badge.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gradient-blue' | 'gradient-green' | 'gradient-purple'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
  dot?: boolean
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
  className,
  onClick,
  ...props
}: BadgeProps) {
  // 클릭 가능한 배지인지 확인
  const isClickable = !!onClick

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-[#10b981] text-white hover:bg-[#059669]',
    warning: 'bg-[#f59e0b] text-white hover:bg-[#d97706]',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
    info: 'bg-[#3b82f6] text-white hover:bg-[#2563eb]',
    'gradient-blue': 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-sm hover:shadow-md',
    'gradient-green': 'bg-gradient-to-r from-green-600 to-emerald-400 text-white shadow-sm hover:shadow-md',
    'gradient-purple': 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm hover:shadow-md'
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'xs': return { paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px', fontSize: '11px' }
      case 'sm': return { paddingLeft: '8px', paddingRight: '8px', paddingTop: '3px', paddingBottom: '3px', fontSize: '12px' }
      case 'md': return { paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', fontSize: '13px' }
      case 'lg': return { paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '14px' }
      default: return {}
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded transition-all duration-200',
        variantStyles[variant],
        isClickable && 'cursor-pointer select-none',
        className
      )}
      style={getSizeStyles()}
      onClick={onClick}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
      )}
      {children}
    </span>
  )
}