import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/promotional-images
 * 홍보 이미지 목록 조회 (Cloudinary 이미지 포함)
 * 🔓 공개 API: 모든 사용자가 홍보 이미지를 볼 수 있음
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    const { data, error } = await supabase
      .from('promotional_images')
      .select(`
        *,
        image:cloudinary_images(
          id,
          secure_url,
          title,
          width,
          height
        )
      `)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('홍보 이미지 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('GET /api/admin/promotional-images 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotional-images
 * 홍보 이미지 생성
 */
export async function POST(request: NextRequest) {
  // 🔒 보안: 관리자만 접근 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    // section 필드 추가 (기본값: tab1)
    const insertData = {
      ...body,
      section: body.section || 'tab1',
    };

    const { data, error } = await supabase
      .from('promotional_images')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('홍보 이미지 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('POST /api/admin/promotional-images 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/promotional-images
 * 홍보 이미지 수정
 */
export async function PUT(request: NextRequest) {
  // 🔒 보안: 관리자만 접근 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('promotional_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('홍보 이미지 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('PUT /api/admin/promotional-images 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promotional-images
 * 홍보 이미지 삭제
 */
export async function DELETE(request: NextRequest) {
  // 🔒 보안: 관리자만 접근 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('promotional_images')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('홍보 이미지 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    logger.error('DELETE /api/admin/promotional-images 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
