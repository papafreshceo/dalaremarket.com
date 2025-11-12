'use client'

import { useState, useEffect } from 'react'

interface Organization {
  id: string
  name: string
  is_main: boolean
  business_number?: string
  created_at: string
}

interface CleanupData {
  user: {
    id: string
    email: string
    tier: string
  }
  summary: {
    total: number
    main: number
    sub: number
  }
  organizations: {
    main: Organization[]
    sub: Organization[]
  }
}

export default function OrgCleanupPage() {
  const [data, setData] = useState<CleanupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/organizations/cleanup')
      const result = await res.json()

      if (result.success) {
        setData(result)
      } else {
        setMessage('조직 정보를 불러오는데 실패했습니다: ' + (result.error || ''))
      }
    } catch (error: any) {
      setMessage('오류: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!data || data.summary.sub === 0) {
      setMessage('삭제할 서브 조직이 없습니다')
      return
    }

    if (!confirm(`정말로 ${data.summary.sub}개의 서브 조직을 모두 삭제하시겠습니까?`)) {
      return
    }

    try {
      setDeleting(true)
      const res = await fetch('/api/organizations/cleanup', {
        method: 'DELETE',
      })
      const result = await res.json()

      if (result.success) {
        setMessage(`✅ ${result.deleted_count}개의 서브 조직이 삭제되었습니다`)
        await loadData()
      } else {
        setMessage('삭제 실패: ' + (result.error || ''))
      }
    } catch (error: any) {
      setMessage('오류: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteOne = async (orgId: string, orgName: string) => {
    if (!confirm(`'${orgName}' 조직을 삭제하시겠습니까?`)) {
      return
    }

    try {
      setDeleting(true)
      const res = await fetch(`/api/organizations/sub?id=${orgId}`, {
        method: 'DELETE',
      })
      const result = await res.json()

      if (result.success) {
        setMessage(`✅ '${orgName}' 조직이 삭제되었습니다`)
        await loadData()
      } else {
        setMessage('삭제 실패: ' + (result.error || ''))
      }
    } catch (error: any) {
      setMessage('오류: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px' }}>
        <h1>조직 정리 도구</h1>
        <p style={{ color: 'red' }}>{message || '데이터를 불러올 수 없습니다'}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>조직 정리 도구</h1>

      {message && (
        <div
          style={{
            padding: '12px 20px',
            marginBottom: '20px',
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            color: message.includes('✅') ? '#155724' : '#721c24',
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ marginBottom: '10px' }}>👤 사용자 정보</h2>
        <p>
          <strong>Email:</strong> {data.user.email}
        </p>
        <p>
          <strong>Tier:</strong> {data.user.tier}
        </p>
        <p>
          <strong>조직 수:</strong> 메인 {data.summary.main}개 + 서브 {data.summary.sub}개 = 총{' '}
          {data.summary.total}개
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>🏆 메인 조직</h2>
        {data.organizations.main.length === 0 ? (
          <p style={{ color: '#666' }}>메인 조직이 없습니다</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.organizations.main.map((org) => (
              <div
                key={org.id}
                style={{
                  padding: '15px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  background: '#fff',
                }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{org.name}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  ID: {org.id}
                  <br />
                  사업자번호: {org.business_number || '(없음)'}
                  <br />
                  생성일: {new Date(org.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h2>📦 서브 조직</h2>
          {data.summary.sub > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? '삭제 중...' : `전체 삭제 (${data.summary.sub}개)`}
            </button>
          )}
        </div>

        {data.organizations.sub.length === 0 ? (
          <p style={{ color: '#666' }}>서브 조직이 없습니다</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.organizations.sub.map((org) => (
              <div
                key={org.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{org.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    ID: {org.id}
                    <br />
                    사업자번호: {org.business_number || '(없음)'}
                    <br />
                    생성일: {new Date(org.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOne(org.id, org.name)}
                  disabled={deleting}
                  style={{
                    padding: '8px 16px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingTop: '20px' }}>
        <button
          onClick={loadData}
          disabled={loading || deleting}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || deleting ? 'not-allowed' : 'pointer',
            opacity: loading || deleting ? 0.6 : 1,
          }}
        >
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      </div>
    </div>
  )
}
