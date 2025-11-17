'use client'

import { useState } from 'react'
import BroadcastTab from './components/BroadcastTab'
import StatsTab from './components/StatsTab'
import UserSettingsTab from './components/UserSettingsTab'
import OneSignalTab from './components/OneSignalTab'
import ReceivedTab from './components/ReceivedTab'

type TabType = 'received' | 'broadcast' | 'stats' | 'users' | 'onesignal'

export default function NotificationsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('received')

  const tabs = [
    { id: 'received', label: '받은 알림', icon: '📬' },
    { id: 'broadcast', label: '전체 공지 발송', icon: '📢' },
    { id: 'stats', label: '알림 통계', icon: '📊' },
    { id: 'users', label: '사용자 설정', icon: '👥' },
    { id: 'onesignal', label: 'OneSignal', icon: '🔔' },
  ] as const

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
        알림 관리
      </h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
        푸시 알림 발송, 통계 확인 및 사용자 설정 관리
      </p>

      {/* 탭 네비게이션 */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '20px',
        display: 'flex',
        gap: '24px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '12px 4px',
              fontSize: '13px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #000' : '2px solid transparent',
              color: activeTab === tab.id ? '#000' : '#6b7280',
              marginBottom: '-1px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'received' && <ReceivedTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'users' && <UserSettingsTab />}
        {activeTab === 'onesignal' && <OneSignalTab />}
      </div>
    </div>
  )
}
