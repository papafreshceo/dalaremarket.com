import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/audit-logs
 * 감사 로그 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 관리자만 감사 로그 조회 가능
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const action = searchParams.get('action');
    const actionCategory = searchParams.get('actionCategory');
    const resourceType = searchParams.get('resourceType');
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const severity = searchParams.get('severity');
    const isSensitive = searchParams.get('isSensitive');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 기본 쿼리
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // 필터 적용
    if (action) {
      query = query.eq('action', action);
    }

    if (actionCategory) {
      query = query.eq('action_category', actionCategory);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (isSensitive === 'true') {
      query = query.eq('is_sensitive', true);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('감사 로그 조회 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    logger.error('GET /api/admin/audit-logs 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
