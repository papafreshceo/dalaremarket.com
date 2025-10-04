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
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'glass' | 'gradient' | 'gradient-blue' | 'gradient-green' | 'gradient-purple'
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
    elevated: 'bg-white shadow-md hover:shadow-xl transition-all duration-300',
    outlined: 'bg-white border-2 border-gray-300',
    ghost: 'bg-gray-50',
    glass: 'bg-white/80 backdrop-blur-lg border border-gray-200/50 shadow-sm',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-gray-200/50 shadow-sm',
    'gradient-blue': 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl',
    'gradient-green': 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl',
    'gradient-purple': 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
  }

  const isGradientVariant = ['gradient-blue', 'gradient-green', 'gradient-purple'].includes(variant)

  return (
    <div
      onClick={onClick}
      className={cn(
        'overflow-hidden transition-all duration-300',
        variantStyles[variant],
        onClick && 'cursor-pointer',
        hover && 'hover:shadow-xl hover:-translate-y-1',
        className
      )}
    >
      {(title || description || actions) && (
        <div className={cn(
          'px-6 py-5',
          !isGradientVariant && 'border-b border-gray-100',
          isGradientVariant && 'border-b border-white/20'
        )}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className={cn(
                  'text-lg font-semibold',
                  isGradientVariant ? 'text-white' : 'text-gray-900'
                )}>{title}</h3>
              )}
              {description && (
                <p className={cn(
                  'mt-1 text-sm',
                  isGradientVariant ? 'text-white/90' : 'text-gray-500'
                )}>{description}</p>
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
        <div className={cn(
          'px-6 py-4',
          !isGradientVariant && 'bg-gray-50 border-t border-gray-100',
          isGradientVariant && 'border-t border-white/20'
        )}>
          {footer}
        </div>
      )}
    </div>
  )
}