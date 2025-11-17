import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  console.log('[Naver Token] ===== 토큰 요청 시작 =====')
  console.log('[Naver Token] Code:', code)
  console.log('[Naver Token] State:', state)
  console.log('[Naver Token] Client ID:', process.env.NEXT_PUBLIC_NAVER_CLIENT_ID)
  console.log('[Naver Token] Client Secret:', process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 없음')

  if (!code || !state) {
    console.log('[Naver Token] ❌ Code 또는 State 없음')
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  try {
    const naverUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
    console.log('[Naver Token] 네이버 API 호출:', naverUrl.replace(process.env.NAVER_CLIENT_SECRET || '', '***'))

    const tokenResponse = await fetch(naverUrl)

    console.log('[Naver Token] 네이버 응답 상태:', tokenResponse.status, tokenResponse.statusText)

    const tokenData = await tokenResponse.json()
    console.log('[Naver Token] 네이버 응답 데이터:', JSON.stringify(tokenData, null, 2))

    if (tokenData.error || !tokenData.access_token) {
      console.log('[Naver Token] ❌ 토큰 받기 실패')
      logger.error('Token error:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 400 })
    }

    console.log('[Naver Token] ✅ 토큰 받기 성공')
    return NextResponse.json(tokenData)
  } catch (error) {
    console.log('[Naver Token] ❌ 예외 발생:', error)
    logger.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
