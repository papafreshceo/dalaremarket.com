'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthModal } from '@/components/auth/AuthModal'

function LoginContent() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [initialMode, setInitialMode] = useState<'login' | 'findId' | 'resetPassword'>('login')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URL 파라미터에서 모드 확인
    const mode = searchParams.get('mode')
    if (mode === 'findId') {
      setInitialMode('findId')
    } else if (mode === 'resetPassword') {
      setInitialMode('resetPassword')
    }
  }, [searchParams])

  const handleClose = () => {
    setIsModalOpen(false)
    // 모달 닫으면 메인 페이지로
    router.push('/')
  }

  return (
    <AuthModal
      isOpen={isModalOpen}
      onClose={handleClose}
      initialMode={initialMode}
    />
  )
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #ffffff 100%)'
    }}>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  )
}
