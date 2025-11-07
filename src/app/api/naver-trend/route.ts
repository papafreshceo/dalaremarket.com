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

// Mock 데이터 생성 함수
function generateMockData(keywords: string[], period: string) {
  const { startDate, endDate } = getPeriodDates(period);

  // 날짜 배열 생성
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  // 각 키워드별 데이터 생성
  const results = keywords.map((keyword, index) => {
    const data = dates.map((date) => {
      // 기본값 + 랜덤 변동 + 키워드별 차이
      const baseValue = 50 + (index * 10);
      const randomVariation = Math.random() * 40 - 20;
      const trendFactor = Math.sin((dates.indexOf(date) / dates.length) * Math.PI * 2) * 15;
      const ratio = Math.max(0, Math.min(100, baseValue + randomVariation + trendFactor));

      return {
        period: date,
        ratio: ratio.toFixed(2)
      };
    });

    return {
      title: keyword,
      keywords: [keyword],
      data
    };
  });

  return {
    startDate,
    endDate,
    timeUnit: 'date',
    results
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

    // API 키 확인
    if (!clientId || !clientSecret) {
      console.log('API keys not configured, using mock data');
      const mockData = generateMockData(keywords, period);
      return NextResponse.json(mockData);
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

      // API 에러 시 Mock 데이터로 폴백
      console.log('Falling back to mock data due to API error');
      const mockData = generateMockData(keywords, period);
      return NextResponse.json(mockData);
    }

    const data = await response.json();

    // 빈 데이터인 경우 Mock 데이터로 폴백
    if (!data.results || data.results.length === 0 || !data.results[0].data || data.results[0].data.length === 0) {
      console.log('Falling back to mock data due to empty response');
      const mockData = generateMockData(keywords, period);
      return NextResponse.json(mockData);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Trend API Error:', error);

    // 에러 시 Mock 데이터로 폴백
    try {
      const body = await request.json();
      const { keywords, period = '1m' } = body;
      const mockData = generateMockData(keywords, period);
      return NextResponse.json(mockData);
    } catch {
      return NextResponse.json(
        {
          error: '트렌드 데이터 조회 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : '알 수 없는 오류'
        },
        { status: 500 }
      );
    }
  }
}
