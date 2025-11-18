'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, AlertCircle, Clock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StatusDesign {
  status_name: string;
  animation_type: number;
  color: string;
  icon: string;
}

export default function AdminStatusDesignPage() {
  const [statusDesigns, setStatusDesigns] = useState<StatusDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const statusOptions = [
    {
      name: '출하중',
      color: '#10b981',
      icon: 'truck',
      description: '활발한 공급 상태'
    },
    {
      name: '일시품절',
      color: '#ef4444',
      icon: 'alert',
      description: '일시적 재고 부족'
    },
    {
      name: '재고있음',
      color: '#3b82f6',
      icon: 'check',
      description: '정상 재고'
    },
    {
      name: '대기중',
      color: '#f59e0b',
      icon: 'clock',
      description: '준비 중'
    }
  ];

  useEffect(() => {
    loadStatusDesigns();
  }, []);

  const loadStatusDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('status_designs')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        setStatusDesigns(data);
      } else {
        // 초기 기본값 설정
        const defaults = statusOptions.map(status => ({
          status_name: status.name,
          animation_type: 1,
          color: status.color,
          icon: status.icon
        }));
        setStatusDesigns(defaults);
      }
    } catch (error) {
      console.error('디자인 로드 오류:', error);
      // 에러 시 기본값 사용
      const defaults = statusOptions.map(status => ({
        status_name: status.name,
        animation_type: 1,
        color: status.color,
        icon: status.icon
      }));
      setStatusDesigns(defaults);
    } finally {
      setLoading(false);
    }
  };

  const saveDesign = async (statusName: string, animationType: number) => {
    try {
      setSaving(true);

      const statusOption = statusOptions.find(s => s.name === statusName);
      if (!statusOption) return;

      const { error } = await supabase
        .from('status_designs')
        .upsert({
          status_name: statusName,
          animation_type: animationType,
          color: statusOption.color,
          icon: statusOption.icon,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'status_name'
        });

      if (error) throw error;

      // 로컬 상태 업데이트
      setStatusDesigns(prev => {
        const index = prev.findIndex(d => d.status_name === statusName);
        if (index >= 0) {
          const newDesigns = [...prev];
          newDesigns[index] = {
            ...newDesigns[index],
            animation_type: animationType
          };
          return newDesigns;
        }
        return prev;
      });

      alert('저장되었습니다!');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName: string, color: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    switch (iconName) {
      case 'truck': return <Truck className={sizeClass} style={{ color }} />;
      case 'alert': return <AlertCircle className={sizeClass} style={{ color }} />;
      case 'check': return <CheckCircle className={sizeClass} style={{ color }} />;
      case 'clock': return <Clock className={sizeClass} style={{ color }} />;
      default: return <Package className={sizeClass} style={{ color }} />;
    }
  };

  const renderAnimation = (type: number, status: typeof statusOptions[0]) => {
    switch (type) {
      case 1:
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full animate-ping absolute" style={{ backgroundColor: status.color, opacity: 0.4 }} />
              <div className="w-3 h-3 rounded-full relative" style={{ backgroundColor: status.color }} />
            </div>
            {getIcon(status.icon, status.color, 'md')}
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${status.color} transparent transparent transparent` }} />
              <div className="absolute inset-1 rounded-full" style={{ backgroundColor: status.color, opacity: 0.2 }} />
            </div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute h-full w-1/2 rounded-full animate-slide" style={{ backgroundColor: status.color }} />
            </div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 4:
        return (
          <div className="flex items-center gap-2">
            <div className="animate-pulse">{getIcon(status.icon, status.color, 'md')}</div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full animate-ping" style={{ backgroundColor: status.color, opacity: 0.3 }} />
              <div className="absolute w-3/4 h-3/4 rounded-full animate-ping" style={{ backgroundColor: status.color, opacity: 0.5, animationDelay: '0.2s' }} />
              {getIcon(status.icon, status.color, 'sm')}
            </div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 6:
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: status.color, animationDelay: '0s' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: status.color, animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: status.color, animationDelay: '0.4s' }} />
            </div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 7:
        return (
          <div className="flex items-center gap-1.5">
            {getIcon(status.icon, status.color, 'md')}
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 8:
        return (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full animate-pulse flex items-center gap-1" style={{ backgroundColor: `${status.color}20` }}>
              {getIcon(status.icon, status.color, 'sm')}
              <span className="text-[10px] font-medium" style={{ color: status.color }}>{status.name}</span>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: status.color }} />
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 10:
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full animate-ping absolute" style={{ backgroundColor: status.color, opacity: 0.5 }} />
              <div className="w-2 h-2 rounded-full relative" style={{ backgroundColor: status.color }} />
            </div>
            <span className="text-[11px]" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 11:
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 animate-pulse">
              <ArrowRight className="w-3 h-3" style={{ color: status.color }} />
              <ArrowRight className="w-3 h-3" style={{ color: status.color, opacity: 0.6 }} />
              <ArrowRight className="w-3 h-3" style={{ color: status.color, opacity: 0.3 }} />
            </div>
            <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      case 12:
        return (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full animate-ping absolute -top-0.5 -right-0.5" style={{ backgroundColor: status.color, opacity: 0.6 }} />
              <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5" style={{ backgroundColor: status.color }} />
              {getIcon(status.icon, status.color, 'md')}
            </div>
            <span className="text-[11px]" style={{ color: status.color }}>{status.name}</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>상태 디자인 관리</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>각 상태별로 원하는 애니메이션 디자인을 선택하세요.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {statusOptions.map((status) => {
          const currentDesign = statusDesigns.find(d => d.status_name === status.name);
          const selectedType = currentDesign?.animation_type || 1;

          return (
            <div key={status.name} className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: status.color }}>
                    {status.name}
                  </h2>
                  <p className="text-sm text-gray-500">{status.description}</p>
                </div>
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">현재 선택:</div>
                  {renderAnimation(selectedType, status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((type) => (
                  <div
                    key={type}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => saveDesign(status.name, type)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">옵션 {type}</span>
                      {selectedType === type && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-center py-2">
                      {renderAnimation(type, status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <style jsx global>{`
          @keyframes slide {
            0%, 100% { left: 0; }
            50% { left: 50%; }
          }
          .animate-slide {
            animation: slide 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
