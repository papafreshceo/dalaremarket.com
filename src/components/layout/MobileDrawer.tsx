'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TierBadge from '@/components/TierBadge';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  text: string;
  icon: JSX.Element;
  hasSubmenu?: boolean;
  submenu?: { path: string; text: string; tab?: string }[];
  tab?: string;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationTier, setOrganizationTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend' | null>(null);
  const [toolsMenuItems, setToolsMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('primary_organization_id')
          .eq('id', user.id)
          .single();

        if (userData?.primary_organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('business_name, tier')
            .eq('id', userData.primary_organization_id)
            .single();

          if (orgData) {
            setOrganizationName(orgData.business_name || '');
            setOrganizationTier(orgData.tier);
          }
        }
      }
    };
    fetchUser();
  }, []);

  // 업무도구 목록 불러오기
  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch('/api/tools');
        const data = await response.json();

        if (data.success && data.tools) {
          const formattedTools: MenuItem[] = data.tools.map((tool: any) => ({
            path: '/platform/tools',
            text: tool.name,
            icon: icons.tools
          }));

          setToolsMenuItems([
            { path: '/platform/tools', text: '전체 도구', icon: icons.tools },
            ...formattedTools
          ]);
        }
      } catch (error) {
        setToolsMenuItems([
          { path: '/platform/tools', text: '전체 도구', icon: icons.tools }
        ]);
      }
    };
    loadTools();
  }, []);

  // 메뉴 아이콘
  const icons = {
    products: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>,
    tools: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>,
    orders: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
    won: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><text x="50%" y="76%" textAnchor="middle" fontSize="20" fontWeight="50" fill="currentColor">₩</text></svg>,
    ranking: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
    notice: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    profile: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    message: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    pricing: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    charge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>,
    wallet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"></path><circle cx="17" cy="14" r="1"></circle></svg>,
    building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  };

  // 메뉴 그룹 정의
  const menuGroups = [
    {
      title: '상품',
      items: [
        {
          path: '/platform',
          text: '공급상품',
          icon: icons.products,
          hasSubmenu: true,
          submenu: [
            { path: '/platform/products/all', text: '전체상품' },
            { path: '/platform/calendar', text: '상품캘린더' },
            { path: '/platform/gallery', text: '이미지다운로드' }
          ]
        }
      ]
    },
    {
      title: '주문',
      items: [
        {
          path: '/platform/orders',
          text: '발주관리',
          icon: icons.orders,
          hasSubmenu: true,
          submenu: [
            { path: '/platform/orders', text: '대시보드', tab: '대시보드' },
            { path: '/platform/orders', text: '발주서등록', tab: '발주서등록' },
            { path: '/platform/orders', text: '건별등록', tab: '건별등록' }
          ]
        },
        {
          path: '/platform/orders',
          text: '정산관리',
          icon: icons.won,
          hasSubmenu: true,
          submenu: [
            { path: '/platform/orders', text: '거래명세서', tab: '정산관리' },
            { path: '/platform/settlement/tax-invoice', text: '세금계산서' }
          ]
        }
      ]
    },
    {
      title: '도구',
      items: toolsMenuItems.length > 0 ? [{
        path: '/platform/tools',
        text: '업무도구',
        icon: icons.tools,
        hasSubmenu: true,
        submenu: toolsMenuItems.map(t => ({ path: t.path, text: t.text }))
      }] : []
    },
    {
      title: '커뮤니티',
      items: [
        { path: '/platform/ranking', text: '셀러랭킹', icon: icons.ranking },
        { path: '/platform/seller-feed', text: '셀러피드', icon: icons.notice }
      ]
    },
    {
      title: '알림',
      items: [
        { path: '/platform/notifications', text: '사이트알림', icon: icons.notice },
        { path: '/platform/notifications/messages', text: '메세지', icon: icons.message }
      ]
    },
    {
      title: '예치금',
      items: [
        { path: '/platform/deposit/charge', text: '예치금충전', icon: icons.charge },
        { path: '/platform/deposit/history', text: '예치금이력', icon: icons.wallet },
        { path: '/platform/orders', text: '지갑', icon: icons.wallet, tab: '지갑' }
      ]
    },
    {
      title: '구독',
      items: [
        { path: '/platform/pricing', text: '요금제', icon: icons.pricing },
        { path: '/platform/winwin', text: 'Win-Win', icon: icons.ranking }
      ]
    },
    {
      title: '공지',
      items: [
        { path: '/platform/notice', text: '일반공지', icon: icons.notice }
      ]
    },
    {
      title: '설정',
      items: [
        { path: '/platform/orders', text: '옵션상품매핑', icon: icons.settings, tab: '옵션상품매핑' }
      ]
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.tab) {
      localStorage.setItem('ordersActiveTab', item.tab);
    }
    router.push(item.path);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    onClose();
  };

  const toggleSubmenu = (menuText: string) => {
    setExpandedMenu(expandedMenu === menuText ? null : menuText);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* 드로어 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '85vw',
          background: 'white',
          zIndex: 1002,
          overflowY: 'auto',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          animation: 'slideIn 0.3s ease',
        }}
      >
        <style jsx>{`
          @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* 헤더 - 사용자 정보 */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          {user ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {icons.profile}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
                    {organizationName || user.email?.split('@')[0]}
                  </div>
                  {organizationTier && (
                    <TierBadge tier={organizationTier} size="sm" />
                  )}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {user.email}
              </div>
            </div>
          ) : (
            <Link
              href="/platform?login=true"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              로그인
            </Link>
          )}
        </div>

        {/* 메뉴 그룹 */}
        <nav style={{ padding: '8px 0' }}>
          {menuGroups.map((group, groupIndex) => (
            group.items.length > 0 && (
              <div key={groupIndex} style={{ marginBottom: '8px' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {group.title}
                </div>
                {group.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex}>
                    {item.hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.text)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#374151',
                            fontSize: '14px',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.icon}
                            {item.text}
                          </span>
                          <span style={{
                            transform: expandedMenu === item.text ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s ease',
                          }}>
                            {icons.chevron}
                          </span>
                        </button>
                        {expandedMenu === item.text && (
                          <div style={{ background: '#f9fafb' }}>
                            {item.submenu?.map((sub: any, subIndex: number) => (
                              <button
                                key={subIndex}
                                onClick={() => handleMenuClick(sub)}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px 10px 48px',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  color: '#6b7280',
                                  fontSize: '13px',
                                }}
                              >
                                {sub.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleMenuClick(item)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: pathname === item.path ? '#eff6ff' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: pathname === item.path ? '#2563eb' : '#374151',
                          fontSize: '14px',
                        }}
                      >
                        {item.icon}
                        {item.text}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ))}
        </nav>

        {/* 하단 - 로그아웃 */}
        {user && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            marginTop: 'auto',
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {icons.logout}
              로그아웃
            </button>
          </div>
        )}
      </div>
    </>
  );
}
