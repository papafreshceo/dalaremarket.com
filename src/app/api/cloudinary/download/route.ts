import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

/**
 * POST /api/cloudinary/download
 * 다운로드 카운트 증가 및 로그 기록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: '이미지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClientForRouteHandler();

    // 다운로드 카운트 증가
    const { error: updateError } = await supabase.rpc('increment_download_count', {
      image_id: imageId,
    });

    // RPC 함수가 없으면 직접 UPDATE
    if (updateError) {
      const { error: directUpdateError } = await supabase
        .from('cloudinary_images')
        .update({ download_count: supabase.sql`download_count + 1` })
        .eq('id', imageId);

      if (directUpdateError) {
        console.error('다운로드 카운트 증가 실패:', directUpdateError);
      }
    }

    // 다운로드 로그 기록
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabase.from('image_download_logs').insert({
      image_id: imageId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: '다운로드 기록 완료',
    });
  } catch (error: any) {
    console.error('다운로드 기록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
