import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthModal from '../auth/AuthModal';
import MobileAuthModal from '../auth/MobileAuthModal';
import GoogleAccountPopup from '../auth/GoogleAccountPopup';

function UserHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 첫 화면에서만 구글 팝업 표시 (하루에 한 번)
  useEffect(() => {
    if (location.pathname === '/') {
      const lastShownDate = localStorage.getItem('googlePopupLastShown');
      const today = new Date().toDateString();
      
      if (lastShownDate !== today) {
        setShowGooglePopup(true);
        localStorage.setItem('googlePopupLastShown', today);
      }
    } else {
      setShowGooglePopup(false);
    }
  }, [location]);

const navItems = [
  { 
    path: '/products', 
    text: '공급상품',
    hasSubmenu: true,
    submenu: [
      { path: '/products/all', text: '전체상품' },
      { path: '/products/calendar', text: '상품캘린더' },
      { path: '/products/images', text: '이미지다운로드' }
    ]
  },
  { path: '/orders', text: '발주시스템' },
  { 
    path: '/tools', 
    text: '업무도구',
    hasSubmenu: true,
    submenu: [
      { path: '/tools/margin-calculator', text: '마진계산기' },
      { path: '/tools/price-simulator', text: '판매가 시뮬레이터' },
      { path: '/tools/order-integration', text: '주문통합 (Excel)' },
      { path: '/tools/option-pricing', text: '옵션가 세팅' },
      { path: '/tools/inventory-tracker', text: '재고 추적기' },
      { path: '/tools/discount-calculator', text: '할인율 계산기' },
      { path: '/tools/sales-analytics', text: '매출 분석' },
      { path: '/tools/customer-message', text: '고객 메시지' },
      { path: '/tools/barcode-generator', text: '바코드 생성기' },
      { path: '/tools/transaction-statement', text: '거래명세서 즉시 발급' },
      { path: '/tools/trend-analysis', text: '트렌드 분석' },
      { path: '/tools/competitor-monitor', text: '경쟁사 모니터링' },
      { path: '/tools/product-name-optimizer', text: '상품명 최적화 도구' },
      { path: '/tools/review-analyzer', text: '리뷰 분석' },
      { path: '/tools/price-recommender', text: '판매가/할인가 추천기' },
      { path: '/tools/category-rank-checker', text: '카테고리 순위 확인' }
    ]
  },
  { path: '/pricing', text: '요금제' },
  { path: '/winwin', text: 'Win-Win', special: true },
  { path: '/notice', text: '공지사항' },
  { 
    path: '/seller-feed', 
    text: 'Seller Feed',
    isImage: true,
    imageUrl: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1758988139/Seller_Feed_cgnxok.png'
  },
];

  const isActive = (path) => location.pathname.startsWith(path);

const openAuthModal = (mode) => {
  setAuthModalMode(mode);
  setShowAuthModal(true);
};

