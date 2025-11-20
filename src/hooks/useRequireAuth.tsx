'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseRequireAuthOptions {
  /**
   * 필수 역할 (선택 사항)
   * 지정하면 해당 역할이 있는지 확인
   */
  requiredRole?: 'admin' | 'super_admin' | 'employee' | 'user';

  /**
   * 승인된 사용자만 허용 (기본값: true)
   */
  requireApproved?: boolean;

  /**
   * 인증 실패 시 리다이렉트 경로 (기본값: '/platform?login=true')
   */
  redirectTo?: string;
}

interface UseRequireAuthReturn {
  /**
   * 현재 인증된 사용자 (로딩 중이거나 인증되지 않으면 null)
   */
  user: User | null;

  /**
   * 사용자 역할
   */
  userRole: string | null;

  /**
   * 인증 상태 확인 중인지 여부
   */
  loading: boolean;

  /**
   * 인증된 사용자인지 여부
   */
  isAuthenticated: boolean;
}

/**
 * 보호된 페이지에서 사용하는 인증 Hook
 *
 * 사용 예시:
 * ```tsx
 * const { user, loading, isAuthenticated } = useRequireAuth({
 *   requiredRole: 'admin', // 선택 사항
 *   requireApproved: true,
 *   redirectTo: '/auth/login'
 * });
 *
 * if (loading) return <div>로딩 중...</div>;
 * if (!isAuthenticated) return null; // 리다이렉트 중
 *
 * return <div>보호된 컨텐츠</div>;
 * ```
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const {
    requiredRole,
    requireApproved = true,
    redirectTo = '/platform?login=true'
  } = options;

  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // 1. 현재 사용자 세션 확인
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (!isMounted) return;

        // 인증되지 않은 경우
        if (authError || !currentUser) {
          console.warn('인증되지 않은 사용자 접근 시도');
          setIsAuthenticated(false);
          setLoading(false);
          router.push(redirectTo);
          return;
        }

        // 2. 사용자 정보 확인 (역할, 승인 상태)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, approved')
          .eq('id', currentUser.id)
          .single();

        if (!isMounted) return;

        if (userError || !userData) {
          console.error('사용자 정보 조회 실패:', userError);
          setIsAuthenticated(false);
          setLoading(false);
          router.push(redirectTo);
          return;
        }

        // 3. 승인 상태 확인
        if (requireApproved && !userData.approved) {
          console.warn('승인되지 않은 사용자 접근 시도');
          setIsAuthenticated(false);
          setLoading(false);
          // 승인 대기 페이지로 이동하거나 로그아웃
          await supabase.auth.signOut();
          router.push('/auth/login?error=not-approved');
          return;
        }

        // 4. 역할 확인
        if (requiredRole) {
          const hasRequiredRole = userData.role === requiredRole ||
                                  (requiredRole === 'admin' && userData.role === 'super_admin');

          if (!hasRequiredRole) {
            console.warn(`필요한 역할(${requiredRole})이 없는 사용자 접근 시도`);
            setIsAuthenticated(false);
            setLoading(false);
            router.push('/'); // 권한 없으면 메인 페이지로
            return;
          }
        }

        // 5. 모든 검증 통과
        setUser(currentUser);
        setUserRole(userData.role);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('인증 확인 중 오류:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
          router.push(redirectTo);
        }
      }
    };

    checkAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        router.push(redirectTo);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // 재검증
        checkAuth();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [requiredRole, requireApproved, redirectTo, router, supabase]);

  return {
    user,
    userRole,
    loading,
    isAuthenticated,
  };
}
