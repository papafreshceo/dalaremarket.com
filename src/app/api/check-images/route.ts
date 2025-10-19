import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // 1. cloudinary_images 현황
  const { data: allImages } = await supabase
    .from('cloudinary_images')
    .select('category, category_4_id, is_representative, option_product_id');

  // 카테고리별 그룹화
  const categoryGroups: Record<string, { total: number; representative: number; with_option: number; with_category_id: number }> = {};
  allImages?.forEach(img => {
    const cat = img.category || 'NULL';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { total: 0, representative: 0, with_option: 0, with_category_id: 0 };
    }
    categoryGroups[cat].total++;
    if (img.is_representative) categoryGroups[cat].representative++;
    if (img.option_product_id) categoryGroups[cat].with_option++;
    if (img.category_4_id) categoryGroups[cat].with_category_id++;
  });

  // 2. category_settings 사입 품목
  const { data: categorySettings } = await supabase
    .from('category_settings')
    .select('category_4, seller_supply')
    .eq('seller_supply', true)
    .eq('is_active', true)
    .order('category_4');

  // 2-1. category_settings 전체 (필터 없음)
  const { data: allCategorySettings } = await supabase
    .from('category_settings')
    .select('category_4, seller_supply, expense_type')
    .eq('is_active', true)
    .order('category_4');

  // 2-2. category_settings 정말 전체 (is_active 필터도 제거)
  const { data: rawCategorySettings, error: catError } = await supabase
    .from('category_settings')
    .select('*')
    .limit(10);

  console.log('category_settings error:', catError);
  console.log('category_settings raw:', rawCategorySettings);

  // 3. 옵션상품 샘플
  const { data: optionProducts } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .limit(10);

  return NextResponse.json({
    cloudinary_images: {
      total: allImages?.length || 0,
      by_category: categoryGroups
    },
    category_settings_seller_supply: {
      total: categorySettings?.length || 0,
      first_10: categorySettings?.slice(0, 10).map(c => c.category_4)
    },
    category_settings_all: {
      total: allCategorySettings?.length || 0,
      first_10: allCategorySettings?.slice(0, 10)
    },
    option_products: {
      total: optionProducts?.length || 0,
      samples: optionProducts
    }
  });
}
