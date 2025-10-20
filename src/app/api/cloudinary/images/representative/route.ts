import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: '이미지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 먼저 해당 이미지의 정보를 가져옵니다
    const { data: image, error: imageError } = await supabase
      .from('cloudinary_images')
      .select('id, category_4_id, raw_material_id, option_product_id')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { success: false, error: '이미지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 외래 키가 없으면 대표이미지로 설정할 수 없음
    if (!image.category_4_id && !image.raw_material_id && !image.option_product_id) {
      return NextResponse.json(
        { success: false, error: '품목, 원물 또는 옵션상품이 연결되지 않은 이미지는 대표이미지로 설정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 3. 같은 품목(category_4, raw_material, option_product)의 다른 대표이미지들을 모두 해제합니다
    let clearConditions: any = {};

    if (image.category_4_id) {
      clearConditions.category_4_id = image.category_4_id;
    } else if (image.raw_material_id) {
      clearConditions.raw_material_id = image.raw_material_id;
    } else if (image.option_product_id) {
      clearConditions.option_product_id = image.option_product_id;
    }

    // 기존 대표이미지 해제
    const { error: clearError } = await supabase
      .from('cloudinary_images')
      .update({ is_representative: false })
      .match(clearConditions);

    if (clearError) {
      console.error('기존 대표이미지 해제 오류:', clearError);
    }

    // 4. 선택한 이미지를 대표이미지로 설정합니다
    const { data: updatedImage, error: updateError } = await supabase
      .from('cloudinary_images')
      .update({ is_representative: true })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: '대표이미지 설정 실패: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '대표이미지가 설정되었습니다.',
      data: updatedImage
    });

  } catch (error) {
    console.error('대표이미지 설정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
