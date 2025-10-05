'use client';

import UserHeader from '@/components/layout/UserHeader';

export default function NoticePage() {
  return (
    <>
      <UserHeader />
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>공지사항 페이지</h1>
        <p>달래마켓 소식</p>
      </div>
    </>
  );
}
