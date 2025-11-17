'use client';

import dynamic from 'next/dynamic';

// ProfilePage를 동적으로 import (iframe 대신 직접 렌더링)
const ProfilePage = dynamic(() => import('@/app/platform/profile/page'), {
  loading: () => <div className="p-5 text-center dark:bg-gray-900 dark:text-white">로딩 중...</div>,
  ssr: false
});

export default function SellerInfoTab() {
  return (
    <div className="w-full h-screen overflow-auto m-0 p-0 dark:bg-gray-900 dark:text-gray-100">
      {/* 다크모드 wrapper - ProfilePage의 배경과 텍스트 색상 조정 */}
      <div className="profile-dark-mode-wrapper">
        <ProfilePage />
      </div>

      <style jsx global>{`
        /* 다크모드 스타일 오버라이드 - CSS 변수 사용 */
        .dark .profile-dark-mode-wrapper {
          background: var(--color-background) !important;
          color: var(--color-text) !important;
        }

        /* 모든 요소의 배경을 다크모드로 강제 변경 */
        .dark .profile-dark-mode-wrapper * {
          background-color: transparent !important;
        }

        .dark .profile-dark-mode-wrapper > div {
          background: var(--color-background) !important;
          background-color: var(--color-background) !important;
        }

        /* 카드나 섹션 같은 구분이 필요한 요소들은 약간 밝게 */
        .dark .profile-dark-mode-wrapper div[style*="background"] {
          background: var(--color-surface) !important;
          background-color: var(--color-surface) !important;
        }

        /* Input, Select, Textarea */
        .dark .profile-dark-mode-wrapper input,
        .dark .profile-dark-mode-wrapper select,
        .dark .profile-dark-mode-wrapper textarea {
          background: var(--color-surface) !important;
          color: var(--color-text) !important;
          border-color: var(--color-border) !important;
        }

        .dark .profile-dark-mode-wrapper input:focus,
        .dark .profile-dark-mode-wrapper select:focus,
        .dark .profile-dark-mode-wrapper textarea:focus {
          border-color: var(--color-border-focus) !important;
          outline: none !important;
        }

        .dark .profile-dark-mode-wrapper input::placeholder,
        .dark .profile-dark-mode-wrapper textarea::placeholder {
          color: var(--color-text-tertiary) !important;
        }

        .dark .profile-dark-mode-wrapper input:disabled,
        .dark .profile-dark-mode-wrapper select:disabled,
        .dark .profile-dark-mode-wrapper textarea:disabled {
          background: var(--color-background) !important;
          color: var(--color-text-disabled) !important;
          opacity: 0.7;
        }

        /* Buttons (gradient 제외) */
        .dark .profile-dark-mode-wrapper button:not([style*="gradient"]):not([style*="linear-gradient"]) {
          background: var(--color-surface-hover) !important;
          color: var(--color-text) !important;
        }

        /* Headings and Labels */
        .dark .profile-dark-mode-wrapper h1,
        .dark .profile-dark-mode-wrapper h2,
        .dark .profile-dark-mode-wrapper h3,
        .dark .profile-dark-mode-wrapper h4,
        .dark .profile-dark-mode-wrapper h5,
        .dark .profile-dark-mode-wrapper h6,
        .dark .profile-dark-mode-wrapper label,
        .dark .profile-dark-mode-wrapper p,
        .dark .profile-dark-mode-wrapper span:not([style*="color: #3b82f6"]):not([style*="color: #ef4444"]):not([style*="gradient"]) {
          color: var(--color-text) !important;
        }

        /* Background colors - 밝은 배경을 어둡게 */
        .dark .profile-dark-mode-wrapper [style*="background: #f9fafb"],
        .dark .profile-dark-mode-wrapper [style*="background: #fff"],
        .dark .profile-dark-mode-wrapper [style*="background: white"],
        .dark .profile-dark-mode-wrapper [style*="background: #ffffff"],
        .dark .profile-dark-mode-wrapper [style*="background:#ffffff"],
        .dark .profile-dark-mode-wrapper [style*="background: #f3f4f6"],
        .dark .profile-dark-mode-wrapper [style*="background: #f1f5f9"],
        .dark .profile-dark-mode-wrapper [style*="background:'white'"],
        .dark .profile-dark-mode-wrapper [style*='background: "white"'],
        .dark .profile-dark-mode-wrapper [style*="background:white"] {
          background: var(--color-surface) !important;
        }

        /* 모든 section과 main 요소도 다크모드로 */
        .dark .profile-dark-mode-wrapper section,
        .dark .profile-dark-mode-wrapper main {
          background: var(--color-background) !important;
        }

        /* Text colors - 어두운 텍스트를 밝게 */
        .dark .profile-dark-mode-wrapper [style*="color: #111827"],
        .dark .profile-dark-mode-wrapper [style*="color: #1f2937"],
        .dark .profile-dark-mode-wrapper [style*="color: #374151"],
        .dark .profile-dark-mode-wrapper [style*="color: #000"],
        .dark .profile-dark-mode-wrapper [style*="color: black"],
        .dark .profile-dark-mode-wrapper [style*="color:#000000"] {
          color: var(--color-text) !important;
        }

        /* Gray text - medium gray */
        .dark .profile-dark-mode-wrapper [style*="color: #6b7280"],
        .dark .profile-dark-mode-wrapper [style*="color: #9ca3af"] {
          color: var(--color-text-secondary) !important;
        }

        /* Border colors */
        .dark .profile-dark-mode-wrapper [style*="border: 1px solid #e5e7eb"],
        .dark .profile-dark-mode-wrapper [style*="border: 1px solid #d1d5db"],
        .dark .profile-dark-mode-wrapper [style*="border: 1px solid #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="border: 2px solid #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="borderColor: #e5e7eb"],
        .dark .profile-dark-mode-wrapper [style*="borderColor: #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="borderBottom: 1px solid #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="borderBottom: 2px solid #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="borderTop: 1px solid #e9ecef"],
        .dark .profile-dark-mode-wrapper [style*="borderTop: 2px solid #e9ecef"] {
          border-color: var(--color-border) !important;
        }

        /* Dividers */
        .dark .profile-dark-mode-wrapper hr {
          border-color: var(--color-border) !important;
        }

        /* 모든 요소의 border를 다크모드로 */
        .dark .profile-dark-mode-wrapper div[style*="border"],
        .dark .profile-dark-mode-wrapper span[style*="border"],
        .dark .profile-dark-mode-wrapper section[style*="border"] {
          border-color: var(--color-border) !important;
        }

        /* 타이틀 아래 구분선을 매우 얇게 */
        .dark .profile-dark-mode-wrapper [style*="borderBottom: 2px"],
        .dark .profile-dark-mode-wrapper [style*="border-bottom: 2px"] {
          border-bottom-width: 0.5px !important;
          opacity: 0.5;
        }

        /* Cards and panels */
        .dark .profile-dark-mode-wrapper div[style*="background: #ffffff"],
        .dark .profile-dark-mode-wrapper div[style*="background: white"] {
          background: var(--color-surface) !important;
        }

        /* Tables */
        .dark .profile-dark-mode-wrapper table {
          background: var(--color-surface) !important;
          color: var(--color-text) !important;
        }

        .dark .profile-dark-mode-wrapper th {
          background: var(--color-surface-hover) !important;
          color: var(--color-text) !important;
          border-color: var(--color-border) !important;
        }

        .dark .profile-dark-mode-wrapper td {
          border-color: var(--color-border) !important;
          color: var(--color-text) !important;
        }

        .dark .profile-dark-mode-wrapper tr:hover {
          background: var(--color-surface-hover) !important;
        }

        /* Links */
        .dark .profile-dark-mode-wrapper a:not([style*="gradient"]) {
          color: var(--color-primary) !important;
        }

        /* Shadow를 어둡게 */
        .dark .profile-dark-mode-wrapper [style*="box-shadow"] {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
        }

        /* Specific adjustments for light backgrounds */
        .dark .profile-dark-mode-wrapper [style*="backgroundColor: #f9fafb"],
        .dark .profile-dark-mode-wrapper [style*="backgroundColor:#f9fafb"] {
          background-color: var(--color-surface) !important;
        }

        /* Checkbox and Radio */
        .dark .profile-dark-mode-wrapper input[type="checkbox"],
        .dark .profile-dark-mode-wrapper input[type="radio"] {
          background: var(--color-surface) !important;
          border-color: var(--color-border) !important;
        }
      `}</style>
    </div>
  );
}
