'use client';

import { UserBalanceProvider } from '@/contexts/UserBalanceContext';
import { ToastProvider } from '@/components/ui/Toast';
import OneSignalProvider from '@/components/OneSignalProvider';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <OneSignalProvider>
      <UserBalanceProvider>
        <ToastProvider>
          {children}
          <PWAInstallPrompt />
        </ToastProvider>
      </UserBalanceProvider>
    </OneSignalProvider>
  );
}
