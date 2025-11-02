import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  try {
    const tokenResponse = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token error:', tokenData)
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 })
    }

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
