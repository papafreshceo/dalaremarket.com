import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
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

  if (!userData?.approved || (userData.role !== 'admin' && userData.role !== 'employee' && userData.role !== 'super_admin')) {
    redirect('/')
  }

  // 통계 데이터 가져오기 (예시)
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                관리자 대시보드
              </h1>
              <p className="mt-2 text-gray-600">
                환영합니다, {userData.name || userData.email}님! (권한: {userData.role})
              </p>
            </div>
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
      
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 통계 카드 */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 상품 카드 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6">
                    <svg className="h-full w-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        전체 상품
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {totalProducts || 0}개
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <a href="/admin/products" className="text-sm text-blue-600 hover:text-blue-900">
                  상품 관리 →
                </a>
              </div>
            </div>

            {/* 주문 카드 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6">
                    <svg className="h-full w-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        전체 주문
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {totalOrders || 0}건
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <a href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-900">
                  주문 관리 →
                </a>
              </div>
            </div>

            {/* 사용자 카드 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6">
                    <svg className="h-full w-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        전체 사용자
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {totalUsers || 0}명
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <a href="/admin/users" className="text-sm text-blue-600 hover:text-blue-900">
                  사용자 관리 →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="mt-8 px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <a href="/admin/orders/upload" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 mb-2">
                  <svg className="h-full w-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm">송장 업로드</span>
              </div>
            </a>
            
            <a href="/admin/products/new" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 mb-2">
                  <svg className="h-full w-full text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm">상품 추가</span>
              </div>
            </a>
            
            <a href="/admin/expense" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 mb-2">
                  <svg className="h-full w-full text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm">지출 관리</span>
              </div>
            </a>
            
            <a href="/admin/reports" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 mb-2">
                  <svg className="h-full w-full text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm">리포트</span>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}