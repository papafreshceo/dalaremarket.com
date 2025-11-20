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

  // 사용자 정보 및 역할 확인 (모든 필요한 필드를 한번에 조회)
  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, role, approved')
    .eq('id', user.id)
    .single();

  // 승인되지 않은 사용자는 로그아웃 후 로그인 페이지로
  if (!userData || !userData.approved) {
    await supabase.auth.signOut();
    redirect('/auth/login?error=not-approved');
  }

  // 관리자가 아니면 접근 불가
  const adminRoles = ['admin', 'employee', 'super_admin'];
  if (!adminRoles.includes(userData.role)) {
    redirect('/');
  }

  // Client Component에 인증 정보 전달 (중복 쿼리 방지)
  return (
    <AdminClientLayout
      initialUser={user}
      initialUserData={userData}
    >
      {children}
    </AdminClientLayout>
  );
}
