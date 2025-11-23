'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { debugSession, forceCleanup, syncSession } from '@/lib/session-sync'

export default function SessionDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const checkSession = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    setSessionInfo({
      session: session ? {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
        provider: session.user.app_metadata.provider
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      cookies: document.cookie,
      localStorage: Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))
    })
    setLoading(false)
  }

  useEffect(() => {
    checkSession()
  }, [])

  const handleDebug = () => {
    debugSession()
  }

  const handleSync = async () => {
    const result = await syncSession()
    console.log('Sync result:', result)
    await checkSession()
  }

  const handleCleanup = () => {
    if (confirm('모든 인증 정보를 삭제하고 로그아웃 하시겠습니까?')) {
      forceCleanup()
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>세션 디버깅 페이지</h1>
      
      <div style={{ marginBottom: '20px', gap: '10px', display: 'flex' }}>
        <button 
          onClick={checkSession}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          세션 재확인
        </button>
        <button 
          onClick={handleDebug}
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          콘솔에 디버그 정보 출력
        </button>
        <button 
          onClick={handleSync}
          style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          세션 동기화
        </button>
        <button 
          onClick={handleCleanup}
          style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          강제 정리 (로그아웃)
        </button>
      </div>

      {loading ? (
        <div>로딩중...</div>
      ) : (
        <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>현재 세션 상태:</h2>
          <pre style={{ background: 'white', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '20px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fca5a5' }}>
        <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>문제 해결 방법:</h3>
        <ol style={{ lineHeight: '1.8', color: '#7f1d1d' }}>
          <li>1. "콘솔에 디버그 정보 출력" 버튼을 클릭하여 개발자 도구 콘솔에서 상태 확인</li>
          <li>2. 세션이 꼬인 경우 "세션 동기화" 버튼 클릭</li>
          <li>3. 그래도 안되면 "강제 정리" 버튼으로 완전히 로그아웃 후 재로그인</li>
          <li>4. 브라우저 캐시 삭제: Ctrl+Shift+Delete → 쿠키 및 사이트 데이터 삭제</li>
        </ol>
      </div>
    </div>
  )
}
