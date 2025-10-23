'use client';

import { Download, Upload } from 'lucide-react';

interface OrderActionButtonsProps {
  statusFilter: string | null;
  selectedOrders: number[];
  filteredOrders: any[];
  bulkApplyValue: string;
  courierList: string[];
  orders: any[];
  onPaymentConfirm: () => void;
  onOrderConfirm: () => void;
  onCancelApprove: () => void;
  onCancelReject: () => void;
  onCSModal: () => void;
  onAdditionalOrderModal: (orderData: any) => void;
  onBulkApplyChange: (value: string) => void;
  onBulkApply: () => void;
  onTrackingRegister: () => void;
  onTrackingUpdate: () => void;
  onTrackingRecall: () => void;
  onBulkInvoiceUpload: () => void;
  onBulkInvoiceUpdate: () => void;
  onVendorFileModal: () => void;
  onMarketInvoiceModal: () => void;
  onRegisterAsRegularCustomer: () => void;
  onRegisterAsMarketingCustomer: () => void;
}

export default function OrderActionButtons({
  statusFilter,
  selectedOrders,
  filteredOrders,
  bulkApplyValue,
  courierList,
  orders,
  onPaymentConfirm,
  onOrderConfirm,
  onCancelApprove,
  onCancelReject,
  onCSModal,
  onAdditionalOrderModal,
  onBulkApplyChange,
  onBulkApply,
  onTrackingRegister,
  onTrackingUpdate,
  onTrackingRecall,
  onBulkInvoiceUpload,
  onBulkInvoiceUpdate,
  onVendorFileModal,
  onMarketInvoiceModal,
  onRegisterAsRegularCustomer,
  onRegisterAsMarketingCustomer,
}: OrderActionButtonsProps) {

  const handleCSClick = () => {
    if (selectedOrders.length === 0) {
      alert('CS접수할 주문을 선택해주세요.');
      return;
    }
    if (selectedOrders.length > 1) {
      alert('CS 접수는 한 번에 하나의 주문만 처리할 수 있습니다.');
      return;
    }
    const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
    if (!selectedOrder) {
      alert('선택된 주문을 찾을 수 없습니다.');
      return;
    }
    if (selectedOrder.shipping_status !== '발송완료') {
      alert('CS접수는 발송완료 상태의 주문만 가능합니다.');
      return;
    }
    onCSModal();
  };

  const handleAdditionalOrderClick = () => {
    if (selectedOrders.length === 0) {
      alert('추가주문할 원주문을 선택해주세요.');
      return;
    }
    if (selectedOrders.length > 1) {
      alert('추가주문은 한 번에 하나의 주문만 처리할 수 있습니다.');
      return;
    }
    const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
    if (!selectedOrder) {
      alert('선택된 주문을 찾을 수 없습니다.');
      return;
    }
    onAdditionalOrderModal({
      ...selectedOrder,
      original_order_number: selectedOrder.order_number,
    });
  };

  return (
    <div className="flex items-center gap-12">
      {/* 상태별 액션 버튼 그룹 */}
      <div className="flex items-center gap-1">
        {statusFilter === '접수' && (
          <button
            onClick={onPaymentConfirm}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
          >
            입금확인
          </button>
        )}

        {statusFilter === '결제완료' && (
          <button
            onClick={onOrderConfirm}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
          >
            발주확인
          </button>
        )}

        {statusFilter === '취소요청' && (
          <>
            <button
              onClick={onCancelApprove}
              className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
            >
              취소승인
            </button>
            <button
              onClick={onCancelReject}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
            >
              취소반려
            </button>
          </>
        )}

        {(statusFilter === '발송완료' || !statusFilter) && (
          <button
            onClick={handleCSClick}
            className="px-2 py-1 bg-pink-600 text-white rounded text-xs font-medium hover:bg-pink-700"
          >
            CS접수
          </button>
        )}

        {(statusFilter === '결제완료' || statusFilter === '상품준비중' || statusFilter === '발송완료' || !statusFilter) && (
          <>
            <button
              onClick={handleAdditionalOrderClick}
              className="px-2 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700"
            >
              추가주문등록
            </button>
            <button
              onClick={onRegisterAsRegularCustomer}
              className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
            >
              단골등록
            </button>
            <button
              onClick={onRegisterAsMarketingCustomer}
              className="px-2 py-1 bg-pink-600 text-white rounded text-xs font-medium hover:bg-pink-700"
            >
              마케팅대상등록
            </button>
          </>
        )}
      </div>

      {/* 송장 관련 버튼 그룹 */}
      {(statusFilter === '상품준비중' || statusFilter === '발송완료') && (
        <>
          <div className="flex items-center gap-1">
            <select
              value={bulkApplyValue}
              onChange={(e) => onBulkApplyChange(e.target.value)}
              className="px-2 border border-gray-300 rounded text-xs h-[26px]"
              style={{ width: '100px' }}
            >
              <option value="">택배사 선택</option>
              {courierList.map(courier => (
                <option key={courier} value={courier}>{courier}</option>
              ))}
            </select>
            <button
              onClick={onBulkApply}
              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
            >
              일괄적용
            </button>

            {statusFilter !== '발송완료' && (
              <button
                onClick={onTrackingRegister}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
              >
                송장등록
              </button>
            )}

            {statusFilter === '발송완료' && (
              <>
                <button
                  onClick={onTrackingUpdate}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                  송장수정
                </button>
                <button
                  onClick={onTrackingRecall}
                  className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
                >
                  송장회수
                </button>
              </>
            )}

            {statusFilter !== '발송완료' && (
              <button
                onClick={onBulkInvoiceUpload}
                className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                송장일괄등록
              </button>
            )}

            {statusFilter === '발송완료' && (
              <button
                onClick={onBulkInvoiceUpdate}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                송장일괄수정
              </button>
            )}
          </div>

          {/* 다운로드 버튼 그룹 */}
          {statusFilter === '상품준비중' && (
            <div className="flex items-center gap-1">
              <button
                onClick={onVendorFileModal}
                disabled={orders.length === 0}
                className="px-2 py-1 bg-cyan-600 text-white rounded text-xs font-medium hover:bg-cyan-700 disabled:bg-gray-400 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                벤더사전송파일
              </button>
            </div>
          )}

          {statusFilter === '발송완료' && (
            <div className="flex items-center gap-1">
              <button
                onClick={onMarketInvoiceModal}
                disabled={orders.length === 0}
                className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                마켓송장파일
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
