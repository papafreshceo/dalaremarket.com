'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundTypesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // CS 유형 페이지로 리다이렉트
    router.replace('/admin/settings/cs-types');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">CS 유형 설정 페이지로 이동 중...</div>
    </div>
  );
}
