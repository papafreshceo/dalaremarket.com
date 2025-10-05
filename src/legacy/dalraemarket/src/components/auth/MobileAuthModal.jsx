import { useState, useRef, useEffect } from 'react';
import BusinessNumberValidator from '../common/BusinessNumberValidator';
import AddressSearch from '../common/AddressSearch';
import { termsContent, termsTitles } from './TermsContent';

function MobileAuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [mobileAuthStep, setMobileAuthStep] = useState('select');
  const [signupMethod, setSignupMethod] = useState(''); // email, google, kakao, naver
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [completedFields, setCompletedFields] = useState([]);
  const [isSeller, setIsSeller] = useState(false);
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessNumber: '',
    address: '',
    representative: '',
    businessNumberValid: false
  });
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState({
    service: false,
    privacy: false,
    marketing: false
  });
  
  const termsRef = useRef(null);
  const formContainerRef = useRef(null);

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'signup') {
      setMobileAuthStep('select');
    }
  }, [initialMode]);

  const handleClose = () => {
    setMode('login');
    setMobileAuthStep('select');
    setSignupMethod('');
    setCurrentFieldIndex(0);
    setTermsScrolled(false);
    setCompletedFields([]);
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: ''
    });
    setBusinessData({
      businessName: '',
      businessNumber: '',
      address: '',
      representative: '',
      businessNumberValid: false
    });
    setIsSeller(false);
    setShowMarketingModal(false);
    onClose();
  };

  // 이메일 가입 필드
  const emailSignupFields = [
    { name: 'name', label: '이름', type: 'text', placeholder: '실명을 입력해주세요' },
    { name: 'phone', label: '전화번호', type: 'tel', placeholder: '0000-0000', prefix: '010' },
    { name: 'email', label: '이메일', type: 'email', placeholder: 'example@email.com' },
    { name: 'password', label: '비밀번호', type: 'password', placeholder: '8자 이상 영문, 숫자 조합' },
  ];

  // 소셜 가입 필드 (이메일, 비밀번호 제외)
  const socialSignupFields = [
    { name: 'name', label: '이름', type: 'text', placeholder: '실명을 입력해주세요' },
    { name: 'phone', label: '전화번호', type: 'tel', placeholder: '0000-0000', prefix: '010' }
  ];

  const currentSignupFields = signupMethod === 'email' ? emailSignupFields : socialSignupFields;

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}`;
  };

  const handleTermsScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    setTermsScrolled(isAtBottom);
  };

  const handleTermsAgree = () => {
    setTermsAgreed({ service: true, privacy: true, marketing: false });
    setMobileAuthStep('seller-check');
  };

  const handleSellerChoice = (choice) => {
    setIsSeller(choice);
    setMobileAuthStep('form');
    setCurrentFieldIndex(0);
    setCompletedFields([]);
  };

  const validateMobileSignup = () => {
    const errors = [];
    
    if (!formData.name || formData.name.length < 2) {
      errors.push({ field: '이름', message: '2자 이상 입력해주세요' });
    }
    if (!formData.phone || formData.phone.replace(/-/g, '').length < 8) {
      errors.push({ field: '전화번호', message: '올바른 형식으로 입력해주세요' });
    }
    
    if (signupMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push({ field: '이메일', message: '올바른 이메일 형식이 아닙니다' });
      }
      if (!formData.password || formData.password.length < 8) {
        errors.push({ field: '비밀번호', message: '8자 이상 입력해주세요' });
      }
    }
    
    if (isSeller) {
      if (!businessData.businessName) {
        errors.push({ field: '사업자명', message: '필수 입력 항목입니다' });
      }
      if (!businessData.businessNumber || businessData.businessNumber.replace(/-/g, '').length !== 10) {
        errors.push({ field: '사업자등록번호', message: '10자리를 입력해주세요' });
      } else if (!businessData.businessNumberValid) {
        errors.push({ field: '사업자등록번호', message: '사업자등록번호 조회를 완료해주세요' });
      }
      if (!businessData.address) {
        errors.push({ field: '사업장 주소', message: '주소를 검색해주세요' });
      }
      if (!businessData.representative) {
        errors.push({ field: '대표자', message: '필수 입력 항목입니다' });
      }
    }
    
    return errors;
  };

  const handleMobileLogin = () => {
    if (!formData.email || !formData.password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    console.log('모바일 로그인:', formData);
    alert('로그인되었습니다!');
    handleClose();
  };

  const handleMobileSignupComplete = () => {
    const errors = validateMobileSignup();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }
    
    // 마케팅 동의 안했으면 모달 표시
    if (!termsAgreed.marketing) {
      setShowMarketingModal(true);
      return;
    }
    
    proceedSignup();
  };

  const proceedSignup = () => {
    console.log('모바일 회원가입 완료', { 
      method: signupMethod,
      ...formData, 
      ...(isSeller ? businessData : {}),
      termsAgreed
    });
    alert('회원가입이 완료되었습니다!');
    handleClose();
  };

  const handleMarketingAgree = () => {
    setTermsAgreed(prev => ({ ...prev, marketing: true }));
    setShowMarketingModal(false);
    proceedSignup();
  };

  const handleMarketingSkip = () => {
    setShowMarketingModal(false);
    proceedSignup();
  };

  const handleNextField = () => {
    if (currentFieldIndex < currentSignupFields.length - 1) {
      setCompletedFields([...completedFields, currentFieldIndex]);
      setCurrentFieldIndex(currentFieldIndex + 1);
      
      setTimeout(() => {
        if (formContainerRef.current) {
          formContainerRef.current.scrollTop = formContainerRef.current.scrollHeight;
        }
      }, 100);
    } else {
      // 판매자 추가 정보 입력으로 이동
      if (isSeller && mobileAuthStep === 'form') {
        setMobileAuthStep('seller');
      } else {
        handleMobileSignupComplete();
      }
    }
  };

  const handlePhoneInput = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    
    if (formatted.length === 9) {
      setTimeout(handleNextField, 300);
    }
  };

  const handleBackButton = () => {
    if (mobileAuthStep === 'terms' || mobileAuthStep === 'seller-check') {
      setMobileAuthStep('select');
    } else if (mobileAuthStep === 'form' && currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
      setCompletedFields(completedFields.filter(i => i !== currentFieldIndex - 1));
    } else if (mobileAuthStep === 'form') {
      setMobileAuthStep('seller-check');
    } else if (mobileAuthStep === 'seller') {
      setMobileAuthStep('form');
      setCurrentFieldIndex(currentSignupFields.length - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0 10px'
    }} onClick={handleClose}>
      <div style={{
        background: 'white',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        height: mode === 'signup' ? '75vh' : '60vh',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease-out'
      }} onClick={(e) => e.stopPropagation()}>

        {/* 드래그 핸들 */}
        <div style={{
          padding: '8px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '4px',
            background: '#ddd',
            borderRadius: '2px'
          }} />
        </div>

        {mode === 'login' ? (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>
              로그인
            </h2>

            <input type="email" placeholder="이메일" 
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '15px',
                marginBottom: '10px'
              }} 
            />
            
            <input type="password" placeholder="비밀번호" 
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '15px',
                marginBottom: '20px'
              }} 
            />

            <button 
              onClick={handleMobileLogin}
              style={{
                width: '100%',
                padding: '14px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '500',
                marginBottom: '12px'
              }}
            >로그인</button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button style={{
                flex: 1,
                padding: '10px',
                background: '#FEE500',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px'
              }}>카카오</button>
              <button style={{
                flex: 1,
                padding: '10px',
                background: '#03C75A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px'
              }}>네이버</button>
              <button style={{
                flex: 1,
                padding: '10px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px'
              }}>구글</button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>
                계정이 없으신가요?{' '}
                <a onClick={() => setMode('signup')} style={{
                  color: '#2563eb',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>회원가입</a>
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* 회원가입 첫 화면 - 4개 버튼 */}
            {mobileAuthStep === 'select' && (
              <div style={{ padding: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>
                  회원가입
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => {
                    setSignupMethod('email');
                    setMobileAuthStep('terms');
                  }} style={{
                    padding: '14px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>이메일로 가입하기</button>

                  <button onClick={() => {
                    setSignupMethod('google');
                    setMobileAuthStep('terms');
                  }} style={{
                    padding: '14px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>구글로 시작하기</button>

                  <button onClick={() => {
                    setSignupMethod('kakao');
                    setMobileAuthStep('terms');
                  }} style={{
                    padding: '14px',
                    background: '#FEE500',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>카카오로 시작하기</button>

                  <button onClick={() => {
                    setSignupMethod('naver');
                    setMobileAuthStep('terms');
                  }} style={{
                    padding: '14px',
                    background: '#03C75A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>네이버로 시작하기</button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    이미 계정이 있으신가요?{' '}
                    <a onClick={() => setMode('login')} style={{
                      color: '#2563eb',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>로그인</a>
                  </span>
                </div>
              </div>
            )}

            {/* 약관 동의 화면 */}
            {mobileAuthStep === 'terms' && (
              <div style={{ 
                position: 'absolute',
                top: '40px',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex', 
                flexDirection: 'column',
                padding: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '16px'
                }}>
                  이용약관
                </h3>
                
                <div 
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  style={{
                    flex: 1,
                    overflowY: 'scroll',
                    WebkitOverflowScrolling: 'touch',
                    padding: '16px',
                    background: '#f8f8f8',
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    marginBottom: '80px'
                  }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {termsContent.general}
                    {'\n\n'}
                    {termsContent.privacy}
                  </div>
                  
                  <div style={{ 
                    marginTop: '30px', 
                    padding: '20px', 
                    background: '#e7f3ff',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      color: '#2563eb',
                      marginBottom: '8px'
                    }}>
                      약관의 끝입니다
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#495057' 
                    }}>
                      위 내용에 모두 동의하십니까?
                    </p>
                  </div>
                </div>

                <button 
                  disabled={!termsScrolled}
                  onClick={handleTermsAgree}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    padding: '14px',
                    background: termsScrolled ? '#2563eb' : '#e0e0e0',
                    color: termsScrolled ? 'white' : '#999',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s',
                    cursor: termsScrolled ? 'pointer' : 'not-allowed'
                  }}>
                  {termsScrolled ? '동의하고 계속하기' : '약관을 끝까지 읽어주세요'}
                </button>

                {/* 뒤로가기 버튼 */}
                <button
                  onClick={() => setMobileAuthStep('select')}
                  style={{
                    position: 'absolute',
                    bottom: '70px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6c757d',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  뒤로가기
                </button>
              </div>
            )}

            {/* 판매자 여부 선택 */}
            {mobileAuthStep === 'seller-check' && (
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                  판매자이신가요?
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
                  판매자는 사업자 정보를 추가로 입력해야 합니다
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleSellerChoice(true)}
                    style={{
                      padding: '20px',
                      background: '#e7f3ff',
                      border: '2px solid #2563eb',
                      borderRadius: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>
                      네, 판매자입니다
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      사업자 정보를 추가로 입력합니다
                    </div>
                  </button>

                  <button
                    onClick={() => handleSellerChoice(false)}
                    style={{
                      padding: '20px',
                      background: '#f8f9fa',
                      border: '2px solid #dee2e6',
                      borderRadius: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                      아니오, 일반 회원입니다
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      기본 정보만 입력합니다
                    </div>
                  </button>
                </div>

                {/* 뒤로가기 버튼 */}
                <button
                  onClick={() => setMobileAuthStep('terms')}
                  style={{
                    marginTop: '20px',
                    background: 'none',
                    border: 'none',
                    color: '#6c757d',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  뒤로가기
                </button>
              </div>
            )}

            {/* 정보 입력 스텝 */}
            {mobileAuthStep === 'form' && (
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  marginBottom: '24px'
                }}>
                  {currentSignupFields.map((_, index) => (
                    <div key={index} style={{
                      flex: 1,
                      height: '3px',
                      background: index <= currentFieldIndex ? '#2563eb' : '#e0e0e0',
                      borderRadius: '2px',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>

                <div 
                  ref={formContainerRef}
                  style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    paddingBottom: '20px'
                  }}>
                  {completedFields.map(index => (
                    <div key={index} style={{
                      marginBottom: '20px',
                      opacity: 0.6
                    }}>
                      <label style={{ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' }}>
                        {currentSignupFields[index].label}
                      </label>
                      <div style={{
                        padding: '12px',
                        background: '#f8f8f8',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}>
                        {currentSignupFields[index].prefix ? `${currentSignupFields[index].prefix}-` : ''}{formData[currentSignupFields[index].name]}
                      </div>
                    </div>
                  ))}

                  <div className="slide-animation" key={currentFieldIndex}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                      {currentSignupFields[currentFieldIndex].label}
                    </h3>
                    
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                      {currentFieldIndex === 0 && '서비스에서 사용할 이름을 입력해주세요'}
                      {currentFieldIndex === 1 && '본인 확인을 위한 번호를 입력해주세요'}
                      {currentFieldIndex === 2 && signupMethod === 'email' && '로그인에 사용할 이메일을 입력해주세요'}
                      {currentFieldIndex === 3 && signupMethod === 'email' && '안전한 비밀번호를 설정해주세요'}
                    </p>

                    {currentSignupFields[currentFieldIndex].name === 'phone' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '14px',
                          background: '#f0f0f0',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500'
                        }}>010</span>
                        <input
                          type="tel"
                          placeholder={currentSignupFields[currentFieldIndex].placeholder}
                          value={formData.phone || ''}
                          onChange={handlePhoneInput}
                          maxLength="9"
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '14px',
                            border: '2px solid #2563eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    ) : currentSignupFields[currentFieldIndex].name === 'name' ? (
                      <input
                        type="text"
                        placeholder={currentSignupFields[currentFieldIndex].placeholder}
                        value={formData.name || ''}
                        onChange={(e) => {
                          const koreanOnly = e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
                          setFormData({ ...formData, name: koreanOnly });
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #2563eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && formData.name.length >= 2) {
                            handleNextField();
                          }
                        }}
                      />
                    ) : (
                      <input
                        type={currentSignupFields[currentFieldIndex].type}
                        placeholder={currentSignupFields[currentFieldIndex].placeholder}
                        value={formData[currentSignupFields[currentFieldIndex].name] || ''}
                        onChange={(e) => setFormData({ ...formData, [currentSignupFields[currentFieldIndex].name]: e.target.value })}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #2563eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleNextField();
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', paddingTop: '16px' }}>
                  {(currentFieldIndex > 0 || mobileAuthStep === 'form') && (
                    <button onClick={handleBackButton} style={{
                      padding: '12px 20px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>이전</button>
                  )}
                  
                  <button onClick={handleNextField} style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {currentFieldIndex === currentSignupFields.length - 1 ? 
                      (isSeller ? '다음' : '가입완료') : '다음'}
                  </button>
                </div>
              </div>
            )}

            {/* 판매자 정보 입력 */}
            {mobileAuthStep === 'seller' && isSeller && (
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  판매자 정보
                </h3>

                <input 
                  type="text" 
                  placeholder="사업자명" 
                  value={businessData.businessName || ''}
                  onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />

                <div style={{ marginBottom: '12px' }}>
                  <BusinessNumberValidator 
                    value={businessData.businessNumber}
                    onChange={(value) => setBusinessData({ 
                      ...businessData, 
                      businessNumber: value,
                      businessNumberValid: false
                    })}
                    onValidate={(result) => {
                      setBusinessData(prev => ({
                        ...prev,
                        businessNumberValid: result.isValid && !result.isDuplicate && result.isActive
                      }));
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <AddressSearch 
                    onAddressSelect={(addressData) => 
                      setBusinessData({ ...businessData, address: addressData.fullAddress })
                    }
                  />
                </div>

                <input 
                  type="text" 
                  placeholder="대표자" 
                  value={businessData.representative || ''}
                  onChange={(e) => {
                    const koreanOnly = e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
                    setBusinessData({ ...businessData, representative: koreanOnly });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={handleBackButton}
                    style={{
                      padding: '12px 20px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    이전
                  </button>
                  
                  <button 
                    onClick={handleMobileSignupComplete}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  >
                    가입완료
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 마케팅 동의 유도 모달 */}
      {showMarketingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 10001,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '320px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              마케팅 정보 수신
            </h3>
            
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#495057',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '12px' }}>
                다음 정보를 이메일로 받으시려면 동의해 주세요:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  신규 상품 및 서비스 안내
                </li>
                <li style={{ paddingLeft: '20px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  이벤트 및 프로모션 정보 제공
                </li>
              </ul>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={handleMarketingSkip}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                건너뛰기
              </button>
              <button
                onClick={handleMarketingAgree}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                동의
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 유효성 검사 모달 */}
      {showValidationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowValidationModal(false)}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '350px',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
              </svg>
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '6px',
              color: '#1a1a1a'
            }}>입력 확인 필요</h3>
            
            <p style={{
              fontSize: '13px',
              color: '#666',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              다음 항목을 확인해주세요
            </p>

            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {validationErrors.map((error, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px',
                  background: '#fff5f5',
                  borderRadius: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    background: '#ff6b6b',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: '600' }}>!</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '2px'
                    }}>{error.field}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#7f8c8d'
                    }}>{error.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowValidationModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileAuthModal;