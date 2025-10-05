// src/components/ui/Select.tsx
'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helper?: string
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helper,
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
        <select
          ref={ref}
          className={cn(
            'block w-full rounded-lg border transition-all duration-200',
            'px-3 py-2 pr-9 text-sm text-gray-900',
            'focus:outline-none focus:ring-0',
            'appearance-none bg-white cursor-pointer',
            error
              ? 'border-red-300 focus:border-red-500 focus:shadow-sm'
              : 'border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:shadow-md',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200',
            className
          )}
          {...props}
        >
          <option value="">선택하세요</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

Select.displayName = 'Select'
