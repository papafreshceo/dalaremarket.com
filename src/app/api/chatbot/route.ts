import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      console.error('⚠️ Gemini API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Supabase에서 원물 데이터 조회
    const supabase = await createClient();
    const { data: rawMaterials, error } = await supabase
      .from('raw_materials')
      .select('product_code, product_name, category_2, category_3, category_4, unit, supply_status, season, season_start_date, season_end_date')
      .order('category_3', { ascending: true });

    if (error) {
      console.error('DB 조회 오류:', error);
    }

    // 출하중인 원물 (원물 + 옵션명)
    const availableProducts = rawMaterials?.filter(p => p.supply_status === '출하중') || [];
    const productList = availableProducts.length > 0
      ? availableProducts.map(p => {
          const dates = p.season_start_date && p.season_end_date
            ? ` (출하: ${p.season_start_date} ~ ${p.season_end_date})`
            : '';
          return `${p.category_4 || p.category_3} - ${p.product_name}${dates}`;
        }).join('\n')
      : '현재 출하중인 상품이 없습니다.';

    // 전체 원물 카테고리 (category_4 기준)
    const allMaterials = [...new Set(rawMaterials?.map(p => p.category_4 || p.category_3) || [])].join(', ');

    // 시즌별 원물 그룹핑
    const seasonMaterials = {
      봄: [...new Set(rawMaterials?.filter(p => p.season === '봄').map(p => p.category_4 || p.category_3) || [])].join(', '),
      여름: [...new Set(rawMaterials?.filter(p => p.season === '여름').map(p => p.category_4 || p.category_3) || [])].join(', '),
      가을: [...new Set(rawMaterials?.filter(p => p.season === '가을').map(p => p.category_4 || p.category_3) || [])].join(', ')
    };

    // Gemini API 호출 - 무료 모델 (gemini-2.0-flash-lite)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    console.log('🔍 API 호출 시도:', apiUrl.replace(GEMINI_API_KEY, 'KEY_HIDDEN'));

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
                text: `당신은 달래마켓 B2B의 농산물 도매 상담 챗봇입니다.

## 회사 정보
- 회사명: 달래마켓 B2B
- 전화: 010-2688-1388
- 영업시간: 09:00-18:00
- 배송: 발주마감 오전 9시
- 최소주문: 1개 이상
- 결제: 선결제, 계좌이체

## 취급 원물 (농산물 종류)
${allMaterials}

## 현재 출하중인 상품
${productList}

## 시즌별 원물 (수확 시기에 공급)
- 봄 시즌: ${seasonMaterials.봄}
- 여름 시즌: ${seasonMaterials.여름}
- 가을 시즌: ${seasonMaterials.가을}

## 중요 안내사항
- 농산물은 재고 개념이 아닌 시즌별 수확량에 따라 공급됩니다
- 각 원물(예: 청도반시)에는 여러 옵션상품(30내, 35내, 40내 등)이 있습니다
- 출하기간 중에는 수확하는 물량만큼 공급 가능합니다
- 시즌이 아닌 상품은 해당 시즌(출하시작일~출하종료일)에 주문 가능합니다

위 정보를 바탕으로 답변하세요.
- 원물명과 옵션상품을 함께 안내하세요
- 출하일정(시작일~종료일)을 언급하세요
- 정확한 가격과 물량은 "010-2688-1388"로 문의하도록 안내하세요

고객 질문: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API 상세 오류:');
      console.error('Status:', response.status);
      console.error('Response:', errorData);
      console.error('API Key (앞 10자):', GEMINI_API_KEY?.substring(0, 10));
      console.error('URL:', apiUrl.replace(GEMINI_API_KEY, 'KEY_HIDDEN'));
      throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API 응답 성공');
    console.log('📦 응답 데이터:', JSON.stringify(data, null, 2));

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
      console.error('❌ 응답 텍스트를 찾을 수 없습니다:', data);
      // 기본 응답 반환
      aiResponse = '죄송합니다. 자세한 문의는 010-2688-1388로 전화주세요.';
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('❌ API 라우트 오류:', error);
    return NextResponse.json(
      {
        response: '죄송합니다. 일시적인 오류가 발생했습니다.\n기본 문의는 010-2688-1388로 전화주세요.'
      },
      { status: 200 } // 200으로 반환하여 프론트엔드에서 처리
    );
  }
}
