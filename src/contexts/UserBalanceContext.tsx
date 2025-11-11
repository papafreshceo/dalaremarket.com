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

  // 잔액 새로고침 함수
  const refreshBalances = async () => {
    if (!user) {
      setCashBalance(0);
      setCreditBalance(0);
      return;
    }

    try {
      const [cashRes, creditRes] = await Promise.all([
        fetch('/api/cash'),
        fetch('/api/user/credits')
      ]);

      const cashData = await cashRes.json();
      if (cashData.success) {
        setCashBalance(cashData.balance);
      }

      const creditData = await creditRes.json();
      if (creditData.success) {
        setCreditBalance(creditData.credits);
      }
    } catch (error) {
      console.error('잔액 조회 실패:', error);
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
