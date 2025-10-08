'use client';

import { useState } from 'react';
import { FileText, Search, Plus, FileSpreadsheet, Truck, MessageSquare, MoreHorizontal, RefreshCw } from 'lucide-react';
import SearchTab from './components/SearchTab';
import InputTab from './components/InputTab';
import ExcelTab from './components/ExcelTab';
import ShippingTab from './components/ShippingTab';
import CSTab from './components/CSTab';
import EtcTab from './components/EtcTab';

type Tab = 'search' | 'input' | 'excel' | 'shipping' | 'cs' | 'etc';

export default function OrderIntegrationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [tabKey, setTabKey] = useState(0);

  const tabs = [
    { id: 'search' as Tab, label: '주문조회', icon: Search, color: '#2563eb' },
    { id: 'input' as Tab, label: '주문입력', icon: Plus, color: '#10b981' },
    { id: 'excel' as Tab, label: '주문통합(Excel)', icon: FileSpreadsheet, color: '#f59e0b' },
    { id: 'shipping' as Tab, label: '발송관리', icon: Truck, color: '#8b5cf6' },
    { id: 'cs' as Tab, label: 'CS', icon: MessageSquare, color: '#ef4444' },
    { id: 'etc' as Tab, label: '기타', icon: MoreHorizontal, color: '#6b7280' },
  ];

  const handleRefresh = () => {
    // key 값을 변경하여 현재 탭 컴포넌트를 재마운트 (완전 초기화)
    setTabKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 - sticky */}
      <header className="sticky top-0 bg-white dark:bg-[#2d2d30] border-b border-gray-200 dark:border-gray-700" style={{ zIndex: 100 }}>
        <div className="px-6 py-4">
          {/* 타이틀 */}
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-text">주문통합관리</h1>
          </div>

          {/* 탭 + 새로고침 버튼 */}
          <div className="flex items-center gap-2 relative -mx-6 px-6 pb-0">
            <div className="flex gap-1 flex-1 flex-wrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-t border transition-all relative
                      ${isActive
                        ? 'bg-primary text-primary-foreground border-gray-200 dark:border-gray-700 border-b-0 -mb-px'
                        : 'bg-surface text-text-secondary border-gray-200 dark:border-gray-700 hover:bg-surface-hover hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    style={{
                      ...(isActive && {
                        '::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '40%',
                          height: '3px',
                          background: tab.color,
                          borderRadius: '2px',
                        }
                      })
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: isActive ? 'currentColor' : tab.color }}
                    />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded bg-surface hover:bg-surface-hover hover:border-gray-300 dark:hover:border-gray-600 hover:rotate-180 transition-all duration-200"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-6">
        {activeTab === 'search' && <SearchTab key={`search-${tabKey}`} />}
        {activeTab === 'input' && <InputTab key={`input-${tabKey}`} />}
        {activeTab === 'excel' && <ExcelTab key={`excel-${tabKey}`} />}
        {activeTab === 'shipping' && <ShippingTab key={`shipping-${tabKey}`} />}
        {activeTab === 'cs' && <CSTab key={`cs-${tabKey}`} />}
        {activeTab === 'etc' && <EtcTab key={`etc-${tabKey}`} />}
      </main>

      {/* 로딩 오버레이 */}
      <div className="hidden fixed inset-0 bg-black/70 z-[10000] items-center justify-center" id="loading-overlay">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-white/30 border-t-primary rounded-full animate-spin mx-auto mb-5" />
          <div className="text-white text-xl font-medium mb-2">처리 중...</div>
          <div className="text-white/80 text-sm">잠시만 기다려주세요</div>
        </div>
      </div>
    </div>
  );
}
