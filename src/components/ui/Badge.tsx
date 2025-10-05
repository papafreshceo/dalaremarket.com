// src/components/ui/Badge.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'xs' | 'sm' | 'md'
  children: React.ReactNode
  dot?: boolean
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  dot = false,
  className,
  onClick,
  ...props
}: BadgeProps) {
  const isClickable = !!onClick

  const baseStyles = 'inline-flex items-center gap-1 font-medium rounded-md transition-colors duration-200'

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
  }

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] rounded',
    sm: 'px-2 py-0.5 text-[11px] rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-md',
  }

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isClickable && 'cursor-pointer select-none',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {dot && (
        <span className="w-1 h-1 bg-current rounded-full animate-pulse" />
      )}
      {children}
    </span>
  )
}
