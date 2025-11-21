'use client'

import MessagesPanel from '@/components/MessagesPanel'

export default function MessagesPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">메시지</h1>
        <p className="text-sm text-gray-600">
          관리자 및 다른 사용자와의 대화 내역을 확인하세요
        </p>
      </div>

      {/* 메시지 패널 */}
      <MessagesPanel />
    </div>
  )
}
