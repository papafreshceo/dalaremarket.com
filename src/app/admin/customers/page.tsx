'use client';

import { useState } from 'react';
import RegularCustomersTab from './components/RegularCustomersTab';
import MarketingCustomersTab from './components/MarketingCustomersTab';

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<'regular' | 'marketing'>('regular');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">고객관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          단골고객과 마케팅대상고객을 관리합니다.
        </p>
      </div>

      {/* 탭 버튼 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('regular')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'regular'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            단골고객
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'marketing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            마케팅대상고객
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'regular' && <RegularCustomersTab />}
        {activeTab === 'marketing' && <MarketingCustomersTab />}
      </div>
    </div>
  );
}
