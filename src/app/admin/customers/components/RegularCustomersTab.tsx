'use client';

import { useState, useEffect } from 'react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal, Button } from '@/components/ui';

interface Customer {
  id: string;
  name: string;
  phone: string;
  customer_types: string[]; // 배열로 변경
  recipient_name?: string;
  recipient_phone?: string;
  zonecode?: string;
  road_address?: string;
  jibun_address?: string;
  ordered_products?: string;
  memo?: string;
  total_orders: number;
  total_amount: number;
  last_order_date?: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  recipient_name: string;
  option_name: string;
  settlement_amount?: string;
  shipping_status: string;
  created_at: string;
}

export default function RegularCustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 신규 고객 등록 폼
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    recipient_name: '',
    recipient_phone: '',
    zonecode: '',
    road_address: '',
    jibun_address: '',
    memo: '',
  });

  // 고객 목록 조회
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        customerType: 'regular',
      });

      if (searchKeyword) {
        params.append('searchKeyword', searchKeyword);
      }

      const response = await fetch(`/api/customers?${params}`);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
      } else {
        alert('고객 조회 실패: ' + result.error);
      }
    } catch (error) {
      console.error('고객 조회 오류:', error);
      alert('고객 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 검색
  const handleSearch = () => {
    fetchCustomers();
  };

  // 신규 고객 추가
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          customer_types: ['regular'], // 배열로 전송
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('고객이 등록되었습니다.');
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          recipient_name: '',
          recipient_phone: '',
          zonecode: '',
          road_address: '',
          jibun_address: '',
          memo: '',
        });
        fetchCustomers();
      } else {
        alert('고객 등록 실패: ' + result.error);
      }
    } catch (error) {
      console.error('고객 등록 오류:', error);
      alert('고객 등록 중 오류가 발생했습니다.');
    }
  };

  // 고객 수정
  const handleSave = async (modifiedRows: Customer[]) => {
    if (modifiedRows.length === 0) return;

    try {
      for (const customer of modifiedRows) {
        const response = await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });

        const result = await response.json();
        if (!result.success) {
          alert(`고객 수정 실패 (${customer.name}): ${result.error}`);
          return;
        }
      }

      alert(`${modifiedRows.length}건의 고객 정보가 수정되었습니다.`);
      fetchCustomers();
    } catch (error) {
      console.error('고객 수정 오류:', error);
      alert('고객 수정 중 오류가 발생했습니다.');
    }
  };

  // 고객 삭제
  const handleDelete = async (indices: number[]) => {
    if (!confirm(`${indices.length}건의 고객을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      for (const index of indices) {
        const customer = customers[index];
        const response = await fetch(`/api/customers?id=${customer.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        if (!result.success) {
          alert(`고객 삭제 실패 (${customer.name}): ${result.error}`);
          return;
        }
      }

      alert(`${indices.length}건의 고객이 삭제되었습니다.`);
      fetchCustomers();
    } catch (error) {
      console.error('고객 삭제 오류:', error);
      alert('고객 삭제 중 오류가 발생했습니다.');
    }
  };

  // 주문 이력 조회
  const handleViewOrderHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowOrderHistoryModal(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}/orders`);
      const result = await response.json();

      if (result.success) {
        setOrderHistory(result.data.orders);
      } else {
        alert('주문 이력 조회 실패: ' + result.error);
      }
    } catch (error) {
      console.error('주문 이력 조회 오류:', error);
      alert('주문 이력 조회 중 오류가 발생했습니다.');
    }
  };

  // 주소 검색 (Daum Postcode API)
  const handleAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        let roadAddressWithBuilding = data.roadAddress;
        if (data.buildingName) {
          roadAddressWithBuilding += ` (${data.buildingName})`;
        }

        setNewCustomer((prev) => ({
          ...prev,
          zonecode: data.zonecode,
          road_address: roadAddressWithBuilding,
          jibun_address: data.jibunAddress,
        }));
      },
    }).open();
  };

  const columns = [
    { key: 'name', title: '이름', width: 100 },
    { key: 'phone', title: '전화번호', width: 120 },
    { key: 'recipient_name', title: '수령인명', width: 100 },
    { key: 'recipient_phone', title: '수령인연락처', width: 120 },
    { key: 'road_address', title: '배송지주소', width: 250 },
    {
      key: 'total_orders',
      title: '총주문수',
      width: 80,
      readOnly: true,
      align: 'center' as const,
    },
    {
      key: 'total_amount',
      title: '총주문금액',
      width: 100,
      readOnly: true,
      align: 'right' as const,
      renderer: (value: number) => {
        return value?.toLocaleString() || '0';
      },
    },
    {
      key: 'last_order_date',
      title: '최근주문일',
      width: 100,
      readOnly: true,
      renderer: (value: string) => {
        return value ? new Date(value).toLocaleDateString('ko-KR') : '-';
      },
    },
    {
      key: 'ordered_products',
      title: '주문상품',
      width: 300,
      readOnly: true,
    },
    { key: 'memo', title: '메모', width: 200 },
    {
      key: 'actions',
      title: '주문이력',
      width: 100,
      readOnly: true,
      renderer: (_: any, row: Customer) => {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrderHistory(row);
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            주문이력보기
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      {/* 검색 및 추가 버튼 */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="이름, 전화번호 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="px-3 py-2 border border-gray-300 rounded flex-1"
        />
        <Button onClick={handleSearch}>검색</Button>
        <Button onClick={() => setShowAddModal(true)}>+ 단골고객 추가</Button>
      </div>

      {/* 고객 목록 테이블 */}
      {loading ? (
        <div className="text-center py-10">로딩 중...</div>
      ) : (
        <EditableAdminGrid
          data={customers}
          columns={columns}
          onSave={handleSave}
          onDeleteSelected={handleDelete}
          height="700px"
          enableAddRow={false}
          enableCSVImport={false}
        />
      )}

      {/* 신규 고객 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="단골고객 추가"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이름 *</label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">전화번호 *</label>
            <input
              type="text"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">배송지 정보</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">수령인명</label>
                <input
                  type="text"
                  value={newCustomer.recipient_name}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      recipient_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">수령인연락처</label>
                <input
                  type="text"
                  value={newCustomer.recipient_phone}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      recipient_phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주소</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCustomer.zonecode}
                    readOnly
                    placeholder="우편번호"
                    className="w-24 px-3 py-2 border border-gray-300 rounded bg-gray-50"
                  />
                  <Button onClick={handleAddressSearch}>주소 검색</Button>
                </div>
                <input
                  type="text"
                  value={newCustomer.road_address}
                  readOnly
                  placeholder="도로명주소"
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">메모</label>
            <textarea
              value={newCustomer.memo}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, memo: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setShowAddModal(false)} className="bg-gray-500">
              취소
            </Button>
            <Button onClick={handleAddCustomer}>등록</Button>
          </div>
        </div>
      </Modal>

      {/* 주문 이력 모달 */}
      <Modal
        isOpen={showOrderHistoryModal}
        onClose={() => setShowOrderHistoryModal(false)}
        title={`주문 이력 - ${selectedCustomer?.name || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">총 주문 수:</span>{' '}
                <span className="font-semibold">{selectedCustomer?.total_orders || 0}건</span>
              </div>
              <div>
                <span className="text-gray-600">총 주문 금액:</span>{' '}
                <span className="font-semibold">
                  {(selectedCustomer?.total_amount || 0).toLocaleString()}원
                </span>
              </div>
              <div>
                <span className="text-gray-600">최근 주문일:</span>{' '}
                <span className="font-semibold">
                  {selectedCustomer?.last_order_date
                    ? new Date(selectedCustomer.last_order_date).toLocaleDateString('ko-KR')
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            {orderHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-10">주문 이력이 없습니다.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">주문번호</th>
                    <th className="px-4 py-2 text-left">수령인</th>
                    <th className="px-4 py-2 text-left">상품명</th>
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-center">상태</th>
                    <th className="px-4 py-2 text-center">주문일</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{order.order_number}</td>
                      <td className="px-4 py-2">{order.recipient_name}</td>
                      <td className="px-4 py-2">{order.option_name}</td>
                      <td className="px-4 py-2 text-right">
                        {order.settlement_amount ? Number(order.settlement_amount).toLocaleString() : '0'}원
                      </td>
                      <td className="px-4 py-2 text-center">{order.shipping_status}</td>
                      <td className="px-4 py-2 text-center">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
