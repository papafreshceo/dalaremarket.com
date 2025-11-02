import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// 네이버 클라우드 SENS 설정
const NCP_ACCESS_KEY = process.env.NCP_ACCESS_KEY || ''
const NCP_SECRET_KEY = process.env.NCP_SECRET_KEY || ''
const NCP_SERVICE_ID = process.env.NCP_SERVICE_ID || ''
const NCP_SENDER_PHONE = process.env.NCP_SENDER_PHONE || ''

// 인증번호 저장소 (실제로는 Redis나 DB 사용 권장)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

// 6자리 인증번호 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 네이버 클라우드 API 서명 생성
function makeSignature(timestamp: string, method: string, url: string): string {
  const space = ' '
  const newLine = '\n'
  const hmac = crypto.createHmac('sha256', NCP_SECRET_KEY)
  const message = [method, space, url, newLine, timestamp, newLine, NCP_ACCESS_KEY].join('')
  const signature = hmac.update(message).digest('base64')
  return signature
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호 형식 검증
    const phoneNumbers = phone.replace(/[^\d]/g, '')
    if (phoneNumbers.length !== 11) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 인증번호 생성
    const code = generateVerificationCode()

    // 인증번호 저장 (3분 유효)
    verificationCodes.set(phoneNumbers, {
      code,
      expiresAt: Date.now() + 3 * 60 * 1000, // 3분
    })

    // 네이버 클라우드 SENS API 호출
    const timestamp = Date.now().toString()
    const method = 'POST'
    const url = `/sms/v2/services/${NCP_SERVICE_ID}/messages`
    const signature = makeSignature(timestamp, method, url)

    const message = `[달래마켓] 인증번호는 [${code}]입니다. 3분 이내에 입력해주세요.`

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify({
        type: 'SMS',
        contentType: 'COMM',
        countryCode: '82',
        from: NCP_SENDER_PHONE,
        content: message,
        messages: [
          {
            to: phoneNumbers,
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Naver Cloud SMS error:', data)
      return NextResponse.json(
        { error: 'SMS 발송에 실패했습니다.', details: data },
        { status: 500 }
      )
    }

    console.log(`SMS sent to ${phoneNumbers}, code: ${code}`)

    return NextResponse.json({
      success: true,
      message: 'SMS가 발송되었습니다.',
    })
  } catch (error: any) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: 'SMS 발송에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// 인증번호 검증 엔드포인트
export async function PUT(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '')
    const storedData = verificationCodes.get(phoneNumbers)

    if (!storedData) {
      return NextResponse.json(
        { error: '인증번호가 발송되지 않았거나 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 만료 시간 확인
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(phoneNumbers)
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 발송해주세요.' },
        { status: 400 }
      )
    }

    // 인증번호 확인
    if (storedData.code !== code) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 인증 성공 - 인증번호 삭제
    verificationCodes.delete(phoneNumbers)

    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
    })
  } catch (error: any) {
    console.error('SMS verify error:', error)
    return NextResponse.json(
      { error: '인증 확인에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
