// src/components/ui/ConfirmModal.tsx
'use client'

import { useEffect } from 'react'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  if (!isOpen) return null

  const icons = {
    danger: '🗑️',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const confirmVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <span className="text-2xl">{icons[type]}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariants[type]}
            size="md"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ConfirmModal Provider Context
import { createContext, useContext, useState, ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  const handleCancel = () => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.options.title}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          type={confirmState.options.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}
