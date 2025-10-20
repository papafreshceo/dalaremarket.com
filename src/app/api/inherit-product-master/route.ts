import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { productMasterId } = await request.json()

    if (!productMasterId) {
      return NextResponse.json(
        { success: false, error: 'productMasterId is required' },
        { status: 400 }
      )
    }

    // Service Role Key로 RLS 우회
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. 품목 마스터 정보 조회
    const { data: productMaster, error: masterError } = await supabase
      .from('products_master')
      .select('*')
      .eq('id', productMasterId)
      .single()

    if (masterError || !productMaster) {
      console.error('Failed to fetch product master:', masterError)
      return NextResponse.json(
        { success: false, error: masterError },
        { status: 500 }
      )
    }

    // 2. 원물 업데이트 (카테고리와 시즌 정보만)
    const { error: rawUpdateError, count: rawCount } = await supabase
      .from('raw_materials')
      .update({
        category_1: productMaster.category_1,
        category_2: productMaster.category_2,
        category_3: productMaster.category_3,
        category_4: productMaster.category_4,
        category_5: productMaster.category_5,
        season_start_date: productMaster.season_start_date,
        season_end_date: productMaster.season_end_date,
        shipping_deadline: productMaster.shipping_deadline
      })
      .eq('product_master_id', productMasterId)

    if (rawUpdateError) {
      console.error('Failed to update raw materials:', rawUpdateError)
      return NextResponse.json(
        { success: false, error: rawUpdateError },
        { status: 500 }
      )
    }

    // 3. 옵션상품 업데이트 (카테고리와 시즌 정보만)
    const { error: optionUpdateError, count: optionCount } = await supabase
      .from('option_products')
      .update({
        category_1: productMaster.category_1,
        category_2: productMaster.category_2,
        category_3: productMaster.category_3,
        category_4: productMaster.category_4,
        category_5: productMaster.category_5,
        season_start_date: productMaster.season_start_date,
        season_end_date: productMaster.season_end_date,
        shipping_deadline: productMaster.shipping_deadline
      })
      .eq('product_master_id', productMasterId)

    if (optionUpdateError) {
      console.error('Failed to update option products:', optionUpdateError)
      return NextResponse.json(
        { success: false, error: optionUpdateError },
        { status: 500 }
      )
    }

    console.log(`✅ 상속 완료: 원물 ${rawCount || 0}개, 옵션상품 ${optionCount || 0}개`)

    return NextResponse.json({
      success: true,
      rawMaterialsUpdated: rawCount || 0,
      optionProductsUpdated: optionCount || 0
    })
  } catch (error) {
    console.error('Inheritance error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
