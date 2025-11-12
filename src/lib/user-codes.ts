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
 * 파트너 코드 생성 (P + yydd + 밀리초 4자리)
 * 예: P25011234 (25년 01일 + 밀리초 4자리)
 */
export async function generatePartnerCode(): Promise<string> {
  const supabase = await createClient()

  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const dd = now.getDate().toString().padStart(2, '0')
    const ms = now.getMilliseconds().toString().padStart(4, '0')
    const yydd = yy + dd

    const code = `P${yydd}${ms}`

    // 중복 확인
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('partner_code', code)
      .single()

    if (!data) {
      return code
    }

    attempts++
    // 중복 시 1ms 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 1))
  }

  throw new Error('Failed to generate unique partner code')
}

/**
 * 사용자에게 역할에 맞는 코드 할당
 */
export async function assignUserCode(userId: string, role: 'seller' | 'partner'): Promise<string | null> {
  const supabase = await createClient()

  try {
    if (role === 'seller') {
      const code = await generateSellerCode()
      const { error } = await supabase
        .from('users')
        .update({ seller_code: code })
        .eq('id', userId)

      if (error) throw error
      return code
    } else if (role === 'partner') {
      const code = await generatePartnerCode()
      const { error } = await supabase
        .from('users')
        .update({ partner_code: code })
        .eq('id', userId)

      if (error) throw error
      return code
    }

    return null
  } catch (error) {
    console.error('Failed to assign user code:', error)
    return null
  }
}
