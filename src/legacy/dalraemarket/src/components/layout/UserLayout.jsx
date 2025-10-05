// src/components/layout/UserLayout.jsx
import { Outlet } from 'react-router-dom';
import UserHeader from './UserHeader';
import { useState, useEffect } from 'react';

function UserLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#ffffff'
    }}>
      <UserHeader />
      
      <main style={{
        flex: '1',
        width: '100%',
        paddingTop: '0'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : '1400px',
          margin: '0 auto',
          padding: isMobile ? '20' : '40px',  // 모바일에서 패딩 제거
          background: '#ffffff',
          minHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 70px)',
          boxShadow: isMobile ? 'none' : '0 0 40px rgba(0, 0, 0, 0.03)'
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default UserLayout;