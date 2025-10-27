import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { businessNumber } = await request.json();

    if (!businessNumber) {
      return NextResponse.json(
        { error: '사업자등록번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const cleanNumber = businessNumber.replace(/-/g, '');
    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { error: '사업자등록번호는 10자리여야 합니다.' },
        { status: 400 }
      );
    }

    // 국세청 사업자 상태 조회 API (API 키 불필요)
    const response = await fetch(
      'https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          b_no: [cleanNumber]
        })
      }
    );

    const data = await response.json();
    console.log('API Response from server:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying business number:', error);
    return NextResponse.json(
      { error: '사업자등록번호 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
