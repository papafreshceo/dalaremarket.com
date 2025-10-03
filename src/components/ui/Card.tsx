// src/components/ui/Card.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  actions?: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'glass' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({
  title,
  description,
  children,
  footer,
  actions,
  variant = 'default',
  padding = 'md',
  className,
  onClick,
  hover = false
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-md hover:shadow-lg transition-shadow',
    outlined: 'bg-white border-2 border-gray-300',
    ghost: 'bg-gray-50',
    glass: 'bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-gray-200/50 shadow-sm'
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300',
        variantStyles[variant],
        onClick && 'cursor-pointer',
        hover && 'hover:shadow-xl hover:-translate-y-1',
        className
      )}
    >
      {(title || description || actions) && (
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      )}
      
      <div className={paddingStyles[padding]}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  )
}