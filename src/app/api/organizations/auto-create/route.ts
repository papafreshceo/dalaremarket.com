import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization'
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/organizations/auto-create
 * 사용자 정보를 기반으로 조직 자동 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    // Rate Limiting: 사용자당 5분에 3번까지 허용
    const rateLimitResult = rateLimit(`org-create:${auth.user.id}`, {
      maxRequests: 3,
      windowMs: 5 * 60 * 1000, // 5분
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // 사용자 정보 기반 조직 자동 생성
    const result = await autoCreateOrganizationFromUser(auth.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '조직 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    if (result.already_exists) {
      return NextResponse.json({
        success: true,
        message: '이미 조직이 존재합니다',
        organization_id: result.organization_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: '조직이 생성되었습니다',
      organization_id: result.organization_id,
      organization_name: result.organization_name,
    })
  } catch (error) {
    logger.error('조직 자동 생성 오류:', error);
    return NextResponse.json(
      { error: '조직 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
