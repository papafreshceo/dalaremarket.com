import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';

  const confmKey = 'U01TX0FVVEgyMDI1MTAyODE5MDE0NTExNjM3Mzk=';
  const countPerPage = '10';
  const resultType = 'json';

  try {
    const apiUrl = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${confmKey}&currentPage=${page}&countPerPage=${countPerPage}&keyword=${encodeURIComponent(keyword)}&resultType=${resultType}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error('주소 검색 API 에러:', error);
    return NextResponse.json(
      {
        results: {
          common: { errorCode: '-1', errorMessage: '검색 중 오류가 발생했습니다.' },
          juso: []
        }
      },
      { status: 500 }
    );
  }
}
