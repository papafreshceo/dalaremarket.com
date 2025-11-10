import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/api-security';
import { canDeleteServer } from '@/lib/permissions-server';

/**
 * POST /api/integrated-orders/soft-delete
 * 주문 소프트 삭제 (is_deleted = true)
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

    // 소프트 삭제 업데이트
    const { data, error } = await supabase
      .from('integrated_orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: auth.user?.id || null,
      })
      .in('id', ids)
      .eq('is_deleted', false) // 이미 삭제된 건은 제외
      .select();

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
