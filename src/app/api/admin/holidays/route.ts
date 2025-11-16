import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';

/**
 * GET /api/admin/holidays
 * 공휴일 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const url = new URL(request.url);
    const year = url.searchParams.get('year') || new Date().getFullYear().toString();

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('holiday_date', `${year}-01-01`)
      .lte('holiday_date', `${year}-12-31`)
      .order('holiday_date', { ascending: true });

    if (error) {
      logger.error('공휴일 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, holidays: data });
  } catch (error: any) {
    logger.error('GET /api/admin/holidays 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/holidays
 * 임시공휴일/발송휴무일 추가
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { holiday_date, holiday_name, holiday_type } = body;

    if (!holiday_date || !holiday_name || !holiday_type) {
      return NextResponse.json(
        { success: false, error: '필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!['temporary', 'shipping_closed', 'task', 'product_info'].includes(holiday_type)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 일정 타입입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        holiday_date,
        holiday_name,
        holiday_type,
        created_by: auth.user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('휴무일 추가 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, holiday: data });
  } catch (error: any) {
    logger.error('POST /api/admin/holidays 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/holidays/load
 * 국공휴일 일괄 불러오기
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { year } = body;

    if (!year) {
      return NextResponse.json(
        { success: false, error: '연도를 입력해주세요.' },
        { status: 400 }
      );
    }

    // JSON 파일에서 공휴일 데이터 읽기
    const filePath = path.join(process.cwd(), 'public', 'data', 'holidays.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const holidaysData = JSON.parse(fileData);

    const yearData = holidaysData[year.toString()];

    if (!yearData || yearData.length === 0) {
      return NextResponse.json(
        { success: false, error: `${year}년 공휴일 데이터가 없습니다.` },
        { status: 404 }
      );
    }

    // 기존 해당 연도 국공휴일 삭제
    await supabase
      .from('holidays')
      .delete()
      .eq('holiday_type', 'national')
      .gte('holiday_date', `${year}-01-01`)
      .lte('holiday_date', `${year}-12-31`);

    // 새로운 공휴일 일괄 등록
    const holidays = yearData.map((h: any) => ({
      holiday_date: h.date,
      holiday_name: h.name,
      holiday_type: 'national'
    }));

    const { error } = await supabase
      .from('holidays')
      .insert(holidays);

    if (error) {
      logger.error('공휴일 일괄 등록 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${year}년 국공휴일 ${holidays.length}개가 등록되었습니다.`
    });
  } catch (error: any) {
    logger.error('PUT /api/admin/holidays 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/holidays
 * 공휴일 삭제 (임시공휴일만 가능)
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 국공휴일은 삭제 불가
    const { data: holiday } = await supabase
      .from('holidays')
      .select('holiday_type')
      .eq('id', id)
      .single();

    if (holiday?.holiday_type === 'national') {
      return NextResponse.json(
        { success: false, error: '국공휴일은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('공휴일 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('DELETE /api/admin/holidays 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
