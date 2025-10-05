// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

function Footer() {
  const footerLinks = [
    { path: '/dashboard', text: '대시보드' },
    { path: '/products', text: '상품리스트' },
    { path: '/calendar', text: '상품캘린더' },
    { path: '/delivery', text: '배송캘린더' },
    { path: '/orders', text: '주문관리' },
    { path: '/services', text: '서비스&프로그램' },
    { path: '/notice', text: '공지사항' },
  ];

  const socialLinks = [
    {
      href: 'https://papafarmers.com/orders/',
      title: '발주시스템',
      icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z'
    },
    {
      href: 'https://blog.naver.com/papa_fresh',
      title: '네이버 블로그',
      icon: 'M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z'
    },
    {
      href: 'https://www.instagram.com/dalraemarket',
      title: '인스타그램',
      icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z'
    }
  ];

  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid #e8e9eb',
      padding: '20px 0 15px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 30px',
        textAlign: 'center'
      }}>
        {/* 로고 */}
        <img 
          src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
          alt="달래마켓"
          style={{
            height: '14px',
            objectFit: 'contain',
            marginBottom: '10px',
            filter: 'grayscale(100%) brightness(0.4)',
            opacity: 0.7
          }}
        />
        
        {/* 회사 정보 */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          lineHeight: 1.4,
          marginBottom: '10px'
        }}>
          <span>대표: 남잠화</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>사업자등록번호: 107-30-96371</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>통신판매업신고: 2022-경북청도-0003</span>
        </div>
        
        {/* 메뉴 링크 */}
        <div style={{ marginBottom: '10px' }}>
          {footerLinks.map((item, index) => (
            <span key={item.path}>
              {index > 0 && <span style={{
                display: 'inline-block',
                width: '1px',
                height: '10px',
                background: '#e8e9eb',
                margin: '0 8px',
                verticalAlign: 'middle'
              }} />}
              <Link 
                to={item.path}
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  textDecoration: 'none',
                  margin: '0 10px',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.color = '#2563eb'}
                onMouseOut={(e) => e.target.style.color = '#6b7280'}
              >
                {item.text}
              </Link>
            </span>
          ))}
        </div>
        
        {/* 연락처 & SNS */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '12px'
        }}>
          <div>papa_fresh@naver.com</div>
          <div>010-2688-1388</div>
          
          {/* SNS 링크 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {socialLinks.map((social, index) => (
              <a 
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.title}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg style={{ width: '12px', height: '12px', fill: '#6b7280' }} viewBox="0 0 24 24">
                  <path d={social.icon} />
                </svg>
              </a>
            ))}
            
            {/* 카카오톡 */}
            <a 
              href="https://open.kakao.com/o/gXyZdXYg"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: '#FEE500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#FDD835';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#FEE500';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img 
                src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1757496850/kakaotalk_sharing_btn_small_wozpwf.png"
                alt="카카오톡"
                style={{ width: '14px', height: '14px' }}
              />
            </a>
          </div>
        </div>
        
        {/* 카피라이트 */}
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e8e9eb',
          fontSize: '10px',
          color: '#9ca3af'
        }}>
          © 2024 달래마켓. All rights reserved.
          <span style={{ margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#6b7280', textDecoration: 'none', margin: '0 6px' }}>
            이용약관
          </Link>
          <Link to="/privacy" style={{ color: '#6b7280', textDecoration: 'none', margin: '0 6px' }}>
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;