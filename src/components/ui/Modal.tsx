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
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
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

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 - 블러 효과 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-3">
        <div
          className={cn(
            'relative bg-white rounded-xl shadow-xl w-full max-h-[92vh] overflow-hidden animate-scaleIn',
            'border border-gray-100',
            sizeStyles[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          {(title || showCloseButton) && (
            <div className="px-3 py-2 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <h3 className="text-[11px] font-semibold text-gray-900">{title}</h3>
                  )}
                  {description && (
                    <p className="mt-0.5 text-[10px] text-gray-500">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 본문 - 컴팩트한 스크롤 */}
          <div className="px-3 py-2 overflow-y-auto max-h-[calc(92vh-100px)] text-[10px]">
            {children}
          </div>

          {/* 푸터 */}
          {footer && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-end gap-1.5">
                {footer}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
