import { createClient } from '@/lib/supabase/client'

/**
 * 품목 마스터(products_master)의 모든 속성을 해당 품목의 모든 원물에 상속
 * 상속 필드: category_1~4, raw_material_status, shipping_deadline, season_start_date, season_end_date,
 *           seller_supply, is_best, is_recommended, has_image, has_detail_page
 */
export async function inheritProductMasterToRawMaterials(productMasterId: string) {
  const supabase = createClient()

  // 1. 품목 마스터 정보 조회
  const { data: productMaster, error: masterError } = await supabase
    .from('products_master')
    .select('*')
    .eq('id', productMasterId)
    .single()

  if (masterError || !productMaster) {
    console.error('Failed to fetch product master:', masterError)
    return { success: false, error: masterError }
  }

  // 2. 해당 품목 마스터와 연결된 모든 원물 업데이트
  const { error: updateError, count } = await supabase
    .from('raw_materials')
    .update({
      category_1: productMaster.category_1,
      category_2: productMaster.category_2,
      category_3: productMaster.category_3,
      category_4: productMaster.category_4,
      raw_material_status: productMaster.raw_material_status,
      shipping_deadline: productMaster.shipping_deadline,
      season_start_date: productMaster.season_start_date,
      season_end_date: productMaster.season_end_date,
      seller_supply: productMaster.seller_supply,
      is_best: productMaster.is_best,
      is_recommended: productMaster.is_recommended,
      has_image: productMaster.has_image,
      has_detail_page: productMaster.has_detail_page
    })
    .eq('product_master_id', productMasterId)

  if (updateError) {
    console.error('Failed to update raw materials:', updateError)
    return { success: false, error: updateError }
  }

  console.log(`✅ 품목 마스터 → 원물: ${count || 0}개 업데이트`)
  return { success: true, updatedCount: count || 0 }
}

/**
 * 원물(raw_materials)의 모든 속성을 해당 원물과 매칭된 모든 옵션상품에 상속
 * 상속 필드: category_1~4, raw_material_status, shipping_deadline, season_start_date, season_end_date,
 *           seller_supply, is_best, is_recommended, has_image, has_detail_page
 */
export async function inheritRawMaterialToOptionProducts(rawMaterialId: string) {
  const supabase = createClient()

  // 1. 원물 정보 조회
  const { data: rawMaterial, error: rawMaterialError } = await supabase
    .from('raw_materials')
    .select('*')
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
    console.log('⚠️ 매칭된 옵션상품이 없습니다.')
    return { success: true, updatedCount: 0 } // 매칭된 옵션상품이 없으면 성공으로 처리
  }

  // 3. 매칭된 옵션상품들 업데이트
  const optionProductIds = materialLinks.map(link => link.option_product_id)
  const { error: updateError, count } = await supabase
    .from('option_products')
    .update({
      category_1: rawMaterial.category_1,
      category_2: rawMaterial.category_2,
      category_3: rawMaterial.category_3,
      category_4: rawMaterial.category_4,
      product_master_id: rawMaterial.product_master_id,
      shipping_deadline: rawMaterial.shipping_deadline,
      season_start_date: rawMaterial.season_start_date,
      season_end_date: rawMaterial.season_end_date,
      seller_supply: rawMaterial.seller_supply,
      is_best: rawMaterial.is_best,
      is_recommended: rawMaterial.is_recommended,
      has_image: rawMaterial.has_image,
      has_detail_page: rawMaterial.has_detail_page
    })
    .in('id', optionProductIds)

  if (updateError) {
    console.error('Failed to update option products:', updateError)
    return { success: false, error: updateError }
  }

  console.log(`✅ 원물 → 옵션상품: ${count || 0}개 업데이트`)
  return { success: true, updatedCount: count || 0 }
}

/**
 * 품목 마스터 업데이트 시 전체 상속 체인 실행
 * products_master → raw_materials → option_products
 */
export async function inheritProductMasterToAllDescendants(productMasterId: string) {
  const supabase = createClient()

  console.log(`🔄 품목 마스터 상속 시작: ${productMasterId}`)

  // 1. 품목 마스터 → 원물 상속
  const result1 = await inheritProductMasterToRawMaterials(productMasterId)
  if (!result1.success) {
    return result1
  }

  // 2. 해당 품목 마스터와 연결된 모든 원물 조회
  const { data: rawMaterials, error: rawMaterialsError } = await supabase
    .from('raw_materials')
    .select('id')
    .eq('product_master_id', productMasterId)

  if (rawMaterialsError) {
    console.error('Failed to fetch raw materials:', rawMaterialsError)
    return { success: false, error: rawMaterialsError }
  }

  // 3. 각 원물 → 옵션상품 상속
  let totalOptionProductsUpdated = 0
  if (rawMaterials && rawMaterials.length > 0) {
    for (const rawMaterial of rawMaterials) {
      const result2 = await inheritRawMaterialToOptionProducts(rawMaterial.id)
      if (result2.success) {
        totalOptionProductsUpdated += result2.updatedCount || 0
      }
    }
  }

  console.log(`✅ 전체 상속 완료: 원물 ${result1.updatedCount}개, 옵션상품 ${totalOptionProductsUpdated}개`)

  return {
    success: true,
    rawMaterialsUpdated: result1.updatedCount || 0,
    optionProductsUpdated: totalOptionProductsUpdated
  }
}

/**
 * 원물 업데이트 시 옵션상품으로 상속
 */
export async function inheritRawMaterialToAllOptionProducts(rawMaterialId: string) {
  console.log(`🔄 원물 상속 시작: ${rawMaterialId}`)
  const result = await inheritRawMaterialToOptionProducts(rawMaterialId)

  if (result.success) {
    console.log(`✅ 원물 상속 완료: 옵션상품 ${result.updatedCount}개`)
  }

  return result
}

/**
 * 품목 마스터의 product_master_id로 원물 자동 연결
 */
export async function linkRawMaterialsToProductMaster(productMasterId: string) {
  const supabase = createClient()

  // 1. 품목 마스터 정보 조회
  const { data: productMaster, error: masterError } = await supabase
    .from('products_master')
    .select('category_3')
    .eq('id', productMasterId)
    .single()

  if (masterError || !productMaster) {
    console.error('Failed to fetch product master:', masterError)
    return { success: false, error: masterError }
  }

  // 2. category_3(품목) 기준으로 원물의 product_master_id 업데이트
  const { error: updateError, count } = await supabase
    .from('raw_materials')
    .update({ product_master_id: productMasterId })
    .eq('category_4', productMaster.category_3)
    .is('product_master_id', null) // 아직 연결되지 않은 원물만

  if (updateError) {
    console.error('Failed to link raw materials:', updateError)
    return { success: false, error: updateError }
  }

  console.log(`✅ 원물 연결 완료: ${count || 0}개`)
  return { success: true, linkedCount: count || 0 }
}
