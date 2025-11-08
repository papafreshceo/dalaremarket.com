import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Add favorite_tools column
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS favorite_tools TEXT[] DEFAULT ARRAY['margin-calculator', 'price-simulator'];

        COMMENT ON COLUMN users.favorite_tools IS '사용자가 즐겨찾기한 도구 ID 목록';
      `
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'favorite_tools column added to users table'
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
