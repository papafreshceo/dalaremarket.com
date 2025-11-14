import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-security';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/run-migration
 * 통계 함수 마이그레이션 실행 (Super Admin만 가능)
 */
export async function POST(request: NextRequest) {
  // 🔒 보안: Super Admin만 접근 가능
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();

    // Service Role 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('📊 통계 함수 업데이트 시작...');

    // SQL 파일 읽기
    const sqlPath = path.join(process.cwd(), 'database', 'migrations', 'update_statistics_function_for_organization.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // SQL을 개별 문장으로 분리 및 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let executedCount = 0;

    for (const statement of statements) {
      if (statement.includes('DROP FUNCTION')) {
        console.log('🗑️ 기존 함수 삭제...');
        try {
          // DROP FUNCTION은 무시 (없을 수도 있음)
          await supabaseAdmin.rpc('exec', { sql: statement });
        } catch (e) {
          console.log('⚠️ DROP FUNCTION 무시 (함수가 없을 수 있음)');
        }
        executedCount++;
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log('✨ 새 함수 생성...');

        // Supabase에서는 직접 CREATE FUNCTION을 실행할 수 없으므로
        // SQL Editor를 통해 수동으로 실행해야 함
        return NextResponse.json({
          success: false,
          error: 'Supabase에서는 JavaScript API를 통해 함수를 생성할 수 없습니다.',
          message: 'Supabase Dashboard > SQL Editor에서 다음 파일을 실행하세요:',
          sqlPath: 'database/migrations/update_statistics_function_for_organization.sql',
          sqlContent: sql
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${executedCount}개의 SQL 문장 실행 완료`,
    });

  } catch (error: any) {
    console.error('❌ 마이그레이션 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
