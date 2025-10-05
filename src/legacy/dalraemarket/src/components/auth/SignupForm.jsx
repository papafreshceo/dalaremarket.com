import { useState } from 'react';
import AddressSearch from '../common/AddressSearch';

// BusinessNumberValidator 컴포넌트
function BusinessNumberValidator({ value, onChange, onValidate }) {
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const formatBusinessNumber = (input) => {
    const numbers = input.replace(/[^\d]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const handleChange = (e) => {
    const formatted = formatBusinessNumber(e.target.value);
    onChange(formatted);
    setValidationResult(null);
  };

  const handleValidate = async () => {
    const cleanNumber = value.replace(/-/g, '');
    
    if (cleanNumber.length !== 10) {
      setValidationResult({ isValid: false, message: '사업자등록번호 10자리를 입력해주세요.' });
      return;
    }

    setIsChecking(true);
    
    setTimeout(() => {
      const result = {
        isValid: true,
        isDuplicate: false,
        isActive: true,
        businessName: '달래마켓',
        message: '유효한 사업자등록번호입니다.'
      };
      
      setValidationResult(result);
      setIsChecking(false);
      
      if (onValidate) {
        onValidate(result);
      }
    }, 1000);
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        gap: '8px'
      }}>
        <input
          type="text"
          placeholder="사업자등록번호"
          value={value}
          onChange={handleChange}
          maxLength="12"
          style={{
            width: 'calc(100% - 88px)',
            padding: '14px 16px',
            border: validationResult 
              ? validationResult.isValid && !validationResult.isDuplicate && validationResult.isActive
                ? '2px solid #10b981'
                : '2px solid #ef4444'
              : '2px solid transparent',
            background: '#ffffff',
            borderRadius: '12px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => {
            if (!validationResult || !validationResult.isValid) {
              e.target.style.borderColor = '#2563eb';
            }
          }}
          onBlur={(e) => {
            if (!validationResult) {
              e.target.style.borderColor = 'transparent';
            }
          }}
        />
        
        <button
          onClick={handleValidate}
          disabled={isChecking || !value}
          style={{
            width: '80px',
            padding: '14px 0',
            background: isChecking || !value ? '#e5e7eb' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isChecking || !value ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {isChecking ? '확인중...' : '조회'}
        </button>
      </div>
      
      {validationResult && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: validationResult.isValid && !validationResult.isDuplicate && validationResult.isActive
            ? '#f0fdf4'
            : '#fef2f2',
          borderRadius: '8px',
          fontSize: '12px',
          color: validationResult.isValid && !validationResult.isDuplicate && validationResult.isActive
            ? '#166534'
            : '#dc2626'
        }}>
          {validationResult.message}
          {validationResult.businessName && (
            <span style={{ fontWeight: '500' }}> - {validationResult.businessName}</span>
          )}
        </div>
      )}
    </div>
  );
}



