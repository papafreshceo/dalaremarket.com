'use client';

import { UserBalanceProvider } from '@/contexts/UserBalanceContext';
import { ToastProvider } from '@/components/ui/Toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserBalanceProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </UserBalanceProvider>
  );
}
