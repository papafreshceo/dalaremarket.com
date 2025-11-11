'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateOrganization() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAutoCreate = async () => {
    if (!confirm('현재 사용자 정보를 기반으로 조직을 생성하시겠습니까?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/organizations/auto-create', {
        method: 'POST',
      })

      const data = await response.json()
      if (data.success) {
        alert('조직이 생성되었습니다')
        router.refresh()
      } else {
        alert(data.error || '조직 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('조직 생성 오류:', error)
      alert('조직 생성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              조직 정보를 불러올 수 없습니다
            </h3>
            <div className="text-sm text-yellow-800 space-y-2 mb-4">
              <p>
                일시적인 오류로 조직 정보를 불러오지 못했습니다.
              </p>
              <p className="font-semibold">
                회원가입 시 자동으로 조직이 생성되므로, 이 화면이 보이는 것은 비정상입니다.
              </p>
            </div>

            <div className="bg-white rounded p-4 mb-4">
              <h4 className="font-semibold mb-2 text-gray-900">
                🔧 해결 방법:
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>1. "지금 조직 생성하기" 버튼 클릭</strong>
                  <p className="text-xs text-gray-500 ml-4">
                    현재 사용자 정보를 기반으로 조직을 수동으로 생성합니다.
                  </p>
                </li>
                <li>
                  <strong>2. 페이지 새로고침</strong>
                  <p className="text-xs text-gray-500 ml-4">
                    일시적인 오류일 수 있으니 페이지를 새로고침해보세요.
                  </p>
                </li>
                <li>
                  <strong>3. 로그아웃 후 다시 로그인</strong>
                  <p className="text-xs text-gray-500 ml-4">
                    로그인 시 조직이 없으면 자동으로 생성됩니다.
                  </p>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAutoCreate}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 flex-1 sm:flex-none font-semibold"
              >
                {loading ? '생성 중...' : '🔄 지금 조직 생성하기'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex-1 sm:flex-none"
              >
                🔄 페이지 새로고침
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>💡 조직 시스템이란?</strong>
              <p className="mt-1">
                회원가입 시 자동으로 생성되는 기본 조직입니다.
                회사의 대표와 직원들이 같은 조직에 속하여 주문, 발주서 등의 데이터를 공유할 수 있습니다.
                마이페이지에서 회사 정보를 입력하면 조직명이 변경되고, 직원을 초대할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
