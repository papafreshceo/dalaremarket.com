'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

export default function DatabaseFixPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const supabase = createClient()
  const { showToast } = useToast()

  const checkUsersTable = async () => {
    setLoading(true)
    setResult('')

    try {
      // 1. users 테이블 구조 확인
      const { data: sample, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      if (sampleError) {
        setResult(`❌ 에러: ${sampleError.message}\n\n${JSON.stringify(sampleError, null, 2)}`)
        showToast('사용자 테이블 조회 실패', 'error')
        return
      }

      let output = '✅ users 테이블 구조:\n'
      output += JSON.stringify(sample, null, 2)
      output += '\n\n'

      // 2. approved 컬럼이 있는지 확인
      if (sample && sample.length > 0) {
        const hasApproved = 'approved' in sample[0]
        output += hasApproved
          ? '✅ approved 컬럼 존재함\n\n'
          : '❌ approved 컬럼 없음 - 테이블 구조를 확인하세요!\n\n'
      }

      // 3. 승인되지 않은 사용자 확인
      const { data: unapproved, error: unapprovedError } = await supabase
        .from('users')
        .select('id, email, name, role, approved, created_at')
        .eq('approved', false)

      if (unapprovedError) {
        output += `⚠️ 승인 대기 사용자 조회 실패:\n${unapprovedError.message}\n\n`
      } else {
        output += `📋 승인 대기 사용자: ${unapproved?.length || 0}명\n`
        if (unapproved && unapproved.length > 0) {
          output += JSON.stringify(unapproved, null, 2)
        }
      }

      setResult(output)
      showToast('확인 완료', 'success')
    } catch (error: any) {
      setResult(`❌ 예외 발생: ${error.message}`)
      showToast('오류 발생', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testApprovalUpdate = async () => {
    setLoading(true)
    setResult('')

    try {
      // 승인되지 않은 사용자 찾기
      const { data: unapproved, error: findError } = await supabase
        .from('users')
        .select('id, email, name, approved')
        .eq('approved', false)
        .limit(1)

      if (findError) {
        setResult(`❌ 사용자 조회 실패: ${findError.message}`)
        return
      }

      if (!unapproved || unapproved.length === 0) {
        setResult('ℹ️ 승인 대기중인 사용자가 없습니다.')
        return
      }

      const user = unapproved[0]
      let output = `🧪 테스트 대상: ${user.email}\n\n`

      // 승인 시도
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ approved: true })
        .eq('id', user.id)
        .select()

      if (updateError) {
        output += `❌ 업데이트 실패:\n`
        output += `에러 코드: ${updateError.code}\n`
        output += `에러 메시지: ${updateError.message}\n`
        output += `상세 정보:\n${JSON.stringify(updateError, null, 2)}\n\n`

        if (updateError.message.includes('policy')) {
          output += `\n⚠️ RLS (Row Level Security) 정책 문제로 보입니다.\n`
          output += `Supabase 대시보드에서 다음 SQL을 실행하세요:\n\n`
          output += `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
        }
      } else {
        output += `✅ 업데이트 성공!\n`
        output += `결과:\n${JSON.stringify(updateData, null, 2)}\n\n`

        // 원복
        await supabase
          .from('users')
          .update({ approved: false })
          .eq('id', user.id)

        output += `✅ 테스트 완료 후 원복함`
      }

      setResult(output)
      showToast('테스트 완료', 'success')
    } catch (error: any) {
      setResult(`❌ 예외 발생: ${error.message}`)
      showToast('오류 발생', 'error')
    } finally {
      setLoading(false)
    }
  }

  const executeRLSFix = async () => {
    setLoading(true)
    setResult('')

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
      })

      if (error) {
        setResult(`❌ RLS 비활성화 실패:\n${error.message}\n\n`)
        setResult(prev => prev + `\n⚠️ 이 작업은 Supabase 대시보드에서 직접 실행해야 합니다.\n`)
        setResult(prev => prev + `SQL Editor에서 다음을 실행하세요:\n\n`)
        setResult(prev => prev + `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`)
      } else {
        setResult(`✅ RLS 비활성화 성공!`)
        showToast('RLS 비활성화 완료', 'success')
      }
    } catch (error: any) {
      setResult(`❌ 예외 발생: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text">데이터베이스 문제 해결</h1>
        <p className="mt-1 text-[14px] text-text-secondary">사용자 승인 문제 진단 및 해결</p>
      </div>

      <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
        <div>
          <h2 className="text-[16px] font-semibold text-text mb-4">진단 도구</h2>

          <div className="space-y-3">
            <button
              onClick={checkUsersTable}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white text-[14px] rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '확인 중...' : '1. users 테이블 구조 확인'}
            </button>

            <button
              onClick={testApprovalUpdate}
              disabled={loading}
              className="w-full px-4 py-3 bg-green-600 text-white text-[14px] rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '테스트 중...' : '2. 승인 업데이트 테스트'}
            </button>

            <div className="border-t border-border pt-3 mt-3">
              <p className="text-[12px] text-text-secondary mb-2">
                ⚠️ 아래 버튼은 작동하지 않을 수 있습니다. 에러 발생 시 Supabase 대시보드에서 직접 실행하세요.
              </p>
              <button
                onClick={executeRLSFix}
                disabled={loading}
                className="w-full px-4 py-3 bg-orange-600 text-white text-[14px] rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '실행 중...' : '3. RLS 비활성화 (고급)'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-6">
            <h3 className="text-[14px] font-semibold text-text mb-2">결과:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-[12px] overflow-x-auto whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h3 className="text-[14px] font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            수동 해결 방법
          </h3>
          <p className="text-[12px] text-yellow-700 dark:text-yellow-300 mb-2">
            위 도구로 해결되지 않는 경우, Supabase 대시보드에서 직접 실행하세요:
          </p>
          <ol className="list-decimal list-inside text-[12px] text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>Supabase 대시보드 → SQL Editor 열기</li>
            <li>다음 SQL 실행:</li>
          </ol>
          <pre className="mt-2 bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded text-[11px] overflow-x-auto">
ALTER TABLE users DISABLE ROW LEVEL SECURITY;</pre>
        </div>
      </div>
    </div>
    </div>
  )
}
