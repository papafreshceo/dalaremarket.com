import { NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

/**
 * GET /api/cloudinary/analytics
 * 다운로드 통계 및 분석 데이터 조회
 */
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // 1. 전체 통계
    const { data: allImages, error: imagesError } = await supabase
      .from('cloudinary_images')
      .select('download_count');

    const totalImages = allImages?.length || 0;
    const totalDownloads = allImages?.reduce((sum, img) => sum + (img.download_count || 0), 0) || 0;

    // 2. 오늘 다운로드 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayDownloads } = await supabase
      .from('image_download_logs')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', today.toISOString());

    // 3. 최근 7일 다운로드 수
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekDownloads } = await supabase
      .from('image_download_logs')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', weekAgo.toISOString());

    // 4. 인기 이미지 TOP 10
    const { data: topImages, error: topError } = await supabase
      .from('cloudinary_images')
      .select('id, title, secure_url, category, download_count, view_count')
      .order('download_count', { ascending: false })
      .limit(10);

    // 5. 최근 다운로드 로그 (최근 50개)
    const { data: recentLogs, error: logsError } = await supabase
      .from('image_download_logs')
      .select(`
        id,
        image_id,
        ip_address,
        user_agent,
        downloaded_at
      `)
      .order('downloaded_at', { ascending: false })
      .limit(50);

    // 6. 로그에 이미지 정보 추가
    let recentDownloads = [];
    if (recentLogs && recentLogs.length > 0) {
      const imageIds = [...new Set(recentLogs.map(log => log.image_id))];
      const { data: imageDetails } = await supabase
        .from('cloudinary_images')
        .select('id, title, secure_url, category')
        .in('id', imageIds);

      const imageMap = new Map(imageDetails?.map(img => [img.id, img]));

      recentDownloads = recentLogs.map(log => ({
        ...log,
        image: imageMap.get(log.image_id),
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalImages,
          totalDownloads,
          todayDownloads: todayDownloads || 0,
          weekDownloads: weekDownloads || 0,
        },
        topImages: topImages || [],
        recentDownloads,
      },
    });
  } catch (error: any) {
    console.error('분석 데이터 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
