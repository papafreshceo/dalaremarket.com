import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import cloudinary from '@/lib/cloudinary/config';

/**
 * GET /api/cloudinary/images
 * 이미지 목록 조회 (필터링, 페이지네이션 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('is_public');
    const search = searchParams.get('search');
    const folderPath = searchParams.get('folder_path'); // 폴더 경로 필터 추가
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await createClient();
    let query = supabase.from('cloudinary_images').select('*', { count: 'exact' });

    // 필터 적용
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    // 폴더 경로로 필터링 (cloudinary_id가 해당 경로로 시작하는 것만)
    if (folderPath) {
      query = query.ilike('cloudinary_id', `${folderPath}/%`);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('이미지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cloudinary/images
 * 이미지 메타데이터 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, category, tags, is_public, is_downloadable } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cloudinary_images')
      .update({
        title,
        description,
        category,
        tags,
        is_public,
        is_downloadable,
        updated_at: new Date().toISOString(),
      })
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
    });
  } catch (error: any) {
    console.error('이미지 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cloudinary/images
 * 이미지 삭제 (Cloudinary + DB)
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

    const supabase = await createClient();

    // DB에서 cloudinary_id 조회
    const { data: image, error: fetchError } = await supabase
      .from('cloudinary_images')
      .select('cloudinary_id')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { success: false, error: '이미지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Cloudinary에서 삭제
    await cloudinary.uploader.destroy(image.cloudinary_id);

    // DB에서 삭제
    const { error: deleteError } = await supabase
      .from('cloudinary_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '이미지가 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
