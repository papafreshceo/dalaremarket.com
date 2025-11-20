import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { handleCsrfToken } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value }))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // 관리자 페이지 접근 시 세션 확인
  // Admin page access check removed for production

  // 공개 페이지 (로그인 없이 접근 가능)
  const publicPaths = [
    '/',
    '/platform',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/test-connection',
  ]

  // 관리자 전용 페이지
  const adminPaths = ['/admin']

  // 공개 페이지는 통과
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    // 로그인한 상태에서 로그인 페이지 접근 시 역할에 따라 리다이렉트
    if (session && (pathname === '/auth/login' || pathname === '/auth/register')) {
      // 사용자 역할 확인
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // 관리자/직원은 admin으로, 일반 사용자는 랜딩페이지로
      if (userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'employee') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    // CSRF 토큰 설정
    response = handleCsrfToken(request, response)
    return response
  }

  // 로그인 필요한 페이지인데 세션이 없으면 로그인 페이지로
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 세션이 있으면 사용자 정보 확인
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, approved')
    .eq('id', session.user.id)
    .single()

  // 사용자 데이터 확인
  // User data logging removed for production

  // 승인되지 않은 사용자
  if (!userData?.approved) {
    // 로그아웃 처리
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login?error=not-approved', request.url))
  }

  // 관리자 페이지 접근 제어
  if (pathname.startsWith('/admin')) {
    const isAdminOrEmployee = userData.role === 'admin' ||
                              userData.role === 'super_admin' ||
                              userData.role === 'employee'

    if (!isAdminOrEmployee) {
      // 관리자가 아니면 랜딩페이지로
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // CSRF 토큰 설정
  response = handleCsrfToken(request, response)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}