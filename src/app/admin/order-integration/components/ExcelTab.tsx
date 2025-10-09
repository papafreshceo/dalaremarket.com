'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';

interface UploadedOrder {
  id?: number;
  _optionNameModified?: boolean;  // 옵션명 수정 여부
  _optionNameInDB?: boolean;      // DB에 옵션명 존재 여부
  match_status?: 'matched' | 'unmatched';
  field_1?: string;  // 마켓명
  field_2?: string;  // 연번
  field_3?: string;  // 결제일
  field_4?: string;  // 주문번호
  field_5?: string;  // 주문자
  field_6?: string;  // 주문자전화번호
  field_7?: string;  // 수령인
  field_8?: string;  // 수령인전화번호
  field_9?: string;  // 주소
  field_10?: string; // 배송메세지
  field_11?: string; // 옵션명
  field_12?: string; // 수량
  field_13?: string; // 마켓
  field_14?: string; // 확인
  field_15?: string; // 특이/요청사항
  field_16?: string; // 발송요청일
  field_17?: string; // 셀러
  field_18?: string; // 셀러공급가
  field_19?: string; // 출고처
  field_20?: string; // 송장주체
  field_21?: string; // 벤더사
  field_22?: string; // 발송지명
  field_23?: string; // 발송지주소
  field_24?: string; // 발송지연락처
  field_25?: string; // 출고비용
  field_26?: string; // 정산예정금액
  field_27?: string; // 정산대상금액
  field_28?: string; // 상품금액
  field_29?: string; // 최종결제금액
  field_30?: string; // 할인금액
  field_31?: string; // 마켓부담할인금액
  field_32?: string; // 판매자할인쿠폰할인
  field_33?: string; // 구매쿠폰적용금액
  field_34?: string; // 쿠폰할인금액
  field_35?: string; // 기타지원금할인금
  field_36?: string; // 수수료1
  field_37?: string; // 수수료2
  field_38?: string; // 판매아이디
  field_39?: string; // 분리배송 Y/N
  field_40?: string; // 택배비
  field_41?: string; // 발송일(송장입력일)
  field_42?: string; // 택배사
  field_43?: string; // 송장번호
  [key: string]: any; // 동적 필드 지원
}

interface OptionProduct {
  id: string;
  option_code: string;
  option_name: string;
  seller_supply_price: number | null;
  shipping_vendor_id: string | null;
  invoice_entity: string | null;
  shipping_location_name: string | null;
  shipping_location_address: string | null;
  shipping_location_contact: string | null;
  shipping_cost: number | null;
  [key: string]: any;
}

interface MarketTemplate {
  id: number;
  market_name: string;
  initial: string;
  color_rgb: string;
  detect_string1: string;
  detect_string2: string;
  detect_string3?: string;
  settlement_method: string;
  settlement_formula: string;
  header_row: number;
  display_order?: number;
  field_mappings: Record<string, string>; // 표준필드명 -> 마켓필드명
}

interface FilePreview {
  file: File;
  marketName: string;
  detectedTemplate: MarketTemplate | null;
  orderCount: number;
  isToday: boolean; // 오늘 수정된 파일인지 여부
}

