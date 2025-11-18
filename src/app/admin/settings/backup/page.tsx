'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface BackupHistory {
  id: string
  created_at: string
  file_name: string
  file_size: string
  status: 'completed' | 'failed' | 'in_progress'
  backup_type: 'manual' | 'auto'
  tables_count: number
}

export default function BackupPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(true)
  const [backupTime, setBackupTime] = useState('02:00')
  const [retentionDays, setRetentionDays] = useState(30)

  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([
    {
      id: '1',
      created_at: '2025-10-15 02:00:00',
      file_name: 'backup_2025-10-15_02-00-00.sql',
      file_size: '15.3 MB',
      status: 'completed',
      backup_type: 'auto',
      tables_count: 28
    },
    {
      id: '2',
      created_at: '2025-10-14 02:00:00',
      file_name: 'backup_2025-10-14_02-00-00.sql',
      file_size: '15.1 MB',
      status: 'completed',
      backup_type: 'auto',
      tables_count: 28
    },
    {
      id: '3',
      created_at: '2025-10-13 14:30:00',
      file_name: 'backup_2025-10-13_14-30-00.sql',
      file_size: '14.8 MB',
      status: 'completed',
      backup_type: 'manual',
      tables_count: 28
    }
  ])

  const handleManualBackup = async () => {
    setLoading(true)
    try {
      // 실제로는 백업 API 호출
      showToast('백업이 시작되었습니다. 완료되면 알림을 받습니다.', 'success')

      // 새로운 백업 추가 (실제로는 백업 완료 후 업데이트)
      setTimeout(() => {
        const newBackup: BackupHistory = {
          id: Date.now().toString(),
          created_at: new Date().toLocaleString('ko-KR'),
          file_name: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
          file_size: '15.5 MB',
          status: 'completed',
          backup_type: 'manual',
          tables_count: 28
        }
        setBackupHistory(prev => [newBackup, ...prev])
        showToast('백업이 완료되었습니다.', 'success')
      }, 3000)
    } catch (error) {
      showToast('백업 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = (fileName: string) => {
    showToast(`${fileName} 다운로드를 시작합니다.`, 'info')
    // 실제로는 파일 다운로드 로직
  }

  const handleDeleteBackup = (id: string, fileName: string) => {
    if (confirm(`${fileName}을(를) 삭제하시겠습니까?`)) {
      setBackupHistory(prev => prev.filter(b => b.id !== id))
      showToast('백업 파일이 삭제되었습니다.', 'success')
    }
  }

  const handleRestore = (fileName: string) => {
    if (confirm(`${fileName}으로 복원하시겠습니까? 현재 데이터는 모두 삭제됩니다.`)) {
      showToast('복원을 시작합니다. 완료까지 시간이 소요될 수 있습니다.', 'info')
      // 실제로는 복원 API 호출
    }
  }

  const handleSaveSettings = () => {
    showToast('백업 설정이 저장되었습니다.', 'success')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'failed':
        return '실패'
      case 'in_progress':
        return '진행중'
      default:
        return '알 수 없음'
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text">백업/복원</h1>
        <p className="mt-1 text-sm text-text-secondary">데이터 백업 및 복원을 관리합니다.</p>
      </div>

      {/* 수동 백업 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text">수동 백업</h2>
            <p className="mt-1 text-sm text-text-secondary">
              현재 데이터를 즉시 백업합니다. 백업에는 약 1-2분이 소요됩니다.
            </p>
          </div>
          <Button
            onClick={handleManualBackup}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                백업 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                지금 백업
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">백업 범위</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>모든 테이블 데이터 (주문, 상품, 고객 등)</li>
                <li>사용자 설정 및 권한</li>
                <li>파일 첨부는 별도로 백업됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 자동 백업 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">자동 백업 설정</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div>
              <div className="font-medium text-text">자동 백업 활성화</div>
              <div className="text-sm text-text-tertiary mt-1">매일 지정된 시간에 자동으로 백업합니다</div>
            </div>
            <button
              onClick={() => setIsAutoBackupEnabled(!isAutoBackupEnabled)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                isAutoBackupEnabled ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isAutoBackupEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isAutoBackupEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    백업 시간
                  </label>
                  <input
                    type="time"
                    value={backupTime}
                    onChange={(e) => setBackupTime(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    서버 시간 기준 (KST)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    보관 기간
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                      min={1}
                      max={365}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    />
                    <span className="text-text-secondary">일</span>
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    이 기간이 지난 백업은 자동으로 삭제됩니다
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  설정 저장
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 백업 이력 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text">백업 이력</h2>
          <p className="text-sm text-text-tertiary mt-1">
            최근 백업 파일 목록입니다. 파일을 다운로드하거나 복원할 수 있습니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">생성일시</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">파일명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">크기</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">유형</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">테이블</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">상태</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-text">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-sm text-text">{backup.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-text">{backup.file_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{backup.file_size}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      backup.backup_type === 'auto'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {backup.backup_type === 'auto' ? '자동' : '수동'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{backup.tables_count}개</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                      {getStatusText(backup.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownloadBackup(backup.file_name)}
                        className="text-sm text-primary hover:underline"
                        title="다운로드"
                      >
                        다운로드
                      </button>
                      <button
                        onClick={() => handleRestore(backup.file_name)}
                        className="text-sm text-green-600 hover:underline"
                        title="복원"
                      >
                        복원
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id, backup.file_name)}
                        className="text-sm text-red-600 hover:underline"
                        title="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 경고 메시지 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <div className="font-medium mb-1">주의사항</div>
            <ul className="list-disc list-inside space-y-1">
              <li>복원 시 현재 데이터는 모두 삭제되고 백업 시점의 데이터로 복원됩니다.</li>
              <li>복원 작업은 되돌릴 수 없으므로 신중하게 진행하세요.</li>
              <li>중요한 작업 전에는 반드시 백업을 진행하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
