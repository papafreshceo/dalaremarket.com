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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
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
    full: 'max-w-[95vw]'
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

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-white/10 z-[9999] animate-fadeIn"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div
          className={cn(
            'relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn',
            'border border-gray-200',
            sizeStyles[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          {(title || showCloseButton) && (
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 본문 */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {children}
          </div>
          
          {/* 푸터 */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-end gap-3">
                {footer}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}