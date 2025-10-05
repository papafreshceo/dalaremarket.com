import { useState, useEffect } from 'react';
import UserHeader from '../../components/layout/UserHeader';

function Home() {
  const [activeTab, setActiveTab] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 상단 통계 데이터는 삭제됨

  // 시세정보 데이터는 삭제됨

  // 달력 데이터는 삭제됨

  return (
    <>
      <UserHeader />
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
        {/* 메인 파란색 그라데이션 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          zIndex: -3
        }} />
        
        {/* 왼쪽 연두색 */}
        <div style={{
          position: 'absolute',
          top: '400px',
          left: 0,
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
          zIndex: -2
        }} />
        
        {/* 우측 상단 보라색 */}
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
          {/* 히어로 섹션 - 텍스트와 이미지 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 3fr',
            gap: '40px',
            marginBottom: '48px',
            alignItems: 'center'
          }}>
            {/* 첫 번째 칼럼 - 텍스트 */}
            <div style={{
              order: isMobile ? 2 : 1,
              paddingLeft: '40px',
              paddingRight: '40px'
            }}>
              <h1 style={{
                fontSize: isMobile ? '32px' : '48px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '20px',
                lineHeight: '1.2'
              }}>
                신선한 농산물을<br/>
                합리적인 가격으로
              </h1>
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                달래마켓은 농가와 소비자를 직접 연결하여<br/>
                더 신선하고 더 저렴한 농산물을 제공합니다
              </p>
              <button style={{
                padding: '14px 32px',
                background: '#ffffff',
                color: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              }}>
                지금 시작하기
              </button>
            </div>
            
            {/* 두 번째 칼럼 - 이미지 */}
            <div style={{
              order: isMobile ? 1 : 2,
              paddingRight: '40px',
              position: 'relative'
            }}>
              <div style={{
                height: isMobile ? '250px' : '400px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* 이미지 placeholder - 실제 이미지로 교체 가능 */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  이미지 영역
                  {/* <img src="이미지URL" alt="달래마켓" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '200px',
            marginBottom: '70px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(10px)',
              width: isMobile ? '100%' : '700px'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                {['한눈에 보는 상품', '간편 발주시스템', '셀러 업무도구', '다양한 서비스'].map((tab, index) => (
                  <button
                    key={index}
                    style={{
                      flex: isMobile ? '0 0 auto' : '1',
                      minWidth: isMobile ? '120px' : 'auto',
                      padding: '12px 16px',
                      background: index === 0 ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : 'transparent',
                      color: index === 0 ? '#ffffff' : '#6c757d',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.style.background.includes('linear-gradient')) {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.color = '#212529';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.style.background.includes('linear-gradient')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6c757d';
                      }
                    }}
                    onClick={(e) => {
                      // 모든 버튼 스타일 초기화
                      const buttons = e.currentTarget.parentElement.children;
                      Array.from(buttons).forEach(btn => {
                        btn.style.background = 'transparent';
                        btn.style.color = '#6c757d';
                      });
                      // 클릭된 버튼 활성화
                      e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)';
                      e.currentTarget.style.color = '#ffffff';
                      // 탭 내용 변경
                      setActiveTab({...activeTab, main: index});
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 탭 컨텐츠 - 슬라이딩 카드 섹션 */}
          <div style={{
            overflow: 'hidden',
            marginBottom: '48px'
          }}>
            <div style={{
              display: 'flex',
              transform: `translateX(-${(activeTab.main || 0) * 100}%)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* 탭 1: 한눈에 보는 상품 - 2x2 그리드 */}
              <div style={{
                minWidth: '100%',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '16px',
                padding: '0 40px'
              }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    aspectRatio: '16/9',
                    background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 95%) 0%, hsl(${i * 60 + 30}, 70%, 98%) 100%)`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    {/* <img src="이미지URL.gif" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
                    상품 홍보 이미지 {i}
                  </div>
                ))}
              </div>

              {/* 탭 2: 간편 발주시스템 - 2x2 그리드 */}
              <div style={{
                minWidth: '100%',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '16px',
                padding: '0 40px'
              }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    aspectRatio: '16/9',
                    background: i % 2 === 0 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    fontSize: '14px'
                  }}>
                    발주 기능 {i}
                  </div>
                ))}
              </div>

              {/* 탭 3: 셀러 업무도구 - 세로형 카드 */}
              <div style={{
                minWidth: '100%',
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '16px',
                padding: '0 40px'
              }}>
                {['재고관리', '매출분석', '세금계산서', '고객관리'].map((tool, i) => (
                  <div key={i} style={{
                    aspectRatio: '3/4',
                    background: `linear-gradient(135deg, hsl(${i * 90}, 70%, 50%) 0%, hsl(${i * 90 + 30}, 70%, 60%) 100%)`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'transform 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    {tool}
                  </div>
                ))}
              </div>

              {/* 탭 4: 다양한 서비스 - 혼합 레이아웃 */}
              <div style={{
                minWidth: '100%',
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '16px',
                padding: '0 40px'
              }}>
                <div style={{
                  gridRow: 'span 2',
                  aspectRatio: '3/4',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e40af'
                }}>
                  프리미엄 서비스
                </div>
                <div style={{
                  aspectRatio: '4/3',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontSize: '14px'
                }}>
                  서비스 1
                </div>
                <div style={{
                  aspectRatio: '4/3',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontSize: '14px'
                }}>
                  서비스 2
                </div>
                <div style={{
                  gridColumn: 'span 2',
                  aspectRatio: '8/3',
                  background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontSize: '14px'
                }}>
                  서비스 3
                </div>
              </div>
            </div>
          </div>



          {/* 6. Win-Win 섹션 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '40px',
            marginBottom: '24px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ 
              fontSize: isMobile ? '20px' : '24px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#8b5cf6'
            }}>Win-Win 프로그램</h2>
            <p style={{ 
              fontSize: '14px', 
              color: '#6c757d', 
              marginBottom: '24px' 
            }}>함께 성장하는 파트너십</p>
            
            <div style={{
              background: '#ffffff',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                특별 혜택
              </span>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '12px' 
              }}>농가 직거래 지원</h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6c757d', 
                lineHeight: '1.6', 
                marginBottom: '16px'
              }}>
                중간 유통 과정 없이 농가와 소비자를 직접 연결하여 
                농가 수익 증대와 소비자 가격 절감을 동시에 실현합니다.
              </p>
              <ul style={{ 
                fontSize: '14px', 
                color: '#495057', 
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>판로 개척 지원</li>
                <li>물류 시스템 제공</li>
                <li>마케팅 지원</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;