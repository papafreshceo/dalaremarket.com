'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    // 메시지 기능이 알림 페이지로 통합되었으므로 리다이렉트
    router.replace('/platform/notifications?tab=chat');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p>메시지 페이지로 이동 중...</p>
    </div>
  );
}