const closeAuthModal = () => {
  setShowAuthModal(false);
};

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    // 스와이프 중 처리 필요시 추가
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextCard();
      } else {
        handlePrevCard();
      }
    }
  };

  const handleNextCard = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentCardIndex((prev) => (prev + 1) % navItems.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrevCard = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentCardIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // 모바일 헤더
  if (isMobile) {
    return (
      <>
        <div style={{ height: '70px' }} />
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'white',
          zIndex: 1000
        }}>
          {/* 헤더 상단 */}
          <div style={{
            height: '70px',
            borderBottom: '1px solid #e0e0e0',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}>
            <div style={{
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px'
            }}>
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                <div style={{ width: '20px', height: '2px', background: '#212529', transition: 'all 0.3s' }}></div>
                <div style={{ width: '20px', height: '2px', background: '#212529', transition: 'all 0.3s' }}></div>
                <div style={{ width: '20px', height: '2px', background: '#212529', transition: 'all 0.3s' }}></div>
              </button>

              <Link to="/" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <img 
                  src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
                  alt="달래마켓"
                  style={{ height: '20px' }}
                />
              </Link>
              
              <button onClick={() => openAuthModal('login')} style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #5b8def 0%, #2563eb 50%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <span style={{ position: 'relative', zIndex: 1 }}>로그인</span>
              </button>
            </div>
          </div>

          {/* 카드 메뉴 섹션 - 홈 화면 제외 */}
          {location.pathname !== '/' && (
            <div 
              style={{
                height: '100px',
                background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
                position: 'relative',
                overflow: 'visible',
                padding: '15px 0',
                perspective: '1000px'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div style={{
                position: 'relative',
                height: '70px',
                width: '200px',
                margin: '0 auto'
              }}>
                {navItems.map((item, index) => {
                  const distance = (index - currentCardIndex + navItems.length) % navItems.length;
                  const isActiveCard = distance === 0;
                  const isFlipping = isAnimating && isActiveCard;
                  
                  let zIndex = 20 - distance;
                  let translateY = isActiveCard ? 0 : distance * 3;
                  let translateX = isActiveCard ? 0 : distance * -8;
                  let scale = isActiveCard ? 1 : 1 - (distance * 0.03);
                  let opacity = distance <= 6 ? 1 - (distance * 0.12) : 0;
                  let rotate = isActiveCard ? 0 : distance * -1;
                  
                  return (
                    <div
                      key={item.path}
                      onClick={() => {
                        if (isActiveCard) {
                          navigate(item.path);
                        } else if (!isAnimating && distance <= 3) {
                          setCurrentCardIndex(index);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: isActiveCard ?
                          'linear-gradient(145deg, #ffffff 0%, #e7f3ff 50%, #dbeafe 100%)' :
                          'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
                        borderRadius: '12px',
                        boxShadow: isActiveCard ? 
                          '0 3px 10px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)' : 
                          '0 2px 5px rgba(0,0,0,0.15)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: isFlipping ? 
                          'translateY(-30px) rotateX(-15deg) scale(0.95)' :
                          `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
                        transformStyle: 'preserve-3d',
                        zIndex: zIndex,
                        opacity: opacity,
                        transition: isAnimating ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        cursor: isActiveCard ? 'pointer' : distance <= 3 ? 'pointer' : 'default',
                        transformOrigin: 'center bottom'
                      }}
                    >
                      <div style={{
                        fontSize: isActiveCard ? '16px' : '14px',
                        fontWeight: isActiveCard ? '600' : '500',
                        color: isActiveCard ? '#2563eb' : '#495057',
                        transition: 'all 0.3s',
                        textAlign: 'center'
                      }}>
                        {item.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 스와이프 힌트 */}
              <div style={{
                position: 'absolute',
                bottom: '5px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10px',
                color: '#adb5bd'
              }}>
                <span style={{ opacity: 0.6 }}>←</span>
                <span>스와이프하여 이동</span>
                <span style={{ opacity: 0.6 }}>→</span>
              </div>
            </div>
          )}
        </header>

        {/* 모바일 메뉴 슬라이드 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: showMobileMenu ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          background: 'linear-gradient(135deg, #dbeafe 0%, #e7f3ff 20%, #ffffff 40%, #ffffff 100%)',
          boxShadow: showMobileMenu ? '2px 0 10px rgba(0,0,0,0.1)' : 'none',
          transition: 'left 0.3s ease-out',
          zIndex: 1001,
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowMobileMenu(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#495057',
                cursor: 'pointer'
              }}>×</button>
          </div>
          
          <nav style={{ paddingTop: '10px' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '14px 20px',
                  fontSize: '14px',
                  color: isActive(item.path) ? '#2563eb' : '#212529',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  textDecoration: 'none',
                  borderLeft: isActive(item.path) ? '3px solid #2563eb' : '3px solid transparent',
                  background: isActive(item.path) ? 'rgba(248, 249, 250, 0.8)' : 'transparent'
                }}
              >
                {item.text}
              </Link>
            ))}
          </nav>

          <div style={{ padding: '20px', marginTop: '20px' }}>
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                openAuthModal('signup');
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
              회원가입
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 배경 오버레이 */}
        {showMobileMenu && (
          <div 
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }} 
          />
        )}
        
        {/* 구글 계정 팝업 - 모바일 */}
        <GoogleAccountPopup 
          isOpen={showGooglePopup && location.pathname === '/'}
          onClose={() => setShowGooglePopup(false)}
          onSelectAccount={(account) => console.log('Selected:', account)}
          isMobile={true}
          isHomePage={location.pathname === '/'}
        />
        
        {/* 모바일 인증 모달 */}
        <MobileAuthModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          initialMode={authModalMode}
        />
      </>
    );
  }

  // PC 헤더
  return (
    <>
      <div style={{ height: '70px' }} />
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 1000
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <Link to="/">
              <img 
                src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
                alt="달래마켓"
                style={{ height: '30px' }}
              />
            </Link>

            <nav style={{ display: 'flex', gap: '24px' }}>
              {navItems.map(item => (
                <div 
                  key={item.path}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => item.hasSubmenu && setShowSubmenu(item.path)}
                  onMouseLeave={() => setShowSubmenu(null)}
                >
<Link
  to={item.path}
  style={{
    fontSize: '14px',
    color: isActive(item.path) ? '#2563eb' : '#212529',
    fontWeight: isActive(item.path) ? '600' : '400',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}
>
  {item.isImage ? (
    <img 
      src={item.imageUrl}
      alt={item.text}
      style={{ 
        height: '24px',
        width: 'auto',
        objectFit: 'contain',
        filter: isActive(item.path) ? 'none' : 'grayscale(0)',
        opacity: isActive(item.path) ? 1 : 0.8,
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = isActive(item.path) ? '1' : '0.8';
      }}
    />
  ) : (
    <>
      {item.text}
      {item.hasSubmenu && (
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </>
  )}
</Link>
                  
                  {/* 하위메뉴 드롭다운 */}
                  {item.hasSubmenu && showSubmenu === item.path && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '8px',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: '1px solid #e0e0e0',
                      minWidth: item.text === '업무도구' ? '600px' : '200px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      zIndex: 1001,
                      padding: item.text === '업무도구' ? '16px' : '0'
                    }}>
                      {item.text === '업무도구' ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0'
                        }}>
                          {item.submenu.map(subItem => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                color: '#212529',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8f9fa';
                                e.currentTarget.style.color = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#212529';
                              }}
                            >
                              <span>{subItem.text}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        item.submenu.map(subItem => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            style={{
                              display: 'block',
                              padding: '10px 16px',
                              fontSize: '13px',
                              color: '#212529',
                              textDecoration: 'none',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#212529';
                            }}
                          >
                            {subItem.text}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            <button onClick={() => openAuthModal('login')} style={{
              padding: '8px 20px',
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#212529',
              cursor: 'pointer'
            }}>로그인</button>
            
            <button onClick={() => openAuthModal('signup')} style={{
              padding: '8px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>회원가입</button>
            
            {/* 구글 계정 팝업 - PC */}
            {showGooglePopup && location.pathname === '/' && (
              <GoogleAccountPopup 
                isOpen={true}
                onClose={() => setShowGooglePopup(false)}
                onSelectAccount={(account) => console.log('Selected:', account)}
                isMobile={false}
                isHomePage={location.pathname === '/'}
              />
            )}
          </div>
        </div>
      </header>
      
      {/* PC용 인증 모달 */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        initialMode={authModalMode}
        isMobile={false}
      />
    </>
  );
}

export default UserHeader;