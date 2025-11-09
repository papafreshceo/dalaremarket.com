// src/components/admin/PageLayout.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageLayout({
  title,
  description,
  actions,
  children,
  className
}: PageLayoutProps) {
  return (
    <div className={cn('', className)}>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {children}
    </div>
  )
}

interface PageSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function PageSection({
  title,
  description,
  children,
  className
}: PageSectionProps) {
  return (
    <div className={cn('bg-white shadow rounded-lg overflow-hidden', className)}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface FormGridProps {
  columns?: 1 | 2 | 3
  children: React.ReactNode
  className?: string
}

export function FormGrid({
  columns = 2,
  children,
  className
}: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {children}
    </div>
  )
}

interface ActionBarProps {
  children: React.ReactNode
  position?: 'left' | 'right' | 'between'
  className?: string
}

export function ActionBar({
  children,
  position = 'right',
  className
}: ActionBarProps) {
  const justifyClass = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div className={cn('mt-6 flex items-center gap-3', justifyClass[position], className)}>
      {children}
    </div>
  )
}

interface InfoBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success'
  title?: string
  message: string
  icon?: React.ReactNode
  className?: string
}

export function InfoBanner({
  type = 'info',
  title,
  message,
  icon,
  className
}: InfoBannerProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-700'
    }
  }

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const style = styles[type]

  return (
    <div className={cn(style.bg, 'border', style.border, 'rounded-lg p-4 mb-4', className)}>
      <div className="flex items-start gap-3">
        <div className={cn(style.iconColor, 'mt-0.5')}>
          {icon || defaultIcons[type]}
        </div>
        <div className="flex-1">
          {title && (
            <p className={cn('text-sm font-medium', style.titleColor)}>{title}</p>
          )}
          <p className={cn('text-sm', title ? 'mt-1' : '', style.textColor)}>{message}</p>
        </div>
      </div>
    </div>
  )
}
