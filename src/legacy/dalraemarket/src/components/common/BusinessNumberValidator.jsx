import { useState } from 'react';

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
    
    // 실제 API 호출 시뮬레이션
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
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <input
          type="text"
          placeholder="사업자등록번호"
          value={value}
          onChange={handleChange}
          maxLength="12"
          style={{
            flex: '1 1 auto',
            minWidth: '0',
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
            flexShrink: 0,
            padding: '14px 20px',
            background: isChecking || !value ? '#e5e7eb' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isChecking || !value ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            whiteSpace: 'nowrap'
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

export default BusinessNumberValidator;