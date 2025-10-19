import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  console.log('=== 대표이미지 초기화 시작 ===');

  // 외래 키가 모두 null인데 is_representative가 true인 이미지들을 찾아서 false로 변경
  const { data: fixed, error } = await supabase
    .from('cloudinary_images')
    .update({ is_representative: false })
    .is('option_product_id', null)
    .is('category_4_id', null)
    .is('raw_material_id', null)
    .eq('is_representative', true)
    .select('id, secure_url');

  if (error) {
    console.error('초기화 실패:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  console.log('초기화된 이미지 수:', fixed?.length || 0);
  console.log('초기화된 이미지 ID:', fixed?.map(img => img.id));

  return NextResponse.json({
    success: true,
    fixed_count: fixed?.length || 0,
    message: `외래 키가 없는 ${fixed?.length || 0}개의 대표이미지를 초기화했습니다.`
  });
}
