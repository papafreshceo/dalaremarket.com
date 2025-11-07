import { NextRequest, NextResponse } from 'next/server';

// 네이버 데이터랩 API 엔드포인트
const DATALAB_API_URL = 'https://openapi.naver.com/v1/datalab/search';

// 기간 문자열을 날짜로 변환
function getPeriodDates(period: string) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1m':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, period = '1m', device = '', gender = '', age = '' } = body;

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: '키워드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 환경변수에서 네이버 데이터랩 API 키 가져오기
    const clientId = process.env.NAVER_DATALAB_CLIENT_ID;
    const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '네이버 API 설정이 필요합니다.' },
        { status: 500 }
      );
    }

    const { startDate, endDate } = getPeriodDates(period);

    // 네이버 데이터랩 API 요청 바디 구성
    const keywordGroups = keywords.map((keyword: string, index: number) => ({
      groupName: keyword,
      keywords: [keyword]
    }));

    const requestBody: any = {
      startDate,
      endDate,
      timeUnit: 'date',
      keywordGroups
    };

    // 선택적 필터 추가
    if (device && device !== 'all') {
      requestBody.device = device;
    }
    if (gender && gender !== 'all') {
      requestBody.gender = gender;
    }
    if (age && age !== 'all') {
      requestBody.ages = [age];
    }

    // 네이버 데이터랩 API 호출
    const response = await fetch(DATALAB_API_URL, {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Naver API Error:', errorData);

      return NextResponse.json(
        {
          error: '네이버 API 요청 실패',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Trend API Error:', error);
    return NextResponse.json(
      {
        error: '트렌드 데이터 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
