// styles/ResponsiveProvider.jsx
import React, { createContext, useContext } from 'react';
import { useMediaQuery } from "../hooks/useMediaQuery";

/**
 * 반응형 Context
 * 모든 컴포넌트에서 디바이스 정보를 공유
 */
const ResponsiveContext = createContext();

/**
 * ResponsiveProvider 컴포넌트
 * 앱 최상위에서 감싸서 사용
 */
export const ResponsiveProvider = ({ children }) => {
  const deviceInfo = useMediaQuery();
  
  // 추가 유틸리티 함수들
  const utils = {
    // 모바일에서만 렌더링
    renderMobileOnly: (component) => deviceInfo.isMobile ? component : null,
    
    // 태블릿 이상에서만 렌더링
    renderTabletUp: (component) => !deviceInfo.isMobile ? component : null,
    
    // 데스크톱에서만 렌더링
    renderDesktopOnly: (component) => deviceInfo.isDesktop ? component : null,
    
    // 조건부 스타일
    getResponsiveStyle: (mobile, tablet, desktop) => {
      if (deviceInfo.isMobile) return mobile;
      if (deviceInfo.isTablet) return tablet || desktop;
      return desktop;
    },
    
    // 조건부 클래스
    getResponsiveClass: (baseClass, options = {}) => {
      const classes = [baseClass];
      
      if (deviceInfo.isMobile && options.mobile) {
        classes.push(options.mobile);
      }
      if (deviceInfo.isTablet && options.tablet) {
        classes.push(options.tablet);
      }
      if (deviceInfo.isDesktop && options.desktop) {
        classes.push(options.desktop);
      }
      
      return classes.join(' ');
    }
  };
  
  const value = {
    ...deviceInfo,
    ...utils
  };
  
  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

/**
 * useResponsive 훅
 * ResponsiveContext의 값을 사용
 */
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  
  return context;
};

/**
 * HOC - 반응형 컴포넌트 래퍼
 * 특정 디바이스에서만 렌더링되는 컴포넌트 생성
 */
export const withResponsive = (Component, options = {}) => {
  return (props) => {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    
    // 렌더링 조건 체크
    if (options.mobileOnly && !isMobile) return null;
    if (options.tabletOnly && !isTablet) return null;
    if (options.desktopOnly && !isDesktop) return null;
    if (options.excludeMobile && isMobile) return null;
    
    return <Component {...props} />;
  };
};