import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userData?.role === 'admin' || userData?.role === 'employee') {
      redirect('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">달래아마켓</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">
                로그인
              </Link>
              <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                무료 시작하기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            B2B 비즈니스를 위한<br />
            <span className="text-blue-600">올인원 관리 플랫폼</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            주문관리, 재고관리, 고객관리를 한 곳에서. 
            엑셀 업로드로 쉽게, AI 분석으로 똑똑하게.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition">
              무료로 시작하기
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-white text-gray-700 text-lg rounded-lg border-2 border-gray-300 hover:border-gray-400 transition">
              로그인
            </Link>
          </div>
        </div>
      </div>

      {/* 기능 소개 */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">주요 기능</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-semibold mb-2">통합 대시보드</h4>
              <p className="text-gray-600">모든 비즈니스 현황을 한눈에 파악하세요</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📤</div>
              <h4 className="text-xl font-semibold mb-2">엑셀 연동</h4>
              <p className="text-gray-600">익숙한 엑셀로 데이터를 쉽게 관리하세요</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="text-xl font-semibold mb-2">AI 분석</h4>
              <p className="text-gray-600">AI가 제공하는 인사이트로 더 나은 결정을</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h3>
          <p className="text-xl text-gray-600 mb-8">
            신용카드 없이 무료로 시작할 수 있습니다
          </p>
          <Link href="/auth/register" className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition">
            무료 계정 만들기 →
          </Link>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 달래아마켓. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}