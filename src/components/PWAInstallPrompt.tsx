'use client'

import { useEffect, useState } from 'react'
import logger from '@/lib/logger'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      // 기본 브라우저 프롬프트 막기
      e.preventDefault()

      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      // 이미 설치되었는지 확인
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches

      if (!isInstalled) {
        setShowInstallButton(true)
        logger.info('PWA 설치 프롬프트 준비됨')
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 이미 설치된 경우 감지
    window.addEventListener('appinstalled', () => {
      logger.info('PWA 앱 설치 완료')
      setShowInstallButton(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // 설치 프롬프트 표시
    await deferredPrompt.prompt()

    // 사용자 선택 결과 대기
    const { outcome } = await deferredPrompt.userChoice

    logger.info('PWA 설치 선택:', outcome)

    if (outcome === 'accepted') {
      logger.info('사용자가 PWA 설치를 수락했습니다')
    } else {
      logger.info('사용자가 PWA 설치를 거부했습니다')
    }

    // 프롬프트 사용 후 초기화
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  const handleClose = () => {
    setShowInstallButton(false)
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // 24시간 이내에 닫았으면 표시하지 않음
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 24) {
        setShowInstallButton(false)
      }
    }
  }, [])

  if (!showInstallButton) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
            달
          </div>
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">달래마켓 앱 설치</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
        >
          설치
        </button>
        <button
          onClick={handleClose}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
