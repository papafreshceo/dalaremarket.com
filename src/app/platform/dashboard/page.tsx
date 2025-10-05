import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
                  🔧 관리자
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
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              플랫폼 대시보드
            </h2>
            <p className="text-gray-600 mb-6">
              고객용 대시보드 페이지입니다. 주문 내역, 상품 조회 등의 기능을 추가할 수 있습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {/* 주문 내역 */}
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📦</div>
                <h3 className="text-lg font-semibold mb-2">내 주문</h3>
                <p className="text-gray-600 text-sm mb-4">주문 내역을 확인하세요</p>
                <Link href="/platform/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  바로가기 →
                </Link>
              </div>

              {/* 상품 조회 */}
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🛍️</div>
                <h3 className="text-lg font-semibold mb-2">상품 조회</h3>
                <p className="text-gray-600 text-sm mb-4">상품 목록을 확인하세요</p>
                <Link href="/platform/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  바로가기 →
                </Link>
              </div>

              {/* 내 정보 */}
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="text-lg font-semibold mb-2">내 정보</h3>
                <p className="text-gray-600 text-sm mb-4">회원 정보를 관리하세요</p>
                <Link href="/platform/profile" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  바로가기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
