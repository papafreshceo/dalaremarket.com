'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Copy, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import * as XLSX from 'xlsx';

interface ColumnMapping {
  order: number;
  header_name: string;
  field_type: 'db';
  db_field: string;
}

interface CourierTemplate {
  id: number;
  courier_name: string;
  template_name: string;
  columns: ColumnMapping[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 송장 업로드용 필드 (주문번호, 택배사, 송장번호만)
const invoiceFields = [
  { value: 'order_number', label: '주문번호' },
  { value: 'courier_company', label: '택배사' },
  { value: 'tracking_number', label: '송장번호' },
];

export default function CourierSettingsPage() {
  const [templates, setTemplates] = useState<CourierTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CourierTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');

  // 송장일괄등록 모달
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/courier-templates');
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

  const handleAddCourier = async () => {
    if (!newCourierName.trim()) {
      alert('택배사명을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/courier-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: newCourierName,
          template_name: newCourierName + ' 양식',
          columns: [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
        setSelectedTemplate(result.data);
        setNewCourierName('');
      } else {
        alert('택배사 추가 실패: ' + result.error);
      }
    } catch (error) {
      console.error('택배사 추가 오류:', error);
      alert('택배사 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCourier = async (id: number) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/courier-templates?id=${id}`, {
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
      const response = await fetch('/api/courier-templates', {
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
    };

    setSelectedTemplate({
      ...selectedTemplate,
      columns: [...selectedTemplate.columns, newColumn],
    });
  };

  const handleRemoveColumn = (index: number) => {
    if (!selectedTemplate) return;

    const newColumns = selectedTemplate.columns.filter((_, i) => i !== index);
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

    const defaultTemplate = templates.find(t => t.courier_name === '기본템플릿');
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

  // 송장일괄등록 - 파일 처리
  const handleUploadFile = async () => {
    if (!uploadFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 현재 주문 데이터 가져오기
        const ordersResponse = await fetch('/api/integrated-orders');
        const ordersResult = await ordersResponse.json();

        if (!ordersResult.success) {
          alert('주문 데이터 조회 실패');
          return;
        }

        const orders = ordersResult.data || [];

        // 엑셀 데이터 매칭 분석
        const uploadedOrders: any[] = [];
        const matchedOrders: any[] = [];
        const unmatchedOrders: any[] = [];
        const overwriteOrders: any[] = [];

        jsonData.forEach((row) => {
          const orderNumber = row['주문번호'] || row['order_number'];
          const courier = row['택배사'] || row['courier_company'];
          const tracking = row['송장번호'] || row['운송장번호'] || row['tracking_number'];

          if (orderNumber) {
            uploadedOrders.push({ orderNumber, courier, tracking });

            // 주문 매칭
            const matchedOrder = orders.find((o: any) => o.order_number === String(orderNumber).trim());

            if (matchedOrder) {
              if (matchedOrder.tracking_number) {
                // 이미 송장번호가 있는 경우
                overwriteOrders.push({
                  ...matchedOrder,
                  new_courier: courier,
                  new_tracking: tracking,
                  old_courier: matchedOrder.courier_company,
                  old_tracking: matchedOrder.tracking_number,
                });
              } else {
                // 송장번호가 없는 경우
                matchedOrders.push({
                  ...matchedOrder,
                  new_courier: courier,
                  new_tracking: tracking,
                });
              }
            } else {
              unmatchedOrders.push({ orderNumber, courier, tracking });
            }
          }
        });

        // 미리보기 데이터 설정
        setPreviewData({
          uploadedOrders,
          matchedOrders,
          unmatchedOrders,
          overwriteOrders,
        });

        setShowUploadModal(false);
        setShowPreviewModal(true);
      };

      reader.readAsBinaryString(uploadFile);
    } catch (error) {
      console.error('파일 처리 오류:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    }
  };

  // 송장일괄등록 - DB 업데이트 실행
  const executeInvoiceUpdate = async () => {
    if (!previewData) return;

    const { matchedOrders, overwriteOrders } = previewData;
    const allUpdates = [...matchedOrders, ...overwriteOrders];

    if (allUpdates.length === 0) {
      alert('업데이트할 주문이 없습니다.');
      return;
    }

    try {
      const updates = allUpdates.map((order: any) => ({
        id: order.id,
        courier_company: order.new_courier,
        tracking_number: order.new_tracking,
        shipping_status: '발송완료',
        shipped_date: new Date().toISOString().split('T')[0],
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문에 송장 정보가 업데이트되었습니다.`);
        setShowPreviewModal(false);
        setPreviewData(null);
        setUploadFile(null);
      } else {
        alert('업데이트 실패: ' + result.error);
      }
    } catch (error) {
      console.error('업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">택배사별 엑셀 양식 설정</h1>
            <p className="text-sm text-gray-600 mt-1">
              각 택배사별로 송장 엑셀 양식을 설정하고 일괄 업로드할 수 있습니다.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            송장일괄등록
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽: 택배사 목록 */}
          <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">택배사 목록</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCourierName}
                  onChange={(e) => setNewCourierName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCourier()}
                  placeholder="택배사명"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCourier}
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
                    <div className="font-medium text-gray-900">{template.courier_name}</div>
                    <div className="text-xs text-gray-500">{template.columns.length}개 컬럼</div>
                  </div>
                  {template.courier_name !== '기본템플릿' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourier(template.id);
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
                      {selectedTemplate.courier_name}
                    </h2>
                    <input
                      type="text"
                      value={selectedTemplate.template_name || ''}
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
                    {selectedTemplate.courier_name !== '기본템플릿' && (
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          매핑 필드
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
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
                                value={column.db_field}
                                onChange={(e) =>
                                  handleColumnChange(index, 'db_field', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">선택하세요</option>
                                {invoiceFields.map((field) => (
                                  <option key={field.value} value={field.value}>
                                    {field.label}
                                  </option>
                                ))}
                              </select>
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
                택배사를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 송장일괄등록 - 파일 선택 모달 */}
      {showUploadModal && (
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송장일괄등록</h3>
            <p className="text-sm text-gray-600 mb-4">
              엑셀 파일에 다음 컬럼이 포함되어야 합니다:<br />
              - 주문번호<br />
              - 택배사<br />
              - 송장번호 (또는 운송장번호)
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                엑셀 파일 선택
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleUploadFile}
                disabled={!uploadFile}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                미리보기
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 송장일괄등록 - 미리보기 모달 */}
      {showPreviewModal && previewData && (
        <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
          <div className="p-6 max-w-4xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송장일괄등록 미리보기</h3>

            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {/* 업로드 주문건 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  📤 업로드 주문건: {previewData.uploadedOrders.length}건
                </h4>
                {previewData.uploadedOrders.length > 0 && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {previewData.uploadedOrders.slice(0, 3).map((o: any, i: number) => (
                      <div key={i}>• {o.orderNumber}</div>
                    ))}
                    {previewData.uploadedOrders.length > 3 && (
                      <div>... 외 {previewData.uploadedOrders.length - 3}건</div>
                    )}
                  </div>
                )}
              </div>

              {/* 매칭완료 주문건 */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2">
                  ✅ 매칭완료 (신규등록): {previewData.matchedOrders.length}건
                </h4>
                {previewData.matchedOrders.length > 0 && (
                  <div className="text-xs text-gray-700 bg-green-50 p-2 rounded space-y-1">
                    {previewData.matchedOrders.slice(0, 5).map((o: any, i: number) => (
                      <div key={i}>
                        • {o.order_number} → {o.new_courier} / {o.new_tracking}
                      </div>
                    ))}
                    {previewData.matchedOrders.length > 5 && (
                      <div>... 외 {previewData.matchedOrders.length - 5}건</div>
                    )}
                  </div>
                )}
              </div>

              {/* 덮어쓰는 주문건 */}
              {previewData.overwriteOrders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-700 mb-2">
                    ⚠️ 기존 송장 덮어쓰기: {previewData.overwriteOrders.length}건
                  </h4>
                  <div className="text-xs text-gray-700 bg-orange-50 p-2 rounded space-y-1">
                    {previewData.overwriteOrders.slice(0, 5).map((o: any, i: number) => (
                      <div key={i}>
                        • {o.order_number}: {o.old_courier} / {o.old_tracking} → {o.new_courier} / {o.new_tracking}
                      </div>
                    ))}
                    {previewData.overwriteOrders.length > 5 && (
                      <div>... 외 {previewData.overwriteOrders.length - 5}건</div>
                    )}
                  </div>
                </div>
              )}

              {/* 미매칭 주문건 */}
              {previewData.unmatchedOrders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2">
                    ❌ 미매칭 (시스템에 없는 주문): {previewData.unmatchedOrders.length}건
                  </h4>
                  <div className="text-xs text-gray-700 bg-red-50 p-2 rounded space-y-1">
                    {previewData.unmatchedOrders.slice(0, 5).map((o: any, i: number) => (
                      <div key={i}>• {o.orderNumber}</div>
                    ))}
                    {previewData.unmatchedOrders.length > 5 && (
                      <div>... 외 {previewData.unmatchedOrders.length - 5}건</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                총 {previewData.matchedOrders.length + previewData.overwriteOrders.length}건이 업데이트됩니다.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={executeInvoiceUpdate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  확인 및 업데이트
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
