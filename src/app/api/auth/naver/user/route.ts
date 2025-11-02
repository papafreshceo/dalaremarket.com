import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }

  const accessToken = authHeader.substring(7)

  try {
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const userData = await userResponse.json()

    if (userData.resultcode !== '00' || !userData.response) {
      console.error('User info error:', userData)
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 })
    }

    const naverUser = userData.response

    return NextResponse.json({
      email: naverUser.email,
      name: naverUser.name || naverUser.nickname,
      phone: naverUser.mobile?.replace(/-/g, '') || naverUser.mobile_e164?.replace('+82', '0'),
      naver_id: naverUser.id,
    })
  } catch (error) {
    console.error('User info fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
