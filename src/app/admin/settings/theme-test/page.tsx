'use client'

import { useEffect, useState } from 'react'

export default function ThemeTestPage() {
  const [cssVars, setCssVars] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 적용된 CSS 변수 확인
    const loadCSSVars = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)

      const varNames = [
        '--background',
        '--foreground',
        '--primary',
        '--primary-foreground',
        '--secondary',
        '--accent',
        '--color-primary',
        '--color-surface',
        '--color-text',
        '--border-border'
      ]

      const vars: Record<string, string> = {}
      varNames.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName).trim()
        if (value) {
          vars[varName] = value
        }
      })

      setCssVars(vars)
      setLoading(false)
    }

    // 약간 지연 후 로드 (테마 적용 기다리기)
    setTimeout(loadCSSVars, 500)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-text mb-6">
        테마 시스템 테스트 페이지
      </h1>

      {/* 배경/전경 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">1. 배경 & 전경색</h2>
        <div className="bg-background text-foreground border-2 border-border p-6 rounded-lg">
          <p className="text-lg">배경: var(--background)</p>
          <p className="text-lg">텍스트: var(--foreground)</p>
        </div>
      </div>

      {/* 버튼 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">2. 버튼 색상</h2>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
            Primary 버튼
          </button>
          <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold">
            Secondary 버튼
          </button>
          <button className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold">
            Accent 버튼
          </button>
        </div>
      </div>

      {/* 카드 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">3. 카드 (Surface)</h2>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-text mb-2">카드 제목</h3>
          <p className="text-text-secondary mb-2">Primary 텍스트</p>
          <p className="text-text-tertiary">Secondary 텍스트</p>
        </div>
      </div>

      {/* 아이콘 박스 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">4. 아이콘 박스</h2>
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">P</span>
          </div>
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-secondary-foreground font-bold">S</span>
          </div>
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-foreground font-bold">A</span>
          </div>
        </div>
      </div>

      {/* 실제 settings 페이지 미리보기 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">5. Settings 페이지 스타일</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden max-w-md">
          <div className="bg-primary px-4 py-3">
            <h3 className="text-sm font-bold text-primary-foreground">테스트 카테고리</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">아</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text">설정 항목</h4>
                  <p className="text-xs text-text-secondary">설명 텍스트</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS 변수 값 표시 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">6. 현재 적용된 CSS 변수</h2>
        <div className="bg-surface border border-border rounded-lg p-6">
          {loading ? (
            <p>로딩 중...</p>
          ) : Object.keys(cssVars).length === 0 ? (
            <p className="text-red-600 font-bold">❌ CSS 변수가 적용되지 않았습니다!</p>
          ) : (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(cssVars, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* 테마 적용 확인 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-blue-900 mb-2">✅ 테스트 방법</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>/admin/settings/design-themes로 이동</li>
          <li>다른 테마 선택 후 "적용하기" 클릭</li>
          <li>이 페이지로 돌아와서 색상 변화 확인</li>
          <li>모든 요소의 색상이 바뀌면 성공!</li>
        </ol>
      </div>
    </div>
  )
}
