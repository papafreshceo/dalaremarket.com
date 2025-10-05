import { useState, useEffect } from 'react';

function GoogleAccountPopup({ isOpen, onClose, onSelectAccount, isMobile, isHomePage }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const googleAccounts = [
    { email: 'gomdolllll', domain: 'syey1744@gmail.com', avatar: '🏔️' },
    { email: 'papa fresh (파파프레시)', domain: 'papafresh.ceo@gmail.com', avatar: '🍑' }
  ];

  // 홈 페이지에서만 자동 표시 (하루에 한 번)
  useEffect(() => {
    if (isHomePage && !isOpen) {
      const lastShownDate = localStorage.getItem('googlePopupLastShown');
      const today = new Date().toDateString();
      
      if (lastShownDate !== today) {
        localStorage.setItem('googlePopupLastShown', today);
      }
    }
  }, [isHomePage, isOpen]);

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    console.log('구글 로그인:', account);
    if (onSelectAccount) {
      onSelectAccount(account);
    }
    onClose();
  };

  if (!isOpen) return null;

  // 모바일 팝업 스타일
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        padding: '12px',
        zIndex: 999
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: 'none',
          border: 'none',
          fontSize: '14px',
          color: '#999',
          cursor: 'pointer',
          padding: '2px'
        }}>✕</button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '10px',
          paddingRight: '16px',
          justifyContent: 'center'
        }}>
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            style={{ width: '14px', height: '14px' }} 
          />
          <div style={{ fontSize: '12px', fontWeight: '400', color: '#202124' }}>
            Google로 시작하기
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #dadce0',
          paddingTop: '10px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {googleAccounts.map((account, idx) => (
              <div 
                key={idx} 
                onClick={() => handleAccountSelect(account)} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px',
                  borderRadius: '6px',
                  background: '#f8f9fa',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px'
                }}>{account.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: '#202124', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {account.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: '#5f6368' }}>
                    {account.domain.split('@')[1]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PC 팝업 스타일
  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      right: 0,
      width: '280px',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      padding: '16px',
      zIndex: 100
    }}>
      <button onClick={onClose} style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        color: '#999',
        cursor: 'pointer',
        padding: '4px'
      }}>✕</button>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '12px',
        paddingRight: '20px'
      }}>
        <img 
          src="https://www.google.com/favicon.ico" 
          alt="Google" 
          style={{ width: '16px', height: '16px' }} 
        />
        <div style={{ fontSize: '13px', fontWeight: '400', color: '#202124' }}>
          google.com의 계정으로<br/>달래마켓에 로그인하세요
        </div>
      </div>
      
      <div style={{ 
        borderTop: '1px solid #dadce0',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {googleAccounts.map((account, idx) => (
            <div 
              key={idx} 
              onClick={() => handleAccountSelect(account)} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: '#fff'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#e8eaed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>{account.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#202124', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {account.email}
                </div>
                <div style={{ fontSize: '11px', color: '#5f6368' }}>
                  {account.domain}
                </div>
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => {
              onClose();
              // 다른 계정 사용 로직
            }} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              borderTop: '1px solid #dadce0',
              marginTop: '4px',
              paddingTop: '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#f1f3f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '16px', color: '#5f6368' }}>+</span>
            </div>
            <div style={{ fontSize: '12px', color: '#5f6368' }}>다른 계정 사용</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleAccountPopup;