import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // 대표이미지로 설정된 모든 이미지 조회
  const { data: images, error } = await supabase
    .from('cloudinary_images')
    .select('id, option_product_id, category_4_id, raw_material_id, is_representative, secure_url')
    .eq('is_representative', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 품목별로 그룹화
  const byCategory = images?.filter(img => img.category_4_id);
  const byOption = images?.filter(img => img.option_product_id);
  const byRawMaterial = images?.filter(img => img.raw_material_id);

  // 중복 체크
  const categoryGroups = new Map<string, any[]>();
  byCategory?.forEach(img => {
    const key = img.category_4_id!;
    if (!categoryGroups.has(key)) {
      categoryGroups.set(key, []);
    }
    categoryGroups.get(key)!.push(img);
  });

  const duplicates = Array.from(categoryGroups.entries())
    .filter(([_, imgs]) => imgs.length > 1)
    .map(([category_id, imgs]) => ({
      category_4_id: category_id,
      count: imgs.length,
      image_ids: imgs.map(i => i.id)
    }));

  return NextResponse.json({
    total: images?.length || 0,
    byCategory: byCategory?.length || 0,
    byOption: byOption?.length || 0,
    byRawMaterial: byRawMaterial?.length || 0,
    duplicates,
    allImages: images
  });
}
