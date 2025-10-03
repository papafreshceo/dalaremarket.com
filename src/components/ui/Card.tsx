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
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
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
  onClick
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
    ghost: 'bg-gray-50'
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        'rounded-xl overflow-hidden',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md transition-all',
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