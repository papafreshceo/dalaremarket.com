import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/platform-orders/sample
 *
 * 샘플 데이터 삭제 (show_sample_data를 false로 변경)
 */
export async function DELETE() {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // show_sample_data를 false로 변경
    const { error } = await supabase
      .from('users')
      .update({ show_sample_data: false })
      .eq('id', user.id);

    if (error) {
      console.error('[DELETE platform-orders/sample] 샘플 모드 비활성화 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: '샘플 데이터가 삭제되었습니다. 실제 주문 데이터가 표시됩니다.',
    });

  } catch (error: any) {
    console.error('DELETE /api/platform-orders/sample 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
