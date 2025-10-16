import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 권한 확인 (super_admin만 실행 가능)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 마이그레이션 파일 읽기
    const sqlPath = path.join(
      process.cwd(),
      'database/migrations/057_create_permissions_system.sql'
    )
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // SQL 실행 (여러 쿼리를 개별적으로 실행)
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))

    const results = []
    for (const query of queries) {
      if (query.toUpperCase().includes('DO $$')) {
        // DO 블록은 전체를 실행
        const { error } = await supabase.rpc('exec_sql', { sql: query })
        if (error) {
          console.error('쿼리 실행 오류:', error)
          results.push({ query: query.substring(0, 50) + '...', error: error.message })
        } else {
          results.push({ query: query.substring(0, 50) + '...', success: true })
        }
      } else if (query.trim()) {
        // 일반 쿼리 실행
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: query })
          if (error) {
            console.error('쿼리 실행 오류:', error)
            results.push({ query: query.substring(0, 50) + '...', error: error.message })
          } else {
            results.push({ query: query.substring(0, 50) + '...', success: true })
          }
        } catch (e: any) {
          results.push({ query: query.substring(0, 50) + '...', error: e.message })
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('마이그레이션 실행 오류:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
