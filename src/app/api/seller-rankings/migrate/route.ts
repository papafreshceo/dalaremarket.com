import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 셀러 랭킹 시스템 마이그레이션 API
 *
 * POST /api/seller-rankings/migrate
 *
 * 관리자만 실행 가능
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (users 테이블의 role 확인)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 마이그레이션 SQL 파일 읽기
    const sqlFilePath = path.join(process.cwd(), 'database', 'migrations', 'all_seller_ranking_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // SQL을 세미콜론으로 분리하여 개별 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results: Array<{ success: boolean; statement: string; error?: any }> = [];

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_custom_sql', {
          sql_text: statement
        });

        if (error) {
          // RPC가 없으면 직접 실행 시도
          console.error('RPC error, trying direct execution:', error);
          results.push({
            success: false,
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
        } else {
          results.push({
            success: true,
            statement: statement.substring(0, 100) + '...'
          });
        }
      } catch (err: any) {
        results.push({
          success: false,
          statement: statement.substring(0, 100) + '...',
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `마이그레이션 완료: 성공 ${successCount}개, 실패 ${failCount}개`,
      results,
      instructions: failCount > 0 ?
        'Supabase Dashboard에서 직접 SQL을 실행해주세요: https://supabase.com/dashboard/project/qxhpgjftkkcxdttgjkzj/sql/new' :
        '모든 마이그레이션이 성공적으로 완료되었습니다.'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '마이그레이션 실행 중 오류가 발생했습니다.',
        details: error.message,
        instructions: 'Supabase Dashboard에서 직접 SQL을 실행해주세요: https://supabase.com/dashboard/project/qxhpgjftkkcxdttgjkzj/sql/new\n\n파일 경로: database/migrations/all_seller_ranking_tables.sql'
      },
      { status: 500 }
    );
  }
}
