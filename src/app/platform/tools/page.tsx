'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ToolModal from '@/components/tools/ToolModal';
import { useUserBalance } from '@/contexts/UserBalanceContext';
import { toolIcons } from '@/components/tools/ToolIcons';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Tool {
  id: string;
  category: string;
  name: string;
  description: string;
  bgGradient: string;
  usageCount: string;
  isNew: boolean;
  isPremium: boolean;
  creditsRequired?: number;
}

export default function ToolsPage() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [openModals, setOpenModals] = useState<Array<{ id: string; tool: Tool }>>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const { creditBalance: userCredits, setCreditBalance } = useUserBalance();
  const [toolsFromDB, setToolsFromDB] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // 도구 목록, 즐겨찾기, 사용 횟수 불러오기 (크레딧은 헤더에서 관리)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 3개 API를 병렬로 호출하여 로딩 시간 단축
        const [toolsResponse, favResponse, usageResponse] = await Promise.all([
          fetch('/api/tools'),
          fetch('/api/user/favorite-tools'),
          fetch('/api/user/tool-usage')
        ]);

        const [toolsData, favData, usageData] = await Promise.all([
          toolsResponse.json(),
          favResponse.json(),
          usageResponse.json()
        ]);

        // 도구 목록
        if (toolsData.success && toolsData.tools) {
          const formattedTools: Tool[] = toolsData.tools.map((t: any) => ({
            id: t.id,
            category: t.category,
            name: t.name,
            description: t.description || '',
            bgGradient: t.icon_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            usageCount: '0회/월',
            isNew: false,
            isPremium: t.is_premium || false,
            creditsRequired: t.credits_required || 0
          }));
          setToolsFromDB(formattedTools);
        }

        // 즐겨찾기
        if (favData.success && favData.favoriteTools) {
          setFavorites(favData.favoriteTools);
        }

        // 사용 횟수
        if (usageData.success && usageData.usageCounts) {
          setUsageCounts(usageData.usageCounts);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingTools(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // 도구 카테고리
  const categories: Category[] = [
    { id: 'all', name: '전체', count: 12 },
    { id: 'essential', name: '핵심 도구', count: 4 },
    { id: 'data', name: '데이터 관리', count: 2 },
    { id: 'pricing', name: '가격 설정', count: 2 },
    { id: 'analytics', name: '분석 도구', count: 5 },
    { id: 'communication', name: '커뮤니케이션', count: 1 }
  ];

  // SVG 아이콘 컴포넌트들 (추가 UI 아이콘들)
  const icons: Record<string, JSX.Element> = {
    ...toolIcons,
    'search': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.2939 12.5786H13.3905L13.0703 12.2699C14.191 10.9663 14.8656 9.27387 14.8656 7.43282C14.8656 3.32762 11.538 0 7.43282 0C3.32762 0 0 3.32762 0 7.43282C0 11.538 3.32762 14.8656 7.43282 14.8656C9.27387 14.8656 10.9663 14.191 12.2699 13.0703L12.5786 13.3905V14.2939L18.2962 20L20 18.2962L14.2939 12.5786ZM7.43282 12.5786C4.58548 12.5786 2.28702 10.2802 2.28702 7.43282C2.28702 4.58548 4.58548 2.28702 7.43282 2.28702C10.2802 2.28702 12.5786 4.58548 12.5786 7.43282C12.5786 10.2802 10.2802 12.5786 7.43282 12.5786Z" fill="#6c757d"/>
      </svg>
    ),
    'star': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" fill="#f59e0b"/>
      </svg>
    ),
    'starOutline': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  };

  // 필터링된 도구
  const filteredTools = toolsFromDB.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 즐겨찾기 토글
  const toggleFavorite = async (toolId: string) => {
    const newFavorites = favorites.includes(toolId)
      ? favorites.filter(id => id !== toolId)
      : [...favorites, toolId];

    // 즉시 UI 업데이트
    setFavorites(newFavorites);

    // DB에 저장
    try {
      const response = await fetch('/api/user/favorite-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favoriteTools: newFavorites }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Error saving favorites:', data.error);
        // 실패 시 롤백
        setFavorites(favorites);
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
      // 실패 시 롤백
      setFavorites(favorites);
    }
  };

  // 도구 클릭 핸들러
  const handleToolClick = async (tool: Tool) => {
    // 크레딧 체크 및 차감
    const creditsRequired = tool.creditsRequired || 0;

    if (creditsRequired > 0) {
      // 크레딧이 부족한지 확인
      if (userCredits < creditsRequired) {
        alert(`크레딧이 부족합니다. 필요한 크레딧: ${creditsRequired}, 보유 크레딧: ${userCredits}`);
        return;
      }

      // 크레딧 차감
      try {
        const response = await fetch('/api/user/use-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ toolId: tool.id }),
        });

        const data = await response.json();

        if (!data.success) {
          alert(data.error || '크레딧 차감에 실패했습니다.');
          return;
        }

        // 크레딧 잔액 업데이트 (Context에 반영)
        setCreditBalance(data.balance || data.credits_after);
      } catch (error) {
        console.error('Error using credits:', error);
        alert('크레딧 차감 중 오류가 발생했습니다.');
        return;
      }
    }

    // 사용 기록 저장
    try {
      await fetch('/api/user/tool-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId: tool.id }),
      });

      // 사용 횟수 업데이트
      setUsageCounts(prev => ({
        ...prev,
        [tool.id]: (prev[tool.id] || 0) + 1
      }));
    } catch (error) {
      console.error('Error recording tool usage:', error);
    }

    // 이미 열린 모달인지 확인
    const isAlreadyOpen = openModals.some(modal => modal.tool.id === tool.id);
    if (!isAlreadyOpen) {
      setOpenModals(prev => [...prev, { id: `modal-${Date.now()}`, tool }]);
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = (modalId: string) => {
    setOpenModals(prev => prev.filter(modal => modal.id !== modalId));
  };

  // 시뮬레이터로 전환 핸들러 (새 모달로 열기)
  const handleOpenSimulator = () => {
    const simulatorTool = toolsFromDB.find(t => t.id === 'price-simulator');
    if (simulatorTool) {
      const isAlreadyOpen = openModals.some(modal => modal.tool.id === 'price-simulator');
      if (!isAlreadyOpen) {
        setOpenModals(prev => [...prev, { id: `modal-${Date.now()}`, tool: simulatorTool }]);
      }
    }
  };

  // 즐겨찾기된 도구와 일반 도구 분리
  const favoriteTools = filteredTools.filter(tool => favorites.includes(tool.id));
  const regularTools = filteredTools.filter(tool => !favorites.includes(tool.id));

  return (
    <>
      
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '70px',
        paddingLeft: isMobile ? '20px' : '40px',
        paddingRight: isMobile ? '20px' : '40px',
        paddingBottom: isMobile ? '20px' : '40px',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          zIndex: -3
        }} />

        {/* 왼쪽 악센트 */}
        <div style={{
          position: 'absolute',
          top: '400px',
          left: 0,
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
          zIndex: -2
        }} />

        {/* 우측 상단 악센트 */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1600px',
          height: '1200px',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          zIndex: -1
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* 히어로 섹션 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '25px 20px' : '40px',
            marginBottom: '32px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px'
                }}>
                  Business Tools
                </div>
                <h1 style={{
                  fontSize: isMobile ? '28px' : '36px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  업무도구
                </h1>
              </div>

              {/* 크레딧 표시 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
                <div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>
                    보유 크레딧
                  </div>
                  <div style={{
                    fontSize: '18px',
                    color: '#ffffff',
                    fontWeight: '700'
                  }}>
                    {loadingTools ? '...' : userCredits.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              lineHeight: '1.6'
            }}>
              판매 업무를 더욱 효율적으로 만드는 다양한 도구들을 활용해보세요.
              마진 계산부터 데이터 분석까지 한 곳에서 관리할 수 있습니다.
            </p>
          </div>

          {/* 즐겨찾기 도구 */}
          {favoriteTools.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {icons.star} 즐겨찾기
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {favoriteTools.map((tool) => (
                  <div
                    key={tool.id}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #2563eb',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      transform: hoveredTool === tool.id ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: hoveredTool === tool.id
                        ? '0 10px 30px rgba(37, 99, 235, 0.2)'
                        : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    onClick={() => handleToolClick(tool)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: tool.bgGradient,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {icons[tool.id]}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {tool.isNew && (
                          <span style={{
                            padding: '2px 6px',
                            background: '#fef3c7',
                            color: '#f59e0b',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            NEW
                          </span>
                        )}
                        {tool.isPremium && (
                          <span style={{
                            padding: '2px 6px',
                            background: '#ede9fe',
                            color: '#8b5cf6',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            PRO
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {icons.star}
                        </button>
                      </div>
                    </div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {tool.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#6c757d',
                      lineHeight: '1.5',
                      marginBottom: '12px'
                    }}>
                      {tool.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#2563eb',
                        fontWeight: '500'
                      }}>
                        {usageCounts[tool.id] ? `${usageCounts[tool.id].toLocaleString()}회 사용` : '사용 기록 없음'}
                      </div>
                      {tool.creditsRequired && tool.creditsRequired > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#ffffff'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                          </svg>
                          {tool.creditsRequired}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 도구 */}
          <div>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {selectedCategory === 'all' ? '전체 도구' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {regularTools.map((tool) => (
                <div
                  key={tool.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: hoveredTool === tool.id ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: hoveredTool === tool.id
                      ? '0 10px 30px rgba(0,0,0,0.1)'
                      : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  onClick={() => handleToolClick(tool)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: tool.bgGradient,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {icons[tool.id]}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {tool.isNew && (
                        <span style={{
                          padding: '2px 6px',
                          background: '#fef3c7',
                          color: '#f59e0b',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          NEW
                        </span>
                      )}
                      {tool.isPremium && (
                        <span style={{
                          padding: '2px 6px',
                          background: '#ede9fe',
                          color: '#8b5cf6',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          PRO
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: favorites.includes(tool.id) ? 1 : 0.3
                        }}
                      >
                        {favorites.includes(tool.id) ? icons.star : icons.starOutline}
                      </button>
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {tool.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#6c757d',
                    lineHeight: '1.5',
                    marginBottom: '12px'
                  }}>
                    {tool.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#6c757d',
                      fontWeight: '500'
                    }}>
                      {usageCounts[tool.id] ? `${usageCounts[tool.id].toLocaleString()}회 사용` : '사용 기록 없음'}
                    </div>
                    {tool.creditsRequired && tool.creditsRequired > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                        </svg>
                        {tool.creditsRequired}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 도구 모달들 */}
      {openModals.map((modal, index) => (
        <ToolModal
          key={modal.id}
          isOpen={true}
          onClose={() => handleCloseModal(modal.id)}
          toolId={modal.tool.id}
          toolName={modal.tool.name}
          onOpenSimulator={handleOpenSimulator}
          zIndex={10000 + index}
        />
      ))}

      {/* Toast 알림 */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}
