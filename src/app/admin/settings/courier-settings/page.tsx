'use client';

import { useState, useEffect } from 'react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Plus, Trash2, Save } from 'lucide-react';

interface CourierSetting {
  id: number;
  courier_name: string;
  courier_header: string;
  order_number_header: string;
  tracking_number_header: string;
  created_at?: string;
  updated_at?: string;
}

export default function CourierSettingsPage() {
  const [couriers, setCouriers] = useState<CourierSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [hasModifications, setHasModifications] = useState(false);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courier-settings');
      const result = await response.json();

      if (result.success) {
        setCouriers(result.data || []);
      } else {
        alert('택배사 설정 조회 실패: ' + result.error);
      }
    } catch (error) {
      console.error('택배사 설정 조회 오류:', error);
      alert('택배사 설정 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (newData: CourierSetting[]) => {
    setCouriers(newData);
  };

  const handleAddRow = () => {
    const newCourier: CourierSetting = {
      id: Date.now(),
      courier_name: '',
      courier_header: '',
      order_number_header: '',
      tracking_number_header: '',
    };
    setCouriers([...couriers, newCourier]);
  };

  const handleDeleteRows = async () => {
    if (selectedRows.length === 0) {
      alert('삭제할 택배사를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.length}개의 택배사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/courier-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRows }),
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제되었습니다.');
        setSelectedRows([]);
        fetchCouriers();
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (couriers.length === 0) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    try {
      const updates = [];
      const inserts = [];

      for (const courier of couriers) {
        if (!courier.courier_name?.trim()) {
          alert('택배사명은 필수입니다.');
          return;
        }

        // id가 타임스탬프 형태면 신규, 아니면 수정
        if (courier.id > 1000000000000) {
          inserts.push({
            courier_name: courier.courier_name,
            courier_header: courier.courier_header || '',
            order_number_header: courier.order_number_header || '',
            tracking_number_header: courier.tracking_number_header || '',
          });
        } else {
          updates.push(courier);
        }
      }

      // 신규 추가
      for (const insert of inserts) {
        const response = await fetch('/api/courier-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insert),
        });

        const result = await response.json();
        if (!result.success) {
          alert('저장 실패: ' + result.error);
          return;
        }
      }

      // 수정
      for (const update of updates) {
        const response = await fetch('/api/courier-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });

        const result = await response.json();
        if (!result.success) {
          alert('저장 실패: ' + result.error);
          return;
        }
      }

      alert('저장되었습니다.');
      fetchCouriers();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const columns = [
    {
      key: 'courier_name',
      title: '택배사명',
      width: 200,
    },
    {
      key: 'courier_header',
      title: '택배사 헤더명',
      width: 200,
    },
    {
      key: 'order_number_header',
      title: '주문번호 헤더명',
      width: 200,
    },
    {
      key: 'tracking_number_header',
      title: '송장번호 헤더명',
      width: 200,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">택배사 설정</h1>
        <p className="text-sm text-gray-600">
          택배사별 엑셀 파일의 헤더명을 설정합니다.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : (
        <EditableAdminGrid
          data={couriers}
          columns={columns}
          onDataChange={handleDataChange}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
