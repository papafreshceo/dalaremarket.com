import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    }

    // 토큰 검증
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');

    try {
      const { payload } = await jwtVerify(token, secret);

      if (payload.type !== 'impersonate') {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: payload.userId as string,
          email: payload.email as string,
          name: payload.name as string,
          role: payload.role as string,
        },
        impersonatedBy: payload.impersonatedBy as string,
      });

    } catch (error) {
      logger.error('토큰 검증 실패:', error);
      return NextResponse.json({ error: '토큰이 만료되었거나 유효하지 않습니다.' }, { status: 401 });
    }

  } catch (error) {
    logger.error('POST /api/admin/verify-impersonate 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
