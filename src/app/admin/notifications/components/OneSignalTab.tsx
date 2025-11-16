'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Activity, MessageCircle } from 'lucide-react'

interface OneSignalData {
  app: {
    id: string
    name: string
    players: number
    messageable_players: number
    updated_at: string
    created_at: string
    gcm_key: string
    chrome_web_origin: string
    chrome_web_default_notification_icon: string
    chrome_web_sub_domain: string
  }
  recent_notifications: any[]
  summary: {
    total_players: number
    messageable_players: number
    recent_notifications_count: number
  }
}

export default function OneSignalTab() {
  const [data, setData] = useState<OneSignalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOneSignalStats()
  }, [])

  const fetchOneSignalStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/onesignal-stats')
      const result = await response.json()

      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('OneSignal 통계 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: '#6b7280',
        fontSize: '13px'
      }}>
        OneSignal 데이터를 불러올 수 없습니다
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 앱 정보 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Activity size={16} />
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>OneSignal 앱 정보</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>앱 이름</p>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginTop: '2px' }}>
              {data.app.name}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>앱 ID</p>
            <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#111827', marginTop: '2px' }}>
              {data.app.id}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>총 플레이어</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb', marginTop: '2px' }}>
              {data.app.players.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>메시지 가능</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
              {data.app.messageable_players.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>Web Origin</p>
            <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151', marginTop: '2px' }}>
              {data.app.chrome_web_origin || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>GCM Key</p>
            <p style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
              {data.app.gcm_key}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>생성일</p>
            <p style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
              {new Date(data.app.created_at * 1000).toLocaleString('ko-KR')}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>마지막 업데이트</p>
            <p style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
              {new Date(data.app.updated_at * 1000).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 요약 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>총 플레이어</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
            {data.summary.total_players.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>메시지 가능</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>
            {data.summary.messageable_players.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>최근 알림</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', marginTop: '4px' }}>
            {data.summary.recent_notifications_count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 최근 알림 목록 */}
      {data.recent_notifications.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <MessageCircle size={16} />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>최근 발송 알림 (OneSignal)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.recent_notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                      {notification.headings?.en || 'No Title'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {notification.contents?.en || 'No Content'}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {notification.completed_at
                      ? new Date(notification.completed_at * 1000).toLocaleString('ko-KR')
                      : '전송 중'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>성공</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', marginTop: '2px' }}>
                      {notification.successful || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>실패</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginTop: '2px' }}>
                      {notification.failed || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>전환</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb', marginTop: '2px' }}>
                      {notification.converted || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>대기</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginTop: '2px' }}>
                      {notification.remaining || 0}
                    </p>
                  </div>
                </div>

                {notification.platform_delivery_stats && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>플랫폼별 전송</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.entries(notification.platform_delivery_stats).map(
                        ([platform, stats]: [string, any]) => (
                          <span
                            key={platform}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: '#f3f4f6',
                              color: '#374151'
                            }}
                          >
                            {platform}: {stats.successful || 0}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OneSignal 대시보드 링크 */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #dbeafe',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>
              OneSignal 대시보드
            </p>
            <p style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px' }}>
              더 자세한 통계와 설정은 OneSignal 대시보드에서 확인하세요
            </p>
          </div>
          <a
            href={`https://app.onesignal.com/apps/${data.app.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            대시보드 열기
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
