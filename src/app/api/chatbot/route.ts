import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      logger.error('⚠️ Gemini API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        {
          response: '죄송합니다. AI 상담 기능이 일시적으로 사용 불가합니다.\n\n기본 문의는 010-2688-1388로 전화주세요.\n영업시간: 평일 09:00 - 18:00'
        },
        { status: 200 }
      );
    }

    // Supabase에서 데이터 조회
    const supabase = await createClientForRouteHandler();

    // 1. 원물 데이터 조회
    const { data: rawMaterials, error: rawError } = await supabase
      .from('raw_materials')
      .select('id, product_name, category_2, category_3, category_4, supply_status, season, season_start_date, season_end_date, origin')
      .order('category_3', { ascending: true });

    if (rawError) {
      logger.error('원물 DB 조회 오류:', rawError);
    }

    // 2. 옵션 상품 조회 (가격 정보 포함)
    const { data: optionProducts, error: optionError } = await supabase
      .from('option_products')
      .select('id, option_name, supply_status, supply_price, consumer_price, stock_quantity')
      .eq('supply_status', '출하중')
      .order('id', { ascending: true })
      .limit(50);

    if (optionError) {
      logger.error('옵션상품 DB 조회 오류:', optionError);
    }

    // 3. 인증된 사용자 정보 조회
    const { data: { user } } = await supabase.auth.getUser();
    let userOrgInfo = '';
    let userOrderHistory = '';

    if (user) {
      // 사용자의 조직 정보 조회
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, org_name, org_type, tier')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .single();

      if (orgData) {
        userOrgInfo = `
현재 상담 중인 회원 정보:
- 조직명: ${orgData.org_name}
- 조직 유형: ${orgData.org_type}
- 등급: ${orgData.tier || '일반'}
`;

        // 최근 발주 내역 조회 (플랫폼 주문)
        const { data: recentOrders } = await supabase
          .from('platform_orders')
          .select('id, product_name, quantity, unit_price, total_price, order_date, status')
          .eq('organization_id', orgData.id)
          .order('order_date', { ascending: false })
          .limit(10);

        if (recentOrders && recentOrders.length > 0) {
          userOrderHistory = `
최근 발주 내역 (최근 10건):
${recentOrders.map(order =>
  `- ${order.order_date}: ${order.product_name} ${order.quantity}${order.unit_price ? ` (단가: ${order.unit_price.toLocaleString()}원)` : ''} [${order.status}]`
).join('\n')}

총 발주 건수: ${recentOrders.length}건
`;
        }
      }
    }

    // 4. 회사 정책/FAQ 데이터 조회
    const { data: chatbotSettings } = await supabase
      .from('chatbot_settings')
      .select('company_name, company_phone, business_hours, welcome_message, faqs, restricted_info, restriction_message')
      .single();

    // 제한 사항 설정 (모두 공개)
    const restrictions = {
      hide_raw_materials: false,      // 원물 정보 공개
      show_option_products: true,      // 옵션 상품 공개
      hide_pricing: false,             // 가격 정보 공개
      hide_personal_info: false,       // 로그인한 사용자 본인 정보는 공개
      hide_admin_info: true,           // 관리자 정보만 비공개
      hide_management_systems: []      // 관리 시스템 공개
    };

    const restrictionMsg = chatbotSettings?.restriction_message || '해당 정보는 전화 문의로만 안내드립니다. 010-2688-1388로 연락주세요.';

    // 출하중인 원물 목록
    const availableProducts = rawMaterials?.filter(p => p.supply_status === '출하중') || [];
    const productList = availableProducts.length > 0
      ? availableProducts.map(p => {
          const dates = p.season_start_date && p.season_end_date
            ? ` (출하: ${p.season_start_date} ~ ${p.season_end_date})`
            : '';
          const origin = p.origin ? ` [산지: ${p.origin}]` : '';
          return `${p.category_4 || p.category_3} - ${p.product_name}${dates}${origin}`;
        }).join('\n')
      : '현재 출하중인 상품이 없습니다.';

    // 옵션 상품 상세 정보 (가격 포함)
    const optionDetails = optionProducts?.map(opt => {
      const priceInfo = opt.supply_price
        ? ` - 공급가: ${opt.supply_price.toLocaleString()}원`
        : '';
      const consumerInfo = opt.consumer_price
        ? ` / 소비자가: ${opt.consumer_price.toLocaleString()}원`
        : '';
      const stockInfo = opt.stock_quantity
        ? ` [재고: ${opt.stock_quantity}개]`
        : '';
      return `${opt.option_name}${priceInfo}${consumerInfo}${stockInfo}`;
    }).join('\n') || '옵션 상품 정보 없음';

    const totalOptions = optionProducts?.length || 0;
    const optionSummary = totalOptions > 0 ? `\n총 ${totalOptions}개 옵션 상품 정보` : '';

    // 전체 원물 카테고리
    const allMaterials = [...new Set(rawMaterials?.map(p => p.category_4 || p.category_3) || [])].join(', ');

    // 시즌별 원물
    const seasonMaterials = {
      봄: [...new Set(rawMaterials?.filter(p => p.season === '봄').map(p => p.category_4 || p.category_3) || [])].join(', '),
      여름: [...new Set(rawMaterials?.filter(p => p.season === '여름').map(p => p.category_4 || p.category_3) || [])].join(', '),
      가을: [...new Set(rawMaterials?.filter(p => p.season === '가을').map(p => p.category_4 || p.category_3) || [])].join(', ')
    };

    // FAQ 데이터 파싱
    const faqs = chatbotSettings?.faqs || [];
    const faqText = faqs.map((faq: any) =>
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join('\n\n');

    // 프롬프트 구성 (모든 정보 공개)
    let promptText = `당신은 달래마켓 B2B의 전문 농산물 도매 상담 AI입니다.

# 역할 및 목표
- 농산물 B2B 거래에 대한 정확하고 상세한 상담 제공
- 가격, 재고, 발주 내역 등 모든 정보를 구체적으로 안내
- 고객의 발주 패턴을 분석하여 맞춤형 추천 제공
- 전문적이면서도 친절한 상담 서비스 제공

# 회사 정보
- **회사명**: ${chatbotSettings?.company_name || '달래마켓 B2B'}
- **연락처**: ${chatbotSettings?.company_phone || '010-2688-1388'}
- **영업시간**: ${chatbotSettings?.business_hours || '평일 09:00-18:00'}
- **주문 마감**: 매일 오전 9시 (당일 출하)
- **최소 주문**: 원물별로 다름 (대부분 1개 이상)
- **결제 방법**: 선결제 (계좌이체, 신용카드)
- **배송 지역**: 전국 배송 (제주/도서 지역 배송비 별도)
- **배송 정책**: 오전 9시 이전 주문 → 당일 출하 → 익일 도착

${userOrgInfo ? `# 현재 상담 중인 회원 정보
${userOrgInfo}` : ''}

${userOrderHistory ? `# 회원님의 발주 내역
${userOrderHistory}` : ''}

# 전체 취급 농산물 카테고리 (총 ${rawMaterials?.length || 0}개 품목)
${allMaterials}

# 현재 출하중인 원물 (실시간)
${productList}

# 시즌별 출하 정보
- **봄 시즌 (3-5월)**: ${seasonMaterials.봄 || '해당 없음'}
- **여름 시즌 (6-8월)**: ${seasonMaterials.여름 || '해당 없음'}
- **가을 시즌 (9-11월)**: ${seasonMaterials.가을 || '해당 없음'}
- **겨울 시즌 (12-2월)**: 저장 농산물 위주

# 옵션 상품 상세 정보 (가격 및 재고 포함)
${optionDetails}${optionSummary}

※ 모든 가격은 실시간 정보이며, 시세 변동이 있을 수 있습니다.
※ 대량 주문 시 할인 가능하니 전화 문의 바랍니다.

${faqText ? `# 자주 묻는 질문 (FAQ)
${faqText}` : ''}

# 중요 정보
1. **가격 정책**
   - 위에 표시된 가격은 현재 기준 가격입니다
   - 공급가는 도매가, 소비자가는 권장 소비자 가격입니다
   - 대량 주문 시 추가 할인 가능 (${chatbotSettings?.company_phone || '010-2688-1388'}로 문의)
   - 등급별, 규격별로 가격이 상이합니다

2. **재고 및 출하**
   - 농산물은 시즌별 수확량에 따라 공급됩니다
   - 출하 기간 중에는 매일 신선한 수확 물량 공급 가능
   - 재고 수량은 실시간으로 변동됩니다
   - 시즌 외 기간에는 예약 주문만 가능

3. **발주 안내**
   - 오전 9시 이전 주문 시 당일 출하
   - 수도권: 익일 도착, 지방: 2-3일 소요
   - 제주/도서 지역: 배송비 별도

# 답변 가이드
1. **상세하고 구체적으로 답변**:
   - 가격은 원 단위까지 정확히 안내
   - 재고 수량이 있으면 함께 안내
   - 출하 시기, 산지 정보 제공
   - 회원의 과거 발주 내역을 참고하여 맞춤 추천

2. **회원 맞춤형 서비스**:
   - 회원의 발주 패턴 분석
   - 자주 주문하는 상품 우선 추천
   - 등급에 따른 혜택 안내

3. **전문적인 상담**:
   - 농산물 특성, 보관 방법 안내
   - 시즌 정보, 품질 정보 제공
   - 대체 상품 제안

4. **답변 형식**:
   - 줄바꿈(\n)을 적절히 사용하여 가독성 높이기
   - 숫자는 천 단위 구분 (예: 10,000원)
   - 5-8줄 정도로 상세하게 작성
   - 추가 문의는 전화번호 안내

고객 질문: ${message}

위 모든 정보를 활용하여 최대한 상세하고 정확하게 답변해주세요.`;

    // 프롬프트 길이 확인
    const promptLength = promptText.length;
    const promptTokens = Math.ceil(promptLength / 4); // 대략적인 토큰 수
    logger.info(`프롬프트 길이: ${promptLength} 문자, 약 ${promptTokens} 토큰`);

    if (promptTokens > 30000) {
      logger.warn(`⚠️ 프롬프트가 너무 깁니다: ${promptTokens} 토큰`);
    }

    // Gemini API 호출 - v1beta API의 gemini-2.5-flash 모델 사용 (현재 안정 버전)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1500,
          topP: 0.95,
          topK: 40,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('❌ Gemini API 상세 오류:');
      console.error('Status:', response.status);
      logger.error('Response:', errorData);
      console.error('API Key (앞 10자):', GEMINI_API_KEY?.substring(0, 10));
      console.error('URL:', apiUrl.replace(GEMINI_API_KEY, 'KEY_HIDDEN'));
      throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // 응답 구조 확인 및 안전하게 추출
    let aiResponse = '';

    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];

      // content.parts 확인
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        aiResponse = candidate.content.parts[0].text;
      }
      // thinking 모드인 경우 thoughts 필드 확인
      else if (candidate.thoughts && candidate.thoughts.parts && candidate.thoughts.parts.length > 0) {
        aiResponse = candidate.thoughts.parts[0].text;
      }
      // 직접 text 필드 확인
      else if (candidate.text) {
        aiResponse = candidate.text;
      }
    }

    if (!aiResponse) {
      logger.error('❌ 응답 텍스트를 찾을 수 없습니다:', data);
      // 기본 응답 반환
      aiResponse = '죄송합니다. 자세한 문의는 010-2688-1388로 전화주세요.';
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    logger.error('❌ API 라우트 오류:', error);
    logger.error('에러 메시지:', error.message);
    logger.error('에러 스택:', error.stack);

    return NextResponse.json(
      {
        response: '죄송합니다. 일시적인 오류가 발생했습니다.\n기본 문의는 010-2688-1388로 전화주세요.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 200 } // 200으로 반환하여 프론트엔드에서 처리
    );
  }
}
