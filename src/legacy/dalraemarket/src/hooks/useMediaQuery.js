// styles/useMediaQuery.js
import { useState, useEffect } from 'react';

/**
 * 브레이크포인트 정의
 * 모바일: 0-767px
 * 태블릿: 768-1023px
 * 데스크톱: 1024px+
 */
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440
};

/**
 * 미디어 쿼리 훅
 * 현재 디바이스 타입과 화면 크기 정보를 반환
 */
export const useMediaQuery = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isWide: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: typeof window !== 'undefined' 
      ? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      : 'portrait'
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDevice({
        isMobile: width < BREAKPOINTS.tablet,
        isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop,
        isWide: width >= BREAKPOINTS.wide,
        width: width,
        height: height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return device;
};

/**
 * 특정 미디어 쿼리 매칭 훅
 * @param {string} query - 미디어 쿼리 문자열
 */
export const useMatchMedia = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    
    // addEventListener 사용 (addListener는 deprecated)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
};

/**
 * 브레이크포인트 헬퍼 함수들
 */
export const useIsMobile = () => useMatchMedia('(max-width: 767px)');
export const useIsTablet = () => useMatchMedia('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMatchMedia('(min-width: 1024px)');
export const useIsWide = () => useMatchMedia('(min-width: 1440px)');

/**
 * 디바이스 타입 반환
 */
export const useDeviceType = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  return 'mobile'; // 기본값
};

// 브레이크포인트 상수 export
export { BREAKPOINTS };