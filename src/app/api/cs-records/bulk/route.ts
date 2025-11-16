import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { records } = await request.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update each record
    const updatePromises = records.map((record: any) => {
      const { id, ...updateData } = record;

      // Auto-set processing_datetime when status changes to '완료'
      if (updateData.status === '완료' && !updateData.processing_datetime) {
        updateData.processing_datetime = new Date().toISOString();
      }

      return supabase
        .from('cs_records')
        .update(updateData)
        .eq('id', id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      count: records.length,
    });
  } catch (error: any) {
    logger.error('CS 기록 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
