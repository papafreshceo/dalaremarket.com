// src/components/ui/Button.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'sm',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-1.5',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-0',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth && 'w-full',
  )

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600',
    secondary: 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  }

  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs rounded-lg font-semibold',
    sm: 'px-4 py-2 text-sm rounded-lg font-semibold',
    md: 'px-5 py-2.5 text-sm rounded-lg font-semibold',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {icon && !loading && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  )
}
