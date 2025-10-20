import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 마켓 기본 설정 가져오기
    const { data: settings, error: settingsError } = await supabase
      .from('mapping_settings')
      .select('*')
      .order('display_order', { ascending: true });

    if (settingsError) throw settingsError;

    // 2. 표준필드 매핑 가져오기
    const { data: fields, error: fieldsError } = await supabase
      .from('mapping_settings_standard_fields')
      .select('*')
      .order('market_name', { ascending: true });

    if (fieldsError) throw fieldsError;

    // 3. 표준필드명(한글)과 영문필드명 추출
    const standardFieldRow = fields?.find((f: any) => f.market_name === '표준필드');
    const englishFieldRow = fields?.find((f: any) => f.market_name === '영문필드명');
    const standardFieldKeys: string[] = [];

    // field_1 ~ field_43 중 값이 있는 것만 수집
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      if (standardFieldRow && standardFieldRow[fieldKey]) {
        standardFieldKeys.push(fieldKey);
      }
    }

    // 4. 각 마켓별로 필드 매핑 생성
    const templates = settings?.map((setting: any) => {
      const marketFieldRow = fields?.find((f: any) => f.market_name === setting.market_name);
      const fieldMappings: Record<string, string> = {};

      if (marketFieldRow && englishFieldRow) {
        standardFieldKeys.forEach((fieldKey) => {
          const englishFieldName = englishFieldRow[fieldKey]; // 영문필드명 (예: payment_date)
          const marketFieldName = marketFieldRow[fieldKey]; // 마켓 컬럼명 (예: 결제일)

          if (englishFieldName && marketFieldName) {
            // 영문필드명 -> 마켓필드명 매핑
            fieldMappings[englishFieldName] = marketFieldName;
          }
        });
      }

      return {
        id: setting.id,
        market_name: setting.market_name,
        initial: setting.market_initial,
        color_rgb: setting.market_color,
        detect_string1: setting.detect_string1,
        detect_string2: setting.detect_string2,
        settlement_method: 'formula',
        settlement_formula: setting.settlement_formula,
        header_row: setting.header_row,
        display_order: setting.display_order,
        field_mappings: fieldMappings,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('마켓 템플릿 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('market_upload_templates')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('마켓 템플릿 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
