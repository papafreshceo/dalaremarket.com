// src/components/ui/Badge.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
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
  className
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  }

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full" />
      )}
      {children}
    </span>
  )
}