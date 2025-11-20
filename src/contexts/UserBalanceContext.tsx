'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserBalanceContextType {
  cashBalance: number;
  creditBalance: number;
  setCashBalance: (balance: number) => void;
  setCreditBalance: (balance: number) => void;
  refreshBalances: () => Promise<void>;
}

const UserBalanceContext = createContext<UserBalanceContextType | undefined>(undefined);

export function UserBalanceProvider({ children }: { children: ReactNode }) {
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // 사용자 정보 가져오기
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 잔액 새로고침 함수 (조직 캐시/크레딧 조회)
  const refreshBalances = async () => {
    if (!user) {
      setCashBalance(0);
      setCreditBalance(0);
      return;
    }

    try {
      // 사용자의 primary_organization_id 조회
      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.primary_organization_id) {
        setCashBalance(0);
        setCreditBalance(0);
        return;
      }

      // 조직의 캐시와 크레딧 조회
      const [cashData, creditData] = await Promise.all([
        supabase
          .from('organization_cash')
          .select('balance')
          .eq('organization_id', userData.primary_organization_id)
          .single(),
        supabase
          .from('organization_credits')
          .select('balance')
          .eq('organization_id', userData.primary_organization_id)
          .single()
      ]);

      setCashBalance(cashData.data?.balance || 0);
      setCreditBalance(creditData.data?.balance || 0);
    } catch (error) {
      console.error('조직 잔액 조회 실패:', error);
    }
  };

  // 초기 로드 및 주기적 갱신은 UserHeader에서 처리하므로 여기서는 하지 않음
  useEffect(() => {
    if (!user) {
      setCashBalance(0);
      setCreditBalance(0);
    }
  }, [user]);

  return (
    <UserBalanceContext.Provider value={{
      cashBalance,
      creditBalance,
      setCashBalance,
      setCreditBalance,
      refreshBalances
    }}>
      {children}
    </UserBalanceContext.Provider>
  );
}

export function useUserBalance() {
  const context = useContext(UserBalanceContext);
  if (context === undefined) {
    throw new Error('useUserBalance must be used within a UserBalanceProvider');
  }
  return context;
}
