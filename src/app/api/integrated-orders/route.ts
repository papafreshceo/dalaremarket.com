import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: 주문 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터 추출
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const dateType = searchParams.get('dateType') || 'sheet' // 'sheet' | 'payment'
    const searchKeyword = searchParams.get('searchKeyword')
    const marketName = searchParams.get('marketName')
    const shippingStatus = searchParams.get('shippingStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    // 기본 쿼리 시작
    let query = supabase
      .from('integrated_orders')
      .select('*', { count: 'exact' })

    // 날짜 필터
    if (startDate && endDate) {
      const dateColumn = dateType === 'payment' ? 'payment_date' : 'sheet_date'
      query = query.gte(dateColumn, startDate).lte(dateColumn, endDate)
    }

    // 마켓명 필터
    if (marketName) {
      query = query.eq('market_name', marketName)
    }

    // 발송상태 필터
    if (shippingStatus) {
      query = query.eq('shipping_status', shippingStatus)
    }

    // 검색어 필터 (주문번호, 수취인명)
    if (searchKeyword) {
      query = query.or(`order_number.ilike.%${searchKeyword}%,recipient_name.ilike.%${searchKeyword}%`)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // 정렬 (최신순)
    query = query.order('sheet_date', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '주문 조회 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 주문 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // 필수 필드 검증
    const requiredFields = ['market_name', 'order_number', 'recipient_name', 'option_name', 'quantity']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}` },
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

    // 주문 데이터 준비
    const orderData = {
      sheet_date: body.sheet_date || new Date().toISOString().split('T')[0],
      market_name: body.market_name,
      order_number: body.order_number,
      payment_date: body.payment_date || null,
      recipient_name: body.recipient_name,
      recipient_phone: body.recipient_phone || null,
      recipient_address: body.recipient_address || null,
      recipient_zipcode: body.recipient_zipcode || null,
      delivery_message: body.delivery_message || null,
      option_name: body.option_name,
      quantity: body.quantity,
      seller_supply_price: body.seller_supply_price || null,
      shipping_status: body.shipping_status || '미발송',
      tracking_number: body.tracking_number || null,
      courier_company: body.courier_company || null,
      shipped_date: body.shipped_date || null,
      cs_status: body.cs_status || null,
      cs_type: body.cs_type || null,
      cs_memo: body.cs_memo || null,
      memo: body.memo || null,
      tags: body.tags || null,
      created_by: user.id,
      updated_by: user.id,
    }

    const { data, error } = await supabase
      .from('integrated_orders')
      .insert(orderData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '주문 생성 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 주문 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: '주문 ID가 필요합니다.' },
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

    // 업데이트할 데이터 준비 (id 제외)
    const { id, ...updateData } = body
    updateData.updated_by = user.id

    const { data, error } = await supabase
      .from('integrated_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '주문 수정 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 주문 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '주문 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('integrated_orders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '주문 삭제 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '주문이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
