// src/components/ui/Button.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { design } from '@/styles/design-tokens'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient-blue' | 'gradient-green' | 'gradient-purple'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // 기본 스타일 (design-tokens 활용)
  const baseStyles = cn(
    // 기본
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-[250ms]',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',

    // 전체 너비
    fullWidth && 'w-full',
  )

  // 변형 스타일
  const variantStyles = {
    primary: cn(
      'bg-primary-500 text-white',
      'hover:bg-primary-600 active:bg-primary-700',
      'focus:ring-primary-500',
      'shadow-sm hover:shadow-md'
    ),
    secondary: cn(
      'bg-secondary-500 text-white',
      'hover:bg-secondary-600 active:bg-secondary-700',
      'focus:ring-secondary-500',
      'shadow-sm hover:shadow-md'
    ),
    outline: cn(
      'border-2 border-gray-300 bg-white text-gray-700',
      'hover:bg-gray-50 active:bg-gray-100',
      'focus:ring-gray-500'
    ),
    ghost: cn(
      'bg-transparent text-gray-700',
      'hover:bg-gray-100 active:bg-gray-200',
      'focus:ring-gray-500'
    ),
    danger: cn(
      'bg-red-500 text-white',
      'hover:bg-red-600 active:bg-red-700',
      'focus:ring-red-500',
      'shadow-sm hover:shadow-md'
    ),
    'gradient-blue': cn(
      'bg-gradient-to-r from-blue-600 to-blue-400 text-white',
      'hover:from-blue-700 hover:to-blue-500',
      'shadow-md hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-blue-500'
    ),
    'gradient-green': cn(
      'bg-gradient-to-r from-green-600 to-emerald-400 text-white',
      'hover:from-green-700 hover:to-emerald-500',
      'shadow-md hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-green-500'
    ),
    'gradient-purple': cn(
      'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
      'hover:from-purple-700 hover:to-pink-600',
      'shadow-md hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-purple-500'
    ),
  }

  // 크기 스타일
  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs rounded-md',
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2.5 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
    xl: 'px-8 py-4 text-xl rounded-xl',
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
      {/* 로딩 스피너 */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {/* 아이콘 */}
      {icon && !loading && (
        <span className="flex items-center">{icon}</span>
      )}

      {/* 텍스트 */}
      {children}
    </button>
  )
}

// 사용 예시
/*
<Button variant="primary" size="md">
  저장하기
</Button>

<Button variant="outline" size="lg" icon={<PlusIcon />}>
  새로 만들기
</Button>

<Button variant="danger" loading>
  삭제 중...
</Button>
*/
