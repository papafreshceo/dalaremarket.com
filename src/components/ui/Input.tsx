// src/components/ui/Input.tsx
'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helper,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full rounded-lg border transition-all duration-200',
            'px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-0',
            'bg-white',
            icon && iconPosition === 'left' && 'pl-9',
            icon && iconPosition === 'right' && 'pr-9',
            error
              ? 'border-red-300 focus:border-red-500 focus:shadow-sm'
              : 'border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:shadow-md',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200',
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {helper && !error && (
        <p className="text-[10px] text-gray-500">{helper}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-600 flex items-center gap-0.5">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
