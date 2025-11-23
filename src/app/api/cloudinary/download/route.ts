import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

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

    // 현재 다운로드 카운트 조회
    const { data: currentImage, error: fetchError } = await supabase
      .from('cloudinary_images')
      .select('download_count')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      logger.error('이미지 조회 실패:', fetchError);
      return NextResponse.json(
        { success: false, error: '이미지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 다운로드 카운트 증가
    const newCount = (currentImage.download_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('cloudinary_images')
      .update({ download_count: newCount })
      .eq('id', imageId);

    if (updateError) {
      logger.error('다운로드 카운트 증가 실패:', updateError);
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
    logger.error('다운로드 기록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
