'use client';

import { useState, useEffect } from 'react';

interface ActionButton {
  id: string;
  label: string;
  credits: number;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  credits_required: number;
  is_active: boolean;
  is_premium: boolean;
  icon_gradient: string;
  display_order: number;
  billing_type?: string;
  billing_interval_minutes?: number;
  billing_description?: string;
  action_buttons?: ActionButton[];
}

export default function ToolsManagementPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 도구 목록 불러오기
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch('/api/admin/tools');
      const data = await response.json();

      if (data.success) {
        setTools(data.tools);
      } else {
        setError(data.error || 'Failed to load tools');
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
      setError('Network error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 필드 업데이트
  const updateTool = (toolId: string, field: keyof Tool, value: any) => {
    setTools(tools.map(tool =>
      tool.id === toolId ? { ...tool, [field]: value } : tool
    ));
    setHasChanges(true);
  };

  // 순서 이동
  const moveToolUp = (index: number) => {
    if (index === 0) return;

    const newTools = [...tools];
    const currentOrder = newTools[index].display_order;
    const prevOrder = newTools[index - 1].display_order;

    // display_order 값 교환
    newTools[index].display_order = prevOrder;
    newTools[index - 1].display_order = currentOrder;

    // 배열 순서도 교환
    [newTools[index], newTools[index - 1]] = [newTools[index - 1], newTools[index]];

    setTools(newTools);
    setHasChanges(true);
  };

  const moveToolDown = (index: number) => {
    if (index === tools.length - 1) return;

    const newTools = [...tools];
    const currentOrder = newTools[index].display_order;
    const nextOrder = newTools[index + 1].display_order;

    // display_order 값 교환
    newTools[index].display_order = nextOrder;
    newTools[index + 1].display_order = currentOrder;

    // 배열 순서도 교환
    [newTools[index], newTools[index + 1]] = [newTools[index + 1], newTools[index]];

    setTools(newTools);
    setHasChanges(true);
  };

  // 전체 저장
  const handleSaveAll = async () => {
    try {
      // 모든 도구 순차적으로 저장
      for (const tool of tools) {
        await fetch('/api/admin/tools', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tool),
        });
      }

      alert('모든 변경사항이 저장되었습니다.');
      setHasChanges(false);
      loadTools();
    } catch (error) {
      console.error('Error saving tools:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 한글 변환
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'essential': '핵심 도구',
      'data': '데이터 관리',
      'pricing': '가격 설정',
      'analytics': '분석 도구',
      'communication': '커뮤니케이션'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '16px',
          color: '#991b1b'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>오류 발생</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#6c757d', fontSize: '14px' }}>등록된 도구가 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            도구 관리
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            테이블에서 직접 수정하고 저장 버튼을 클릭하세요.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveAll}
            style={{
              padding: '8px 16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            💾 변경사항 저장
          </button>
        )}
      </div>

      {/* 도구 목록 테이블 */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        overflow: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '60px' }}>순서</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '80px' }}>이동</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', width: '150px' }}>도구명</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', width: '120px' }}>과금방식</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '100px' }}>크레딧</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '80px' }}>간격(분)</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '80px' }}>프리미엄</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '80px' }}>활성화</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '100px' }}>버튼설정</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool, index) => (
              <tr
                key={tool.id}
                style={{
                  borderBottom: index < tools.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                {/* 순서 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {tool.display_order}
                  </div>
                </td>

                {/* 이동 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button
                      onClick={() => moveToolUp(index)}
                      disabled={index === 0}
                      style={{
                        padding: '4px 8px',
                        background: index === 0 ? '#e5e7eb' : '#3b82f6',
                        color: index === 0 ? '#9ca3af' : '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                      title="위로 이동"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveToolDown(index)}
                      disabled={index === tools.length - 1}
                      style={{
                        padding: '4px 8px',
                        background: index === tools.length - 1 ? '#e5e7eb' : '#3b82f6',
                        color: index === tools.length - 1 ? '#9ca3af' : '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: index === tools.length - 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                      title="아래로 이동"
                    >
                      ▼
                    </button>
                  </div>
                </td>

                {/* 도구명 */}
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>
                    {tool.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    {getCategoryName(tool.category)}
                  </div>
                </td>

                {/* 과금방식 */}
                <td style={{ padding: '12px' }}>
                  <select
                    value={tool.billing_type || 'on_open'}
                    onChange={(e) => updateTool(tool.id, 'billing_type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: '#ffffff'
                    }}
                  >
                    <option value="on_open">열 때 차감</option>
                    <option value="on_action">버튼 클릭시</option>
                    <option value="hourly">시간당</option>
                  </select>
                </td>

                {/* 크레딧 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {tool.billing_type === 'on_action' ? (
                    <span style={{ fontSize: '11px', color: '#6c757d' }}>버튼별 설정</span>
                  ) : (
                    <input
                      type="number"
                      value={tool.credits_required}
                      onChange={(e) => updateTool(tool.id, 'credits_required', parseInt(e.target.value) || 0)}
                      style={{
                        width: '70px',
                        padding: '6px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                  )}
                </td>

                {/* 간격(분) */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {tool.billing_type === 'hourly' ? (
                    <input
                      type="number"
                      value={tool.billing_interval_minutes || 60}
                      onChange={(e) => updateTool(tool.id, 'billing_interval_minutes', parseInt(e.target.value) || 60)}
                      style={{
                        width: '60px',
                        padding: '6px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#d1d5db' }}>-</span>
                  )}
                </td>

                {/* 프리미엄 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={tool.is_premium}
                    onChange={(e) => updateTool(tool.id, 'is_premium', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>

                {/* 활성화 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={tool.is_active}
                    onChange={(e) => updateTool(tool.id, 'is_active', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>

                {/* 버튼설정 */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {tool.billing_type === 'on_action' && (
                    <button
                      onClick={() => setEditingToolId(tool.id)}
                      style={{
                        padding: '4px 12px',
                        background: '#f8f9fa',
                        color: '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      버튼 {(tool.action_buttons || []).length}개
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 버튼 설정 모달 */}
      {editingToolId && (
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
          zIndex: 10000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '700px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                실행 버튼 설정 - {tools.find(t => t.id === editingToolId)?.name}
              </h2>
              <button
                onClick={() => setEditingToolId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>

            {/* 모달 본문 */}
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '16px' }}>
                각 버튼별로 다른 크레딧을 설정할 수 있습니다. 버튼 ID는 개발자가 코드에서 사용하는 값입니다.
              </div>

              {(tools.find(t => t.id === editingToolId)?.action_buttons || []).map((button, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr auto',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                      버튼 ID
                    </label>
                    <input
                      type="text"
                      placeholder="예: integrate"
                      value={button.id}
                      onChange={(e) => {
                        const tool = tools.find(t => t.id === editingToolId);
                        if (!tool) return;
                        const newButtons = [...(tool.action_buttons || [])];
                        newButtons[index] = { ...button, id: e.target.value };
                        updateTool(editingToolId, 'action_buttons', newButtons);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                      버튼명
                    </label>
                    <input
                      type="text"
                      placeholder="예: 통합하기"
                      value={button.label}
                      onChange={(e) => {
                        const tool = tools.find(t => t.id === editingToolId);
                        if (!tool) return;
                        const newButtons = [...(tool.action_buttons || [])];
                        newButtons[index] = { ...button, label: e.target.value };
                        updateTool(editingToolId, 'action_buttons', newButtons);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                      크레딧
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={button.credits}
                      onChange={(e) => {
                        const tool = tools.find(t => t.id === editingToolId);
                        if (!tool) return;
                        const newButtons = [...(tool.action_buttons || [])];
                        newButtons[index] = { ...button, credits: parseInt(e.target.value) || 0 };
                        updateTool(editingToolId, 'action_buttons', newButtons);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                      min="0"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const tool = tools.find(t => t.id === editingToolId);
                      if (!tool) return;
                      const newButtons = (tool.action_buttons || []).filter((_, i) => i !== index);
                      updateTool(editingToolId, 'action_buttons', newButtons);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#dc3545',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginTop: '16px'
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  const tool = tools.find(t => t.id === editingToolId);
                  if (!tool) return;
                  const newButtons = [...(tool.action_buttons || []), { id: '', label: '', credits: 0 }];
                  updateTool(editingToolId, 'action_buttons', newButtons);
                }}
                style={{
                  padding: '10px 16px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + 버튼 추가
              </button>
            </div>

            {/* 모달 푸터 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setEditingToolId(null)}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
