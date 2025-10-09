import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrated-orders/soft-delete
 * 주문 소프트 삭제 (is_deleted = true)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 소프트 삭제 업데이트
    const { data, error } = await supabase
      .from('integrated_orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
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
