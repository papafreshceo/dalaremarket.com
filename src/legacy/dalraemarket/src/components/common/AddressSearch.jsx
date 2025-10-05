import { useState, useEffect, useRef } from 'react';

function AddressSearch({ onAddressSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const embedRef = useRef(null);

  useEffect(() => {
    // Daum 주소 API 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src*="daumcdn.net/mapjsapi/bundle/postcode"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && window.daum && window.daum.Postcode && embedRef.current) {
      // embed 방식으로 모달 안에 주소 검색 삽입
      new window.daum.Postcode({
        oncomplete: function(data) {
          const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
          setSelectedAddress(addr);
        },
        width: '100%',
        height: '100%'
      }).embed(embedRef.current);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedAddress && detailAddress) {
      const completeAddress = `${selectedAddress} ${detailAddress}`;
      setFullAddress(completeAddress);
      setIsOpen(false);
      
      if (onAddressSelect) {
        onAddressSelect({
          basicAddress: selectedAddress,
          detailAddress: detailAddress,
          fullAddress: completeAddress
        });
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 전체 주소 표시 (주소가 입력된 경우) */}
      {fullAddress && (
        <div style={{
          padding: '12px 16px',
          background: '#f8f9fa',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#495057',
          marginBottom: '12px'
        }}>
          {fullAddress}
        </div>
      )}

      {/* 주소 검색 버튼만 표시 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '12px'
        }}
      >
        주소 검색
      </button>

      {/* 주소 검색 모달 */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setIsOpen(false)}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '500px',
            height: selectedAddress ? 'auto' : '70%',
            maxHeight: '600px',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>주소 검색</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* 카카오 주소 API embed 영역 또는 상세주소 입력 */}
            {!selectedAddress ? (
              <>
                <div 
                  ref={embedRef}
                  style={{
                    flex: 1,
                    width: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                />
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#6c757d',
                  textAlign: 'center'
                }}>
                  도로명, 건물명, 지번으로 검색하세요
                </div>
              </>
            ) : (
              <div>
                {/* 선택된 기본 주소 표시 */}
                <div style={{
                  padding: '14px 16px',
                  background: '#e7f3ff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#2563eb',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>기본주소</div>
                  {selectedAddress}
                </div>

                {/* 상세 주소 입력 */}
                <input
                  type="text"
                  placeholder="상세주소를 입력하세요 (동/호수 등)"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #2563eb',
                    background: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '20px'
                  }}
                />

                {/* 버튼 그룹 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSelectedAddress('');
                      setDetailAddress('');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f8f9fa',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    다시 검색
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!detailAddress}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: detailAddress ? '#2563eb' : '#e0e0e0',
                      color: detailAddress ? 'white' : '#999',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: detailAddress ? 'pointer' : 'not-allowed'
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressSearch;