'use client';

import { Truck, Package, AlertCircle, Clock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function StatusAnimationDemo() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">상태 표시 애니메이션 옵션</h1>

        {statusOptions.map((status) => (
          <div key={status.name} className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4" style={{ color: status.color }}>
              {status.name} - {status.description}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 옵션 1: 펄스 애니메이션 + 아이콘 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 1: 펄스 도트</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      className="w-3 h-3 rounded-full animate-ping absolute"
                      style={{ backgroundColor: status.color, opacity: 0.4 }}
                    />
                    <div
                      className="w-3 h-3 rounded-full relative"
                      style={{ backgroundColor: status.color }}
                    />
                  </div>
                  {getIcon(status.icon, status.color, 'md')}
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 2: 회전 테두리 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 2: 회전 링</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: `${status.color} transparent transparent transparent` }}
                    />
                    <div
                      className="absolute inset-1 rounded-full"
                      style={{ backgroundColor: status.color, opacity: 0.2 }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 3: 슬라이드 바 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 3: 슬라이드 바</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full w-1/2 rounded-full animate-slide"
                      style={{ backgroundColor: status.color }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 4: 펄스 아이콘만 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 4: 펄스 아이콘</h3>
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">
                    {getIcon(status.icon, status.color, 'md')}
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 5: 파동 효과 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 5: 파동 효과</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div
                      className="absolute w-full h-full rounded-full animate-ping"
                      style={{ backgroundColor: status.color, opacity: 0.3 }}
                    />
                    <div
                      className="absolute w-3/4 h-3/4 rounded-full animate-ping"
                      style={{
                        backgroundColor: status.color,
                        opacity: 0.5,
                        animationDelay: '0.2s'
                      }}
                    />
                    {getIcon(status.icon, status.color, 'sm')}
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 6: 깜박이는 도트 3개 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 6: 깜박이는 도트</h3>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: status.color, animationDelay: '0s' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: status.color, animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: status.color, animationDelay: '0.4s' }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 7: 아이콘만 (심플) */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 7: 아이콘만 (애니메이션 없음)</h3>
                <div className="flex items-center gap-1.5">
                  {getIcon(status.icon, status.color, 'md')}
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 8: 펄스 배경 + 아이콘 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 8: 펄스 배경</h3>
                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-1 rounded-full animate-pulse flex items-center gap-1"
                    style={{ backgroundColor: `${status.color}20` }}
                  >
                    {getIcon(status.icon, status.color, 'sm')}
                    <span className="text-[10px] font-medium" style={{ color: status.color }}>
                      {status.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* 옵션 9: 로딩 스피너 스타일 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 9: 스피너</h3>
                <div className="flex items-center gap-2">
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: status.color }}
                  />
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 10: 작은 펄스 도트만 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 10: 미니멀 도트</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      className="w-2 h-2 rounded-full animate-ping absolute"
                      style={{ backgroundColor: status.color, opacity: 0.5 }}
                    />
                    <div
                      className="w-2 h-2 rounded-full relative"
                      style={{ backgroundColor: status.color }}
                    />
                  </div>
                  <span className="text-[11px]" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 11: 화살표 이동 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 11: 화살표 이동</h3>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 animate-pulse">
                    <ArrowRight className="w-3 h-3" style={{ color: status.color }} />
                    <ArrowRight className="w-3 h-3" style={{ color: status.color, opacity: 0.6 }} />
                    <ArrowRight className="w-3 h-3" style={{ color: status.color, opacity: 0.3 }} />
                  </div>
                  <span className="text-xs" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>

              {/* 옵션 12: 컴팩트 아이콘 + 도트 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">옵션 12: 아이콘+도트 (추천)</h3>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div
                      className="w-2 h-2 rounded-full animate-ping absolute -top-0.5 -right-0.5"
                      style={{ backgroundColor: status.color, opacity: 0.6 }}
                    />
                    <div
                      className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
                      style={{ backgroundColor: status.color }}
                    />
                    {getIcon(status.icon, status.color, 'md')}
                  </div>
                  <span className="text-[11px]" style={{ color: status.color }}>{status.name}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <style jsx global>{`
          @keyframes slide {
            0%, 100% {
              left: 0;
            }
            50% {
              left: 50%;
            }
          }
          .animate-slide {
            animation: slide 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
