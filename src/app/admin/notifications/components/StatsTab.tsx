'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Users, TrendingUp } from 'lucide-react'

interface NotificationStats {
  stats: {
    total: number
    read: number
    sent: number
    failed: number
    read_rate: string
    sent_rate: string
  }
  byType: Record<string, number>
  byCategory: Record<string, number>
  dailyStats: Record<string, number>
  broadcasts: {
    total: number
    recent: any[]
  }
  subscribers: {
    active: number
  }
}

export default function StatsTab() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data)
      }
    } catch (error) {
      console.error('통계 조회 오류:', error)
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

  if (!stats) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: '#6b7280',
        fontSize: '13px'
      }}>
        통계 데이터를 불러올 수 없습니다
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 전체 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전체 알림</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {stats.stats.total.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전송 완료</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {stats.stats.sent.toLocaleString()}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {stats.stats.sent_rate}%
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>읽음</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
            {stats.stats.read.toLocaleString()}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {stats.stats.read_rate}%
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전송 실패</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
            {stats.stats.failed.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 구독자 정보 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Users size={16} />
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>푸시 알림 구독자</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>활성 구독자</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginTop: '4px' }}>
              {stats.subscribers.active.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>전체 공지 발송 횟수</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
              {stats.broadcasts.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 타입별/카테고리별 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <BarChart3 size={16} />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>타입별 알림 수</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{type}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <BarChart3 size={16} />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>카테고리별 알림 수</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{category}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 7일 발송 통계 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <TrendingUp size={16} />
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>최근 7일 알림 발송</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(stats.dailyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, count]) => (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#374151', minWidth: '80px' }}>{date}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '200px',
                    height: '6px',
                    background: '#e5e7eb',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#2563eb',
                      width: `${Math.min((count / Math.max(...Object.values(stats.dailyStats))) * 100, 100)}%`,
                      borderRadius: '3px'
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#111827',
                    minWidth: '40px',
                    textAlign: 'right'
                  }}>
                    {count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 최근 전체 공지 */}
      {stats.broadcasts.recent.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            최근 전체 공지
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.broadcasts.recent.map((broadcast: any) => (
              <div
                key={broadcast.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px'
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {broadcast.title}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {broadcast.body}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    수신자: {broadcast.recipient_count}명
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {new Date(broadcast.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
