'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderItem {
  optionName: string;
  quantity: number;
  sellerSupplyPrice: number;
  // 제품 매핑 정보
  shippingSource?: string;
  invoiceIssuer?: string;
  vendorName?: string;
  matchStatus?: 'matched' | 'unmatched' | 'pending';
}

interface ProductMapping {
  id: number;
  option_name: string;
  shipping_source?: string;
  invoice_issuer?: string;
  vendor_name?: string;
  seller_supply_price?: number;
  shipping_cost?: number;
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
    { optionName: '', quantity: 1, sellerSupplyPrice: 0, matchStatus: 'pending' }
  ]);

  const [productMappings, setProductMappings] = useState<Map<string, ProductMapping>>(new Map());
  const [loading, setLoading] = useState(false);

  // 제품 매핑 데이터 로드
  useEffect(() => {
    loadProductMappings();
  }, []);

  const loadProductMappings = async () => {
    try {
      const response = await fetch('/api/product-mapping?limit=10000');
      const result = await response.json();

      if (result.success) {
        const mappingMap = new Map<string, ProductMapping>();
        result.data.forEach((mapping: ProductMapping) => {
          mappingMap.set(mapping.option_name.toLowerCase(), mapping);
        });
        setProductMappings(mappingMap);
      }
    } catch (error) {
      console.error('제품 매핑 로드 실패:', error);
    }
  };

  // 옵션명 입력 시 자동 매칭
  const handleOptionNameChange = (index: number, optionName: string) => {
    const newItems = [...items];
    newItems[index].optionName = optionName;

    // 매칭 시도
    if (optionName.trim()) {
      const mapping = productMappings.get(optionName.trim().toLowerCase());

      if (mapping) {
        // 매칭 성공
        newItems[index].matchStatus = 'matched';
        newItems[index].shippingSource = mapping.shipping_source;
        newItems[index].invoiceIssuer = mapping.invoice_issuer;
        newItems[index].vendorName = mapping.vendor_name;

        // 셀러공급가가 비어있으면 매핑 데이터 사용
        if (!newItems[index].sellerSupplyPrice && mapping.seller_supply_price) {
          newItems[index].sellerSupplyPrice = mapping.seller_supply_price * newItems[index].quantity;
        }
      } else {
        // 매칭 실패
        newItems[index].matchStatus = 'unmatched';
        newItems[index].shippingSource = undefined;
        newItems[index].invoiceIssuer = undefined;
        newItems[index].vendorName = undefined;
      }
    } else {
      newItems[index].matchStatus = 'pending';
    }

    setItems(newItems);
  };

  // 수량 변경 시 셀러공급가 재계산
  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    const item = newItems[index];

    // 매칭된 제품이 있으면 단가 * 수량으로 재계산
    const mapping = productMappings.get(item.optionName.trim().toLowerCase());
    if (mapping && mapping.seller_supply_price) {
      item.sellerSupplyPrice = mapping.seller_supply_price * quantity;
    }

    item.quantity = quantity;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { optionName: '', quantity: 1, sellerSupplyPrice: 0, matchStatus: 'pending' }]);
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
    setLoading(true);
    try {
      // 필수 필드 검증
      if (!orderData.marketName || !orderData.orderNumber || !orderData.recipientName) {
        alert('마켓명, 주문번호, 수취인명은 필수 항목입니다.');
        setLoading(false);
        return;
      }

      // 옵션명이 없는 항목 확인
      const invalidItems = items.filter(item => !item.optionName);
      if (invalidItems.length > 0) {
        alert('모든 상품의 옵션명을 입력해주세요.');
        setLoading(false);
        return;
      }

      // 매칭 실패 항목 확인
      const unmatchedCount = items.filter(item => item.matchStatus === 'unmatched').length;
      if (unmatchedCount > 0) {
        if (!confirm(`${unmatchedCount}개 상품이 매칭되지 않았습니다. 계속 진행하시겠습니까?`)) {
          setLoading(false);
          return;
        }
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
        shipping_source: item.shippingSource,
        invoice_issuer: item.invoiceIssuer,
        vendor_name: item.vendorName,
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
        setItems([{ optionName: '', quantity: 1, sellerSupplyPrice: 0, matchStatus: 'pending' }]);
      } else {
        console.error('저장 실패:', result.error);
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('주문 저장 실패:', error);
      alert('주문 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              마켓명 *
            </label>
            <select
              value={orderData.marketName}
              onChange={(e) => setOrderData({ ...orderData, marketName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결제일 *
            </label>
            <input
              type="date"
              value={orderData.paymentDate}
              onChange={(e) => setOrderData({ ...orderData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주문번호 *
            </label>
            <input
              type="text"
              value={orderData.orderNumber}
              onChange={(e) => setOrderData({ ...orderData, orderNumber: e.target.value })}
              placeholder="주문번호를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* 수취인 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">수취인 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수취인명 *
            </label>
            <input
              type="text"
              value={orderData.recipientName}
              onChange={(e) => setOrderData({ ...orderData, recipientName: e.target.value })}
              placeholder="수취인명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 *
            </label>
            <input
              type="tel"
              value={orderData.recipientPhone}
              onChange={(e) => setOrderData({ ...orderData, recipientPhone: e.target.value })}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소 *
            </label>
            <input
              type="text"
              value={orderData.recipientAddress}
              onChange={(e) => setOrderData({ ...orderData, recipientAddress: e.target.value })}
              placeholder="주소를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배송 메시지
            </label>
            <textarea
              value={orderData.deliveryMessage}
              onChange={(e) => setOrderData({ ...orderData, deliveryMessage: e.target.value })}
              placeholder="배송 메시지를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* 주문 상품 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">주문 상품</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            상품 추가
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex gap-3 items-start">
                {/* 매칭 상태 아이콘 */}
                <div className="mt-8">
                  {item.matchStatus === 'matched' && (
                    <CheckCircle className="w-5 h-5 text-green-600" title="제품 매칭 완료" />
                  )}
                  {item.matchStatus === 'unmatched' && (
                    <AlertCircle className="w-5 h-5 text-red-600" title="제품 매칭 실패" />
                  )}
                  {item.matchStatus === 'pending' && (
                    <div className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  {/* 첫 번째 줄: 옵션명, 수량, 셀러공급가 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        옵션명 *
                      </label>
                      <input
                        type="text"
                        value={item.optionName}
                        onChange={(e) => handleOptionNameChange(index, e.target.value)}
                        placeholder="옵션명"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        수량 *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        셀러공급가
                      </label>
                      <input
                        type="number"
                        value={item.sellerSupplyPrice}
                        onChange={(e) => updateItem(index, 'sellerSupplyPrice', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 두 번째 줄: 매칭된 정보 표시 */}
                  {item.matchStatus === 'matched' && (
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          출고처
                        </label>
                        <div className="text-sm text-gray-900">{item.shippingSource || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          송장주체
                        </label>
                        <div className="text-sm text-gray-900">{item.invoiceIssuer || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          벤더사
                        </label>
                        <div className="text-sm text-gray-900">{item.vendorName || '-'}</div>
                      </div>
                    </div>
                  )}

                  {item.matchStatus === 'unmatched' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-red-600">
                        ⚠️ 제품 매핑을 찾을 수 없습니다. 출고처, 송장주체, 벤더사 정보가 자동으로 입력되지 않습니다.
                      </div>
                    </div>
                  )}
                </div>

                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="mt-6 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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
              setItems([{ optionName: '', quantity: 1, sellerSupplyPrice: 0, matchStatus: 'pending' }]);
            }
          }}
          className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          초기화
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
