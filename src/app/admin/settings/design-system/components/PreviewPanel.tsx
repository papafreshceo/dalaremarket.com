'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  ShoppingBag,
  Activity,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

interface PreviewPanelProps {
  settings: any;
}

export default function PreviewPanel({ settings }: PreviewPanelProps) {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'medium' | 'dark'>('light');

  // Helper functions to safely access settings
  const getPrimaryColor = (tone = 500) => {
    return settings?.colors?.primary?.tones?.[tone]?.color || settings?.colors?.primary?.base || '#3b82f6';
  };

  const getSecondaryColor = (tone = 500) => {
    return settings?.colors?.secondary?.tones?.[tone]?.color || settings?.colors?.secondary?.base || '#10b981';
  };

  const getSuccessColor = (tone = 500) => {
    return settings?.colors?.success?.tones?.[tone]?.color || settings?.colors?.success?.base || '#22c55e';
  };

  const getErrorColor = (tone = 500) => {
    return settings?.colors?.error?.tones?.[tone]?.color || settings?.colors?.error?.base || '#ef4444';
  };

  const getWarningColor = (tone = 500) => {
    return settings?.colors?.warning?.tones?.[tone]?.color || settings?.colors?.warning?.base || '#f59e0b';
  };

  const getBgColor = (type: 'page' | 'card' | 'input') => {
    if (previewTheme === 'dark') {
      if (type === 'page') return '#111827';
      if (type === 'card') return '#1f2937';
      if (type === 'input') return '#374151';
    }
    if (type === 'page') return '#f3f4f6';
    if (type === 'card') return '#ffffff';
    if (type === 'input') return '#f9fafb';
    return '#ffffff';
  };

  const getTextColor = (type: 'primary' | 'secondary' | 'muted') => {
    if (previewTheme === 'dark') {
      if (type === 'primary') return '#ffffff';
      if (type === 'secondary') return '#e5e7eb';
      if (type === 'muted') return '#9ca3af';
    }
    if (type === 'primary') return '#111827';
    if (type === 'secondary') return '#4b5563';
    if (type === 'muted') return '#6b7280';
    return '#000000';
  };

  const getBorderColor = () => {
    return previewTheme === 'dark' ? '#374151' : '#e5e7eb';
  };

  const getRadius = (size: 'sm' | 'md' | 'lg' | 'full' = 'md') => {
    // This would normally come from settings.border
    const map = { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' };
    return map[size];
  };

  const getShadow = (size: 'sm' | 'md' | 'lg' = 'md') => {
    // This would normally come from settings.shadow
    const map = {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    };
    return map[size];
  };

  const getFontFamily = () => {
    return settings?.typography?.font_family || 'inherit';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Toolbar */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setPreviewTheme('light')}
            className={`p-1.5 rounded-md transition-all ${previewTheme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Sun size={14} />
          </button>
          <button
            onClick={() => setPreviewTheme('dark')}
            className={`p-1.5 rounded-md transition-all ${previewTheme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Moon size={14} />
          </button>
        </div>
      </div>

      {/* Mockup Content */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{
          backgroundColor: getBgColor('page'),
          fontFamily: getFontFamily(),
          color: getTextColor('primary')
        }}
      >
        {/* Header */}
        <header
          className="h-16 border-b flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 backdrop-blur-sm bg-opacity-90"
          style={{
            borderColor: getBorderColor(),
            backgroundColor: getBgColor('card')
          }}
        >
          <div className="flex items-center gap-4">
            <Menu size={20} style={{ color: getTextColor('secondary') }} />
            <span className="font-bold text-lg" style={{ color: getPrimaryColor(600) }}>DalraeMarket</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                className="pl-9 pr-4 py-1.5 text-sm rounded-full border focus:outline-none focus:ring-2 w-64 transition-all"
                style={{
                  backgroundColor: getBgColor('input'),
                  borderColor: getBorderColor(),
                  color: getTextColor('primary'),
                  // @ts-ignore
                  '--tw-ring-color': getPrimaryColor(500)
                }}
              />
            </div>
            <div className="relative">
              <Bell size={20} style={{ color: getTextColor('secondary') }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: getErrorColor() }} />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border" style={{ borderColor: getBorderColor() }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '총 매출', value: '₩54,230,000', change: '+12.5%', icon: DollarSign, color: getPrimaryColor() },
              { label: '활성 사용자', value: '2,345', change: '+18.2%', icon: Users, color: getSecondaryColor() },
              { label: '신규 주문', value: '456', change: '-2.4%', icon: ShoppingBag, color: getWarningColor() },
              { label: '전환율', value: '3.24%', change: '+4.3%', icon: Activity, color: getSuccessColor() },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border transition-transform hover:-translate-y-1 duration-200"
                style={{
                  backgroundColor: getBgColor('card'),
                  borderColor: getBorderColor(),
                  borderRadius: getRadius('lg'),
                  boxShadow: getShadow('sm')
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `${stat.color}20` }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
                    style={{
                      backgroundColor: stat.change.startsWith('+') ? `${getSuccessColor()}15` : `${getErrorColor()}15`,
                      color: stat.change.startsWith('+') ? getSuccessColor(600) : getErrorColor(600)
                    }}
                  >
                    {stat.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: getTextColor('primary') }}>{stat.value}</div>
                <div className="text-sm" style={{ color: getTextColor('muted') }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart Area */}
            <div
              className="lg:col-span-2 p-6 rounded-xl border"
              style={{
                backgroundColor: getBgColor('card'),
                borderColor: getBorderColor(),
                borderRadius: getRadius('lg'),
                boxShadow: getShadow('sm')
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg" style={{ color: getTextColor('primary') }}>매출 현황</h3>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreHorizontal size={20} style={{ color: getTextColor('muted') }} />
                </button>
              </div>
              <div className="h-64 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                    <div
                      className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80 relative"
                      style={{
                        height: `${h}%`,
                        backgroundColor: getPrimaryColor(500),
                        borderRadius: `${getRadius('sm')} ${getRadius('sm')} 0 0`
                      }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                        style={{ backgroundColor: '#1f2937' }}
                      >
                        {h}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs" style={{ color: getTextColor('muted') }}>
                <span>1월</span><span>2월</span><span>3월</span><span>4월</span><span>5월</span><span>6월</span>
                <span>7월</span><span>8월</span><span>9월</span><span>10월</span><span>11월</span><span>12월</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: getBgColor('card'),
                borderColor: getBorderColor(),
                borderRadius: getRadius('lg'),
                boxShadow: getShadow('sm')
              }}
            >
              <h3 className="font-semibold text-lg mb-4" style={{ color: getTextColor('primary') }}>최근 활동</h3>
              <div className="space-y-4">
                {[
                  { user: '김지수', action: '새로운 주문 #1234', time: '2분 전', color: getPrimaryColor() },
                  { user: '이민호', action: '회원가입 완료', time: '15분 전', color: getSecondaryColor() },
                  { user: '박서준', action: '결제 실패', time: '1시간 전', color: getErrorColor() },
                  { user: '최유리', action: '리뷰 작성', time: '3시간 전', color: getWarningColor() },
                  { user: '정우성', action: '문의 등록', time: '5시간 전', color: getPrimaryColor() },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: getBorderColor() }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.user[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: getTextColor('primary') }}>{item.action}</div>
                      <div className="text-xs truncate" style={{ color: getTextColor('muted') }}>{item.user} • {item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full mt-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: `${getPrimaryColor()}15`,
                  color: getPrimaryColor(600)
                }}
              >
                모두 보기
              </button>
            </div>
          </div>

          {/* UI Components Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: getBgColor('card'),
                borderColor: getBorderColor(),
                borderRadius: getRadius('lg'),
                boxShadow: getShadow('sm')
              }}
            >
              <h3 className="font-semibold text-lg mb-4" style={{ color: getTextColor('primary') }}>버튼 스타일</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-transform active:scale-95" style={{ backgroundColor: getPrimaryColor(), borderRadius: getRadius() }}>
                  Primary
                </button>
                <button className="px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-transform active:scale-95" style={{ backgroundColor: getSecondaryColor(), borderRadius: getRadius() }}>
                  Secondary
                </button>
                <button className="px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700" style={{ borderColor: getBorderColor(), color: getTextColor('primary'), borderRadius: getRadius() }}>
                  Outline
                </button>
                <button className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700" style={{ color: getPrimaryColor(), borderRadius: getRadius() }}>
                  Ghost
                </button>
              </div>
            </div>

            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: getBgColor('card'),
                borderColor: getBorderColor(),
                borderRadius: getRadius('lg'),
                boxShadow: getShadow('sm')
              }}
            >
              <h3 className="font-semibold text-lg mb-4" style={{ color: getTextColor('primary') }}>입력 필드</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: getTextColor('secondary') }}>이메일</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                    style={{
                      backgroundColor: getBgColor('input'),
                      borderColor: getBorderColor(),
                      color: getTextColor('primary'),
                      borderRadius: getRadius(),
                      // @ts-ignore
                      '--tw-ring-color': getPrimaryColor(500)
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" style={{ color: getPrimaryColor() }} />
                  <span className="text-sm" style={{ color: getTextColor('secondary') }}>약관에 동의합니다</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
