import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { customers } = await request.json();

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update each customer
    const updatePromises = customers.map((customer: any) => {
      const { id, ...updateData } = customer;

      return supabase
        .from('regular_customers')
        .update(updateData)
        .eq('id', id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      count: customers.length,
    });
  } catch (error: any) {
    logger.error('단골 고객 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
