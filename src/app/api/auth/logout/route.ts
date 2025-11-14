import { createClientForRouteHandler } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClientForRouteHandler()
  await supabase.auth.signOut()
  redirect('/')
}