'use client';

import { UserBalanceProvider } from '@/contexts/UserBalanceContext';
import { ToastProvider } from '@/components/ui/Toast';
import OneSignalProvider from '@/components/OneSignalProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <OneSignalProvider>
      <UserBalanceProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </UserBalanceProvider>
    </OneSignalProvider>
  );
}
