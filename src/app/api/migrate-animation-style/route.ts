import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Add animation_style column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE supply_status_settings
        ADD COLUMN IF NOT EXISTS animation_style TEXT DEFAULT 'minimal_dot';
      `
    });

    if (alterError) {
      // Try alternative approach using direct query
      const { error } = await supabase
        .from('supply_status_settings')
        .select('animation_style')
        .limit(1);

      if (error && error.message.includes('column')) {
        return NextResponse.json(
          { error: 'Failed to add column. Please add manually via Supabase dashboard.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
