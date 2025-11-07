'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // PWA로 실행 중인지 확인
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIosPwa = (window.navigator as any).standalone === true
      setIsPWA(isStandalone || isIosPwa)
    }

    checkPWA()

    // 이미 PWA로 실행 중이면 배너 표시 안 함
    if (isPWA) return

    // PWA 설치 프롬프트 이벤트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // 사용자가 이전에 배너를 닫았는지 확인
      const dismissed = localStorage.getItem('pwa-install-dismissed-orders')
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isPWA])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
    }

    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // 7일 동안 배너 표시 안 함
    const dismissUntil = new Date()
    dismissUntil.setDate(dismissUntil.getDate() + 7)
    localStorage.setItem('pwa-install-dismissed-orders', dismissUntil.toISOString())
  }

  if (!showBanner || isPWA) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        maxWidth: '500px',
        width: 'calc(100% - 40px)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ flexShrink: 0, marginTop: '2px' }}
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
            앱으로 설치하면 더 편해요!
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            주소창 없이 독립된 앱처럼 사용할 수 있습니다
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: '#ffffff',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          지금 설치하기
        </button>

        <button
          onClick={handleDismiss}
          style={{
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
        >
          나중에
        </button>
      </div>
    </div>
  )
}
