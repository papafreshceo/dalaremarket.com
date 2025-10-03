// src/styles/design-tokens.ts
/**
 * 달래마켓 디자인 시스템
 * B2B 플랫폼에 맞는 신뢰감 있고 깔끔한 디자인
 */

export const design = {
  // 🎨 색상 팔레트
  colors: {
    // 메인 브랜드 색상 (신뢰감 있는 블루)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // 메인
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // 보조 색상 (따뜻한 그린)
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // 메인
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // 중성 색상 (부드러운 그레이)
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // 상태 색상
    success: '#10b981',  // 녹색
    warning: '#f59e0b',  // 주황
    error: '#ef4444',    // 빨강
    info: '#3b82f6',     // 파랑
    
    // 배경 색상
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    
    // 텍스트 색상
    text: {
      primary: '#111827',   // 진한 텍스트
      secondary: '#4b5563', // 중간 텍스트
      tertiary: '#9ca3af',  // 연한 텍스트
      inverse: '#ffffff',   // 반전 텍스트
    },
    
    // 테두리 색상
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
    },
  },
  
  // 📏 간격 시스템 (8px 기반)
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },
  
  // 🔤 타이포그래피
  typography: {
    fontFamily: {
      sans: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    },
    
    fontSize: {
      xs: ['0.75rem', '1rem'],     // 12px
      sm: ['0.875rem', '1.25rem'],  // 14px
      base: ['1rem', '1.5rem'],     // 16px
      lg: ['1.125rem', '1.75rem'],  // 18px
      xl: ['1.25rem', '1.75rem'],   // 20px
      '2xl': ['1.5rem', '2rem'],    // 24px
      '3xl': ['1.875rem', '2.25rem'], // 30px
      '4xl': ['2.25rem', '2.5rem'],   // 36px
      '5xl': ['3rem', '1'],          // 48px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 500,  // 600 대신 500
      bold: 500,      // 700 대신 500
    },
  },
  
  // 🎯 모서리 반경
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // 🌊 그림자 (부드러운 그림자)
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  
  // ⏱️ 애니메이션
  animation: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // 📱 반응형 브레이크포인트
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // 📐 레이아웃
  layout: {
    maxWidth: {
      xs: '20rem',      // 320px
      sm: '24rem',      // 384px
      md: '28rem',      // 448px
      lg: '32rem',      // 512px
      xl: '36rem',      // 576px
      '2xl': '42rem',   // 672px
      '3xl': '48rem',   // 768px
      '4xl': '56rem',   // 896px
      '5xl': '64rem',   // 1024px
      '6xl': '72rem',   // 1152px
      '7xl': '80rem',   // 1280px
      full: '100%',
    },
    
    container: {
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '6rem',
      },
    },
  },
  
  // 🎭 컴포넌트별 스타일
  components: {
    button: {
      base: 'inline-flex items-center justify-center font-medium transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      
      variants: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      },
      
      sizes: {
        xs: 'px-2.5 py-1.5 text-xs rounded-md',
        sm: 'px-3 py-2 text-sm rounded-md',
        md: 'px-4 py-2.5 text-base rounded-lg',
        lg: 'px-6 py-3 text-lg rounded-lg',
        xl: 'px-8 py-4 text-xl rounded-xl',
      },
    },
    
    input: {
      base: 'block w-full rounded-lg border-2 transition-colors duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2',
      
      variants: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      },
      
      sizes: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-5 py-3 text-lg',
      },
    },
    
    card: {
      base: 'bg-white rounded-xl border border-gray-200 overflow-hidden',
      
      variants: {
        elevated: 'shadow-md hover:shadow-lg transition-shadow',
        outlined: 'border-2',
        ghost: 'border-0 bg-gray-50',
      },
      
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
  },
}

// Tailwind Config에서 사용할 수 있도록 export
export const tailwindExtend = {
  colors: design.colors,
  spacing: design.spacing,
  fontSize: design.typography.fontSize,
  fontWeight: design.typography.fontWeight,
  fontFamily: design.typography.fontFamily,
  borderRadius: design.borderRadius,
  boxShadow: design.shadows,
  maxWidth: design.layout.maxWidth,
  screens: design.breakpoints,
}

// 타입 정의
export type DesignTokens = typeof design
export type ColorScheme = keyof typeof design.colors
export type Spacing = keyof typeof design.spacing