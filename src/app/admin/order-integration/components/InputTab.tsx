'use client';

import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';

interface OrderItem {
  optionName: string;
  quantity: number;
  sellerSupplyPrice: number;
}

export default function InputTab() {
  const [orderData, setOrderData] = useState({
    marketName: '',
    paymentDate: new Date().toISOString().split('T')[0],
    orderNumber: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    deliveryMessage: '',
  });

  const [items, setItems] = useState<OrderItem[]>([
    { optionName: '', quantity: 1, sellerSupplyPrice: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { optionName: '', quantity: 1, sellerSupplyPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    try {
      // 필수 필드 검증
      if (!orderData.marketName || !orderData.orderNumber || !orderData.recipientName) {
        alert('마켓명, 주문번호, 수취인명은 필수 항목입니다.');
        return;
      }

      // 옵션명이 없는 항목 확인
      const invalidItems = items.filter(item => !item.optionName);
      if (invalidItems.length > 0) {
        alert('모든 상품의 옵션명을 입력해주세요.');
        return;
      }

      // 각 항목을 개별 주문으로 저장
      const orders = items.map(item => ({
        market_name: orderData.marketName,
        payment_date: orderData.paymentDate,
        order_number: orderData.orderNumber,
        recipient_name: orderData.recipientName,
        recipient_phone: orderData.recipientPhone,
        recipient_address: orderData.recipientAddress,
        delivery_message: orderData.deliveryMessage,
        option_name: item.optionName,
        quantity: item.quantity,
        seller_supply_price: item.sellerSupplyPrice || null,
        sheet_date: new Date().toISOString().split('T')[0],
      }));

      // API 호출
      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`주문 ${result.count}건이 저장되었습니다.`);

        // 폼 초기화
        setOrderData({
          marketName: '',
          paymentDate: new Date().toISOString().split('T')[0],
          orderNumber: '',
          recipientName: '',
          recipientPhone: '',
          recipientAddress: '',
          deliveryMessage: '',
        });
        setItems([{ optionName: '', quantity: 1, sellerSupplyPrice: 0 }]);
      } else {
        console.error('저장 실패:', result.error);
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('주문 저장 실패:', error);
      alert('주문 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 기본 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text mb-4">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              마켓명 *
            </label>
            <select
              value={orderData.marketName}
              onChange={(e) => setOrderData({ ...orderData, marketName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">선택하세요</option>
              <option value="스마트스토어">스마트스토어</option>
              <option value="쿠팡">쿠팡</option>
              <option value="11번가">11번가</option>
              <option value="토스">토스</option>
              <option value="전화주문">전화주문</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              결제일 *
            </label>
            <input
              type="date"
              value={orderData.paymentDate}
              onChange={(e) => setOrderData({ ...orderData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              주문번호 *
            </label>
            <input
              type="text"
              value={orderData.orderNumber}
              onChange={(e) => setOrderData({ ...orderData, orderNumber: e.target.value })}
              placeholder="주문번호를 입력하세요"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>
      </div>

      {/* 수취인 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text mb-4">수취인 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              수취인명 *
            </label>
            <input
              type="text"
              value={orderData.recipientName}
              onChange={(e) => setOrderData({ ...orderData, recipientName: e.target.value })}
              placeholder="수취인명을 입력하세요"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              전화번호 *
            </label>
            <input
              type="tel"
              value={orderData.recipientPhone}
              onChange={(e) => setOrderData({ ...orderData, recipientPhone: e.target.value })}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              주소 *
            </label>
            <input
              type="text"
              value={orderData.recipientAddress}
              onChange={(e) => setOrderData({ ...orderData, recipientAddress: e.target.value })}
              placeholder="주소를 입력하세요"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              배송 메시지
            </label>
            <textarea
              value={orderData.deliveryMessage}
              onChange={(e) => setOrderData({ ...orderData, deliveryMessage: e.target.value })}
              placeholder="배송 메시지를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </div>

      {/* 주문 상품 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">주문 상품</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            상품 추가
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start p-3 border border-border rounded-lg bg-surface-secondary">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    옵션명 *
                  </label>
                  <input
                    type="text"
                    value={item.optionName}
                    onChange={(e) => updateItem(index, 'optionName', e.target.value)}
                    placeholder="옵션명"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    수량 *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    셀러공급가
                  </label>
                  <input
                    type="number"
                    value={item.sellerSupplyPrice}
                    onChange={(e) => updateItem(index, 'sellerSupplyPrice', parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="mt-6 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                  title="삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            if (confirm('입력한 내용을 초기화하시겠습니까?')) {
              setOrderData({
                marketName: '',
                paymentDate: new Date().toISOString().split('T')[0],
                orderNumber: '',
                recipientName: '',
                recipientPhone: '',
                recipientAddress: '',
                deliveryMessage: '',
              });
              setItems([{ optionName: '', quantity: 1, sellerSupplyPrice: 0 }]);
            }
          }}
          className="px-4 py-2 border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors"
        >
          초기화
        </button>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
    </div>
  );
}
