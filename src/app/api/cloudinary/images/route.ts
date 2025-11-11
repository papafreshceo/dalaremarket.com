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
 * 이미지 메타데이터 수정 (외래 키 포함)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      category,
      tags,
      is_public,
      is_downloadable,
      option_product_id,
      raw_material_id,
      category_4_id
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 외래 키 값 확인
    const newOptionProductId = option_product_id || null;
    const newRawMaterialId = raw_material_id || null;
    const newCategory4Id = category_4_id || null;


    // 0. 먼저 기존 이미지 데이터 조회 (이전 외래 키 확인용)
    const { data: oldImage, error: fetchError } = await supabase
      .from('cloudinary_images')
      .select('option_product_id, raw_material_id, category_4_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('기존 이미지 조회 실패:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 1. 먼저 현재 이미지를 업데이트 (외래 키 + 대표이미지 설정)
    const hasAnyForeignKey = !!(newOptionProductId || newRawMaterialId || newCategory4Id);

    const updateData: any = {
      title,
      description,
      category,
      tags,
      is_public,
      is_downloadable,
      option_product_id: newOptionProductId,
      raw_material_id: newRawMaterialId,
      category_4_id: newCategory4Id,
      updated_at: new Date().toISOString(),
      // 외래 키가 하나라도 있으면 대표이미지로 설정, 없으면 해제
      is_representative: hasAnyForeignKey,
    };



    const { data, error } = await supabase
      .from('cloudinary_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('현재 이미지 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }


    // 2. 대표이미지 해제 작업

    // 2-1. 새로운 외래 키에 대한 다른 대표이미지 해제
    if (newOptionProductId) {
      const { data: cleared, error: clearError } = await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('option_product_id', newOptionProductId)
        .neq('id', id)
        .select();

      if (clearError) console.error('해제 오류:', clearError);
    }

    if (newRawMaterialId) {
      const { data: cleared, error: clearError } = await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('raw_material_id', newRawMaterialId)
        .neq('id', id)
        .select();

      if (clearError) console.error('해제 오류:', clearError);
    }

    if (newCategory4Id) {
      const { data: cleared, error: clearError } = await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('category_4_id', newCategory4Id)
        .neq('id', id)
        .select();

      if (clearError) console.error('해제 오류:', clearError);
    }

    // 2-2. 이전 외래 키가 있었다면 해당 엔티티의 대표이미지도 해제 (외래 키가 변경된 경우)
    if (oldImage?.option_product_id && oldImage.option_product_id !== newOptionProductId) {
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('option_product_id', oldImage.option_product_id);
    }

    if (oldImage?.raw_material_id && oldImage.raw_material_id !== newRawMaterialId) {
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('raw_material_id', oldImage.raw_material_id);
    }

    if (oldImage?.category_4_id && oldImage.category_4_id !== newCategory4Id) {
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('category_4_id', oldImage.category_4_id);
    }


    return NextResponse.json({
      success: true,
      data,
      message: newOptionProductId || newRawMaterialId || newCategory4Id
        ? '외래 키가 설정되고 대표이미지로 지정되었습니다.'
        : '외래 키가 해제되고 대표이미지에서 제외되었습니다.',
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
