'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Plus, Trash2, Save } from 'lucide-react';

interface VendorFormatSetting {
  id: number;
  vendor_name: string;
  vendor_code: string;
  payment_date_header: string;
  order_number_header: string;
  buyer_name_header: string;
  buyer_phone_header: string;
  recipient_name_header: string;
  recipient_phone_header: string;
  address_header: string;
  delivery_message_header: string;
  option_name_header: string;
  quantity_header: string;
  special_request_header: string;
  courier_company_header: string;
  tracking_number_header: string;
  created_at?: string;
  updated_at?: string;
}

interface Partner {
  id: string;
  name: string;
  partner_type: string;
}

export default function VendorFormatSettingsPage() {
  const [vendors, setVendors] = useState<VendorFormatSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [vendorPartners, setVendorPartners] = useState<Partner[]>([]);
  const [hasModifications, setHasModifications] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    console.log('=== hasModifications 변경 ===', hasModifications);
  }, [hasModifications]);

  useEffect(() => {
    fetchVendors();
    fetchVendorPartners();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor-format-settings');
      const result = await response.json();

      if (result.success) {
        setVendors(result.data || []);
      } else {
        alert('벤더사 양식 설정 조회 실패: ' + result.error);
      }
    } catch (error) {
      console.error('벤더사 양식 설정 조회 오류:', error);
      alert('벤더사 양식 설정 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, partner_type')
        .eq('partner_type', '벤더사')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('벤더사 거래처 조회 오류:', error);
      } else {
        setVendorPartners(data || []);
      }
    } catch (error) {
      console.error('벤더사 거래처 조회 오류:', error);
    }
  };

  const handleDataChange = (newData: VendorFormatSetting[]) => {
    setVendors(newData);
  };

  const handleAddRow = () => {
    const newVendor: VendorFormatSetting = {
      id: Date.now(),
      vendor_name: '',
      vendor_code: '',
      payment_date_header: '',
      order_number_header: '',
      buyer_name_header: '',
      buyer_phone_header: '',
      recipient_name_header: '',
      recipient_phone_header: '',
      address_header: '',
      delivery_message_header: '',
      option_name_header: '',
      quantity_header: '',
      special_request_header: '',
      courier_company_header: '',
      tracking_number_header: '',
    };
    setVendors([...vendors, newVendor]);
  };

  const handleDeleteRows = async () => {
    if (selectedRows.length === 0) {
      alert('삭제할 벤더사를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.length}개의 벤더사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      for (const id of selectedRows) {
        const response = await fetch(`/api/vendor-format-settings?id=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!result.success) {
          alert('삭제 실패: ' + result.error);
          return;
        }
      }

      alert('삭제되었습니다.');
      setSelectedRows([]);
      fetchVendors();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (vendors.length === 0) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    try {
      const updates = [];
      const inserts = [];

      for (const vendor of vendors) {
        if (!vendor.vendor_name?.trim()) {
          alert('벤더사는 필수입니다.');
          return;
        }

        // id가 타임스탬프 형태면 신규, 아니면 수정
        if (vendor.id > 1000000000000) {
          inserts.push({
            vendor_name: vendor.vendor_name,
            vendor_code: vendor.vendor_code || '',
            payment_date_header: vendor.payment_date_header || '',
            order_number_header: vendor.order_number_header || '',
            buyer_name_header: vendor.buyer_name_header || '',
            buyer_phone_header: vendor.buyer_phone_header || '',
            recipient_name_header: vendor.recipient_name_header || '',
            recipient_phone_header: vendor.recipient_phone_header || '',
            address_header: vendor.address_header || '',
            delivery_message_header: vendor.delivery_message_header || '',
            option_name_header: vendor.option_name_header || '',
            quantity_header: vendor.quantity_header || '',
            special_request_header: vendor.special_request_header || '',
            courier_company_header: vendor.courier_company_header || '',
            tracking_number_header: vendor.tracking_number_header || '',
          });
        } else {
          updates.push(vendor);
        }
      }

      // 신규 추가
      for (const insert of inserts) {
        const response = await fetch('/api/vendor-format-settings', {
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
        const response = await fetch('/api/vendor-format-settings', {
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
      fetchVendors();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const columns = [
    {
      key: 'vendor_name',
      title: '벤더사',
      width: 120,
      type: 'dropdown' as const,
      source: vendorPartners.map(p => p.name),
    },
    {
      key: 'vendor_code',
      title: '거래처코드',
      width: 100,
    },
    {
      key: 'payment_date_header',
      title: '결제일',
      width: 100,
    },
    {
      key: 'order_number_header',
      title: '주문번호',
      width: 100,
    },
    {
      key: 'buyer_name_header',
      title: '주문자',
      width: 100,
    },
    {
      key: 'buyer_phone_header',
      title: '주문자전화번호',
      width: 120,
    },
    {
      key: 'recipient_name_header',
      title: '수령인',
      width: 100,
    },
    {
      key: 'recipient_phone_header',
      title: '수령인전화번호',
      width: 120,
    },
    {
      key: 'address_header',
      title: '주소',
      width: 100,
    },
    {
      key: 'delivery_message_header',
      title: '배송메세지',
      width: 100,
    },
    {
      key: 'option_name_header',
      title: '옵션명',
      width: 100,
    },
    {
      key: 'quantity_header',
      title: '수량',
      width: 80,
    },
    {
      key: 'special_request_header',
      title: '특이요청사항',
      width: 120,
    },
    {
      key: 'courier_company_header',
      title: '택배사',
      width: 100,
    },
    {
      key: 'tracking_number_header',
      title: '송장번호',
      width: 100,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">벤더사 양식 설정</h1>
        <p className="text-sm text-gray-600">
          벤더사별 엑셀 업로드 양식의 헤더명을 설정합니다.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      ) : (
        <EditableAdminGrid
          data={vendors}
          columns={columns}
          onDataChange={handleDataChange}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
