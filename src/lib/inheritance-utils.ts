import { createClient } from '@/lib/supabase/client'

/**
 * 품목(category_settings)의 발송기한/시즌 정보를 해당 품목의 모든 원물에 상속
 */
export async function inheritCategoryToRawMaterials(categoryId: string) {
  const supabase = createClient()

  // 1. 품목 정보 조회
  const { data: category, error: categoryError } = await supabase
    .from('category_settings')
    .select('shipping_deadline, season_start_date, season_end_date')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    console.error('Failed to fetch category:', categoryError)
    return { success: false, error: categoryError }
  }

  // 2. 해당 품목의 모든 원물 업데이트
  const { error: updateError } = await supabase
    .from('raw_materials')
    .update({
      shipping_deadline: category.shipping_deadline,
      season_start_date: category.season_start_date,
      season_end_date: category.season_end_date
    })
    .eq('category_4_id', categoryId)

  if (updateError) {
    console.error('Failed to update raw materials:', updateError)
    return { success: false, error: updateError }
  }

  return { success: true }
}

/**
 * 원물(raw_materials)의 발송기한/시즌 정보를 해당 원물과 매칭된 모든 옵션상품에 상속
 */
export async function inheritRawMaterialToOptionProducts(rawMaterialId: string) {
  const supabase = createClient()

  // 1. 원물 정보 조회
  const { data: rawMaterial, error: rawMaterialError } = await supabase
    .from('raw_materials')
    .select('shipping_deadline, season_start_date, season_end_date')
    .eq('id', rawMaterialId)
    .single()

  if (rawMaterialError || !rawMaterial) {
    console.error('Failed to fetch raw material:', rawMaterialError)
    return { success: false, error: rawMaterialError }
  }

  // 2. 해당 원물과 매칭된 옵션상품 ID 조회
  const { data: materialLinks, error: linkError } = await supabase
    .from('option_product_materials')
    .select('option_product_id')
    .eq('raw_material_id', rawMaterialId)

  if (linkError) {
    console.error('Failed to fetch material links:', linkError)
    return { success: false, error: linkError }
  }

  if (!materialLinks || materialLinks.length === 0) {
    return { success: true } // 매칭된 옵션상품이 없으면 성공으로 처리
  }

  // 3. 매칭된 옵션상품들 업데이트
  const optionProductIds = materialLinks.map(link => link.option_product_id)
  const { error: updateError } = await supabase
    .from('option_products')
    .update({
      shipping_deadline: rawMaterial.shipping_deadline,
      season_start_date: rawMaterial.season_start_date,
      season_end_date: rawMaterial.season_end_date
    })
    .in('id', optionProductIds)

  if (updateError) {
    console.error('Failed to update option products:', updateError)
    return { success: false, error: updateError }
  }

  return { success: true }
}

/**
 * 품목 업데이트 시 전체 상속 실행 (category -> raw_materials, category -> option_products)
 */
export async function inheritCategoryToAllDescendants(categoryId: string) {
  const supabase = createClient()

  // 1. 품목 정보 조회
  const { data: category, error: categoryError } = await supabase
    .from('category_settings')
    .select('shipping_deadline, season_start_date, season_end_date')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    console.error('Failed to fetch category:', categoryError)
    return { success: false, error: categoryError }
  }

  // 2. 품목명으로 품목 이름 조회
  const { data: categoryInfo } = await supabase
    .from('category_settings')
    .select('category_4')
    .eq('id', categoryId)
    .single()

  if (!categoryInfo) return { success: false }

  // 3. 품목 -> 원물 상속 (category_4 텍스트 필드로 매칭)
  const { error: rawMaterialError } = await supabase
    .from('raw_materials')
    .update({
      shipping_deadline: category.shipping_deadline,
      season_start_date: category.season_start_date,
      season_end_date: category.season_end_date
    })
    .eq('category_4', categoryInfo.category_4)

  if (rawMaterialError) {
    console.error('Failed to update raw materials:', rawMaterialError)
  }

  // 4. 품목 -> 옵션상품 상속 (category_4 텍스트 필드로 매칭)
  const { error: optionProductError } = await supabase
    .from('option_products')
    .update({
      shipping_deadline: category.shipping_deadline,
      season_start_date: category.season_start_date,
      season_end_date: category.season_end_date
    })
    .eq('category_4', categoryInfo.category_4)

  if (optionProductError) {
    console.error('Failed to update option products:', optionProductError)
  }

  return { success: true }
}

/**
 * 품목명으로 찾아서 전체 상속 체인 실행
 */
export async function inheritCategoryByName(category4Name: string) {
  const supabase = createClient()

  // 품목 ID 조회
  const { data: category, error } = await supabase
    .from('category_settings')
    .select('id')
    .eq('category_4', category4Name)
    .single()

  if (error || !category) {
    console.error('Failed to find category:', error)
    return { success: false, error }
  }

  return inheritCategoryToAllDescendants(category.id)
}
