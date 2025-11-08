import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create tool_usage table and related objects
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create tool_usage table for tracking tool usage
        CREATE TABLE IF NOT EXISTS tool_usage (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tool_id TEXT NOT NULL,
          used_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_user_tool ON tool_usage(user_id, tool_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage(used_at);

        -- Add comments
        COMMENT ON TABLE tool_usage IS '사용자별 도구 사용 이력 추적';
        COMMENT ON COLUMN tool_usage.user_id IS '사용자 ID';
        COMMENT ON COLUMN tool_usage.tool_id IS '도구 ID (margin-calculator, price-simulator 등)';
        COMMENT ON COLUMN tool_usage.used_at IS '도구 사용 시각';

        -- Create function to get usage count for user
        CREATE OR REPLACE FUNCTION get_user_tool_usage_counts(p_user_id UUID)
        RETURNS TABLE(tool_id TEXT, usage_count BIGINT) AS $func$
        BEGIN
          RETURN QUERY
          SELECT
            t.tool_id,
            COUNT(*)::BIGINT as usage_count
          FROM tool_usage t
          WHERE t.user_id = p_user_id
          GROUP BY t.tool_id;
        END;
        $func$ LANGUAGE plpgsql;

        COMMENT ON FUNCTION get_user_tool_usage_counts IS '사용자의 도구별 사용 횟수 조회';
      `
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'tool_usage table and functions created successfully'
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
