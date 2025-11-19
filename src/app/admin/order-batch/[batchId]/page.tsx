'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Package, Calendar, User, DollarSign } from 'lucide-react';

interface Order {
  id: number;
  order_number?: string;
  organization_id?: string;
  sub_account_name?: string;
  option_name: string;
  quantity: string;
  seller_supply_price?: string;
  product_amount?: string;
  discount_amount?: string;
  cash_used?: string;
  final_deposit_amount?: string;
  shipping_status?: string;
  created_at: string;
}

export default function OrderBatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState('');
  const [batchDate, setBatchDate] = useState('');

  useEffect(() => {
    fetchBatchOrders();
  }, [batchId]);

  async function fetchBatchOrders() {
    try {
      const supabase = createClient();

      // 배치 주문 조회
      const { data: ordersData, error } = await supabase
        .from('integrated_orders')
        .select('*')
        .eq('batch_id', batchId)
        .order('id', { ascending: true });

      if (error) {
        console.error('주문 조회 실패:', error);
        return;
      }

      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData);
        setBatchDate(new Date(ordersData[0].created_at).toLocaleString('ko-KR'));

        // 조직명 조회
        if (ordersData[0].organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('business_name')
            .eq('id', ordersData[0].organization_id)
            .single();

          if (orgData) {
            setOrganizationName(orgData.business_name);
          }
        }
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = orders.reduce((sum, order) => {
    return sum + (Number(order.final_deposit_amount) || 0);
  }, 0);

  const getStatusColor = (status?: string) => {
    if (status === '발주서등록' || status === '접수' || status === '발주서확정') return 'bg-purple-100 text-purple-800';
    if (status === '결제완료') return 'bg-blue-100 text-blue-800';
    if (status === '상품준비중') return 'bg-yellow-100 text-yellow-800';
    if (status === '발송완료') return 'bg-green-100 text-green-800';
    if (status === '취소요청') return 'bg-orange-100 text-orange-800';
    if (status === '취소완료') return 'bg-gray-100 text-gray-800';
    if (status === '환불완료') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">해당 배치의 주문을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/admin/order-platform')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            주문 관리로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/order-platform')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            주문 관리로 돌아가기
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">신규 발주서 등록</h1>
          <p className="text-gray-600">등록된 주문 내역을 확인하세요</p>
        </div>

        {/* 요약 정보 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-500">조직</div>
                <div className="text-lg font-semibold text-gray-900">{organizationName || '셀러'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">주문 건수</div>
                <div className="text-lg font-semibold text-gray-900">{orders.length}건</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-sm text-gray-500">최종입금액</div>
                <div className="text-lg font-semibold text-gray-900">{totalAmount.toLocaleString()}원</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-sm text-gray-500">등록일시</div>
                <div className="text-sm font-semibold text-gray-900">{batchDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 주문 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">서브계정</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">옵션상품</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">수량</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">공급단가</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">공급가</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">할인액</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">사용캐시</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">최종입금액</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.order_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.sub_account_name || '메인계정'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.option_name}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {Number(order.seller_supply_price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      {Number(order.product_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-purple-600">
                      {Number(order.discount_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      {Number(order.cash_used || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold">
                      {Number(order.final_deposit_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.shipping_status)}`}>
                        {order.shipping_status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
