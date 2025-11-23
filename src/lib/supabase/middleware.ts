import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // 디버깅 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Path:', request.nextUrl.pathname);
        console.log('[Middleware] Cookies:', request.cookies.getAll().map(c => c.name));
    }

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
                    const cookies = request.cookies.getAll()
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[Middleware] Getting cookies:', cookies.length);
                    }
                    return cookies
                },
                setAll(cookiesToSet) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[Middleware] Setting cookies:', cookiesToSet.length);
                    }
                    
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // 쿠키 옵션 강제 설정
                        const cookieOptions = {
                            ...options,
                            sameSite: 'lax' as const,
                            path: '/',
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true,
                        }
                        response.cookies.set(name, value, cookieOptions)
                    })
                },
            },
        }
    )

    // 세션 갱신 및 유저 확인
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[Middleware] Auth status:', {
                hasUser: !!user,
                error: error?.message,
                path: request.nextUrl.pathname
            });
        }

        // 세션이 있으면 갱신
        if (user) {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (session && !sessionError && process.env.NODE_ENV === 'development') {
                console.log('[Middleware] Session refreshed for user:', user.id);
            }
        }
    } catch (error) {
        console.error('[Middleware] Error checking auth:', error);
    }

    return response
}
