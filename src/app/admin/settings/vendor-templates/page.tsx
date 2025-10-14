'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Copy, Download, ArrowUp, ArrowDown } from 'lucide-react';

interface ColumnMapping {
  order: number;
  header_name: string;
  field_type: 'db' | 'fixed' | 'empty';  // db: DB필드, fixed: 고정값, empty: 빈칸
  db_field: string;
  fixed_value?: string;  // 고정값인 경우 사용
  transform: string | null;
}

interface VendorTemplate {
  id: number;
  vendor_name: string;
  template_name: string;
  columns: ColumnMapping[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StandardField {
  value: string;
  label: string;
}

export default function VendorTemplatesPage() {
  const [templates, setTemplates] = useState<VendorTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VendorTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [standardFields, setStandardFields] = useState<StandardField[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchStandardFields();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/vendor-templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
        if (result.data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(result.data[0]);
        }
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardFields = async () => {
    try {
      console.log('표준필드 API 호출 시작');
      const response = await fetch('/api/standard-fields');
      console.log('표준필드 API 응답 상태:', response.status);
      const result = await response.json();
      console.log('표준필드 API 응답 데이터:', result);
      if (result.success) {
        console.log('표준필드 설정:', result.data);
        setStandardFields(result.data);
      } else {
        console.error('표준필드 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('표준필드 조회 오류:', error);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) {
      alert('벤더사명을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/vendor-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: newVendorName,
          template_name: newVendorName + ' 양식',
          columns: [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
        setSelectedTemplate(result.data);
        setNewVendorName('');
      } else {
        alert('벤더사 추가 실패: ' + result.error);
      }
    } catch (error) {
      console.error('벤더사 추가 오류:', error);
      alert('벤더사 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/vendor-templates?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(templates[0] || null);
        }
      } else {
        alert('템플릿 삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const response = await fetch('/api/vendor-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate),
      });

      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        await fetchTemplates();
      } else {
        alert('저장 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddColumn = () => {
    if (!selectedTemplate) return;

    const newColumn: ColumnMapping = {
      order: selectedTemplate.columns.length + 1,
      header_name: '',
      field_type: 'db',
      db_field: '',
      fixed_value: '',
      transform: null,
    };

    setSelectedTemplate({
      ...selectedTemplate,
      columns: [...selectedTemplate.columns, newColumn],
    });
  };

  const handleRemoveColumn = (index: number) => {
    if (!selectedTemplate) return;

    const newColumns = selectedTemplate.columns.filter((_, i) => i !== index);
    // 순서 재조정
    newColumns.forEach((col, i) => {
      col.order = i + 1;
    });

    setSelectedTemplate({
      ...selectedTemplate,
      columns: newColumns,
    });
  };

  const handleColumnChange = (index: number, field: keyof ColumnMapping, value: any) => {
    if (!selectedTemplate) return;

    const newColumns = [...selectedTemplate.columns];
    newColumns[index] = {
      ...newColumns[index],
      [field]: value,
    };

    setSelectedTemplate({
      ...selectedTemplate,
      columns: newColumns,
    });
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    if (!selectedTemplate) return;

    const newColumns = [...selectedTemplate.columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];

    // 순서 재조정
    newColumns.forEach((col, i) => {
      col.order = i + 1;
    });

    setSelectedTemplate({
      ...selectedTemplate,
      columns: newColumns,
    });
  };

  const handleCopyFromDefault = async () => {
    if (!selectedTemplate) return;

    const defaultTemplate = templates.find(t => t.vendor_name === '기본템플릿');
    if (!defaultTemplate) {
      alert('기본 템플릿을 찾을 수 없습니다.');
      return;
    }

    if (!confirm('기본 템플릿의 컬럼 설정을 복사하시겠습니까?\n현재 설정은 덮어씌워집니다.')) return;

    setSelectedTemplate({
      ...selectedTemplate,
      columns: JSON.parse(JSON.stringify(defaultTemplate.columns)),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">벤더사별 엑셀 양식 설정</h1>
          <p className="text-sm text-gray-600 mt-1">
            각 벤더사별로 원하는 엑셀 양식을 설정할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽: 벤더사 목록 */}
          <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">벤더사 목록</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVendor()}
                  placeholder="벤더사명"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddVendor}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{template.vendor_name}</div>
                    <div className="text-xs text-gray-500">{template.columns.length}개 컬럼</div>
                  </div>
                  {template.vendor_name !== '기본템플릿' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVendor(template.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 컬럼 매핑 설정 */}
          <div className="col-span-9 bg-white rounded-lg border border-gray-200 p-6">
            {selectedTemplate ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTemplate.vendor_name}
                    </h2>
                    <input
                      type="text"
                      value={selectedTemplate.template_name}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          template_name: e.target.value,
                        })
                      }
                      className="mt-2 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="템플릿 이름"
                    />
                  </div>
                  <div className="flex gap-2">
                    {selectedTemplate.vendor_name !== '기본템플릿' && (
                      <button
                        onClick={handleCopyFromDefault}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        기본템플릿 복사
                      </button>
                    )}
                    <button
                      onClick={handleSaveTemplate}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    컬럼 추가
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">
                          순번
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          엑셀 헤더명
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
                          필드 타입
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          값 설정
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
                          순서
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                          삭제
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTemplate.columns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            컬럼을 추가해주세요.
                          </td>
                        </tr>
                      ) : (
                        selectedTemplate.columns.map((column, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{column.order}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={column.header_name}
                                onChange={(e) =>
                                  handleColumnChange(index, 'header_name', e.target.value)
                                }
                                placeholder="예: 주문번호"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={column.field_type || 'db'}
                                onChange={(e) => {
                                  handleColumnChange(index, 'field_type', e.target.value);
                                  // 타입 변경 시 관련 필드 초기화
                                  if (e.target.value === 'empty') {
                                    handleColumnChange(index, 'db_field', '');
                                    handleColumnChange(index, 'fixed_value', '');
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="db">DB필드</option>
                                <option value="fixed">고정값</option>
                                <option value="empty">빈칸</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              {(column.field_type || 'db') === 'db' && (
                                <select
                                  value={column.db_field}
                                  onChange={(e) =>
                                    handleColumnChange(index, 'db_field', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">선택하세요</option>
                                  {standardFields.map((field) => (
                                    <option key={field.value} value={field.value}>
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {(column.field_type || 'db') === 'fixed' && (
                                <input
                                  type="text"
                                  value={column.fixed_value || ''}
                                  onChange={(e) =>
                                    handleColumnChange(index, 'fixed_value', e.target.value)
                                  }
                                  placeholder="예: 달래마켓"
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                              {(column.field_type || 'db') === 'empty' && (
                                <div className="text-sm text-gray-500 px-3 py-2 italic">
                                  빈 값으로 출력됩니다
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMoveColumn(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleMoveColumn(index, 'down')}
                                  disabled={index === selectedTemplate.columns.length - 1}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleRemoveColumn(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedTemplate.columns.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">미리보기</h3>
                    <div className="text-sm text-blue-800">
                      엑셀 헤더:{' '}
                      <span className="font-mono">
                        {selectedTemplate.columns
                          .map((col) => col.header_name || '(비어있음)')
                          .join(' | ')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                벤더사를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
