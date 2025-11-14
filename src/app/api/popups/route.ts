import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

/**
 * GET /api/popups
 * 팝업 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    const includeImage = searchParams.get('include_image') === 'true';

    const supabase = await createClientForRouteHandler();

    let query = supabase
      .from('popups')
      .select(
        includeImage
          ? `
            *,
            image:cloudinary_images(
              id,
              secure_url,
              title,
              width,
              height
            )
          `
          : '*'
      )
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 활성화된 팝업만 조회
    if (activeOnly) {
      query = query.eq('is_active', true);

      // 현재 시간이 노출 기간 내인 것만
      const now = new Date().toISOString();
      query = query
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }

    const { data, error } = await query;

    if (error) {
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
    console.error('팝업 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/popups
 * 팝업 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      image_id,
      popup_type,
      link_url,
      is_active,
      display_order,
      width,
      height,
      position_x,
      position_y,
      start_date,
      end_date,
      enable_today_close,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: '팝업 제목이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClientForRouteHandler();

    const { data, error } = await supabase
      .from('popups')
      .insert({
        title,
        content,
        image_id: image_id || null,
        popup_type: popup_type || 'notice',
        link_url: link_url || null,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
        width: width ?? 400,
        height: height ?? 500,
        position_x: position_x ?? 100,
        position_y: position_y ?? 100,
        start_date: start_date || null,
        end_date: end_date || null,
        enable_today_close: enable_today_close ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '팝업이 추가되었습니다.',
    });
  } catch (error: any) {
    console.error('팝업 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/popups
 * 팝업 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      image_id,
      popup_type,
      link_url,
      is_active,
      display_order,
      width,
      height,
      position_x,
      position_y,
      start_date,
      end_date,
      enable_today_close,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClientForRouteHandler();

    const updateData: any = {
      title,
      content,
      image_id: image_id || null,
      popup_type,
      link_url: link_url || null,
      is_active,
      display_order,
      width,
      height,
      position_x,
      position_y,
      start_date: start_date || null,
      end_date: end_date || null,
      enable_today_close,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('popups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '팝업이 수정되었습니다.',
    });
  } catch (error: any) {
    console.error('팝업 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/popups
 * 팝업 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClientForRouteHandler();

    const { error } = await supabase.from('popups').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '팝업이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('팝업 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
