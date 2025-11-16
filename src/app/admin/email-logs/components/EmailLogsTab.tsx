'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Search, Filter, ChevronLeft, ChevronRight, Mail, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'

interface EmailLog {
  id: number
  email_type: string
  recipient_email: string
  recipient_name?: string
  subject: string
  status: 'sent' | 'failed'
  error_message?: string
  resend_id?: string
  created_at: string
  sent_at?: string
}

interface Stats {
  total: number
  sent: number
  failed: number
  success_rate: string
  by_type: Record<string, { total: number; sent: number; failed: number }>
  by_date: Array<{ date: string; sent: number; failed: number }>
}

export default function EmailLogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  const [emailType, setEmailType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [page, emailType, status])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (emailType) params.append('email_type', emailType)
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/email-logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.total_pages)
      } else {
        toast.error(data.error || '기록을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('로그 조회 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/admin/email-logs/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('통계 조회 오류:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      broadcast: '전체 공지',
      welcome: '가입 환영',
      notification: '알림',
      order: '주문 확인',
      shipping: '배송 안내'
    }
    return labels[type] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      broadcast: '#2563eb',
      welcome: '#059669',
      notification: '#f59e0b',
      order: '#8b5cf6',
      shipping: '#ec4899'
    }
    return colors[type] || '#6b7280'
  }

  return (
    <div>
      {/* 통계 */}
      {!statsLoading && stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>전체 발송</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mail size={20} style={{ color: '#6b7280' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>성공</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                  {stats.sent.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#ecfdf5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={20} style={{ color: '#059669' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>실패</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  {stats.failed.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#fef2f2',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={20} style={{ color: '#dc2626' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>성공률</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.success_rate}%
                </p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} style={{ color: '#6b7280' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: showFilters ? '16px' : '0' }}>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="이메일 주소나 이름으로 검색..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '8px 16px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Search size={14} />
              검색
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              background: showFilters ? '#000' : '#f3f4f6',
              color: showFilters ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Filter size={14} />
            필터
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '6px', color: '#374151' }}>
                타입
              </label>
              <select
                value={emailType}
                onChange={(e) => {
                  setEmailType(e.target.value)
                  setPage(1)
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">전체</option>
                <option value="broadcast">전체 공지</option>
                <option value="welcome">가입 환영</option>
                <option value="notification">알림</option>
                <option value="order">주문 확인</option>
                <option value="shipping">배송 안내</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '6px', color: '#374151' }}>
                상태
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">전체</option>
                <option value="sent">성공</option>
                <option value="failed">실패</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 로그 목록 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
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
        ) : logs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px'
          }}>
            <Mail size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              발송 기록이 없습니다
            </p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    타입
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    수신자
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    제목
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    상태
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    발송일시
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: getTypeBadgeColor(log.email_type),
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {getTypeLabel(log.email_type)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                          {log.recipient_name || '-'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          {log.recipient_email}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: '13px', color: '#374151' }}>
                        {log.subject}
                      </p>
                      {log.error_message && (
                        <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {log.status === 'sent' ? (
                          <>
                            <CheckCircle size={14} style={{ color: '#059669' }} />
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>성공</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} style={{ color: '#dc2626' }} />
                            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>실패</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(log.sent_at || log.created_at).toLocaleString('ko-KR')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                총 {total.toLocaleString()}건
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 12px',
                    background: page === 1 ? '#f3f4f6' : '#fff',
                    color: page === 1 ? '#9ca3af' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ChevronLeft size={14} />
                  이전
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 12px'
                }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {page} / {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px 12px',
                    background: page === totalPages ? '#f3f4f6' : '#fff',
                    color: page === totalPages ? '#9ca3af' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  다음
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
