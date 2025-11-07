import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'database', 'migrations', 'add_platform_notices_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];

    for (const statement of statements) {
      try {
        // Execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          results.push({
            statement: statement.substring(0, 100),
            success: false,
            error: error.message
          });
        } else {
          results.push({
            statement: statement.substring(0, 100),
            success: true
          });
        }
      } catch (err: any) {
        results.push({
          statement: statement.substring(0, 100),
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Applied ${successCount} policies successfully, ${failCount} failed`,
      results
    });

  } catch (error: any) {
    console.error('Error applying RLS:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
