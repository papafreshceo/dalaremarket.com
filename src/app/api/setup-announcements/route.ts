import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      -- Create announcements table
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        is_pinned BOOLEAN DEFAULT FALSE,
        published BOOLEAN DEFAULT TRUE,
        view_count INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
      CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
      CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
    `;

    // Note: RLS policies need to be set up manually in Supabase dashboard
    // or using supabase CLI

    return NextResponse.json({
      message: 'Please execute the SQL in database/migrations/create_announcements_table.sql manually in Supabase SQL Editor',
      sql
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to setup table' },
      { status: 500 }
    );
  }
}
