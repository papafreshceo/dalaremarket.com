import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Add option_code column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE integrated_orders
        ADD COLUMN IF NOT EXISTS option_code TEXT;

        COMMENT ON COLUMN integrated_orders.option_code IS '옵션코드 - 플랫폼 주문의 옵션 코드 (옵션상품의 대안)';
      `
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'option_code column added successfully'
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
