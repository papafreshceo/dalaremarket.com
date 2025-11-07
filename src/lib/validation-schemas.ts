/**
 * 입력값 검증 스키마 (Zod)
 *
 * API 요청 본문, 쿼리 파라미터 등의 유효성 검사를 위한 스키마 정의
 */

import { z } from 'zod';

// 공통 스키마
export const emailSchema = z.string().email('유효한 이메일 주소를 입력하세요.');
export const phoneSchema = z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 전화번호를 입력하세요.');
export const uuidSchema = z.string().uuid('유효한 UUID가 아닙니다.');
export const positiveIntSchema = z.number().int().positive('양수여야 합니다.');
export const nonNegativeIntSchema = z.number().int().nonnegative('0 이상이어야 합니다.');

// 캐시 설정 스키마
export const cashSettingsSchema = z.object({
  login_reward: z.number().nonnegative('0 이상이어야 합니다.').max(10000, '10,000 이하여야 합니다.'),
  activity_reward_per_minute: z.number().nonnegative('0 이상이어야 합니다.').max(1000, '1,000 이하여야 합니다.'),
  daily_activity_limit: z.number().nonnegative('0 이상이어야 합니다.').max(100000, '100,000 이하여야 합니다.'),
});

// 파일 업로드 스키마
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: '파일이 필요합니다.' }),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  is_public: z.boolean().optional(),
  is_downloadable: z.boolean().optional(),
});

// 주문 생성 스키마
export const orderSchema = z.object({
  customer_name: z.string().min(1, '고객명을 입력하세요.').max(100),
  customer_phone: phoneSchema.optional(),
  customer_address: z.string().optional(),
  product_name: z.string().min(1, '상품명을 입력하세요.').max(200),
  quantity: positiveIntSchema,
  price: nonNegativeIntSchema,
  shipping_fee: nonNegativeIntSchema.optional(),
  memo: z.string().max(1000, '메모는 1000자 이하여야 합니다.').optional(),
});

// 대량 주문 스키마
export const bulkOrdersSchema = z.object({
  orders: z.array(orderSchema).min(1, '최소 1개 이상의 주문이 필요합니다.').max(1000, '한 번에 최대 1000개까지 처리 가능합니다.'),
});

// 회원 정보 업데이트 스키마
export const memberUpdateSchema = z.object({
  memberId: uuidSchema,
  is_active: z.boolean(),
});

// 사업자 등록번호 스키마
export const businessNumberSchema = z.object({
  businessNumber: z.string().regex(/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/, '사업자등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)'),
});

// 홍보 이미지 스키마
export const promotionalImageSchema = z.object({
  image_id: uuidSchema,
  title: z.string().min(1, '제목을 입력하세요.').max(200),
  description: z.string().optional(),
  link_url: z.string().url('유효한 URL을 입력하세요.').optional(),
  is_active: z.boolean().optional(),
  display_order: nonNegativeIntSchema.optional(),
});

// 디자인 테마 스키마
export const designThemeSchema = z.object({
  name: z.string().min(1, '테마 이름을 입력하세요.').max(100),
  description: z.string().optional(),
  css_variables: z.record(z.string()),
  is_active: z.boolean().optional(),
});

// 공지사항 스키마
export const noticeSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(200),
  content: z.string().min(1, '내용을 입력하세요.'),
  category: z.enum(['general', 'important', 'event', 'update']),
  is_pinned: z.boolean().optional(),
  published: z.boolean().optional(),
});

// 팝업 스키마
export const popupSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_active: z.boolean().optional(),
  display_order: nonNegativeIntSchema.optional(),
});

// 유틸리티 함수: Zod 스키마로 요청 검증
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message || '입력값이 유효하지 않습니다.'
      };
    }
    return {
      success: false,
      error: '입력값 검증 중 오류가 발생했습니다.'
    };
  }
}

// 유틸리티 함수: 부분 업데이트용 (선택적 필드)
export function createPartialSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial();
}
