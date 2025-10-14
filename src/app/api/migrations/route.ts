import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'filename is required' },
        { status: 400 }
      );
    }

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', filename);

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { success: false, error: 'Migration file not found' },
        { status: 404 }
      );
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Supabase 클라이언트로 SQL 실행
    const supabase = await createClient();

    // SQL을 세미콜론으로 분리하여 개별 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      if (error) {
        console.error('SQL execution error:', error);
        return NextResponse.json(
          { success: false, error: error.message, statement },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration ${filename} executed successfully`,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
