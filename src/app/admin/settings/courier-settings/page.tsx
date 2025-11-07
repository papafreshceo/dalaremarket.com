'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Copy, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import ExcelJS from 'exceljs';

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

interface VendorCourierDefault {
  id: number;
  vendor_name: string;
  default_courier: string;
  created_at: string;
  updated_at: string;
}

interface CourierSetting {
  id: number;
  courier_name: string;
  courier_header: string;
  order_number_header: string;
  tracking_number_header: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export default function CourierSettingsPage() {
  const [templates, setTemplates] = useState<CourierTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CourierTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');

  // courier_settings 관리
  const [courierSettings, setCourierSettings] = useState<CourierSetting[]>([]);
  const [newCourierSettingName, setNewCourierSettingName] = useState('');

  // 송장일괄등록 모달
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [columnValidation, setColumnValidation] = useState<{
    hasOrderNumber: boolean;
    hasCourier: boolean;
    hasTracking: boolean;
  } | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>('');

  // 벤더사별 기본 택배사 설정
  const [vendorDefaults, setVendorDefaults] = useState<VendorCourierDefault[]>([]);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCourier, setNewVendorCourier] = useState('');
  const [courierList, setCourierList] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchVendorDefaults();
    fetchCourierList();
    fetchCourierSettings();
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

  const fetchVendorDefaults = async () => {
    try {
      const response = await fetch('/api/vendor-courier-defaults');
      const data = await response.json();
      if (Array.isArray(data)) {
        setVendorDefaults(data);
      }
    } catch (error) {
      console.error('벤더 기본 택배사 조회 오류:', error);
    }
  };

