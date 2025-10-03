// src/components/ui/Badge.tsx
'use client'

import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

export function Badge({ 
  variant = 'default', 
  size = 'md',
  children, 
  className = '' 
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]} 
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  )
}
