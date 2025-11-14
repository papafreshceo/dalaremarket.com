import { createClient } from '@/lib/supabase/server'

/**
 * 셀러 코드 생성 (S + yydd + 밀리초 4자리)
 * 예: S25011234 (25년 01일 + 밀리초 4자리)
 */
export async function generateSellerCode(): Promise<string> {
  const supabase = await createClient()

  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const dd = now.getDate().toString().padStart(2, '0')
    const ms = now.getMilliseconds().toString().padStart(4, '0')
    const yydd = yy + dd

    const code = `S${yydd}${ms}`

    // 중복 확인
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('seller_code', code)
      .single()

    if (!data) {
      return code
    }

    attempts++
    // 중복 시 1ms 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 1))
  }

  throw new Error('Failed to generate unique seller code')
}


/**
 * 사용자에게 셀러 코드 할당
 */
export async function assignUserCode(userId: string): Promise<string | null> {
  const supabase = await createClient()

  try {
    const code = await generateSellerCode()
    const { error } = await supabase
      .from('users')
      .update({ seller_code: code })
      .eq('id', userId)

    if (error) throw error
    return code
  } catch (error) {
    console.error('Failed to assign user code:', error)
    return null
  }
}

/**
 * 사용자의 organization에 셀러코드 생성 및 할당
 */
export async function generateUserCodes(userId: string): Promise<{ sellerCode: string }> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()

  // 셀러코드 생성
  const sellerCode = await generateSellerCode()

  // 사용자의 organization 찾기
  const { data: user } = await supabase
    .from('users')
    .select('primary_organization_id')
    .eq('id', userId)
    .single()

  if (!user?.primary_organization_id) {
    throw new Error('User has no primary organization')
  }

  // organization에 셀러코드 할당
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ seller_code: sellerCode })
    .eq('id', user.primary_organization_id)

  if (orgError) {
    console.error('Failed to assign seller code to organization:', orgError)
    throw orgError
  }

  return { sellerCode }
}
