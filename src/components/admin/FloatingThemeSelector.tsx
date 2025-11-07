'use client';

import { useState, useEffect } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DesignTheme {
  id: number;
  name: string;
  description?: string;
  css_variables: Record<string, string>;
  is_active: boolean;
}

interface FloatingThemeSelectorProps {
  onClose: () => void;
}

export function FloatingThemeSelector({ onClose }: FloatingThemeSelectorProps) {
  const [themes, setThemes] = useState<DesignTheme[]>([]);
  const [previewThemeId, setPreviewThemeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/admin/design-themes');
      const result = await response.json();

      if (result.success) {
        setThemes(result.data);
        const activeTheme = result.data.find((t: DesignTheme) => t.is_active);
        if (activeTheme) {
          setPreviewThemeId(activeTheme.id);
        }
      }
    } catch (error) {
      console.error('테마 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreview = (theme: DesignTheme) => {
    const cssVars = theme.css_variables;
    const root = document.documentElement;

    // 변수명 매핑 (테마 변수 → Tailwind/globals.css 변수)
    const variableMapping: Record<string, string[]> = {
      '--primary': ['--color-primary', '--color-primary-600'],
      '--background': ['--color-background', '--color-surface'],
      '--foreground': ['--color-text', '--color-text-primary'],
      '--secondary': ['--color-secondary', '--color-secondary-600'],
      '--border': ['--color-border'],
      '--card': ['--color-surface', '--color-background-secondary'],
      '--card-foreground': ['--color-text'],
      '--muted': ['--color-muted', '--color-gray-100'],
      '--muted-foreground': ['--color-text-secondary', '--color-text-tertiary'],
      '--accent': ['--color-accent', '--color-primary-100'],
      '--accent-foreground': ['--color-text'],
      '--popover': ['--color-surface'],
      '--popover-foreground': ['--color-text'],
      '--destructive': ['--color-danger', '--color-danger-600'],
      '--destructive-foreground': ['--color-text'],
      '--input': ['--color-border', '--color-gray-300'],
      '--ring': ['--color-primary', '--color-border-focus'],
    };

    // :root에 직접 적용 (즉시 미리보기)
    Object.entries(cssVars).forEach(([key, value]) => {
      if (key.startsWith('dark-')) {
        return; // 다크 모드는 스킵
      }

      // 원본 변수 적용
      root.style.setProperty(key, value as string);

      // 매핑된 변수들도 적용
      if (variableMapping[key]) {
        variableMapping[key].forEach(mappedKey => {
          root.style.setProperty(mappedKey, value as string);
        });
      }
    });

  };

  const handlePreview = (theme: DesignTheme) => {
    setPreviewThemeId(theme.id);
    applyThemePreview(theme);
  };

  const handleActivate = async (themeId: number) => {
    try {
      const response = await fetch(`/api/admin/design-themes/${themeId}/activate`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert('테마가 활성화되었습니다!');
        loadThemes();
      } else {
        alert('테마 활성화 실패: ' + result.error);
      }
    } catch (error) {
      console.error('활성화 오류:', error);
      alert('테마 활성화 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '400px',
        maxHeight: '80vh',
        background: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 헤더 */}
      <div style={{
        padding: '16px',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette className="w-5 h-5" style={{ color: '#6366f1' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>테마 미리보기</h3>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 테마 목록 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            로딩 중...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {themes.map((theme) => (
              <div
                key={theme.id}
                style={{
                  padding: '12px',
                  border: previewThemeId === theme.id ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: previewThemeId === theme.id ? '#f5f3ff' : '#ffffff',
                  transition: 'all 0.2s'
                }}
                onClick={() => handlePreview(theme)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{theme.name}</span>
                    {theme.is_active && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#10b981',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        활성
                      </span>
                    )}
                  </div>
                  {previewThemeId === theme.id && (
                    <Check className="w-4 h-4" style={{ color: '#6366f1' }} />
                  )}
                </div>
                {theme.description && (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    {theme.description}
                  </p>
                )}
                {!theme.is_active && previewThemeId === theme.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivate(theme.id);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      background: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    이 테마 활성화
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <div style={{
        padding: '12px',
        borderTop: '2px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
          💡 테마를 클릭하면 실시간으로 미리보기됩니다. 마음에 드는 테마를 활성화하세요.
        </p>
      </div>
    </div>
  );
}
