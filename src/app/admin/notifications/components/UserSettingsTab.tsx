'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle } from 'lucide-react'

interface UserSetting {
  id: string
  email: string
  name: string | null
  profile_name: string | null
  role: string
  settings: {
    all_notifications_enabled: boolean
    order_status_enabled: boolean
    announcement_enabled: boolean
    comment_reply_enabled: boolean
    deposit_confirm_enabled: boolean
    new_message_enabled: boolean
  }
  push_subscription: {
    is_subscribed: boolean
    device_count: number
    devices: { type: string; player_id: string }[]
  }
}

export default function UserSettingsTab() {
  const [users, setUsers] = useState<UserSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({
    total_users: 0,
    push_subscribed: 0,
    push_unsubscribed: 0,
    all_disabled: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/notifications/user-settings?page=${page}&search=${search}`
      )
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setTotalPages(data.pagination.total_pages)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('사용자 설정 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 요약 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전체 사용자</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {summary.total_users.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>푸시 구독 중</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {summary.push_subscribed.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>푸시 미구독</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>
            {summary.push_unsubscribed.toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전체 알림 꺼짐</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
            {summary.all_disabled.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 검색 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이메일, 이름으로 검색..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 34px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            검색
          </button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {loading ? (
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
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      사용자
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      푸시 구독
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      알림 설정
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} style={{
                      borderTop: index > 0 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                            {user.profile_name || user.name || user.email}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {user.email}
                          </p>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#f3f4f6',
                            color: '#374151',
                            marginTop: '4px'
                          }}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {user.push_subscription.is_subscribed ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: '#d1fae5',
                              color: '#065f46'
                            }}>
                              <CheckCircle size={12} />
                              구독 중 ({user.push_subscription.device_count}개)
                            </span>
                            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {user.push_subscription.devices.map((device, idx) => (
                                <p key={idx} style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  {device.type}: {device.player_id.slice(0, 20)}...
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#f3f4f6',
                            color: '#6b7280'
                          }}>
                            <XCircle size={12} />
                            미구독
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {[
                            { key: 'all_notifications_enabled', label: '전체 알림' },
                            { key: 'order_status_enabled', label: '발주서 상태' },
                            { key: 'announcement_enabled', label: '공지사항' },
                            { key: 'new_message_enabled', label: '새 메시지' }
                          ].map(({ key, label }) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={user.settings[key as keyof typeof user.settings]}
                                disabled
                                style={{ width: '14px', height: '14px', cursor: 'not-allowed' }}
                              />
                              <span style={{
                                fontSize: '11px',
                                color: user.settings[key as keyof typeof user.settings] ? '#374151' : '#dc2626'
                              }}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    background: '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  이전
                </button>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    background: '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
