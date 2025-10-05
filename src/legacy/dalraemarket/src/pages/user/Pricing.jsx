// src/pages/user/Pricing.jsx
import { useState } from 'react';
import UserHeader from '../../components/layout/UserHeader';

function Pricing() {
  const [billingMode, setBillingMode] = useState('monthly');
  
  const formatPrice = (price) => {
    return '₩' + price.toLocaleString('ko-KR');
  };
  
  const monthly = { 
    pro: 13900,
    partner: 79900 
  };
  const yearly = { 
    pro: Math.round(13900 * 12 * 0.8),
    partner: Math.round(79900 * 12 * 0.8)
  };
  
  const isYearly = billingMode === 'yearly';
  const currentPricePro = isYearly ? yearly.pro : monthly.pro;
  const currentPricePartner = isYearly ? yearly.partner : monthly.partner;
  const priceUnit = isYearly ? '/년' : '/월';

  // 통일된 기능 목록 (순서 고정)
  const allFeatures = [
    { id: 'order', icon: 'M16 3H8a2 2 0 0 0-2 2v14l6-3 6 3V5a2 2 0 0 0-2-2z', text: '간편 발주시스템 이용' },
    { id: 'stats', icon: 'M3 3v18h18', path2: 'M18 17V9', path3: 'M13 17V5', path4: 'M8 17v-6', text: '셀러별 발주통계 대시보드 제공' },
    { id: 'image', icon: 'M3 5h18v14H3z', circle: '8.5,11.5,1.5', path2: 'M21 15l-4-4-3 3-2-2-5 5', text: '상품 이미지 다운로드' },
    { id: 'chart', icon: 'M3 17l6-6 4 4 8-8', text: '상품별 공급가 변동 차트' },
    { id: 'calendar', icon: 'M3 4h18v18H3z', path2: 'M16 2v4M8 2v4M3 10h18', text: '상품별 공급일정 캘린더' },
    { id: 'unique', icon: 'M3 4h18v14H3z', circle: '8,11,2', path2: 'M13 9h7M13 13h7', text: 'UNIQUE 사진 영상 서비스 이용' },
    { id: 'simulation', icon: 'M3 4h18M3 20h18', rect: '7,8,10,8', path2: 'M12 8v8', text: '판매/마진 시뮬레이션 이용' },
    { id: 'option', icon: 'M4 21v-7M8 21V3M12 21v-5M16 21V8M20 21v-3', text: '옵션가 세팅 어플리케이션 이용' },
    { id: 'integration', icon: 'M8 6h13M8 12h13M8 18h13', circle2: '3,6,0.01', circle3: '3,12,0.01', circle4: '3,18,0.01', text: '주문 통합 어플리케이션 이용' },
    { id: 'discount', icon: 'M20 12V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7', path2: 'M20 21l2-2-2-2M17 16l-2 2 2 2', text: '공급가 할인가 적용' },
    { id: 'margin', icon: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z', path2: 'M11 7H13V9H11V7ZM11 11H13V17H11V11Z', text: '마진계산기' },
    { id: 'discount-calc', icon: 'M12.5 6.9C11.77 6.33 10.86 6 9.85 6C7.09 6 4.85 8.24 4.85 11C4.85 13.76 7.09 16 9.85 16', text: '할인율 계산기' },
    { id: 'price-rec', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', text: '판매가/할인가 추천기' },
    { id: 'barcode', icon: 'M2 6H4V18H2V6ZM5 6H6V18H5V6ZM7 6H10V18H7V6Z', text: '바코드 생성기' },
    { id: 'invoice', icon: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z', text: '거래명세서 즉시 발급' },
    { id: 'message', icon: 'M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z', text: '고객 메시지' },
    { id: 'inventory', icon: 'M12 2L2 7L12 12L22 7L12 2Z', text: '재고 추적기' },
    { id: 'title-opt', icon: 'M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z', text: '상품명 최적화 도구' },
    { id: 'review', icon: 'M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2Z', text: '리뷰 분석' },
    { id: 'sales', icon: 'M5 9.2H8V19H5V9.2ZM10.6 5H13.4V19H10.6V5ZM16.2 13H19V19H16.2V13Z', text: '매출 분석' },
    { id: 'trend', icon: 'M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z', text: '트렌드 분석' },
    { id: 'competitor', icon: 'M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z', text: '경쟁사 모니터링' },
    { id: 'category', icon: 'M7.5 21L2 9L4.5 9L7.5 16L10.5 9L13 9L7.5 21ZM17 3V13L22 13L17 21L17 13L12 13L17 3Z', text: '카테고리 순위 확인' },
    // 파트너 전용
    { id: 'special-event', icon: 'M16 3H8a2 2 0 0 0-2 2v14l6-3 6 3V5a2 2 0 0 0-2-2z', text: '특가 공급 이벤트 참여' },
    { id: 'farm-matching', icon: 'M12 2L2 7L12 12L22 7L12 2Z', text: '농가매칭서비스 50% 할인(1회/1년)' },
    { id: 'farm-photo', icon: 'M3 5h18v14H3z', circle: '8.5,11.5,1.5', path2: 'M21 15l-4-4-3 3-2-2-5 5', text: '농가방문 촬영서비스 무료(1회/1년)' },
    { id: 'strategy', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', path2: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7', text: '판매전략 구상회의(ZOOM) 참여' },
    { id: 'price-sim', icon: 'M3 13H5L8 17L12 7L15 13H17V15H15L12 9L8 19L5 15H3V13Z', path2: 'M19 3H21V12H19V3ZM15 8H17V12H15V8Z', text: '판매가 시뮬레이터' },
    { id: 'excel-order', icon: 'M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3Z', text: '주문통합 (Excel)' },
    { id: 'option-setting', icon: 'M12 2L2 7V11C2 16.55 5.84 21.74 11 22.97V20.91C6.91 19.75 4 15.54 4 11.22V8.3L12 4.19', text: '옵션가 세팅' },
  ];

  // 플랜별 기능 제한사항
  const planLimits = {
    starter: {
      'order': '',
      'stats': '',
      'image': '<b>[ 상품당 20개 ]</b>',
      'chart': '',
      'calendar': '',
      'unique': '',
      'simulation': '<b>일 3회</b>',
      'option': '<b>일 1회</b>',
      'integration': '<b>일 1회</b>',
      'margin': '<b>일 3회</b>',
      'discount-calc': '<b>일 3회</b>',
      'price-rec': '<b>일 3회</b>',
      'barcode': '<b>일 1회</b>',
      'invoice': '<b>일 1회</b>',
      'message': '<b>일 1회</b>',
      'inventory': '<b>일 1회</b>'
    },
    pro: {
      'order': '',
      'stats': '',
      'chart': '',
      'calendar': '',
      'unique': '',
      'image': '<b style="font-weight:600">무제한</b>',
      'simulation': '<b style="font-weight:600">무제한</b>',
      'option': '<b style="font-weight:600">무제한</b>',
      'integration': '<b style="font-weight:600">무제한</b>',
      'discount': '<b style="color:#10b981">상시 2% 할인</b>',
      'margin': '<b style="font-weight:600">무제한</b>',
      'discount-calc': '<b style="font-weight:600">무제한</b>',
      'price-rec': '<b style="font-weight:600">무제한</b>',
      'barcode': '<b style="font-weight:600">무제한</b>',
      'invoice': '<b style="font-weight:600">무제한</b>',
      'message': '<b style="font-weight:600">무제한</b>',
      'inventory': '<b style="font-weight:600">무제한</b>',
      'title-opt': '<b>일 3회</b>',
      'review': '<b>일 3회</b>',
      'sales': '<b>일 3회</b>',
      'trend': '<b>일 3회</b>',
      'competitor': '<b>일 3회</b>',
      'category': '<b>일 3회</b>'
    },
    partner: {
      'order': '',
      'stats': '',
      'chart': '',
      'calendar': '',
      'unique': '<b style="color:#9333ea">월 1회 50% 할인</b>',
      'discount': '<b style="color:#10b981">상시 4% 할인</b>',
      'special-event': '',
      'farm-matching': '',
      'farm-photo': '',
      'strategy': '',
      'image': '<b style="font-weight:600">무제한</b>',
      'margin': '<b style="font-weight:600">무제한</b>',
      'price-sim': '<b style="font-weight:600">무제한</b>',
      'discount-calc': '<b style="font-weight:600">무제한</b>',
      'price-rec': '<b style="font-weight:600">무제한</b>',
      'excel-order': '<b style="font-weight:600">무제한</b>',
      'option-setting': '<b style="font-weight:600">무제한</b>',
      'inventory': '<b style="font-weight:600">무제한</b>',
      'invoice': '<b style="font-weight:600">무제한</b>',
      'barcode': '<b style="font-weight:600">무제한</b>',
      'message': '<b style="font-weight:600">무제한</b>',
      'title-opt': '<b style="font-weight:600">무제한</b>',
      'review': '<b style="font-weight:600">무제한</b>',
      'sales': '<b style="font-weight:600">무제한</b>',
      'trend': '<b style="font-weight:600">무제한</b>',
      'competitor': '<b style="font-weight:600">무제한</b>',
      'category': '<b style="font-weight:600">무제한</b>'
    }
  };

  // 플랜별로 표시할 기능 필터링
  const getFeaturesList = (plan) => {
    return allFeatures.filter(feature => planLimits[plan][feature.id] !== undefined);
  };

  // 애니메이션 스타일
  const heroAuraStyle = `
    @keyframes neonGlow {
      0%, 100% {
        box-shadow: 
          0 0 15px rgba(37, 99, 235, 0.8),
          0 0 30px rgba(6, 182, 212, 0.6),
          0 0 45px rgba(37, 99, 235, 0.4),
          inset 0 0 15px rgba(37, 99, 235, 0.15);
      }
      50% {
        box-shadow: 
          0 0 20px rgba(37, 99, 235, 0.9),
          0 0 40px rgba(6, 182, 212, 0.8),
          0 0 60px rgba(37, 99, 235, 0.6),
          inset 0 0 20px rgba(37, 99, 235, 0.2);
      }
    }
    
    .hero-button {
      position: relative;
      background: linear-gradient(90deg, #2563eb, #06b6d4);
      animation: neonGlow 2s ease-in-out infinite;
      transition: transform 0.2s;
    }
    
    .hero-button::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      background: linear-gradient(90deg, #2563eb, #06b6d4, #2563eb);
      background-size: 200% 100%;
      border-radius: 14px;
      opacity: 0;
      z-index: -1;
      animation: neonFlame 2s linear infinite;
    }
    
    @keyframes neonFlame {
      0% {
        opacity: 0.3;
        background-position: 0% 50%;
      }
      50% {
        opacity: 0.6;
        background-position: 100% 50%;
      }
      100% {
        opacity: 0.3;
        background-position: 200% 50%;
      }
    }
  `;

  return (
    <>
      <style>{heroAuraStyle}</style>
      <UserHeader />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '70px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '-140px',
          width: '260px',
          height: '260px',
          background: '#bfdbfe',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          right: '-120px',
          bottom: '-140px',
          width: '300px',
          height: '300px',
          background: '#93c5fd',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        {/* 히어로 섹션 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px 24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <h1 style={{
            fontSize: '38px',
            lineHeight: '1.15',
            margin: 0,
            color: '#1d4ed8',
            fontWeight: '700'
          }}>
            합리적인 B2B 요금제
          </h1>
          <p style={{
            margin: '12px auto 0',
            color: '#475569',
            maxWidth: '720px',
            fontSize: '16px'
          }}>
            농산물 공급에 특화된 기능을 필요한 만큼. 부담 없이 시작하고 성장에 맞춰 확장하세요.
          </p>
          
          {/* 토글 버튼 */}
          <div style={{
            margin: '22px auto 0',
            display: 'inline-flex',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '18px',
            boxShadow: '0 8px 24px rgba(2,6,23,0.06)'
          }}>
            <button
              onClick={() => setBillingMode('monthly')}
              style={{
                border: 0,
                background: billingMode === 'monthly' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: billingMode === 'monthly' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: billingMode === 'monthly' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              월간
            </button>
            <button
              onClick={() => setBillingMode('yearly')}
              style={{
                border: 0,
                background: billingMode === 'yearly' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: billingMode === 'yearly' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: billingMode === 'yearly' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              연간
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '2px 6px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '900'
              }}>
                20% 할인
              </span>
            </button>
          </div>
          
          <div style={{
            marginTop: '8px',
            color: '#64748b',
            fontSize: '12px'
          }}>
            * 부가세 별도
          </div>
        </div>

        {/* 요금제 카드 그리드 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'grid',
          gap: '20px',
          marginTop: '36px',
          marginBottom: '70px',
          gridTemplateColumns: window.innerWidth >= 900 ? 'repeat(3, 1fr)' : '1fr'
        }}>
          {/* 스타터(무료) 플랜 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '22px 22px 24px',
            transition: 'box-shadow 0.25s, transform 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1d4ed8',
              fontWeight: '900',
              margin: '0 0 6px',
              fontSize: '18px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none">
                <path d="M16 3H8a2 2 0 0 0-2 2v14l6-3 6 3V5a2 2 0 0 0-2-2z"/>
              </svg>
              스타터(무료)
            </h2>
            <div style={{
              fontSize: '30px',
              fontWeight: '900',
              margin: '8px 0 2px'
            }}>
              ₩0 <span style={{ color: '#64748b', fontSize: '13px' }}>/월</span>
            </div>
            <p style={{
              color: '#64748b',
              fontSize: '13px',
              margin: '8px 0 16px'
            }}>
              핵심 기능으로 가볍게 시작
            </p>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0 18px'
            }}>
              {getFeaturesList('starter').map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  margin: '10px 0',
                  color: '#334155',
                  fontSize: '14px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    {feature.icon && <path d={feature.icon}/>}
                    {feature.path2 && <path d={feature.path2}/>}
                    {feature.path3 && <path d={feature.path3}/>}
                    {feature.path4 && <path d={feature.path4}/>}
                    {feature.rect && <rect x={feature.rect.split(',')[0]} y={feature.rect.split(',')[1]} width={feature.rect.split(',')[2]} height={feature.rect.split(',')[3]} rx="2"/>}
                    {feature.circle && <circle cx={feature.circle.split(',')[0]} cy={feature.circle.split(',')[1]} r={feature.circle.split(',')[2]}/>}
                    {feature.circle2 && <circle cx={feature.circle2.split(',')[0]} cy={feature.circle2.split(',')[1]} r={feature.circle2.split(',')[2]}/>}
                    {feature.circle3 && <circle cx={feature.circle3.split(',')[0]} cy={feature.circle3.split(',')[1]} r={feature.circle3.split(',')[2]}/>}
                    {feature.circle4 && <circle cx={feature.circle4.split(',')[0]} cy={feature.circle4.split(',')[1]} r={feature.circle4.split(',')[2]}/>}
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: feature.text + (planLimits.starter[feature.id] ? ' ' + planLimits.starter[feature.id] : '') }} />
                </li>
              ))}
            </ul>
            
            <button style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              fontWeight: '900',
              background: '#ffffff',
              color: '#1d4ed8',
              border: '1px solid #93c5fd',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}>
              무료 시작하기
            </button>
          </div>

          {/* 프로 플랜 */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #3b82f6',
            borderRadius: '22px',
            padding: '22px 22px 24px',
            boxShadow: '0 24px 60px -20px rgba(59,130,246,0.35)',
            position: 'relative',
            transition: 'box-shadow 0.25s, transform 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 28px 70px -20px rgba(59,130,246,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 24px 60px -20px rgba(59,130,246,0.35)';
          }}>
            {/* 인기 리본 */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '-12px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '900',
              padding: '6px 10px',
              borderRadius: '999px'
            }}>
              가장 인기
            </div>
            
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1d4ed8',
              fontWeight: '900',
              margin: '0 0 6px',
              fontSize: '18px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none">
                <path d="M13 2 3 14h9l-1 8 10-12h-9z"/>
              </svg>
              프로
            </h2>
            <div style={{
              fontSize: '30px',
              fontWeight: '900',
              margin: '8px 0 2px'
            }}>
              <span>{formatPrice(currentPricePro)}</span> <span style={{ color: '#64748b', fontSize: '13px' }}>{priceUnit}</span>
            </div>
            <p style={{
              color: '#64748b',
              fontSize: '13px',
              margin: '8px 0 16px'
            }}>
              대부분 도구 무제한 + 공급가 할인
            </p>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0 18px'
            }}>
              {getFeaturesList('pro').map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  margin: '10px 0',
                  color: '#334155',
                  fontSize: '14px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    {feature.icon && <path d={feature.icon}/>}
                    {feature.path2 && <path d={feature.path2}/>}
                    {feature.path3 && <path d={feature.path3}/>}
                    {feature.path4 && <path d={feature.path4}/>}
                    {feature.rect && <rect x={feature.rect.split(',')[0]} y={feature.rect.split(',')[1]} width={feature.rect.split(',')[2]} height={feature.rect.split(',')[3]} rx="2"/>}
                    {feature.circle && <circle cx={feature.circle.split(',')[0]} cy={feature.circle.split(',')[1]} r={feature.circle.split(',')[2]}/>}
                    {feature.circle2 && <circle cx={feature.circle2.split(',')[0]} cy={feature.circle2.split(',')[1]} r={feature.circle2.split(',')[2]}/>}
                    {feature.circle3 && <circle cx={feature.circle3.split(',')[0]} cy={feature.circle3.split(',')[1]} r={feature.circle3.split(',')[2]}/>}
                    {feature.circle4 && <circle cx={feature.circle4.split(',')[0]} cy={feature.circle4.split(',')[1]} r={feature.circle4.split(',')[2]}/>}
                  </svg>
                  <span dangerouslySetInnerHTML={{ 
                    __html: feature.id === 'discount' 
                      ? `공급가 ${planLimits.pro[feature.id]}` 
                      : feature.text + (planLimits.pro[feature.id] ? ' ' + planLimits.pro[feature.id] : '') 
                  }} />
                </li>
              ))}
            </ul>
            
            <button style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              fontWeight: '900',
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
              color: '#ffffff',
              border: '1px solid transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}>
              프로 업그레이드
            </button>
          </div>

          {/* 파트너 플랜 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '22px 22px 24px',
            transition: 'box-shadow 0.25s, transform 0.25s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1d4ed8',
              fontWeight: '900',
              margin: '0 0 6px',
              fontSize: '18px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              파트너
            </h2>
            <div style={{
              fontSize: '30px',
              fontWeight: '900',
              margin: '8px 0 2px'
            }}>
              <span>{formatPrice(currentPricePartner)}</span> <span style={{ color: '#64748b', fontSize: '13px' }}>{priceUnit}</span>
            </div>
            <p style={{
              color: '#64748b',
              fontSize: '13px',
              margin: '8px 0 16px'
            }}>
              모든 도구 무제한 + 프리미엄 혜택
            </p>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0 18px'
            }}>
              {getFeaturesList('partner').map((feature, index) => {
                let displayText = feature.text;
                const limit = planLimits.partner[feature.id];
                
                if (feature.id === 'unique') {
                  displayText = `UNIQUE 사진 영상 서비스 ${limit}`;
                } else if (feature.id === 'discount') {
                  displayText = `공급가 ${limit}`;
                } else if (feature.id === 'special-event') {
                  displayText = '<b style="color:#dc2626">특가 공급 이벤트 참여</b>';
                } else if (feature.id === 'farm-matching') {
                  displayText = '<b style="color:#0891b2">농가매칭서비스 50% 할인(1회/1년)</b>';
                } else if (feature.id === 'farm-photo') {
                  displayText = '<b style="color:#0891b2">농가방문 촬영서비스 무료(1회/1년)</b>';
                } else if (feature.id === 'strategy') {
                  displayText = '<b style="color:#0891b2">판매전략 구상회의(ZOOM) 참여</b>';
                } else if (limit) {
                  displayText = feature.text + ' ' + limit;
                }
                
                return (
                  <li key={index} style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    margin: '10px 0',
                    color: '#334155',
                    fontSize: '14px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                      {feature.icon && <path d={feature.icon}/>}
                      {feature.path2 && <path d={feature.path2}/>}
                      {feature.path3 && <path d={feature.path3}/>}
                      {feature.path4 && <path d={feature.path4}/>}
                      {feature.rect && <rect x={feature.rect.split(',')[0]} y={feature.rect.split(',')[1]} width={feature.rect.split(',')[2]} height={feature.rect.split(',')[3]} rx="2"/>}
                      {feature.circle && <circle cx={feature.circle.split(',')[0]} cy={feature.circle.split(',')[1]} r={feature.circle.split(',')[2]}/>}
                      {feature.circle2 && <circle cx={feature.circle2.split(',')[0]} cy={feature.circle2.split(',')[1]} r={feature.circle2.split(',')[2]}/>}
                      {feature.circle3 && <circle cx={feature.circle3.split(',')[0]} cy={feature.circle3.split(',')[1]} r={feature.circle3.split(',')[2]}/>}
                      {feature.circle4 && <circle cx={feature.circle4.split(',')[0]} cy={feature.circle4.split(',')[1]} r={feature.circle4.split(',')[2]}/>}
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: displayText }} />
                  </li>
                );
              })}
            </ul>
            
            <button className="hero-button" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              fontWeight: '900',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1
            }}>
              파트너 시작하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pricing;