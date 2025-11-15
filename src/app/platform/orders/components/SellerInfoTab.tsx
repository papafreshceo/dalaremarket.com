'use client';

export default function SellerInfoTab() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <iframe
        src="/platform/profile"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          margin: 0,
          padding: 0
        }}
        title="셀러 정보 관리"
      />
    </div>
  );
}
