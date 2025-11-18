'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'search-console'>('analytics');
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Google 분석 도구</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Google Analytics와 Search Console을 통해 사이트 성능을 분석하세요
        </p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'analytics'
              ? 'text-primary'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Google Analytics
          {activeTab === 'analytics' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('search-console')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'search-console'
              ? 'text-primary'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Search Console
          {activeTab === 'search-console' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Google Analytics 스크립트 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        strategy="afterInteractive"
        onLoad={() => setAnalyticsLoaded(true)}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </Script>

      {/* 콘텐츠 영역 */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Google Analytics 임베드 */}
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Google Analytics 4 대시보드</h2>
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <span>새 창에서 열기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Analytics 임베드 iframe */}
            <div className="relative w-full" style={{ height: '800px' }}>
              <iframe
                src="https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID/page/YOUR_PAGE_ID"
                frameBorder="0"
                style={{ width: '100%', height: '100%', border: 0 }}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />

              {/* 대체 콘텐츠 (iframe이 로드되지 않을 경우) */}
              <div className="absolute inset-0 flex items-center justify-center bg-background pointer-events-none">
                <div className="text-center max-w-md p-6">
                  <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    Google Analytics 설정 필요
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Google Analytics 대시보드를 표시하려면 Looker Studio 보고서 ID가 필요합니다.
                  </p>
                  <a
                    href="https://lookerstudio.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors gap-2 text-sm"
                  >
                    Looker Studio에서 보고서 만들기
                  </a>
                </div>
              </div>
            </div>

            {/* 설정 안내 */}
            <div className="p-6 border-t border-border bg-blue-50 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Analytics 임베드 설정 방법
                  </p>
                  <ol className="text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li><a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">Looker Studio</a>에서 새 보고서 생성</li>
                    <li>Google Analytics 데이터 소스 연결</li>
                    <li>원하는 대시보드 디자인 구성</li>
                    <li>공유 → 임베드 코드 복사</li>
                    <li>src/app/admin/analytics/page.tsx 파일의 iframe src에 URL 붙여넣기</li>
                  </ol>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    💡 보안상 iframe X-Frame-Options 제한이 있을 수 있습니다. Looker Studio 사용을 권장합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Google Search Console 임베드 */}
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Google Search Console 대시보드</h2>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <span>새 창에서 열기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Search Console 대체 UI (직접 임베드 불가) */}
            <div className="p-8 bg-background">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    Search Console 데이터
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Google Search Console은 보안상 iframe 임베드를 지원하지 않습니다.<br />
                    대신 Looker Studio로 Search Console 보고서를 만들 수 있습니다.
                  </p>
                </div>

                {/* 빠른 액세스 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <a
                    href="https://search.google.com/search-console/performance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">검색 실적</h4>
                        <p className="text-sm text-text-secondary">클릭, 노출, CTR, 순위</p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://search.google.com/search-console/sitemaps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">사이트맵</h4>
                        <p className="text-sm text-text-secondary">사이트맵 제출 및 상태</p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://search.google.com/search-console/index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">색인 생성</h4>
                        <p className="text-sm text-text-secondary">페이지 색인 상태</p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://search.google.com/search-console/mobile-usability"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">모바일 사용성</h4>
                        <p className="text-sm text-text-secondary">모바일 최적화</p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://search.google.com/search-console/links"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">링크</h4>
                        <p className="text-sm text-text-secondary">내부/외부 링크</p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://search.google.com/search-console/core-web-vitals"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-surface rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text mb-1">Core Web Vitals</h4>
                        <p className="text-sm text-text-secondary">페이지 경험 지표</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* 설정 안내 */}
            <div className="p-6 border-t border-border bg-green-50 dark:bg-green-900/20">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Search Console을 관리자 페이지에 임베드하는 방법
                  </p>
                  <ol className="text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                    <li><a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">Looker Studio</a>에서 새 보고서 생성</li>
                    <li>데이터 소스로 "Search Console" 선택</li>
                    <li>원하는 지표와 차트 추가 (클릭, 노출, CTR, 순위 등)</li>
                    <li>공유 → 임베드 → URL 복사</li>
                    <li>Analytics 탭의 iframe src에 붙여넣기 (같은 방식)</li>
                  </ol>
                  <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                    💡 Looker Studio를 사용하면 Analytics와 Search Console 데이터를 함께 시각화할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
