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

  // 변형 스타일 (OrderSystem.jsx 스타일)
  const variantStyles = {
    primary: cn(
      'bg-[#2563eb] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-sm hover:shadow-md'
    ),
    secondary: cn(
      'bg-white border border-[#2563eb] text-[#2563eb] rounded-lg font-medium',
      'transition-all duration-200',
      'hover:bg-[#eff6ff]'
    ),
    outline: cn(
      'bg-white border border-gray-300 text-gray-700 rounded-lg font-medium',
      'transition-all duration-200',
      'hover:bg-gray-50'
    ),
    ghost: cn(
      'bg-transparent text-gray-700 rounded-lg font-medium',
      'hover:bg-gray-100 transition-all duration-200'
    ),
    danger: cn(
      'bg-[#ef4444] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-sm hover:shadow-md'
    ),
    success: cn(
      'bg-[#10b981] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-sm hover:shadow-md'
    ),
    'gradient-blue': cn(
      'bg-gradient-to-r from-[#2563eb] to-[#60a5fa] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-md hover:shadow-lg'
    ),
    'gradient-green': cn(
      'bg-gradient-to-r from-[#10b981] to-[#34d399] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-md hover:shadow-lg'
    ),
    'gradient-purple': cn(
      'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white rounded-lg font-medium',
      'transition-all duration-200',
      'shadow-md hover:shadow-lg'
    ),
  }

  // 크기 스타일 (인라인으로 강제 적용)
  const getSizeStyles = () => {
    switch (size) {
      case 'xs': return { paddingLeft: '6px', paddingRight: '6px', paddingTop: '3px', paddingBottom: '3px', fontSize: '11px', borderRadius: '6px' }
      case 'sm': return { paddingLeft: '10px', paddingRight: '10px', paddingTop: '5px', paddingBottom: '5px', fontSize: '13px', borderRadius: '8px' }
      case 'md': return { paddingLeft: '14px', paddingRight: '14px', paddingTop: '7px', paddingBottom: '7px', fontSize: '14px', borderRadius: '8px' }
      case 'lg': return { paddingLeft: '18px', paddingRight: '18px', paddingTop: '9px', paddingBottom: '9px', fontSize: '15px', borderRadius: '8px' }
      case 'xl': return { paddingLeft: '22px', paddingRight: '22px', paddingTop: '11px', paddingBottom: '11px', fontSize: '16px', borderRadius: '10px' }
      default: return {}
    }
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      style={getSizeStyles()}
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
