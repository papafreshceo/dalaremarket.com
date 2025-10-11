'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MobileRegistrationTabProps {
  isMobile: boolean;
  onRefresh?: () => void;
  userEmail: string;
}

interface FormData {
  orderNumber: string;
  orderer: string;
  ordererPhone: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  deliveryMessage: string;
  optionName: string;
  optionCode: string;
  quantity: number;
  specialRequest: string;
  unitPrice: number;
}

export default function MobileRegistrationTab({
  isMobile,
  onRefresh,
  userEmail
}: MobileRegistrationTabProps) {
  const [formData, setFormData] = useState<FormData>({
    orderNumber: '',
    orderer: '',
    ordererPhone: '',
    recipient: '',
    recipientPhone: '',
    address: '',
    deliveryMessage: '',
    optionName: '',
    optionCode: '',
    quantity: 1,
    specialRequest: '',
    unitPrice: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 옵션코드 변경 시 공급단가 조회
  useEffect(() => {
    const fetchUnitPrice = async () => {
      if (!formData.optionCode) {
        setFormData(prev => ({ ...prev, unitPrice: 0 }));
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('product_options')
          .select('seller_supply_price')
          .eq('option_code', formData.optionCode)
          .single();

        if (error) {
          console.error('공급단가 조회 오류:', error);
          setFormData(prev => ({ ...prev, unitPrice: 0 }));
          return;
        }

        if (data && data.seller_supply_price) {
          setFormData(prev => ({
            ...prev,
            unitPrice: parseFloat(data.seller_supply_price)
          }));
        }
      } catch (error) {
        console.error('공급단가 조회 실패:', error);
        setFormData(prev => ({ ...prev, unitPrice: 0 }));
      }
    };

    fetchUnitPrice();
  }, [formData.optionCode]);

  // 공급가 계산
  const supplyPrice = formData.unitPrice * formData.quantity;

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 입력란 검증
    if (!formData.recipient.trim()) {
      newErrors.recipient = '수령인을 입력해주세요';
    }
    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = '수령인 전화번호를 입력해주세요';
    }
    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요';
    }
    if (!formData.optionName.trim()) {
      newErrors.optionName = '옵션명을 입력해주세요';
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = '수량을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 발주번호 생성
      const emailPrefix = userEmail.substring(0, 2).toUpperCase();
      const now = new Date();
      const dateTime = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      const orderNo = `${emailPrefix}${dateTime}0001`;

      // DB에 저장
      const { error } = await supabase
        .from('integrated_orders')
        .insert({
          seller_id: user.id,
          order_no: orderNo,
          order_number: formData.orderNumber || null,
          buyer_name: formData.orderer || null,
          buyer_phone: formData.ordererPhone || null,
          recipient_name: formData.recipient,
          recipient_phone: formData.recipientPhone,
          recipient_address: formData.address,
          delivery_message: formData.deliveryMessage || null,
          option_name: formData.optionName,
          option_code: formData.optionCode || null,
          quantity: formData.quantity.toString(),
          special_request: formData.specialRequest || null,
          seller_supply_price: formData.unitPrice.toString(),
          settlement_amount: supplyPrice.toString(),
          shipping_status: '접수',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('주문 등록 오류:', error);
        alert('주문 등록에 실패했습니다.');
        return;
      }

      alert('주문이 성공적으로 등록되었습니다.');

      // 폼 초기화
      setFormData({
        orderNumber: '',
        orderer: '',
        ordererPhone: '',
        recipient: '',
        recipientPhone: '',
        address: '',
        deliveryMessage: '',
        optionName: '',
        optionCode: '',
        quantity: 1,
        specialRequest: '',
        unitPrice: 0
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('주문 등록 실패:', error);
      alert('주문 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: isMobile ? '20px' : '32px'
      }}>
        <h2 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1f2937'
        }}>모바일 주문 등록</h2>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '24px'
        }}>주문 정보를 입력해주세요</p>

        <form onSubmit={handleSubmit}>
          {/* 주문번호 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              주문번호
            </label>
            <input
              type="text"
              value={formData.orderNumber}
              onChange={(e) => handleChange('orderNumber', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 주문자 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              주문자
            </label>
            <input
              type="text"
              value={formData.orderer}
              onChange={(e) => handleChange('orderer', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 주문자 전화번호 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              주문자 전화번호
            </label>
            <input
              type="tel"
              value={formData.ordererPhone}
              onChange={(e) => handleChange('ordererPhone', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 수령인 * */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              수령인 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => handleChange('recipient', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.recipient ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = errors.recipient ? '#ef4444' : '#d1d5db'}
            />
            {errors.recipient && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.recipient}
              </p>
            )}
          </div>

          {/* 수령인 전화번호 * */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              수령인 전화번호 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={formData.recipientPhone}
              onChange={(e) => handleChange('recipientPhone', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.recipientPhone ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = errors.recipientPhone ? '#ef4444' : '#d1d5db'}
            />
            {errors.recipientPhone && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.recipientPhone}
              </p>
            )}
          </div>

          {/* 주소 * */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              주소 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.address ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = errors.address ? '#ef4444' : '#d1d5db'}
            />
            {errors.address && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.address}
              </p>
            )}
          </div>

          {/* 배송메시지 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              배송메시지
            </label>
            <textarea
              value={formData.deliveryMessage}
              onChange={(e) => handleChange('deliveryMessage', e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 옵션명 * */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              옵션명 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.optionName}
              onChange={(e) => handleChange('optionName', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.optionName ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = errors.optionName ? '#ef4444' : '#d1d5db'}
            />
            {errors.optionName && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.optionName}
              </p>
            )}
          </div>

          {/* 옵션코드 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              옵션코드
            </label>
            <input
              type="text"
              value={formData.optionCode}
              onChange={(e) => handleChange('optionCode', e.target.value)}
              placeholder="옵션코드를 입력하면 공급단가가 자동 조회됩니다"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 수량 * */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              수량 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.quantity ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = errors.quantity ? '#ef4444' : '#d1d5db'}
            />
            {errors.quantity && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.quantity}
              </p>
            )}
          </div>

          {/* 특이/요청사항 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              특이/요청사항
            </label>
            <textarea
              value={formData.specialRequest}
              onChange={(e) => handleChange('specialRequest', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* 가격 정보 표시 */}
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>공급단가</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {formData.unitPrice.toLocaleString()}원
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>공급가</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>
                {supplyPrice.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              background: isSubmitting ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
          >
            {isSubmitting ? '등록 중...' : '주문 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
