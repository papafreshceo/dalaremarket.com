'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  activeIconMenu: string | null;
  setActiveIconMenu: (menu: string | null) => void;
  isSidebarVisible: boolean;
  setIsSidebarVisible: (visible: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [activeIconMenu, setActiveIconMenu] = useState<string | null>(null);
  // 서버와 클라이언트 모두 false로 시작 (Hydration 에러 방지)
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('platformSidebarVisible');
      setIsSidebarVisible(saved !== null ? saved === 'true' : false);
    }
  }, []);

  // 사이드바 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('platformSidebarVisible', String(isSidebarVisible));
    }
  }, [isSidebarVisible]);

  return (
    <SidebarContext.Provider value={{ activeIconMenu, setActiveIconMenu, isSidebarVisible, setIsSidebarVisible }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
