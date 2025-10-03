import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = await createClient()
  
  // 이메일 확인 처리
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/auth/login')
  } else {
    redirect('/auth/login')
  }
}