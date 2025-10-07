// src/components/ui/Modal.tsx
'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closeOnOverlay?: boolean
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  showCloseButton = true
}: ModalProps) {
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-[96vw]'
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-[9998]',
          'transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div
          className={cn(
            'relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden',
            'border border-gray-200 dark:border-gray-700',
            'transition-all duration-300 ease-out',
            isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95',
            sizeStyles[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                {title && (
                  <h3 className="text-lg font-semibold text-text">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-surface-hover rounded-lg transition-all duration-200"
                  aria-label="닫기"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 본문 */}
          <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)] text-sm text-text text-center">
            {children}
          </div>

          {/* 푸터 */}
          {footer && (
            <div className="flex justify-end gap-3 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
