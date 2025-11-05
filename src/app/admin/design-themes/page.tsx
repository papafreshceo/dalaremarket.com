'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface DesignTheme {
  id: number;
  name: string;
  description?: string;
  css_variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DesignThemesPage() {
  const [themes, setThemes] = useState<DesignTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<DesignTheme | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    css_variables: ''
  });

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/admin/design-themes');
      const result = await response.json();

      if (result.success) {
        setThemes(result.data);
      } else {
        toast.error('테마 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Fetch themes error:', error);
      toast.error('테마 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTheme(null);
    setFormData({
      name: '',
      description: '',
      css_variables: JSON.stringify({
        '--font-sans': 'DM Sans, sans-serif',
        '--font-mono': 'Space Mono, monospace',
        '--color-primary': '#000000',
        '--color-secondary': '#ffffff',
        '--color-accent': '#fef3c7',
        '--color-border': '#000000',
        '--border-width': '2px',
        '--shadow-sm': '4px 4px 0px 0px rgba(0, 0, 0, 0.1)',
        '--shadow-md': '6px 6px 0px 0px rgba(0, 0, 0, 0.1)',
        '--shadow-lg': '8px 8px 0px 0px rgba(0, 0, 0, 0.15)',
        '--radius': '0px'
      }, null, 2)
    });
    setShowModal(true);
  };

  const handleEdit = (theme: DesignTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      css_variables: JSON.stringify(theme.css_variables, null, 2)
    });
    setShowModal(true);
  };

  const parseCSSToJSON = (cssText: string): Record<string, string> | null => {
    try {
      // 이미 JSON 형식인지 확인
      const trimmed = cssText.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }

      // CSS 형식 파싱
      const variables: Record<string, string> = {};

      // :root { } 블록 추출
      const rootMatch = cssText.match(/:root\s*\{([^}]+)\}/s);
      if (rootMatch) {
        const rootContent = rootMatch[1];
        const lines = rootContent.split(';');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.includes(':')) continue;

          const colonIndex = trimmedLine.indexOf(':');
          const varName = trimmedLine.substring(0, colonIndex).trim();
          const varValue = trimmedLine.substring(colonIndex + 1).trim();

          if (varName.startsWith('--')) {
            variables[varName] = varValue;
          }
        }
      }

      // .dark { } 블록은 별도로 저장하지 않고 무시
      // (프론트엔드에서 다크 모드는 별도로 처리)

      return Object.keys(variables).length > 0 ? variables : null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      // JSON 또는 CSS 형식 파싱
      let cssVars;
      try {
        // 먼저 JSON으로 파싱 시도
        cssVars = JSON.parse(formData.css_variables);
      } catch (parseError) {
        // JSON이 아니면 CSS 형식으로 파싱 시도
        cssVars = parseCSSToJSON(formData.css_variables);

        if (!cssVars) {
          toast.error('올바른 형식이 아닙니다.\nJSON 형식 또는 CSS :root { } 형식으로 입력해주세요.');
          setSubmitting(false);
          return;
        }
      }

      const url = editingTheme
        ? `/api/admin/design-themes/${editingTheme.id}`
        : '/api/admin/design-themes';

      const method = editingTheme ? 'PATCH' : 'POST';

      console.log('Submitting to:', url, 'Method:', method, 'Data:', {
        name: formData.name,
        description: formData.description,
        css_variables: cssVars
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          css_variables: cssVars
        })
      });

      const result = await response.json();
      console.log('Response:', result);

      if (result.success) {
        toast.success(editingTheme ? '✅ 테마가 수정되었습니다!' : '✅ 테마가 생성되었습니다!');
        setShowModal(false);
        setEditingTheme(null);
        await fetchThemes();
      } else {
        toast.error(result.error || '작업 실패');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || '서버 요청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 테마를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/design-themes/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('테마가 삭제되었습니다.');
        fetchThemes();
      } else {
        toast.error(result.error || '삭제 실패');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('테마 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/design-themes/${id}/activate`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('테마가 활성화되었습니다. 페이지를 새로고침하면 적용됩니다.');
        fetchThemes();

        // 페이지 새로고침 권장
        setTimeout(() => {
          if (confirm('새로고침하여 테마를 적용하시겠습니까?')) {
            window.location.reload();
          }
        }, 1000);
      } else {
        toast.error(result.error || '활성화 실패');
      }
    } catch (error) {
      console.error('Activate error:', error);
      toast.error('테마 활성화 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            디자인 테마 관리
          </h1>
          <p style={{ color: '#64748b' }}>
            플랫폼 전체에 적용될 디자인 테마를 관리합니다.
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Plus className="w-4 h-4" />
          새 테마 추가
        </button>
      </div>

      {/* 테마 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            style={{
              background: '#ffffff',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              boxShadow: theme.is_active ? '0 0 0 2px #10b981' : 'none'
            }}
          >
            {/* 활성 배지 */}
            {theme.is_active && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#10b981',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Check className="w-3 h-3" />
                활성
              </div>
            )}

            {/* 테마 정보 */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '8px',
              paddingRight: theme.is_active ? '60px' : '0'
            }}>
              {theme.name}
            </h3>
            {theme.description && (
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '16px'
              }}>
                {theme.description}
              </p>
            )}

            {/* CSS 변수 미리보기 */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              maxHeight: '150px',
              overflow: 'auto'
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
                {Object.entries(theme.css_variables).slice(0, 5).map(([key, value]) => (
                  <div key={key}>
                    <span style={{ color: '#0ea5e9' }}>{key}</span>: {value};
                  </div>
                ))}
                {Object.keys(theme.css_variables).length > 5 && (
                  <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                    ... +{Object.keys(theme.css_variables).length - 5} more
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              {!theme.is_active && (
                <button
                  onClick={() => handleActivate(theme.id)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  적용하기
                </button>
              )}
              <button
                onClick={() => setPreviewTheme(theme)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(theme)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {!theme.is_active && (
                <button
                  onClick={() => handleDelete(theme.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 생성일 */}
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '12px'
            }}>
              생성일: {new Date(theme.created_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
        ))}
      </div>

      {/* 생성/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '24px'
            }}>
              {editingTheme ? '테마 수정' : '새 테마 추가'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  테마 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="예: Neobrutalism Blue"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  설명
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="테마에 대한 설명을 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  CSS 변수 *
                </label>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px'
                }}>
                  <strong>JSON 또는 CSS 형식 모두 가능:</strong><br/>
                  JSON: {`{ "--color-primary": "#2563eb" }`}<br/>
                  CSS: {`:root { --color-primary: #2563eb; }`}
                </div>
                <textarea
                  value={formData.css_variables}
                  onChange={(e) => setFormData({ ...formData, css_variables: e.target.value })}
                  required
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                  placeholder='{"--color-primary": "#2563eb", "--color-text": "#111827"}'
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: submitting ? '#94a3b8' : '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                  )}
                  {submitting
                    ? (editingTheme ? '수정 중...' : '추가 중...')
                    : (editingTheme ? '수정하기' : '추가하기')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewTheme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>
                {previewTheme.name}
              </h2>
              <button
                onClick={() => setPreviewTheme(null)}
                style={{
                  padding: '8px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <pre style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#475569',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(previewTheme.css_variables, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