export default function ExcelTab() {
  const [orders, setOrders] = useState<UploadedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [optionProducts, setOptionProducts] = useState<Map<string, OptionProduct>>(new Map());
  const [marketTemplates, setMarketTemplates] = useState<Map<string, MarketTemplate>>(new Map());
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);
  const [integrationStage, setIntegrationStage] = useState<'idle' | 'file-preview' | 'integrated'>('idle');
  const [columns, setColumns] = useState<any[]>([]);
  const [marketFieldMappings, setMarketFieldMappings] = useState<Map<string, any>>(new Map());
  const [standardFields, setStandardFields] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState({ title: '', content: '' });

  // 옵션상품, 마켓 템플릿, 표준 필드 로드
  useEffect(() => {
    loadOptionProducts();
    loadMarketTemplates();
    loadStandardFields();
  }, []);

  // marketTemplates와 columns가 로드되면 마켓 컬럼에 렌더러 추가
  useEffect(() => {
    if (marketTemplates.size > 0 && columns.length > 0) {
      // 이미 렌더러가 있는지 확인 (무한 루프 방지)
      const marketColumn = columns.find(c => c.isMarketColumn);
      if (marketColumn && !marketColumn.renderer) {
        const updatedColumns = columns.map((column) => {
          if (column.isMarketColumn) {
            return {
              ...column,
              renderer: (value: any, row: any, rowIndex: number, _dropdownHandler?: any) => {
                const marketName = value ?? '';
                if (!marketName) return <span style={{ fontSize: '13px' }}></span>;

                const template = marketTemplates.get(String(marketName).toLowerCase());
                let marketColor = '#6B7280';

                if (template?.color_rgb) {
                  if (template.color_rgb.includes(',')) {
                    marketColor = `rgb(${template.color_rgb})`;
                  } else {
                    marketColor = template.color_rgb;
                  }
                }

                return (
                  <span
                    className="px-2 py-0.5 rounded text-white text-xs font-medium"
                    style={{ backgroundColor: marketColor }}
                  >
                    {String(marketName)}
                  </span>
                );
              }
            };
          }
          return column;
        });

        setColumns(updatedColumns);
        console.log('✓ 마켓 렌더러 추가 완료, marketTemplates 크기:', marketTemplates.size);
      }
    }
  }, [marketTemplates, columns]);


  const loadStandardFields = async () => {
    try {
      const response = await fetch('/api/mapping-settings/fields');
      const result = await response.json();

      console.log('API 응답:', result);

      if (result.success && result.data) {
        // 표준필드 행 찾기
        const standardRow = result.data.find((row: any) => row.market_name === '표준필드');

        console.log('표준필드 행:', standardRow);

        if (standardRow) {
          // field_1 ~ field_43까지 있는 필드들을 컬럼으로 변환
          const dynamicColumns = [];
          for (let i = 1; i <= 43; i++) {
            const fieldKey = `field_${i}`;
            const fieldValue = standardRow[fieldKey];

            if (fieldValue && fieldValue.trim()) {
              const column: any = {
                key: fieldKey,
                title: fieldValue
              };

              // 특정 필드만 너비 고정
              if (i === 4) column.width = 150; // 주문번호
              if (i === 5) column.width = 100; // 주문자
              if (i === 7) column.width = 100; // 수령인
              if (i === 9) column.width = 250; // 주소
              if (i === 10) column.width = 120; // 배송메시지

              // field_1 (마켓명) - 마켓 배지 렌더러는 제거 (아래에서 처리)
              if (i === 1) {
                column.isMarketColumn = true; // 마커 추가
              }

              // field_11 (옵션명)에 특별 처리
              if (i === 11) {
                column.renderer = (value: any, row: any, rowIndex: number, _dropdownHandler?: any) => {
                  const isModified = row?._optionNameModified;
                  const isInDB = row?._optionNameInDB;
                  const displayValue = value ?? '';

                  return (
                    <div className="relative flex items-center" style={{ fontSize: '13px' }}>
                      <span>{String(displayValue)}</span>
                      {!isInDB && !isModified && <span className="ml-1">⚠️</span>}
                      {isModified && <span className="ml-1">✏️</span>}
                    </div>
                  );
                };

                column.cellStyle = (value: any, row: any) => {
                  if (!row?._optionNameInDB && !row?._optionNameModified) {
                    return { backgroundColor: '#FED7AA' }; // 주황색 배경
                  }
                  if (row?._optionNameModified) {
                    return { backgroundColor: '#BBF7D0' }; // 초록색 배경
                  }
                  return {};
                };
              }

              dynamicColumns.push(column);
            }
          }

          console.log('생성된 컬럼 수:', dynamicColumns.length);
          console.log('컬럼 샘플:', dynamicColumns.slice(0, 5).map(c => ({ key: c.key, title: c.title, width: c.width, hasRenderer: !!c.renderer })));
          console.log('marketTemplates 크기:', marketTemplates.size);
          console.log('marketTemplates 샘플:', Array.from(marketTemplates.entries()).slice(0, 3));

          // 컬럼 검증 - renderer가 함수인지 확인
          dynamicColumns.forEach((col, idx) => {
            if (col.renderer && typeof col.renderer !== 'function') {
              console.error(`컬럼 ${idx} (${col.key})의 renderer가 함수가 아닙니다:`, typeof col.renderer, col.renderer);
            }
            if (col.cellStyle && typeof col.cellStyle !== 'function') {
              console.error(`컬럼 ${idx} (${col.key})의 cellStyle이 함수가 아닙니다:`, typeof col.cellStyle, col.cellStyle);
            }
          });

          setColumns(dynamicColumns);
          setStandardFields(standardRow); // 표준필드 정보 저장
        } else {
          console.log('표준필드 행을 찾을 수 없습니다.');
        }

        // 마켓별 필드 매핑 정보 저장
        const mappings = new Map<string, any>();
        result.data.forEach((row: any) => {
          if (row.market_name !== '표준필드') {
            mappings.set(row.market_name.toLowerCase(), row);
          }
        });
        setMarketFieldMappings(mappings);
        console.log('마켓별 필드 매핑:', mappings);
      }
    } catch (error) {
      console.error('표준 필드 로드 실패:', error);
    }
  };

  const loadOptionProducts = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('option_products')
        .select('id, option_code, option_name, seller_supply_price, shipping_vendor_id, invoice_entity, shipping_location_name, shipping_location_address, shipping_location_contact, shipping_cost')
        .order('option_name');

      if (error) {
        console.error('옵션상품 로드 실패:', error);
        return;
      }

      if (data) {
        const productMap = new Map<string, OptionProduct>();
        data.forEach((product: OptionProduct) => {
          productMap.set(product.option_name.toLowerCase(), product);
        });
        setOptionProducts(productMap);
        console.log('옵션상품 로드 완료:', productMap.size, '개');
      }
    } catch (error) {
      console.error('옵션상품 로드 실패:', error);
    }
  };

  const loadMarketTemplates = async () => {
    try {
      const response = await fetch('/api/market-templates');
      const result = await response.json();

      if (result.success) {
        const templateMap = new Map<string, MarketTemplate>();
        result.data.forEach((template: MarketTemplate) => {
          templateMap.set(template.market_name.toLowerCase(), template);
          // 감지 문자열로도 매핑
          if (template.detect_string1) {
            templateMap.set(template.detect_string1.toLowerCase(), template);
          }
          if (template.detect_string2) {
            templateMap.set(template.detect_string2.toLowerCase(), template);
          }
        });
        setMarketTemplates(templateMap);
      }
    } catch (error) {
      console.error('매핑 설정 로드 실패:', error);
    }
  };

  // option_products 컬럼명 → 한글 레이블 매핑
  const OPTION_PRODUCT_LABELS: Record<string, string> = {
    seller_supply_price: '셀러공급가',
    shipping_vendor_id: '출고처',
    invoice_entity: '송장주체',
    shipping_location_name: '발송지명',
    shipping_location_address: '발송지주소',
    shipping_location_contact: '발송지연락처',
    shipping_cost: '상품출고비용'
  };

  // 옵션상품 데이터를 주문에 동적으로 매핑
  const mapOptionProductToOrder = (order: any, product: OptionProduct): any => {
    if (!standardFields) return order;

    const mappedOrder = { ...order };

    // 표준필드(field_1~43)를 순회하면서 매칭
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      const standardFieldName = standardFields[fieldKey]; // 예: "셀러공급가"

      if (!standardFieldName) continue;

      // 이 표준필드명에 해당하는 option_products 컬럼 찾기
      const optionProductColumn = Object.entries(OPTION_PRODUCT_LABELS)
        .find(([_, label]) => label === standardFieldName)?.[0];

      if (optionProductColumn && product[optionProductColumn] !== undefined && product[optionProductColumn] !== null) {
        // 기존 값이 없을 때만 매핑 (엑셀 데이터 우선)
        if (!mappedOrder[fieldKey]) {
          mappedOrder[fieldKey] = product[optionProductColumn];
        }
      }
    }

    return mappedOrder;
  };

  // 옵션명에 옵션상품 매칭 적용
  const applyProductMapping = (orders: UploadedOrder[]): UploadedOrder[] => {
    return orders.map((order) => {
      // field_11이 옵션명
      const optionName = order.field_11;

      if (!optionName) {
        return {
          ...order,
          match_status: 'unmatched' as const,
          _optionNameInDB: false
        };
      }

      const product = optionProducts.get(optionName.trim().toLowerCase());

      if (product) {
        const mappedOrder = mapOptionProductToOrder(order, product);
        return {
          ...mappedOrder,
          match_status: 'matched' as const,
          _optionNameInDB: true
        };
      } else {
        return {
          ...order,
          match_status: 'unmatched' as const,
          _optionNameInDB: false
        };
      }
    });
  };

  // 파일명 또는 내용으로 마켓 템플릿 감지 (우선순위 기반)
  const detectMarketTemplate = (fileName: string, firstRow: any): MarketTemplate | null => {
    const lowerFileName = fileName.toLowerCase();
    const rowText = Object.keys(firstRow).join(',').toLowerCase();

    console.log('마켓 감지 시작 - 파일명:', fileName);
    console.log('헤더:', rowText);

    // 각 템플릿별 매칭 점수 계산
    const candidates: Array<{ template: MarketTemplate; score: number; reason: string }> = [];

    for (const template of marketTemplates.values()) {
      let score = 0;
      const reasons: string[] = [];

      // 1. detect_string1로 파일명 검사 (높은 점수)
      if (template.detect_string1 && template.detect_string1.trim()) {
        const detectStrings = template.detect_string1.split(',').map(s => s.trim().toLowerCase());
        const matched = detectStrings.filter(str => str && lowerFileName.includes(str));
        if (matched.length > 0) {
          score += 100 * matched.length; // 파일명 매칭은 100점씩
          reasons.push(`파일명(${matched.join(',')})`);
        }
      }

      // 2. detect_string2로 헤더 검사 (매칭된 개수만큼 점수)
      if (template.detect_string2 && template.detect_string2.trim()) {
        const headerStrings = template.detect_string2.split(',').map(s => s.trim().toLowerCase());
        const matched = headerStrings.filter(str => str && rowText.includes(str));
        if (matched.length > 0) {
          score += 10 * matched.length; // 헤더 매칭은 10점씩
          reasons.push(`헤더(${matched.length}개)`);
        }
      }

      if (score > 0) {
        candidates.push({
          template,
          score,
          reason: reasons.join(' + ')
        });
        console.log(`${template.market_name} - 점수: ${score}, 이유: ${reasons.join(' + ')}`);
      }
    }

    // 점수가 가장 높은 것 선택
    if (candidates.length === 0) {
      console.log('✗ 매칭되는 마켓을 찾을 수 없음');
      return null;
    }

    // 점수 내림차순 정렬
    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];
    console.log(`✓ ${winner.template.market_name}로 감지됨 (점수: ${winner.score}, 이유: ${winner.reason})`);

    // 동점자가 있는지 확인 (같은 마켓이 아닌 경우만)
    if (candidates.length > 1 && candidates[1].score === winner.score && candidates[1].template.market_name !== winner.template.market_name) {
      console.warn(`⚠ 경고: ${candidates[1].template.market_name}도 같은 점수(${winner.score})입니다`);
    }

    return winner.template;
  };

  // 마켓명 배지 렌더러
  const renderMarketBadge = (row: any, column: any) => {
    if (column.key !== 'field_1') return undefined;

    const marketName = row.field_1;
    if (!marketName) return '';

    // 마켓 템플릿에서 색상 가져오기
    const template = marketTemplates.get(marketName.toLowerCase());
    let marketColor = '#6B7280'; // 기본 회색

    if (template?.color_rgb) {
      if (template.color_rgb.includes(',')) {
        marketColor = `rgb(${template.color_rgb})`;
      } else {
        marketColor = template.color_rgb;
      }
    }

    return (
      <span
        className="px-2 py-0.5 rounded text-white text-xs font-medium"
        style={{ backgroundColor: marketColor }}
      >
        {marketName}
      </span>
    );
  };

  // 정산예정금액 계산
  const calculateSettlement = (row: any, formula: string, marketFieldMappings: any): number | null => {
    if (!formula || !standardFields) return null;

    console.log('정산 계산 - formula:', formula);

    // formula 예: "정산예정금액*1", "상품금액*0.9415", "최종결제금액*0.88", "최종결제금액"
    // 곱하기가 없으면 그 필드 값을 그대로 사용
    let fieldName: string;
    let multiplier: number = 1;

    const match = formula.match(/^(.+?)\*(.+)$/);
    if (match) {
      fieldName = match[1].trim(); // 예: "정산예정금액"
      multiplier = parseFloat(match[2].trim()); // 예: 1, 0.9415
    } else {
      fieldName = formula.trim(); // 예: "최종결제금액"
      multiplier = 1;
    }

    console.log('필드명:', fieldName, '배율:', multiplier);

    // 표준필드명 -> field 번호 매핑 (예: "정산예정금액" -> field_26)
    let targetFieldNumber: number | null = null;
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      if (standardFields[fieldKey] === fieldName) {
        targetFieldNumber = i;
        console.log(`표준필드에서 ${fieldName}은 field_${i}`);
        break;
      }
    }

    if (!targetFieldNumber) {
      console.log('표준필드에서 해당 필드를 찾을 수 없음:', fieldName);
      return null;
    }

    // 해당 마켓의 field_X가 엑셀의 어느 컬럼인지 찾기
    const targetFieldKey = `field_${targetFieldNumber}`;
    const excelColumnName = marketFieldMappings[targetFieldKey];

    if (!excelColumnName) {
      console.log(`${targetFieldKey}에 대한 매핑이 없음`);
      return null;
    }

    console.log(`${targetFieldKey}의 엑셀 컬럼명:`, excelColumnName);

    // 엑셀에서 해당 컬럼의 값 가져오기
    const fieldValue = row[excelColumnName];
    console.log('엑셀에서 값 가져옴:', fieldValue);

    if (fieldValue === null || fieldValue === undefined) {
      console.log('필드 값을 찾을 수 없음');
      return null;
    }

    const numValue = parseFloat(String(fieldValue).replace(/,/g, ''));
    if (isNaN(numValue)) {
      console.log('숫자 변환 실패:', fieldValue);
      return null;
    }

    const result = Math.round(numValue * multiplier);
    console.log('정산 계산 결과:', result);
    return result;
  };

  // 엑셀 날짜를 YYYY-MM-DD HH:MM:SS 형식으로 변환
  const convertExcelDate = (value: any): string => {
    if (typeof value === 'number') {
      // 엑셀 날짜는 1900-01-01부터의 일 수
      const date = new Date((value - 25569) * 86400 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return value;
  };

  // 템플릿 기반 필드 매핑 (field_1~field_43 구조로 변환)
  const mapFieldsUsingTemplate = (row: any, template: MarketTemplate, marketFieldMappings: any, sequenceNumber?: number): any => {
    const mappedData: any = {
      field_1: template.market_name, // 첫 번째 필드는 마켓명
      field_2: sequenceNumber?.toString() || '' // 연번
    };

    // marketFieldMappings는 mapping_settings_standard_fields에서 해당 마켓의 매핑 정보
    // { field_3: "결제일", field_4: "주문번호", ... }
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      const marketFieldName = marketFieldMappings[fieldKey]; // 예: "결제일"

      if (marketFieldName && row[marketFieldName] !== undefined) {
        let value = row[marketFieldName];

        // field_3 (결제일)은 날짜 변환
        if (i === 3 && typeof value === 'number') {
          value = convertExcelDate(value);
        }

        mappedData[fieldKey] = value;
      }
    }

    // field_13 (마켓): 마켓이니셜 + 시퀀스
    if (template.initial && sequenceNumber) {
      mappedData.field_13 = `${template.initial}${sequenceNumber}`;
    }

    // 정산예정금액 계산 (field_26)
    const settlement = calculateSettlement(row, template.settlement_formula, marketFieldMappings);
    if (settlement !== null) {
      mappedData.field_26 = settlement;
    }

    return mappedData;
  };

  // 엑셀 파일 읽기 (1단계: 파일 목록만 표시)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      console.log('marketTemplates 크기:', marketTemplates.size);
      console.log('optionProducts 크기:', optionProducts.size);

      const filePreviews: FilePreview[] = [];

      // 모든 파일의 마켓명 감지
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // 헤더 행 감지를 위해 먼저 읽기
        const allData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // 첫 번째 데이터 행으로 템플릿 감지
        const firstDataRow = allData[0] || [];
        const headerObj: any = {};
        firstDataRow.forEach((header: any, index: number) => {
          headerObj[header] = index;
        });

        let template = detectMarketTemplate(file.name, headerObj);
        let marketName = template?.market_name;

        // 템플릿을 찾지 못한 경우 파일명으로 마켓명 추측 후 다시 검색
        if (!template) {
          marketName = detectMarketFromFileNameFallback(file.name);
          // 추측한 마켓명으로 템플릿 다시 검색
          template = marketTemplates.get(marketName.toLowerCase()) || null;
        }

        // 주문 건수 계산 (실제 데이터 행 개수 - 헤더와 동일한 방식으로)
        const headerRowIndex = (template?.header_row || 1) - 1;
        const dataRows = XLSX.utils.sheet_to_json(firstSheet, {
          range: headerRowIndex,
          defval: null
        });
        const orderCount = dataRows.length;

        // 파일이 오늘 수정되었는지 확인
        const today = new Date();
        const fileDate = new Date(file.lastModified);
        const isToday =
          fileDate.getFullYear() === today.getFullYear() &&
          fileDate.getMonth() === today.getMonth() &&
          fileDate.getDate() === today.getDate();

        filePreviews.push({
          file,
          marketName: marketName || '알 수 없음',
          detectedTemplate: template,
          orderCount,
          isToday,
        });
      }

      // display_order에 따라 정렬
      filePreviews.sort((a, b) => {
        const orderA = a.detectedTemplate?.display_order ?? 999;
        const orderB = b.detectedTemplate?.display_order ?? 999;
        return orderA - orderB;
      });

      setUploadedFiles(filePreviews);
      setIntegrationStage('file-preview');
    } catch (error) {
      console.error('파일 읽기 실패:', error);
      alert('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 통합 버튼 클릭 (2단계: 실제 통합 처리)
  const handleIntegrateFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setLoading(true);
    try {
      let allOrders: UploadedOrder[] = [];
      let globalSequence = 0; // 전체 주문의 연번 카운터

      // 모든 파일 처리
      for (const filePreview of uploadedFiles) {
        const file = filePreview.file;
        const template = filePreview.detectedTemplate;

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        let jsonData: any[];

        if (template) {
          // 템플릿이 있으면 헤더 행 고려
          const headerRowIndex = (template.header_row || 1) - 1;
          jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            range: headerRowIndex,
            defval: null
          }) as any[];

          // 마켓별 필드 매핑 정보 가져오기
          const marketMapping = marketFieldMappings.get(template.market_name.toLowerCase());

          console.log(`${template.market_name} - 읽은 데이터 행 수:`, jsonData.length);
          console.log('마켓 매핑:', marketMapping);

          if (!marketMapping) {
            console.warn(`${template.market_name}의 필드 매핑 정보가 없습니다.`);
            continue;
          }

          // 템플릿 기반 매핑 (field_1~field_43 구조로)
          const mappedOrders = jsonData.map((row: any, index: number) => {
            globalSequence++; // 전체 연번 증가
            const mapped = mapFieldsUsingTemplate(row, template, marketMapping, globalSequence);
            if (index === 0) {
              console.log('첫 번째 행 원본:', row);
              console.log('첫 번째 행 매핑 결과:', mapped);
            }
            return mapped;
          });

          console.log(`${template.market_name} - 매핑된 주문 수:`, mappedOrders.length);
          allOrders = [...allOrders, ...mappedOrders];

        } else {
          // 템플릿이 없으면 기존 방식 (fallback)
          jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

          const marketName = filePreview.marketName;

          const getFieldValue = (row: any, ...fieldNames: string[]) => {
            for (const fieldName of fieldNames) {
              const value = row[fieldName];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            return null;
          };

          const mappedOrders: UploadedOrder[] = jsonData.map((row: any) => ({
            market_name: marketName,
            order_number: getFieldValue(row, '주문번호', 'orderNumber', '주문 번호', 'Order Number') || '',
            payment_date: getFieldValue(row, '결제일', 'paymentDate', '결제 일', 'Payment Date'),
            recipient_name: getFieldValue(row, '수취인', '수취인명', 'recipientName', '수령인', 'Recipient Name', '이름') || '',
            recipient_phone: getFieldValue(row, '전화번호', '연락처', 'phone', 'phoneNumber', '휴대폰', '핸드폰'),
            recipient_address: getFieldValue(row, '주소', 'address', '배송주소', 'deliveryAddress'),
            option_name: getFieldValue(row, '옵션명', '상품명', 'optionName', 'productName', '옵션', '상품') || '',
            quantity: parseInt(String(getFieldValue(row, '수량', 'quantity', 'qty', '개수') || '1')),
            seller_supply_price: parseFloat(String(getFieldValue(row, '셀러공급가', 'sellerSupplyPrice', '공급가') || '0')) || undefined,
          }));

          const validOrders = mappedOrders.filter(
            (order) => order.order_number && order.recipient_name && order.option_name
          );

          allOrders = [...allOrders, ...validOrders];
        }
      }

      console.log('전체 통합된 주문 수:', allOrders.length);
      console.log('전체 주문 데이터:', allOrders);

      // 옵션명 기준으로 자동 매칭
      const ordersWithMapping = applyProductMapping(allOrders);

      console.log('옵션명 매칭 완료');

      // 주문통합 완료 - 로컬에만 저장 (DB 저장 안 함)
      setOrders(ordersWithMapping);
      setIntegrationStage('integrated');

      // 통계 계산
      const matchedCount = ordersWithMapping.filter((o) => o.match_status === 'matched').length;
      const unmatchedCount = ordersWithMapping.filter((o) => o.match_status === 'unmatched').length;

      setStats({
        total: ordersWithMapping.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      });

      setResultMessage({
        title: '주문 통합 완료',
        content: `총 ${ordersWithMapping.length}개 주문\n✓ 옵션명 매칭 성공: ${matchedCount}개\n✗ 옵션명 매칭 실패: ${unmatchedCount}개\n\n${
          unmatchedCount > 0
            ? '매칭 실패한 옵션명은 출고 정보가 자동으로 입력되지 않았습니다.'
            : '모든 주문의 출고 정보가 자동으로 입력되었습니다!'
        }`
      });
      setShowResultModal(true);
    } catch (error) {
      console.error('엑셀 파일 읽기 실패:', error);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const detectMarketFromFileNameFallback = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('스마트스토어') || lower.includes('네이버')) return '스마트스토어';
    if (lower.includes('쿠팡')) return '쿠팡';
    if (lower.includes('11번가')) return '11번가';
    if (lower.includes('토스')) return '토스';
    return '전화주문';
  };

  // 옵션명 매칭 실행
  const handleApplyProductMatching = async () => {
    if (orders.length === 0) {
      alert('매칭할 주문 데이터가 없습니다.\n\n먼저 엑셀 파일을 업로드하세요.');
      return;
    }

    setLoading(true);
    try {
      // 옵션상품 데이터 로드 (캐시가 없는 경우)
      let productMap = optionProducts;
      if (productMap.size === 0) {
        await loadOptionProducts();
        productMap = optionProducts;
      }

      console.log('매칭 시작 - 주문 수:', orders.length, '옵션상품 수:', productMap.size);

      // 옵션상품 매칭 적용
      const ordersWithMapping = orders.map((order, index) => {
        if (!order.option_name) {
          console.log(`[${index}] 옵션명 없음`);
          return { ...order, match_status: 'unmatched' as const };
        }

        const trimmedOption = order.option_name.trim().toLowerCase();
        const product = productMap.get(trimmedOption);

        if (product) {
          console.log(`[${index}] 매칭 성공: "${order.option_name}" → ${product.vendor_name}`);
          return {
            ...order,
            vendor_name: order.vendor_name || product.vendor_name,
            seller_supply_price:
              order.seller_supply_price ||
              (product.seller_supply_price ? product.seller_supply_price * order.quantity : undefined),
            match_status: 'matched' as const,
          };
        } else {
          console.log(`[${index}] 매칭 실패: "${order.option_name}" (검색키: "${trimmedOption}")`);
          return { ...order, match_status: 'unmatched' as const };
        }
      });

      setOrders(ordersWithMapping);

      // 통계 계산
      const matchedCount = ordersWithMapping.filter((o) => o.match_status === 'matched').length;
      const unmatchedCount = ordersWithMapping.filter((o) => o.match_status === 'unmatched').length;

      setStats({
        total: ordersWithMapping.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      });

      alert(
        `옵션명 검증 완료\n\n` +
          `✓ 검증 성공: ${matchedCount}개\n` +
          `✗ 검증 실패: ${unmatchedCount}개\n\n` +
          (unmatchedCount > 0
            ? `검증 실패한 옵션명은 출고 정보가 자동으로 입력되지 않았습니다.`
            : `모든 주문의 출고 정보가 자동으로 입력되었습니다!`)
      );
    } catch (error) {
      console.error('옵션명 매칭 오류:', error);
      alert('옵션명 매칭 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 저장 (Supabase에 업로드)
  const handleSaveToDatabase = async () => {
    if (orders.length === 0) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    const unmatchedCount = orders.filter((o) => o.match_status === 'unmatched').length;

    if (unmatchedCount > 0) {
      if (
        !confirm(
          `${unmatchedCount}개 주문이 매칭되지 않았습니다.\n\n` +
            `계속 진행하시겠습니까?`
        )
      ) {
        return;
      }
    }

    setLoading(true);
    try {
      // field_X를 표준명으로 매핑
      const ordersToSave = orders.map((order) => {
        const { _optionNameModified, _optionNameInDB, match_status, id, ...cleanOrder } = order;

        return {
          market_name: cleanOrder.field_1,
          sequence_number: cleanOrder.field_2,
          payment_date: cleanOrder.field_3,
          order_number: cleanOrder.field_4,
          buyer_name: cleanOrder.field_5,
          buyer_phone: cleanOrder.field_6,
          recipient_name: cleanOrder.field_7,
          recipient_phone: cleanOrder.field_8,
          recipient_address: cleanOrder.field_9,
          delivery_message: cleanOrder.field_10,
          option_name: cleanOrder.field_11,
          quantity: cleanOrder.field_12,
          market_check: cleanOrder.field_13,
          confirmation: cleanOrder.field_14,
          special_request: cleanOrder.field_15,
          shipping_request_date: cleanOrder.field_16,
          seller_name: cleanOrder.field_17,
          seller_supply_price: cleanOrder.field_18,
          shipping_source: cleanOrder.field_19,
          invoice_issuer: cleanOrder.field_20,
          vendor_name: cleanOrder.field_21,
          shipping_location_name: cleanOrder.field_22,
          shipping_location_address: cleanOrder.field_23,
          shipping_location_contact: cleanOrder.field_24,
          shipping_cost: cleanOrder.field_25,
          settlement_amount: cleanOrder.field_26,
          settlement_target_amount: cleanOrder.field_27,
          product_amount: cleanOrder.field_28,
          final_payment_amount: cleanOrder.field_29,
          discount_amount: cleanOrder.field_30,
          platform_discount: cleanOrder.field_31,
          seller_discount: cleanOrder.field_32,
          buyer_coupon_discount: cleanOrder.field_33,
          coupon_discount: cleanOrder.field_34,
          other_support_discount: cleanOrder.field_35,
          commission_1: cleanOrder.field_36,
          commission_2: cleanOrder.field_37,
          seller_id: cleanOrder.field_38,
          separate_shipping: cleanOrder.field_39,
          delivery_fee: cleanOrder.field_40,
          shipped_date: cleanOrder.field_41,
          courier_company: cleanOrder.field_42,
          tracking_number: cleanOrder.field_43,
          sheet_date: new Date().toISOString().split('T')[0],
        };
      });

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 저장되었습니다.`);
        setOrders([]); // 초기화
        setStats({ total: 0, matched: 0, unmatched: 0 });
      } else {
        alert('저장 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 수정 핸들러
  const handleDataChange = (updatedData: any[]) => {
    // field_11 (옵션명)이 수정되었는지 확인
    const dataWithModifiedFlag = updatedData.map((row, index) => {
      const originalRow = orders[index];

      // 옵션명(field_11)이 수정되었는지 확인
      if (originalRow && row.field_11 !== originalRow.field_11) {
        // 수정한 옵션명이 DB에 있는지 확인
        const newOptionName = row.field_11;
        const isInDB = newOptionName ? optionProducts.has(newOptionName.trim().toLowerCase()) : false;

        return {
          ...row,
          _optionNameModified: true,
          _optionNameInDB: isInDB,
          match_status: isInDB ? 'matched' : 'unmatched'
        };
      }

      return row;
    });

    setOrders(dataWithModifiedFlag);

    // 통계 재계산
    const matchedCount = dataWithModifiedFlag.filter((o) => o.match_status === 'matched').length;
    const unmatchedCount = dataWithModifiedFlag.filter((o) => o.match_status === 'unmatched').length;

    setStats({
      total: dataWithModifiedFlag.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
    });
  };

  // 행 삭제 핸들러
  const handleDeleteRows = (indices: number[]) => {
    const remainingOrders = orders.filter((_, index) => !indices.includes(index));
    setOrders(remainingOrders);

    // 통계 재계산
    const matchedCount = remainingOrders.filter((o) => o.match_status === 'matched').length;
    const unmatchedCount = remainingOrders.filter((o) => o.match_status === 'unmatched').length;

    setStats({
      total: remainingOrders.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
    });
  };

  return (
    <div className="space-y-4">
      {/* 업로드 버튼 (중앙 배치) */}
      {integrationStage === 'idle' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-base font-medium"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              엑셀 파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* 파일 목록 미리보기 */}
      {integrationStage === 'file-preview' && uploadedFiles.length > 0 && (
        <div className="max-w-[1000px] mx-auto">
          {/* 선택 결과 통계 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>파일 <strong className="text-gray-900">{uploadedFiles.length}개</strong></span>
              <span>마켓 <strong className="text-gray-900">{new Set(uploadedFiles.map(f => f.marketName)).size}개</strong></span>
              <span>주문 <strong className="text-gray-900">{uploadedFiles.reduce((sum, f) => sum + f.orderCount, 0).toLocaleString()}건</strong></span>
            </div>
            {/* 오늘 파일 아닌 것 배지 */}
            {uploadedFiles.filter(f => !f.isToday).length > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                오늘 파일 아님 {uploadedFiles.filter(f => !f.isToday).length}개
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            {uploadedFiles.map((filePreview, index) => {
              const template = filePreview.detectedTemplate;
              // RGB 문자열을 rgb() 형식으로 변환 (예: "0,255,0" -> "rgb(0,255,0)")
              let marketColor = '#6B7280'; // 기본 회색
              if (template?.color_rgb) {
                // color_rgb가 "0,255,0" 형식이면 rgb()로 변환
                if (template.color_rgb.includes(',')) {
                  marketColor = `rgb(${template.color_rgb})`;
                } else {
                  // 이미 hex 또는 rgb 형식이면 그대로 사용
                  marketColor = template.color_rgb;
                }
              }

              const fileName = filePreview.file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
              const lastModified = new Date(filePreview.file.lastModified).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  {/* 왼쪽: 마켓명 배지 + 주문건수 */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: marketColor }}
                    >
                      {filePreview.marketName}
                    </span>
                    <span className="text-gray-900 font-bold text-sm">{filePreview.orderCount}건</span>
                  </div>

                  {/* 오른쪽: 파일명 + 최근수정일 + 삭제 */}
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 text-sm">{fileName}</span>
                    <span className="text-gray-500 text-xs">{lastModified}</span>
                    <button
                      onClick={() => {
                        const newFiles = uploadedFiles.filter((_, i) => i !== index);
                        if (newFiles.length === 0) {
                          setUploadedFiles([]);
                          setIntegrationStage('idle');
                        } else {
                          setUploadedFiles(newFiles);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setUploadedFiles([]);
                setIntegrationStage('idle');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleIntegrateFiles}
              disabled={loading || uploadedFiles.some(f => !f.isToday)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  통합 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  통합
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 통계 카드 - 통합 완료 시에만 표시 */}
      {integrationStage === 'integrated' && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">총 주문</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            매칭 성공
          </div>
          <div className="text-2xl font-semibold text-green-600">{stats.matched.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-red-600" />
            매칭 실패
          </div>
          <div className="text-2xl font-semibold text-red-600">{stats.unmatched.toLocaleString()}</div>
        </div>
      </div>
      )}

      {/* EditableAdminGrid */}
      {integrationStage === 'integrated' && orders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">업로드된 주문 ({orders.length}건)</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOrders([]);
                  setUploadedFiles([]);
                  setIntegrationStage('idle');
                  setStats({ total: 0, matched: 0, unmatched: 0 });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                초기화
              </button>
              <button
                onClick={handleApplyProductMatching}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? '검증 중...' : '옵션명 검증'}
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {loading ? '저장 중...' : 'DB 저장'}
              </button>
            </div>
          </div>
          <EditableAdminGrid
            columns={columns}
            data={orders}
            onDataChange={handleDataChange}
            onDeleteSelected={handleDeleteRows}
            height="calc(100vh - 450px)"
            enableCSVExport={true}
            enableCSVImport={false}
          />
        </div>
      )}

      {/* 빈 상태 */}
      {integrationStage === 'idle' && orders.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">엑셀 파일을 업로드하세요</h3>
        </div>
      )}

      {/* 결과 모달 */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{resultMessage.title}</h3>
            <p className="text-gray-700 whitespace-pre-line mb-6">{resultMessage.content}</p>
            <button
              onClick={() => setShowResultModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
