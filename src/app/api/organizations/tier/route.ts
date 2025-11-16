import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * GET /api/organizations/tier?id=xxx
 * 조직의 티어 및 할인율 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const organizationId = request.nextUrl.searchParams.get('id');
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: '조직 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    logger.debug('🔍 조직 티어 조회 요청:', { organizationId, userId: auth.user.id });

    const supabase = await createClientForRouteHandler();

    // 조직의 tier 조회 (서비스 롤 키로 RLS 우회)
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, tier')
      .eq('id', organizationId)
      .single();

    logger.debug('📊 조직 정보 조회 결과:', { orgData, orgError });

    if (orgError || !orgData) {
      console.error('❌ 조직 정보 조회 오류:', { organizationId, error: orgError });
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // tier가 없으면 기본값 반환
    if (!orgData.tier) {
      return NextResponse.json({
        success: true,
        data: {
          organization_id: orgData.id,
          organization_name: orgData.name,
          tier: 'LIGHT',
          discount_rate: 0.5,
          description: '기본 등급'
        }
      });
    }

    // tier_criteria에서 할인율 조회
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('tier_criteria')
      .select('discount_rate, description')
      .eq('tier', orgData.tier)
      .single();

    if (criteriaError || !criteriaData) {
      logger.error('티어 기준 조회 오류:', criteriaError);
      return NextResponse.json(
        { success: false, error: '티어 기준을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organization_id: orgData.id,
        organization_name: orgData.name,
        tier: orgData.tier,
        discount_rate: Number(criteriaData.discount_rate) || 0,
        description: criteriaData.description
      }
    });
  } catch (error: any) {
    logger.error('GET /api/organizations/tier 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