  const fetchCourierList = async () => {
    try {
      const response = await fetch('/api/market-invoice-templates');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const couriers = result.data
          .map((item: any) => item.courier_name)
          .filter((name: string) => name && name.trim())
          .sort();
        setCourierList([...new Set(couriers)]);
      }
    } catch (error) {
      console.error('택배사 목록 조회 오류:', error);
    }
  };

  const fetchCourierSettings = async () => {
    try {
      const response = await fetch('/api/courier-settings');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // display_order로 정렬
        const sorted = result.data.sort((a: CourierSetting, b: CourierSetting) => {
          const orderA = a.display_order ?? a.id;
          const orderB = b.display_order ?? b.id;
          return orderA - orderB;
        });
        setCourierSettings(sorted);
      }
    } catch (error) {
      console.error('택배사 설정 조회 오류:', error);
    }
  };

  const handleAddCourierSetting = async () => {
    if (!newCourierSettingName.trim()) {
      alert('택배사명을 입력해주세요.');
      return;
    }

    try {
      // 현재 최대 display_order 찾기
      const maxOrder = courierSettings.reduce((max, s) => {
        const order = s.display_order ?? s.id;
        return order > max ? order : max;
      }, 0);

      const response = await fetch('/api/courier-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: newCourierSettingName.trim(),
          courier_header: '택배사',
          order_number_header: '주문번호',
          tracking_number_header: '송장번호',
          display_order: maxOrder + 1,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCourierSettings();
        setNewCourierSettingName('');
        alert('택배사가 추가되었습니다.');
      } else {
        alert('추가 실패: ' + result.error);
      }
    } catch (error) {
      console.error('택배사 추가 오류:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateCourierSetting = async (setting: CourierSetting) => {
    try {
      const response = await fetch('/api/courier-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCourierSettings();
        alert('수정되었습니다.');
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('택배사 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCourierSetting = async (id: number) => {
    if (!confirm('이 택배사 설정을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/courier-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCourierSettings();
        alert('삭제되었습니다.');
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('택배사 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleMoveCourierSetting = async (index: number, direction: 'up' | 'down') => {
    const newSettings = [...courierSettings];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSettings.length) return;

    // 스왑
    [newSettings[index], newSettings[targetIndex]] = [newSettings[targetIndex], newSettings[index]];

    // display_order 재설정
    const updatedSettings = newSettings.map((setting, idx) => ({
      ...setting,
      display_order: idx + 1
    }));

    setCourierSettings(updatedSettings);

    // 서버에 순서 업데이트
    try {
      await Promise.all(
        updatedSettings.map(setting =>
          fetch('/api/courier-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setting),
          })
        )
      );
    } catch (error) {
      console.error('순서 저장 오류:', error);
      alert('순서 저장 중 오류가 발생했습니다.');
      await fetchCourierSettings(); // 원래대로 되돌리기
    }
  };

  const handleAddVendorDefault = async () => {
    if (!newVendorName.trim() || !newVendorCourier.trim()) {
      alert('벤더사명과 기본 택배사를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/vendor-courier-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: newVendorName.trim(),
          default_courier: newVendorCourier.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        await fetchVendorDefaults();
        setNewVendorName('');
        setNewVendorCourier('');
        alert('벤더 기본 택배사 설정이 추가되었습니다.');
      } else {
        alert('추가 실패: ' + result.error);
      }
    } catch (error) {
      console.error('벤더 기본 택배사 추가 오류:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateVendorDefault = async (id: number, vendor_name: string, default_courier: string) => {
    try {
      const response = await fetch('/api/vendor-courier-defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, vendor_name, default_courier }),
      });

      const result = await response.json();
      if (response.ok) {
        await fetchVendorDefaults();
        alert('수정되었습니다.');
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('벤더 기본 택배사 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteVendorDefault = async (id: number) => {
    if (!confirm('이 벤더 기본 택배사 설정을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/vendor-courier-defaults?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await fetchVendorDefaults();
        alert('삭제되었습니다.');
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('벤더 기본 택배사 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
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

  // 송장일괄등록 - 파일 처리 및 칼럼 검증
  const handleUploadFile = async () => {
    if (!uploadFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData: any = {};
          const headers = worksheet.getRow(1).values as any[];
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
          }
        });

        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 1단계: 필수 칼럼 검증
        const firstRow = jsonData[0];
        const hasOrderNumber = !!(firstRow['주문번호'] || firstRow['order_number']);
        const hasCourier = !!(firstRow['택배사'] || firstRow['courier_company']);
        const hasTracking = !!(firstRow['송장번호'] || firstRow['운송장번호'] || firstRow['tracking_number']);

        setColumnValidation({ hasOrderNumber, hasCourier, hasTracking });

        // 택배사 칼럼이 없으면 여기서 멈추고 사용자에게 선택 요청
        if (!hasCourier) {
          console.log('택배사 칼럼이 없습니다. 사용자 선택 대기 중...');
          return;
        }

        // 모든 필수 칼럼이 있으면 바로 처리
        await processInvoiceData(jsonData);
      };

      reader.readAsArrayBuffer(uploadFile);
    } catch (error) {
      console.error('파일 처리 오류:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    }
  };

  // 송장 데이터 처리 (택배사 정보가 확정된 후)
  const processInvoiceData = async (jsonData: any[]) => {
    try {
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
        let courier = row['택배사'] || row['courier_company'];
        const tracking = row['송장번호'] || row['운송장번호'] || row['tracking_number'];

        // 택배사가 없으면 선택된 택배사 사용
        if (!courier && selectedCourier) {
          courier = selectedCourier;
        }

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
        validation: columnValidation,
      });

      setShowUploadModal(false);
      setShowPreviewModal(true);
      setColumnValidation(null); // 검증 상태 초기화
      setSelectedCourier(''); // 선택된 택배사 초기화
    } catch (error) {
      console.error('데이터 처리 오류:', error);
      alert('데이터 처리 중 오류가 발생했습니다.');
    }
  };

  // 택배사 선택 후 등록 버튼 클릭
  const handleRegisterWithSelectedCourier = async () => {
    if (!selectedCourier) {
      alert('택배사를 선택해주세요.');
      return;
    }

    if (!uploadFile) {
      alert('파일이 선택되지 않았습니다.');
      return;
    }

    // 파일 다시 읽어서 처리
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData: any = {};
          const headers = worksheet.getRow(1).values as any[];
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
          }
        });

        await processInvoiceData(jsonData);
      };

      reader.readAsArrayBuffer(uploadFile);
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
          {/* 맨 왼쪽: 택배사 기본 설정 (드롭다운용) */}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">택배사 목록</h2>
            <p className="text-xs text-gray-600 mb-4">
              드롭다운에 표시될 택배사
            </p>

            {/* 추가 폼 */}
            <div className="mb-4">
              <input
                type="text"
                value={newCourierSettingName}
                onChange={(e) => setNewCourierSettingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCourierSetting()}
                placeholder="택배사명"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <button
                onClick={handleAddCourierSetting}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            {/* 택배사 목록 */}
            <div className="space-y-1 max-h-[700px] overflow-y-auto">
              {courierSettings.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  택배사 없음
                </div>
              ) : (
                courierSettings.map((setting, index) => (
                  <div key={setting.id} className="flex items-center gap-1 p-2 bg-gray-50 rounded hover:bg-gray-100">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveCourierSetting(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveCourierSetting(index, 'down')}
                        disabled={index === courierSettings.length - 1}
                        className="p-0.5 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={setting.courier_name}
                      onChange={(e) => {
                        const updated = courierSettings.map(s =>
                          s.id === setting.id ? { ...s, courier_name: e.target.value } : s
                        );
                        setCourierSettings(updated);
                      }}
                      onBlur={() => handleUpdateCourierSetting(setting)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleDeleteCourierSetting(setting.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 중간: 엑셀 양식 템플릿 목록 */}
          <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">엑셀 양식 템플릿</h2>
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
          <div className="col-span-7 bg-white rounded-lg border border-gray-200 p-6">
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

        {/* 벤더사별 기본 택배사 설정 */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">벤더사별 기본 택배사 설정</h2>
          <p className="text-sm text-gray-600 mb-4">
            엑셀 파일에 택배사 칼럼이 없을 경우 자동으로 적용될 벤더사별 기본 택배사를 설정합니다.
          </p>

          {/* 추가 폼 */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              placeholder="벤더사명"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newVendorCourier}
              onChange={(e) => setNewVendorCourier(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">기본 택배사 선택</option>
              {courierList.map((courier) => (
                <option key={courier} value={courier}>
                  {courier}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddVendorDefault}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>

          {/* 벤더 목록 테이블 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    벤더사명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    기본 택배사
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendorDefaults.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      등록된 벤더 기본 택배사 설정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  vendorDefaults.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={vendor.vendor_name}
                          onChange={(e) => {
                            const newVendors = vendorDefaults.map(v =>
                              v.id === vendor.id ? { ...v, vendor_name: e.target.value } : v
                            );
                            setVendorDefaults(newVendors);
                          }}
                          onBlur={() => handleUpdateVendorDefault(vendor.id, vendor.vendor_name, vendor.default_courier)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={vendor.default_courier}
                          onChange={(e) => {
                            const newVendors = vendorDefaults.map(v =>
                              v.id === vendor.id ? { ...v, default_courier: e.target.value } : v
                            );
                            setVendorDefaults(newVendors);
                            handleUpdateVendorDefault(vendor.id, vendor.vendor_name, e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택하세요</option>
                          {courierList.map((courier) => (
                            <option key={courier} value={courier}>
                              {courier}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteVendorDefault(vendor.id)}
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

          {/* 설명 박스 */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">택배사 우선순위</h3>
            <div className="text-sm text-yellow-800">
              1️⃣ <strong>Excel 칼럼</strong>: 엑셀 파일에 택배사 정보가 있으면 우선 사용<br />
              2️⃣ <strong>UI 선택</strong>: 파일 업로드 시 수동으로 선택한 택배사<br />
              3️⃣ <strong>벤더 기본값</strong>: 위 설정표의 벤더사별 기본 택배사<br />
              <span className="text-xs text-yellow-600">※ 모두 없는 경우 택배사 정보가 빈 값으로 저장됩니다</span>
            </div>
          </div>
        </div>
      </div>

      {/* 송장일괄등록 - 파일 선택 모달 */}
      {showUploadModal && (
        <Modal isOpen={showUploadModal} onClose={() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setColumnValidation(null);
          setSelectedCourier('');
        }}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송장일괄등록</h3>
            <p className="text-sm text-gray-600 mb-4">
              엑셀 파일에 다음 3개 컬럼이 필수입니다:<br />
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
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setColumnValidation(null);
                  setSelectedCourier('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 칼럼 검증 결과 표시 */}
            {columnValidation && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">필수 칼럼 검증 결과</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {columnValidation.hasOrderNumber ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-red-600">❌</span>
                    )}
                    <span className={columnValidation.hasOrderNumber ? 'text-green-700' : 'text-red-700'}>
                      주문번호
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {columnValidation.hasCourier ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-orange-600">⚠️</span>
                    )}
                    <span className={columnValidation.hasCourier ? 'text-green-700' : 'text-orange-700'}>
                      택배사 {!columnValidation.hasCourier && '(아래에서 선택 필요)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {columnValidation.hasTracking ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-red-600">❌</span>
                    )}
                    <span className={columnValidation.hasTracking ? 'text-green-700' : 'text-red-700'}>
                      송장번호
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 택배사 칼럼이 없을 경우 선택 UI */}
            {columnValidation && !columnValidation.hasCourier && columnValidation.hasOrderNumber && columnValidation.hasTracking && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-900 mb-3">
                  ⚠️ 택배사 정보가 없습니다
                </h4>
                <p className="text-xs text-orange-700 mb-3">
                  택배사를 선택하면 모든 주문에 동일한 택배사가 적용됩니다.
                </p>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">택배사를 선택하세요</option>
                  {courierList.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 에러 메시지 */}
            {columnValidation && (!columnValidation.hasOrderNumber || !columnValidation.hasTracking) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-900 mb-2">❌ 필수 칼럼 누락</h4>
                <p className="text-xs text-red-700">
                  주문번호와 송장번호는 필수 칼럼입니다. 엑셀 파일을 확인해주세요.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setColumnValidation(null);
                  setSelectedCourier('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>

              {/* 검증 전 또는 모든 칼럼 있을 때: 미리보기 버튼 */}
              {!columnValidation && (
                <button
                  onClick={handleUploadFile}
                  disabled={!uploadFile}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  검증 및 미리보기
                </button>
              )}

              {/* 택배사만 없을 때: 등록하기 버튼 */}
              {columnValidation && !columnValidation.hasCourier && columnValidation.hasOrderNumber && columnValidation.hasTracking && (
                <button
                  onClick={handleRegisterWithSelectedCourier}
                  disabled={!selectedCourier}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                >
                  등록하기
                </button>
              )}
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
