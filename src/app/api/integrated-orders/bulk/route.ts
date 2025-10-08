import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST: 대량 주문 생성 (엑셀 업로드용)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!Array.isArray(body.orders) || body.orders.length === 0) {
      return NextResponse.json(
        { error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 대량 삽입 데이터 준비
    const ordersData = body.orders.map((order: any) => ({
      sheet_date: order.sheet_date || new Date().toISOString().split('T')[0],
      market_name: order.market_name,
      order_number: order.order_number,
      payment_date: order.payment_date || null,
      recipient_name: order.recipient_name,
      recipient_phone: order.recipient_phone || null,
      recipient_address: order.recipient_address || null,
      recipient_zipcode: order.recipient_zipcode || null,
      delivery_message: order.delivery_message || null,
      option_name: order.option_name,
      quantity: order.quantity || 1,
      seller_supply_price: order.seller_supply_price || null,
      shipping_status: order.shipping_status || '미발송',
      tracking_number: order.tracking_number || null,
      courier_company: order.courier_company || null,
      shipped_date: order.shipped_date || null,
      cs_status: order.cs_status || null,
      cs_type: order.cs_type || null,
      cs_memo: order.cs_memo || null,
      memo: order.memo || null,
      tags: order.tags || null,
      created_by: user.id,
      updated_by: user.id,
    }))

    // upsert 옵션 (중복 시 업데이트)
    const { data, error } = await supabase
      .from('integrated_orders')
      .upsert(ordersData, {
        onConflict: 'market_name,order_number,option_name',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '대량 주문 생성 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 대량 주문 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!Array.isArray(body.orders) || body.orders.length === 0) {
      return NextResponse.json(
        { error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const results = []
    const errors = []

    // 각 주문을 개별적으로 업데이트 (트랜잭션 대안)
    for (const order of body.orders) {
      if (!order.id) {
        errors.push({ order, error: 'ID가 없습니다.' })
        continue
      }

      const { id, ...updateData } = order
      updateData.updated_by = user.id

      const { data, error } = await supabase
        .from('integrated_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        errors.push({ order, error: error.message })
      } else {
        results.push(data)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: results,
      successCount: results.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 대량 주문 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 주문 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('integrated_orders')
      .delete()
      .in('id', body.ids)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '대량 삭제 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
