import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PlatformDashboard() {
  const supabase = await createClient()

  // 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 사용자 정보 가져오기
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData?.approved) {
    redirect('/')
  }

  // 관리자 권한 확인
  const isAdmin = userData.role === 'admin' || userData.role === 'employee' || userData.role === 'super_admin'

  // 셀러의 주문 통계 가져오기
  const { data: allOrders } = await supabase
    .from('integrated_orders')
    .select('*')
    .eq('seller_id', user.id)

  const orders = allOrders || []

  // 통계 계산
  const totalOrders = orders.length

  // 발송완료 주문 (shipped_date가 있고 shipping_status가 '발송완료')
  const shippedOrders = orders.filter(o => o.shipping_status === '발송완료').length

  // 발송대기 주문 (confirmed_at이 있고 shipping_status가 null 또는 '발송대기')
  const pendingShipment = orders.filter(o => o.confirmed_at && (!o.shipping_status || o.shipping_status === '발송대기')).length

  // 발주서등록 (confirmed_at이 없는 주문)
  const registeredOrders = orders.filter(o => !o.confirmed_at).length

  // 환불요청 (refund_status가 '환불요청')
  const refundRequested = orders.filter(o => o.refund_status === '환불요청').length

  // 환불완료 (refund_status가 '환불완료')
  const refundCompleted = orders.filter(o => o.refund_status === '환불완료').length

  // 총 정산 예정 금액 계산 (발송완료 주문의 settlement_amount 합계)
  const totalSettlement = orders
    .filter(o => o.shipping_status === '발송완료' && o.settlement_amount)
    .reduce((sum, o) => {
      const amount = parseFloat(o.settlement_amount?.replace(/[^0-9.-]/g, '') || '0')
      return sum + amount
    }, 0)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                달래마켓
              </h1>
              <p className="mt-2 text-gray-600">
                환영합니다, {userData.name || userData.email}님!
              </p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  관리자
                </Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 주문 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* 전체 주문 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 주문</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrders}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
              <Link href="/platform/orders" className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                주문 관리 →
              </Link>
            </div>

            {/* 발주서등록 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">발주서등록</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{registeredOrders}</p>
                </div>
                <div className="text-4xl">📝</div>
              </div>
              <Link href="/platform/orders" className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                등록 관리 →
              </Link>
            </div>

            {/* 발송대기 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">발송대기</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pendingShipment}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
              <Link href="/platform/orders" className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                발송 관리 →
              </Link>
            </div>

            {/* 발송완료 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">발송완료</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{shippedOrders}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <Link href="/platform/orders" className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                배송 확인 →
              </Link>
            </div>

            {/* 환불 요청/완료 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">환불 요청/완료</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {refundRequested} / {refundCompleted}
                  </p>
                </div>
                <div className="text-4xl">↩️</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">요청 {refundRequested}건 / 완료 {refundCompleted}건</p>
            </div>

            {/* 정산 예정 금액 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">정산 예정 금액</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {totalSettlement.toLocaleString()}원
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">발송완료 주문 기준</p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              빠른 메뉴
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 주문 관리 */}
              <Link
                href="/platform/orders"
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">📦</div>
                <h3 className="text-lg font-semibold mb-2">주문 관리</h3>
                <p className="text-gray-600 text-sm">주문 등록 및 관리</p>
              </Link>

              {/* 상품 조회 */}
              <Link
                href="/platform/products"
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">🛍️</div>
                <h3 className="text-lg font-semibold mb-2">상품 조회</h3>
                <p className="text-gray-600 text-sm">상품 목록 확인</p>
              </Link>

              {/* 내 정보 */}
              <Link
                href="/platform/profile"
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">👤</div>
                <h3 className="text-lg font-semibold mb-2">내 정보</h3>
                <p className="text-gray-600 text-sm">회원 정보 관리</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
