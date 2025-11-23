'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DesignSettings {
  colors: {
    primary: { base: string; opacity: number };
    secondary: { base: string; opacity: number };
    success: { base: string; opacity: number };
    warning: { base: string; opacity: number };
    error: { base: string; opacity: number };
    info: { base: string; opacity: number };
    neutral: { base: string; opacity: number };
  };
  background: {
    light: { solid: { color: string } };
    medium: { solid: { color: string } };
    dark: { solid: { color: string } };
  };
  typography: {
    base_size: number;
    base_weight: number;
  };
  border: {
    radius?: { sm?: number; md?: number; lg?: number; xl?: number };
    width?: number;
  };
  shadow: {
    sm?: string;
    md?: string;
    lg?: string;
  };
}

interface DesignSystemContextType {
  settings: DesignSettings | null;
  isLoading: boolean;
}

const defaultSettings: DesignSettings = {
  colors: {
    primary: { base: '#2563eb', opacity: 100 },
    secondary: { base: '#10b981', opacity: 100 },
    success: { base: '#22c55e', opacity: 100 },
    warning: { base: '#f59e0b', opacity: 100 },
    error: { base: '#ef4444', opacity: 100 },
    info: { base: '#3b82f6', opacity: 100 },
    neutral: { base: '#6b7280', opacity: 100 },
  },
  background: {
    light: { solid: { color: '#ffffff' } },
    medium: { solid: { color: '#f3f4f6' } },
    dark: { solid: { color: '#1f2937' } },
  },
  typography: {
    base_size: 16,
    base_weight: 400,
  },
  border: {
    radius: { sm: 4, md: 8, lg: 12, xl: 16 },
    width: 1,
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 20px rgba(0,0,0,0.15)',
  },
};

const DesignSystemContext = createContext<DesignSystemContextType>({
  settings: null,
  isLoading: true,
});

export function useDesignSystem() {
  return useContext(DesignSystemContext);
}

// CSS 변수 생성 함수
function generateCSSVariables(settings: DesignSettings): string {
  const vars: string[] = [];

  // 색상
  if (settings.colors) {
    Object.entries(settings.colors).forEach(([key, value]) => {
      if (value?.base) {
        vars.push(`--ds-color-${key}: ${value.base}`);
      }
    });
  }

  // 배경
  if (settings.background) {
    if (settings.background.light?.solid?.color) {
      vars.push(`--ds-bg-light: ${settings.background.light.solid.color}`);
    }
    if (settings.background.medium?.solid?.color) {
      vars.push(`--ds-bg-medium: ${settings.background.medium.solid.color}`);
    }
    if (settings.background.dark?.solid?.color) {
      vars.push(`--ds-bg-dark: ${settings.background.dark.solid.color}`);
    }
  }

  // 타이포그래피
  if (settings.typography) {
    if (settings.typography.base_size) {
      vars.push(`--ds-font-size-base: ${settings.typography.base_size}px`);
    }
    if (settings.typography.base_weight) {
      vars.push(`--ds-font-weight-base: ${settings.typography.base_weight}`);
    }
  }

  // 테두리
  if (settings.border?.radius) {
    Object.entries(settings.border.radius).forEach(([key, value]) => {
      if (value !== undefined) {
        vars.push(`--ds-radius-${key}: ${value}px`);
      }
    });
  }
  if (settings.border?.width) {
    vars.push(`--ds-border-width: ${settings.border.width}px`);
  }

  // 그림자
  if (settings.shadow) {
    Object.entries(settings.shadow).forEach(([key, value]) => {
      if (value) {
        vars.push(`--ds-shadow-${key}: ${value}`);
      }
    });
  }

  return vars.join('; ');
}

interface DesignSystemProviderProps {
  children: ReactNode;
}

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  const [settings, setSettings] = useState<DesignSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadDesignSettings = async () => {
      try {
        // 활성화된 디자인 프리셋 불러오기
        const { data, error } = await supabase
          .from('platform_design_presets')
          .select('settings')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          // DB에 설정이 없으면 기본값 사용
          setSettings(defaultSettings);
        } else {
          setSettings(data.settings as DesignSettings);
        }
      } catch (err) {
        console.error('디자인 시스템 로드 실패:', err);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadDesignSettings();
  }, []);

  // CSS 변수 주입
  useEffect(() => {
    if (settings) {
      const cssVars = generateCSSVariables(settings);
      document.documentElement.style.cssText += cssVars;
    }

    return () => {
      // cleanup: 컴포넌트 언마운트 시 CSS 변수 제거 (선택사항)
    };
  }, [settings]);

  return (
    <DesignSystemContext.Provider value={{ settings, isLoading }}>
      {children}
    </DesignSystemContext.Provider>
  );
}
