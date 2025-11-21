import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Supabase 세션 갱신 (가장 먼저 실행)
  const response = await updateSession(request)

  // 🔒 보안 헤더 추가 (추가 레이어)
  response.headers.set('X-Robots-Tag', 'index, follow')

  // API 요청에 대한 추가 보안 헤더
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0')
  }

  // 로깅 (프로덕션에서는 필요시 제거)
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    const method = request.method
    const path = request.nextUrl.pathname
    console.log(`[${timestamp}] ${method} ${path}`)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