function SignupForm({ onClose, onModeChange }) {
  // 가입 단계 관리 (1: 방법 선택, 2: 정보 입력)
  const [signupStep, setSignupStep] = useState(1);
  const [signupMethod, setSignupMethod] = useState(''); // email, google, kakao, naver
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessNumber: '',
    address: '',
    representative: '',
    businessNumberValid: false
  });
  
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showBusinessConfirmModal, setShowBusinessConfirmModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState({
    service: false,
    privacy: false,
    marketing: false
  });

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}`;
  };

  // 사업자등록번호 포맷팅
  const formatBusinessNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  // 사업자 정보가 하나라도 입력되었는지 확인
  const hasAnyBusinessInfo = () => {
    return businessData.businessName || 
           businessData.businessNumber || 
           businessData.address || 
           businessData.representative;
  };

  // 회원가입 유효성 검사
  const validateSignup = () => {
    const errors = [];
    const isEmailSignup = signupMethod === 'email';

    // 필수 항목 검사
    if (!formData.name || formData.name.length < 2) {
      errors.push({ field: '이름', message: '2자 이상 입력해주세요' });
    }

    if (!formData.phone || formData.phone.replace(/-/g, '').length < 8) {
      errors.push({ field: '전화번호', message: '올바른 형식으로 입력해주세요' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.push({ field: '이메일', message: '올바른 이메일 형식이 아닙니다' });
    }

    // 이메일 가입일 때만 비밀번호 검사
    if (isEmailSignup) {
      if (!formData.password || formData.password.length < 8) {
        errors.push({ field: '비밀번호', message: '8자 이상 입력해주세요' });
      }

      if (formData.password !== formData.passwordConfirm) {
        errors.push({ field: '비밀번호 확인', message: '비밀번호가 일치하지 않습니다' });
      }
    }

    // 사업자 정보 검사 - 하나라도 입력했으면 모두 필수
    if (hasAnyBusinessInfo()) {
      if (!businessData.businessName) {
        errors.push({ field: '사업자명', message: '사업자 정보를 입력하셨다면 필수 입력 항목입니다' });
      }
      
      if (!businessData.businessNumber) {
        errors.push({ field: '사업자등록번호', message: '사업자 정보를 입력하셨다면 필수 입력 항목입니다' });
      } else {
        // 사업자등록번호가 있으면 추가 검사
        const cleanNumber = businessData.businessNumber.replace(/-/g, '');
        if (cleanNumber.length !== 10) {
          errors.push({ field: '사업자등록번호', message: '10자리를 입력해주세요' });
        } else if (!businessData.businessNumberValid) {
          errors.push({ field: '사업자등록번호', message: '사업자등록번호 조회를 완료해주세요' });
        }
      }
      
      if (!businessData.address) {
        errors.push({ field: '사업장 주소', message: '사업자 정보를 입력하셨다면 필수 입력 항목입니다' });
      }
      
      if (!businessData.representative) {
        errors.push({ field: '대표자', message: '사업자 정보를 입력하셨다면 필수 입력 항목입니다' });
      }
    }

    // 약관 동의 검사
    if (!termsAgreed.service || !termsAgreed.privacy) {
      errors.push({ field: '약관 동의', message: '필수 약관에 동의해주세요' });
    }

    return errors;
  };

  // 회원가입 처리
  const handleSignup = () => {
    const errors = validateSignup();
    
    // 사업자 정보가 하나도 없으면 확인 모달 표시
    if (errors.length === 0 && !hasAnyBusinessInfo()) {
      setShowBusinessConfirmModal(true);
      return;
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    proceedSignup();
  };

  // 실제 가입 진행
  const proceedSignup = () => {
    console.log('회원가입 데이터:', {
      method: signupMethod,
      ...formData,
      business: businessData
    });

    alert('회원가입이 완료되었습니다!');
    onClose();
  };

  // 가입 방법 선택 화면
  const renderMethodSelection = () => (
    <>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        marginBottom: '32px', 
        textAlign: 'center' 
      }}>회원가입</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => {
            setSignupMethod('email');
            setSignupStep(2);
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          이메일로 가입하기
        </button>

        <button 
          onClick={() => {
            setSignupMethod('google');
            setSignupStep(2);
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          구글로 시작하기
        </button>
        
        <button 
          onClick={() => {
            setSignupMethod('kakao');
            setSignupStep(2);
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: '#FEE500',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 8px rgba(254, 229, 0, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          카카오로 시작하기
        </button>
        
        <button 
          onClick={() => {
            setSignupMethod('naver');
            setSignupStep(2);
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: '#03C75A',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 8px rgba(3, 199, 90, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          네이버로 시작하기
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          이미 계정이 있으신가요?{' '}
          <a 
            onClick={() => onModeChange('login')} 
            style={{
              color: '#2563eb',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >로그인</a>
        </span>
      </div>
    </>
  );

  // 정보 입력 화면
const renderInfoInput = () => {
  const isEmailSignup = signupMethod === 'email';
  const buttonText = {
    email: '회원가입',
    google: '구글로 가입하기',
    kakao: '카카오로 가입하기',
    naver: '네이버로 가입하기'
  }[signupMethod];

  return (
    <>
      <button 
        onClick={() => setSignupStep(1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#6c757d',
          fontSize: '13px',  // 14px → 13px
          cursor: 'pointer',
          marginBottom: '16px',  // 20px → 16px
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s'
        }}
        // ... hover 효과 동일
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">  {/* 16 → 14 */}
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        뒤로가기
      </button>

      <h2 style={{ 
        fontSize: '20px',  // 24px → 20px
        fontWeight: '600', 
        marginBottom: '16px',  // 24px → 16px
        textAlign: 'center' 
      }}>
        {signupMethod === 'email' ? '이메일로 가입하기' : `${signupMethod === 'google' ? '구글' : signupMethod === 'kakao' ? '카카오' : '네이버'}로 시작하기`}
      </h2>

      {/* 기본 정보 입력 */}
      <div style={{ marginBottom: '12px' }}>  {/* 20px → 12px */}
        <input 
          type="text" 
          placeholder="이름 (한글만 입력)" 
          value={formData.name || ''}
          onChange={(e) => {
            const koreanOnly = e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
            setFormData({ ...formData, name: koreanOnly });
          }}
          style={{
            width: '100%',
            padding: '12px 14px',  // 14px 16px → 12px 14px
            border: '0.5px solid #e6d4ff',
            background: '#f8f9fa',
            borderRadius: '10px',  // 12px → 10px
            fontSize: '13px',  // 14px → 13px
            outline: 'none',
            transition: 'all 0.3s'
          }}
          // ... focus/blur 동일
        />
      </div>

      <div style={{ marginBottom: '10px' }}>  {/* 12px → 10px */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '14px',  // 16px → 14px
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '13px',  // 14px → 13px
            color: '#495057',
            fontWeight: '500',
            pointerEvents: 'none'
          }}>010</span>
          <input 
            type="tel" 
            placeholder="0000-0000" 
            value={formData.phone || ''}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              setFormData({ ...formData, phone: formatted });
            }}
            maxLength="9"
            style={{
              width: '100%',
              padding: '12px 14px 12px 46px',  // 패딩 조정
              border: '0.5px solid #e6d4ff',
              background: '#f8f9fa',
              borderRadius: '10px',  // 12px → 10px
              fontSize: '13px',  // 14px → 13px
              outline: 'none',
              transition: 'all 0.3s'
            }}
            // ... focus/blur 동일
          />
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>  {/* 12px → 10px */}
        <input 
          type="email" 
          placeholder={isEmailSignup ? "이메일 - 계정 ID로 사용됨" : "상품 소식을 받을 이메일 입력"}
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            width: '100%',
            padding: '12px 14px',  // 14px 16px → 12px 14px
            border: '0.5px solid #e6d4ff',
            background: '#f8f9fa',
            borderRadius: '10px',  // 12px → 10px
            fontSize: '13px',  // 14px → 13px
            outline: 'none',
            transition: 'all 0.3s'
          }}
          // ... focus/blur 동일
        />
      </div>

      {/* 이메일 가입일 때만 비밀번호 필드 표시 */}
      {isEmailSignup && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="password" 
              placeholder="비밀번호 (8자 이상, 영문+숫자 조합)" 
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '0.5px solid #e6d4ff',
                background: '#f8f9fa',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              // ... focus/blur 동일
            />
          </div>

          <div style={{ marginBottom: '14px' }}>  {/* 20px → 14px */}
            <input 
              type="password" 
              placeholder="비밀번호 확인" 
              value={formData.passwordConfirm || ''}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '0.5px solid #e6d4ff',
                background: '#f8f9fa',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              // ... focus/blur 동일
            />
          </div>
        </>
      )}

      {/* 사업자 정보 섹션 */}
      <div style={{
        padding: '14px',  // 20px → 14px
        background: '#f8f9fa',
        borderRadius: '10px',  // 12px → 10px
        marginBottom: '14px'  // 20px → 14px
      }}>
        <p style={{
          fontSize: '12px',  // 13px → 12px
          color: '#6c757d',
          marginBottom: '12px',  // 16px → 12px
          fontStyle: 'italic'
        }}>
          세금계산서 발행 등에 필요한 정보입니다
        </p>

        <input 
          type="text" 
          placeholder="사업자명" 
          value={businessData.businessName || ''}
          onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '0.5px solid transparent',
            background: '#ffffff',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '10px',
            outline: 'none',
            transition: 'all 0.3s'
          }}
          // ... focus/blur 동일
        />

        <div style={{ marginBottom: '10px' }}>
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

        <div style={{ marginBottom: '10px' }}>
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
            padding: '12px 14px',
            border: '0.5px solid transparent',
            background: '#ffffff',
            borderRadius: '10px',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.3s'
          }}
          // ... focus/blur 동일
        />
      </div>

      {/* 약관 동의 섹션 */}
      <div style={{
        padding: '12px',  // 16px → 12px
        background: '#f8f9fa',
        borderRadius: '10px',
        marginBottom: '14px'  // 20px → 14px
      }}>
        <h4 style={{
          fontSize: '13px',  // 14px → 13px
          fontWeight: '600',
          marginBottom: '10px',  // 12px → 10px
          color: '#212529'
        }}>약관 동의</h4>
        
        {/* 전체 동의 */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',  // 10px → 8px
          padding: '8px',  // 10px → 8px
          background: 'white',
          borderRadius: '6px',  // 8px → 6px
          marginBottom: '6px',  // 8px → 6px
          cursor: 'pointer'
        }}>
          {/* 체크박스 크기 조정 */}
          <div style={{
            width: '18px',  // 20px → 18px
            height: '18px',
            borderRadius: '3px',
            border: (termsAgreed.service && termsAgreed.privacy && termsAgreed.marketing) ? 
              '2px solid #2563eb' : '2px solid #dee2e6',
            background: (termsAgreed.service && termsAgreed.privacy && termsAgreed.marketing) ? 
              '#2563eb' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {(termsAgreed.service && termsAgreed.privacy && termsAgreed.marketing) && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            전체 동의
          </span>
        </label>

        <div style={{
          borderTop: '1px solid #dee2e6',
          marginTop: '10px',
          paddingTop: '10px'
        }}>
          {/* 개별 약관 동의 항목들도 동일하게 크기 조정 */}
          {/* 여기는 반복되는 코드라 생략하지만 fontSize와 padding을 모두 줄여주세요 */}
        </div>
      </div>

      <button 
        onClick={handleSignup}
        style={{
          width: '100%',
          padding: '12px',  // 14px → 12px
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',  // 12px → 10px
          fontSize: '13px',  // 14px → 13px
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '16px',  // 24px → 16px
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'transform 0.2s'
        }}
        // ... hover 효과 동일
      >
        {buttonText}
      </button>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>  {/* 13px → 12px */}
          이미 계정이 있으신가요?{' '}
          <a 
            onClick={() => onModeChange('login')} 
            style={{
              color: '#2563eb',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >로그인</a>
        </span>
      </div>
    </>
  );
};

  // 임시 약관 내용 - TermsContent import 대신 직접 정의
  const termsContent = {
    service: '이용약관 내용...',
    privacy: '개인정보처리방침 내용...',
    marketing: '마케팅 정보 수신 동의 내용...'
  };

  return (
    <>
      {signupStep === 1 ? renderMethodSelection() : renderInfoInput()}

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowValidationModal(false)}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes bounce {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}</style>
          
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '420px',
            borderRadius: '20px',
            padding: '28px',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'bounce 0.5s ease-out'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '8px',
              color: '#1a1a1a'
            }}>입력 정보를 확인해주세요</h3>
            
            <p style={{
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              다음 항목들을 확인 후 다시 시도해주세요
            </p>

            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '24px'
            }}>
              {validationErrors.map((error, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: index % 2 === 0 ? '#fafafa' : '#ffffff',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff5f5';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? '#fafafa' : '#ffffff';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: '#ff6b6b',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>!</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '2px'
                    }}>{error.field}</div>
                    <div style={{
                      fontSize: '13px',
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
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              확인했습니다
            </button>
            
            <button
              onClick={() => setShowValidationModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '28px',
                height: '28px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '18px',
                color: '#999'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff6b6b';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#999';
                e.currentTarget.style.transform = 'rotate(0)';
              }}
            >×</button>
          </div>
        </div>
      )}

      {/* Business Info Confirm Modal */}
      {showBusinessConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowBusinessConfirmModal(false)}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '380px',
            borderRadius: '20px',
            padding: '28px',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M12 3L2 20H22L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '12px',
              color: '#1a1a1a'
            }}>사업자 정보 미입력</h3>
            
            <p style={{
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              사업자 정보 등록없이 가입하시겠습니까?<br/>
              <span style={{ fontSize: '12px', color: '#999' }}>
                나중에 마이페이지에서 등록할 수 있습니다
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowBusinessConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                취소
              </button>
              
              <button 
                onClick={() => {
                  setShowBusinessConfirmModal(false);
                  proceedSignup();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                계속 진행
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 약관 내용 모달 */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowTermsModal(false)}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                {showTermsModal === 'service' && '이용약관'}
                {showTermsModal === 'privacy' && '개인정보처리방침'}
                {showTermsModal === 'marketing' && '마케팅 정보 수신 동의'}
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer'
                }}
              >×</button>
            </div>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              fontSize: '14px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {showTermsModal === 'service' && termsContent.service}
              {showTermsModal === 'privacy' && termsContent.privacy}
              {showTermsModal === 'marketing' && termsContent.marketing}
            </div>
            
            <div style={{
              padding: '20px',
              borderTop: '1px solid #dee2e6'
            }}>
              <button
                onClick={() => {
                  if (showTermsModal === 'service') {
                    setTermsAgreed({ ...termsAgreed, service: true });
                  } else if (showTermsModal === 'privacy') {
                    setTermsAgreed({ ...termsAgreed, privacy: true });
                  } else if (showTermsModal === 'marketing') {
                    setTermsAgreed({ ...termsAgreed, marketing: true });
                  }
                  setShowTermsModal(false);
                }}
                style={{
                  width: '100%',
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
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SignupForm;