import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminClientLayout from './admin-client-layout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // 사용자 역할 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // 관리자가 아니면 접근 불가
  const adminRoles = ['admin', 'employee', 'super_admin'];
  if (!userData || !adminRoles.includes(userData.role)) {
    redirect('/');
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
