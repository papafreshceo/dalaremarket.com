import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminClientLayout from './admin-client-layout';
import { headers } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();

    // 쿠키 헤더 확인 (디버깅용)
    const headersList = await headers();
    const cookie = headersList.get('cookie');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminLayout] Cookie header:', cookie?.substring(0, 100));
    }

    // 인증 확인 - getUser()는 JWT 토큰을 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminLayout] Auth check:', { 
        hasUser: !!user, 
        error: authError?.message,
        userId: user?.id 
      });
    }

    if (authError || !user) {
      console.log('[AdminLayout] No auth, redirecting to platform login');
      redirect('/platform?login=true&redirect=/admin');
    }

    // 사용자 정보 및 역할 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, approved')
      .eq('id', user.id)
      .single();

    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminLayout] User data:', { 
        found: !!userData, 
        role: userData?.role,
        approved: userData?.approved,
        error: userError?.message 
      });
    }

    // 승인되지 않은 사용자는 로그아웃 후 로그인 페이지로
    if (!userData || !userData.approved) {
      console.log('[AdminLayout] User not approved, signing out');
      await supabase.auth.signOut();
      redirect('/platform?login=true&error=not-approved');
    }

    // 관리자가 아니면 접근 불가
    const adminRoles = ['admin', 'employee', 'super_admin'];
    if (!adminRoles.includes(userData.role)) {
      console.log('[AdminLayout] Not admin role, redirecting');
      redirect('/');
    }

    // Client Component에 인증 정보 전달
    return (
      <AdminClientLayout
        initialUser={user}
        initialUserData={userData}
      >
        {children}
      </AdminClientLayout>
    );
  } catch (error) {
    console.error('[AdminLayout] Unexpected error:', error);
    redirect('/platform?login=true&error=unexpected');
  }
}
