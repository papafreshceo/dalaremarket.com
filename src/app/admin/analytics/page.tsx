'use client';

import { useState } from 'react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'search-console'>('analytics');

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-2">Google 분석 도구</h1>
        <p className="text-text-secondary">
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

      {/* 콘텐츠 영역 */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Google Analytics 임베드 */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Google Analytics 4</h2>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span>Analytics 열기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="bg-background rounded-lg p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">
                  Google Analytics 연동
                </h3>
                <p className="text-text-secondary mb-4">
                  Google Analytics에서 직접 데이터를 확인하세요. <br />
                  아래 버튼을 클릭하여 Analytics 대시보드로 이동할 수 있습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" />
                    </svg>
                    Analytics 대시보드 열기
                  </a>
                  <a
                    href="https://analytics.google.com/analytics/web/#/report-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    실시간 보고서
                  </a>
                </div>
              </div>
            </div>

            {/* 안내 정보 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Google Analytics 주요 지표
                  </p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• 실시간 사용자 추적</li>
                    <li>• 페이지뷰 및 세션 분석</li>
                    <li>• 사용자 행동 패턴</li>
                    <li>• 전환율 측정</li>
                    <li>• 트래픽 소스 분석</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Google Search Console 임베드 */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Google Search Console</h2>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span>Search Console 열기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="bg-background rounded-lg p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">
                  Search Console 연동
                </h3>
                <p className="text-text-secondary mb-4">
                  Google Search Console에서 검색 성능을 확인하세요. <br />
                  아래 버튼을 클릭하여 Search Console로 이동할 수 있습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Console 열기
                  </a>
                  <a
                    href="https://search.google.com/search-console/performance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    검색 실적 보고서
                  </a>
                </div>
              </div>
            </div>

            {/* 안내 정보 */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                    Search Console 주요 기능
                  </p>
                  <ul className="text-green-800 dark:text-green-200 space-y-1">
                    <li>• 검색 쿼리 및 클릭 수</li>
                    <li>• 검색 노출 수 및 클릭률</li>
                    <li>• 검색 순위 추적</li>
                    <li>• 색인 상태 확인</li>
                    <li>• 모바일 사용성 분석</li>
                    <li>• 사이트맵 제출 및 관리</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://search.google.com/search-console/sitemaps"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-surface rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text">사이트맵</h3>
                  <p className="text-sm text-text-secondary">사이트맵 제출 및 관리</p>
                </div>
              </div>
            </a>

            <a
              href="https://search.google.com/search-console/index"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-surface rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text">색인 생성</h3>
                  <p className="text-sm text-text-secondary">페이지 색인 상태 확인</p>
                </div>
              </div>
            </a>

            <a
              href="https://search.google.com/search-console/mobile-usability"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-surface rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text">모바일 사용성</h3>
                  <p className="text-sm text-text-secondary">모바일 최적화 확인</p>
                </div>
              </div>
            </a>

            <a
              href="https://search.google.com/search-console/links"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-surface rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text">링크</h3>
                  <p className="text-sm text-text-secondary">내부/외부 링크 분석</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
