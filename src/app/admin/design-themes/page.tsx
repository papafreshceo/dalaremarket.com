'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface DesignTheme {
  id: number;
  name: string;
  description?: string;
  css_variables: Record<string, string>;
  is_active: boolean;
  theme_scope: 'admin' | 'platform' | 'orders';
  created_at: string;
  updated_at: string;
}

type ThemeScope = 'admin' | 'platform' | 'orders';

const SCOPE_LABELS: Record<ThemeScope, string> = {
  admin: '관리자 페이지',
  platform: '플랫폼 페이지',
  orders: '발주 시스템'
};

export default function DesignThemesPage() {
  const [themes, setThemes] = useState<DesignTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [currentScope, setCurrentScope] = useState<ThemeScope>('admin');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme_scope: 'admin' as ThemeScope,
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

  const handleCreate = (scope: ThemeScope) => {
    setCurrentScope(scope);
    setEditingTheme(null);
    setFormData({
      name: '',
      description: '',
      theme_scope: scope,
      css_variables: JSON.stringify({
        '--primary': 'oklch(0.5 0.2 250)',
        '--background': 'oklch(1 0 0)',
        '--foreground': 'oklch(0 0 0)',
        '--radius': '8px'
      }, null, 2)
    });
    setShowModal(true);
  };

  const handleEdit = (theme: DesignTheme) => {
    setCurrentScope(theme.theme_scope);
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      theme_scope: theme.theme_scope,
      css_variables: JSON.stringify(theme.css_variables, null, 2)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      let cssVars;
      try {
        cssVars = JSON.parse(formData.css_variables);
      } catch {
        toast.error('JSON 형식이 올바르지 않습니다.');
        setSubmitting(false);
        return;
      }

      const url = editingTheme
        ? `/api/admin/design-themes/${editingTheme.id}`
        : '/api/admin/design-themes';

      const method = editingTheme ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          theme_scope: formData.theme_scope,
          css_variables: cssVars
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingTheme ? '테마가 수정되었습니다' : '테마가 생성되었습니다');
        setShowModal(false);
        setEditingTheme(null);
        await fetchThemes();
      } else {
        toast.error(result.error || '작업 실패');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('서버 요청 중 오류가 발생했습니다.');
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
        toast.success('테마가 삭제되었습니다');
        fetchThemes();
      } else {
        toast.error(result.error || '삭제 실패');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('테마 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleActivate = async (id: number, scope: ThemeScope) => {
    try {
      const response = await fetch(`/api/admin/design-themes/${id}/activate`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('테마가 활성화되었습니다');
        fetchThemes();
      } else {
        toast.error(result.error || '활성화 실패');
      }
    } catch (error) {
      console.error('Activate error:', error);
      toast.error('테마 활성화 중 오류가 발생했습니다.');
    }
  };

  const renderSection = (scope: ThemeScope) => {
    const scopedThemes = themes.filter(t => t.theme_scope === scope);
    const activeTheme = scopedThemes.find(t => t.is_active);

    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>
            {SCOPE_LABELS[scope]}
          </h2>
          <button
            onClick={() => handleCreate(scope)}
            style={{
              padding: '6px 12px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            테마 추가
          </button>
        </div>

        {/* 현재 활성 테마 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '8px',
          background: '#f9fafb',
          borderRadius: '6px'
        }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>현재 활성:</span>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>
            {activeTheme ? activeTheme.name : '없음'}
          </span>
        </div>

        {/* 테마 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scopedThemes.map((theme) => (
            <div
              key={theme.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: theme.is_active ? '#f0fdf4' : '#ffffff',
                border: theme.is_active ? '1px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {theme.is_active && (
                    <Check size={14} style={{ color: '#10b981' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    {theme.name}
                  </span>
                </div>
                {theme.description && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {theme.description}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {!theme.is_active && (
                  <button
                    onClick={() => handleActivate(theme.id, scope)}
                    style={{
                      padding: '4px 10px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    적용
                  </button>
                )}
                <button
                  onClick={() => handleEdit(theme)}
                  style={{
                    padding: '4px 10px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={12} />
                </button>
                {!theme.is_active && (
                  <button
                    onClick={() => handleDelete(theme.id)}
                    style={{
                      padding: '4px 10px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
        디자인 테마 관리
      </h1>

      {renderSection('admin')}
      {renderSection('platform')}
      {renderSection('orders')}

      {/* 모달 */}
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
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingTheme ? '테마 수정' : '테마 추가'} - {SCOPE_LABELS[currentScope]}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                  테마 이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '300px',
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                  설명
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '400px',
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                  CSS 변수 (JSON)
                </label>
                <textarea
                  value={formData.css_variables}
                  onChange={(e) => setFormData({ ...formData, css_variables: e.target.value })}
                  required
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '6px 12px',
                    background: submitting ? '#9ca3af' : '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? '처리 중...' : (editingTheme ? '수정' : '추가')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
