import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/api-security';
import { canDeleteServer } from '@/lib/permissions-server';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

/**
 * POST /api/integrated-orders/soft-delete
 * 주문 소프트 삭제 (is_deleted = true)
 * Security: 조직 단위 필터링 적용
 */
export async function POST(request: NextRequest) {
  // 🔒 보안: 직원 이상 접근 가능
  const auth = await requireStaff(request);
  if (!auth.authorized) return auth.error;

  // 🔒 권한 체크: 삭제 권한 확인
  const hasDeletePermission = await canDeleteServer(auth.user!.id, '/admin/order-integration');
  if (!hasDeletePermission) {
    return NextResponse.json(
      { success: false, error: '주문 삭제 권한이 없습니다.' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔒 조직 필터: 같은 조직의 주문만 삭제 가능 (관리자 제외)
    let query = supabase
      .from('integrated_orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: auth.user?.id || null,
      })
      .in('id', ids)
      .eq('is_deleted', false); // 이미 삭제된 건은 제외

    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
      const organizationId = await getOrganizationDataFilter(auth.user.id);
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        // 조직이 없으면 본인이 등록한 주문만 삭제 가능
        query = query.eq('seller_id', auth.user.id);
      }
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('소프트 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('POST /api/integrated-orders/soft-delete 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
