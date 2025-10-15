'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

interface UploadedOrder {
  id?: number;
  _optionNameModified?: boolean;  // 옵션명 수정 여부
  _optionNameInDB?: boolean;      // DB에 옵션명 존재 여부
  _optionNameVerified?: boolean;  // 옵션명 검증 완료 여부
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
  field_17?: string; // 옵션코드
  field_18?: string; // 셀러
  field_19?: string; // 셀러공급가
  field_20?: string; // 출고처
  field_21?: string; // 송장주체
  field_22?: string; // 벤더사
  field_23?: string; // 발송지명
  field_24?: string; // 발송지주소
  field_25?: string; // 발송지연락처
  field_26?: string; // 출고비용
  field_27?: string; // 정산예정금액
  field_28?: string; // 정산대상금액
  field_29?: string; // 상품금액
  field_30?: string; // 최종결제금액
  field_31?: string; // 할인금액
  field_32?: string; // 마켓부담할인금액
  field_33?: string; // 판매자할인쿠폰할인
  field_34?: string; // 구매쿠폰적용금액
  field_35?: string; // 쿠폰할인금액
  field_36?: string; // 기타지원금할인금
  field_37?: string; // 수수료1
  field_38?: string; // 수수료2
  field_39?: string; // 판매아이디
  field_40?: string; // 분리배송 Y/N
  field_41?: string; // 택배비
  field_42?: string; // 발송일(송장입력일)
  field_43?: string; // 택배사
  field_44?: string; // 송장번호
  [key: string]: any; // 동적 필드 지원
}

interface OptionProduct {
  id: string;
  option_code: string;
  option_name: string;
  seller_supply_price: number | null;
  shipping_entity: string | null;
  invoice_entity: string | null;
  shipping_vendor_id: string | null;
  shipping_vendor?: { name: string } | null;
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
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [batchEditData, setBatchEditData] = useState<Record<string, string>>({});
  const [recommendedOptions, setRecommendedOptions] = useState<Record<string, string[]>>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    newCount: number;
    duplicateCount: number;
    batchInfo?: {
      currentBatch: number;
      nextSequenceStart: number;
      sequenceFormat: string;
    }
  } | null>(null);

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
                    className="px-2 py-0.5 rounded text-white font-medium"
                    style={{ backgroundColor: marketColor, fontSize: '12px' }}
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
              if (i === 2) column.width = 50; // 연번
              if (i === 4) column.width = 150; // 주문번호
              if (i === 5) column.width = 100; // 주문자
              if (i === 7) column.width = 100; // 수령인
              if (i === 9) column.width = 250; // 주소
              if (i === 10) column.width = 120; // 배송메시지
              if (i === 12) {
                column.width = 40; // 수량
                // 수량이 2 이상이면 배경색 추가
                column.cellStyle = (value: any, row: any) => {
                  const quantity = parseInt(String(value || '0'), 10);
                  if (!isNaN(quantity) && quantity >= 2) {
                    return { backgroundColor: '#FEF3C7' }; // 노란색 배경
                  }
                  return {};
                };
              }

              // field_1 (마켓명) - 마켓 배지 렌더러는 제거 (아래에서 처리)
              if (i === 1) {
                column.isMarketColumn = true; // 마커 추가
              }

              // field_11 (옵션명)에 특별 처리
              if (i === 11) {
                column.renderer = (value: any, row: any, rowIndex: number, _dropdownHandler?: any) => {
                  const isModified = row?._optionNameModified;
                  const isInDB = row?._optionNameInDB;
                  const isVerified = row?._optionNameVerified; // 검증 통과 여부
                  const displayValue = value ?? '';

                  return (
                    <div className="relative flex items-center" style={{ fontSize: '13px' }}>
                      <span>{String(displayValue)}</span>
                      {!isInDB && !isModified && !isVerified && <span className="ml-1">⚠️</span>}
                      {isModified && !isVerified && <span className="ml-1" style={{ color: '#16a34a' }}>✏️</span>}
                      {isVerified && <span className="ml-1" style={{ color: '#16a34a' }}>✓</span>}
                    </div>
                  );
                };

                column.cellStyle = (value: any, row: any) => {
                  if (!row?._optionNameInDB && !row?._optionNameModified && !row?._optionNameVerified) {
                    return { backgroundColor: '#FED7AA' }; // 주황색 배경
                  }
                  if (row?._optionNameModified || row?._optionNameVerified) {
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
        .select(`
          id, option_code, option_name, seller_supply_price, shipping_entity, invoice_entity,
          shipping_vendor_id, shipping_location_name, shipping_location_address,
          shipping_location_contact, shipping_cost,
          shipping_vendor:partners!shipping_vendor_id(name)
        `)
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
    shipping_entity: '출고',
    invoice_entity: '송장',
    shipping_vendor_id: '벤더사',
    shipping_location_name: '발송지명',
    shipping_location_address: '발송지주소',
    shipping_location_contact: '발송지연락처',
    shipping_cost: '상품출고비용'
  };

  // 옵션상품 데이터를 주문에 동적으로 매핑
  const mapOptionProductToOrder = (order: any, product: OptionProduct): any => {
    if (!standardFields) return order;

    const mappedOrder = { ...order };

    console.log('📦 옵션상품 매핑 시작:', product.option_name);
    console.log('  - shipping_entity:', product.shipping_entity);
    console.log('  - invoice_entity:', product.invoice_entity);
    console.log('  - shipping_vendor_id:', product.shipping_vendor_id);
    console.log('  - shipping_vendor name:', product.shipping_vendor?.name);

    // 표준필드(field_1~43)를 순회하면서 매칭
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      const standardFieldName = standardFields[fieldKey]; // 예: "셀러공급가"

      if (!standardFieldName) continue;

      // 이 표준필드명에 해당하는 option_products 컬럼 찾기
      const optionProductColumn = Object.entries(OPTION_PRODUCT_LABELS)
        .find(([_, label]) => label === standardFieldName)?.[0];

      if (optionProductColumn) {
        let value = product[optionProductColumn];

        // 벤더사는 이름을 사용
        if (optionProductColumn === 'shipping_vendor_id' && product.shipping_vendor?.name) {
          value = product.shipping_vendor.name;
        }

        if (value !== undefined && value !== null) {
          // 기존 값이 없을 때만 매핑 (엑셀 데이터 우선)
          if (!mappedOrder[fieldKey]) {
            console.log(`  ✓ 매핑: ${standardFieldName} (${fieldKey}) = ${value} (from ${optionProductColumn})`);
            mappedOrder[fieldKey] = value;
          }
        } else {
          if (standardFieldName === '출고' || standardFieldName === '송장' || standardFieldName === '벤더사') {
            console.log(`  ✗ 값 없음: ${standardFieldName} (${fieldKey}) - optionProductColumn: ${optionProductColumn}, value: ${value}`);
          }
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
    // Date 객체인 경우 (cellDates: true로 읽은 경우)
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 숫자인 경우 (엑셀 시리얼 날짜)
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return String(value || '');
  };

  // 템플릿 기반 필드 매핑 (field_1~field_43 구조로 변환)
  const mapFieldsUsingTemplate = (row: any, template: MarketTemplate, marketFieldMappings: any, sequenceNumber?: number): any => {
    const mappedData: any = {
      field_1: template.market_name, // 첫 번째 필드는 마켓명
      field_2: sequenceNumber ? String(sequenceNumber).padStart(4, '0') : '' // 연번 (4자리)
    };

    // marketFieldMappings는 mapping_settings_standard_fields에서 해당 마켓의 매핑 정보
    // { field_3: "결제일", field_4: "주문번호", ... }
    // 날짜 필드 목록 (field_3: 결제일, field_16: 발송요청일, field_42: 발송일)
    const dateFields = [3, 16, 42];

    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      const marketFieldName = marketFieldMappings[fieldKey]; // 예: "결제일"

      if (marketFieldName && row[marketFieldName] !== undefined) {
        let value = row[marketFieldName];

        // Date 객체는 항상 문자열로 변환
        if (value instanceof Date) {
          value = convertExcelDate(value);
        }
        // 날짜 필드이면서 숫자인 경우에만 날짜로 변환
        else if (dateFields.includes(i) && typeof value === 'number') {
          value = convertExcelDate(value);
        }
        // 다른 값들은 그대로 유지하거나 문자열로 변환
        else if (value !== null && value !== undefined) {
          value = String(value);
        }

        mappedData[fieldKey] = value;
      }
    }

    // field_13 (마켓): 마켓이니셜 + 시퀀스 (3자리)
    if (template.initial && sequenceNumber) {
      mappedData.field_13 = `${template.initial}${String(sequenceNumber).padStart(4, '0')}`;
    }

    // 정산예정금액 계산 (field_27) - 엑셀에 값이 없을 때만
    if (!mappedData.field_27) {
      const settlement = calculateSettlement(row, template.settlement_formula, marketFieldMappings);
      if (settlement !== null) {
        mappedData.field_27 = settlement;
      }
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

        // xlsx 라이브러리의 console.error를 임시로 무시
        const originalError = console.error;
        console.error = (...args: any[]) => {
          // "Bad uncompressed size" 에러만 무시
          if (args[0]?.toString().includes('Bad uncompressed size')) {
            return;
          }
          originalError(...args);
        };

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, WTF: true });

        // console.error 복원
        console.error = originalError;
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
      const marketSequences = new Map<string, number>(); // 마켓별 시퀀스 카운터

      // 모든 파일 처리
      for (const filePreview of uploadedFiles) {
        const file = filePreview.file;
        const template = filePreview.detectedTemplate;

        // xlsx 라이브러리의 console.error를 임시로 무시
        const originalError = console.error;
        console.error = (...args: any[]) => {
          // "Bad uncompressed size" 에러만 무시
          if (args[0]?.toString().includes('Bad uncompressed size')) {
            return;
          }
          originalError(...args);
        };

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, WTF: true });

        // console.error 복원
        console.error = originalError;
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

          // 마켓별 시퀀스 초기화
          if (!marketSequences.has(template.market_name)) {
            marketSequences.set(template.market_name, 0);
          }

          // 템플릿 기반 매핑 (field_1~field_43 구조로)
          const mappedOrders = jsonData.map((row: any, index: number) => {
            globalSequence++; // 전체 연번 증가

            // 마켓별 시퀀스 증가
            const currentMarketSeq = (marketSequences.get(template.market_name) || 0) + 1;
            marketSequences.set(template.market_name, currentMarketSeq);

            const mapped = mapFieldsUsingTemplate(row, template, marketMapping, globalSequence);

            // field_13 (마켓) 값을 마켓별 시퀀스로 교체 (3자리)
            if (template.initial) {
              mapped.field_13 = `${template.initial}${String(currentMarketSeq).padStart(4, '0')}`;
            }

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

  // 옵션명 검증 실행
  const handleApplyProductMatching = async () => {
    if (orders.length === 0) {
      toast.error('검증할 주문 데이터가 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('검증 시작 - 주문 수:', orders.length, '옵션상품 수:', optionProducts.size);

      // field_11이 옵션명
      const ordersWithMapping = orders.map((order) => {
        const optionName = order.field_11;

        if (!optionName || optionName.trim() === '') {
          return {
            ...order,
            match_status: 'unmatched' as const,
            _optionNameInDB: false,
            _optionNameVerified: false
          };
        }

        const trimmedOption = optionName.trim().toLowerCase();
        const product = optionProducts.get(trimmedOption);

        if (product) {
          // 옵션상품 매핑 적용
          const mappedOrder = mapOptionProductToOrder(order, product);
          return {
            ...mappedOrder,
            match_status: 'matched' as const,
            _optionNameInDB: true,
            _optionNameVerified: true  // 검증 통과 시 verified 플래그 설정
          };
        } else {
          return {
            ...order,
            match_status: 'unmatched' as const,
            _optionNameInDB: false,
            _optionNameVerified: false
          };
        }
      });

      setOrders(ordersWithMapping);

      // 통계 계산
      const matchedCount = ordersWithMapping.filter((o) => o.match_status === 'matched').length;
      const unmatchedCount = ordersWithMapping.filter((o) => o.match_status === 'unmatched').length;

      // 수정된 항목 중 매칭 성공/실패 카운트
      const modifiedMatched = ordersWithMapping.filter((o) => o._optionNameModified && o.match_status === 'matched').length;
      const modifiedUnmatched = ordersWithMapping.filter((o) => o._optionNameModified && o.match_status === 'unmatched').length;

      setStats({
        total: ordersWithMapping.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      });

      // 검증 결과 모달 표시
      let content = `총 ${ordersWithMapping.length}개 주문\n\n`;
      content += `✓ 매칭 성공: ${matchedCount}개\n`;
      content += `✗ 매칭 실패: ${unmatchedCount}개\n`;

      if (modifiedMatched > 0 || modifiedUnmatched > 0) {
        content += `\n📝 수정된 옵션명:\n`;
        if (modifiedMatched > 0) {
          content += `  ✓ 매칭 성공: ${modifiedMatched}개\n`;
        }
        if (modifiedUnmatched > 0) {
          content += `  ✗ 여전히 매칭 실패: ${modifiedUnmatched}개\n`;
        }
      }

      content += `\n`;
      if (unmatchedCount > 0) {
        content += `매칭 실패한 옵션명은 출고 정보가 자동으로 입력되지 않았습니다.\n`;
        content += `"옵션명 일괄수정" 버튼을 사용하여 수정하세요.`;
      } else {
        content += `✅ 모든 주문의 출고 정보가 자동으로 입력되었습니다!`;
      }

      setResultMessage({
        title: '옵션명 검증 완료',
        content
      });
      setShowResultModal(true);

    } catch (error) {
      console.error('옵션명 검증 오류:', error);
      toast.error('옵션명 검증 중 오류가 발생했습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  // 데이터 저장 (Supabase에 업로드)
  const handleSaveToDatabase = async () => {
    if (orders.length === 0) {
      toast.error('저장할 데이터가 없습니다.', {
        duration: 3000,
        position: 'top-center',
        style: {
          marginTop: '50vh',
        },
      });
      return;
    }

    // 저장 확인 모달 표시
    setShowSaveConfirmModal(true);
  };

  // 실제 저장 실행
  const executeSaveToDatabase = async (overwriteDuplicates: boolean = false) => {
    setShowSaveConfirmModal(false);
    setShowDuplicateModal(false);

    setLoading(true);
    try {
      // field_X를 표준명으로 매핑
      const ordersToSave = orders.map((order, index) => {
        // UI 전용 필드 제거 (_로 시작하는 필드와 match_status, id 등)
        const cleanOrder = Object.entries(order).reduce((acc, [key, value]) => {
          // _로 시작하는 필드, match_status, id 제외
          if (!key.startsWith('_') && key !== 'match_status' && key !== 'id') {
            acc[key] = value;
          }
          return acc;
        }, {} as any);

        return {
          market_name: cleanOrder.field_1,
          sequence_number: cleanOrder.field_2,
          payment_date: cleanOrder.field_3,
          order_number: cleanOrder.field_4,  // NULL 허용 (DB에서 중복 검사)
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
          option_code: cleanOrder.field_17,
          seller_name: cleanOrder.field_18,
          seller_supply_price: cleanOrder.field_19,
          shipping_source: cleanOrder.field_20,
          invoice_issuer: cleanOrder.field_21,
          vendor_name: cleanOrder.field_22,
          shipping_location_name: cleanOrder.field_23,
          shipping_location_address: cleanOrder.field_24,
          shipping_location_contact: cleanOrder.field_25,
          shipping_cost: cleanOrder.field_26,
          settlement_amount: cleanOrder.field_27,
          settlement_target_amount: cleanOrder.field_28,
          product_amount: cleanOrder.field_29,
          final_payment_amount: cleanOrder.field_30,
          discount_amount: cleanOrder.field_31,
          platform_discount: cleanOrder.field_32,
          seller_discount: cleanOrder.field_33,
          buyer_coupon_discount: cleanOrder.field_34,
          coupon_discount: cleanOrder.field_35,
          other_support_discount: cleanOrder.field_36,
          commission_1: cleanOrder.field_37,
          commission_2: cleanOrder.field_38,
          sell_id: cleanOrder.field_39,
          separate_shipping: cleanOrder.field_40,
          delivery_fee: cleanOrder.field_41,
          shipped_date: cleanOrder.field_42,
          courier_company: cleanOrder.field_43,
          tracking_number: cleanOrder.field_44,
          sheet_date: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0],
        };
      });

      // UNIQUE 제약조건 기준으로 중복 제거 (마지막 항목 유지)
      // market_name + order_number + buyer_name + recipient_name + option_name + quantity
      const uniqueOrders = Array.from(
        new Map(
          ordersToSave.map(order => {
            const key = `${order.market_name || ''}-${order.order_number || ''}-${order.buyer_name || ''}-${order.recipient_name || ''}-${order.option_name || ''}-${order.quantity || ''}`;
            return [key, order];
          })
        ).values()
      );

      console.log('총 저장할 주문 수:', uniqueOrders.length);
      console.log('첫 번째 주문 데이터:', uniqueOrders[0]);
      console.log('첫 번째 주문의 모든 키:', Object.keys(uniqueOrders[0]));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: uniqueOrders, checkDuplicatesOnly: !overwriteDuplicates, overwriteDuplicates }),
      });

      const result = await response.json();

      if (result.success) {
        // 중복 체크만 한 경우
        if (result.duplicatesDetected && !overwriteDuplicates) {
          setDuplicateInfo({
            newCount: result.newCount || 0,
            duplicateCount: result.duplicateCount || 0,
            batchInfo: result.batchInfo
          });
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }

        // 저장 결과 메시지 생성
        const { total, newCount, duplicateCount } = result;
        let message = '';

        if (duplicateCount > 0) {
          message = `신규 저장 ${newCount}건 / 중복 덮어쓰기 ${duplicateCount}건`;
        } else {
          message = `✓ ${newCount}개 주문이 저장되었습니다.`;
        }

        toast.success(message, {
          duration: 4000,
          position: 'top-center',
          style: {
            marginTop: '50vh',
          },
        });

        setOrders([]); // 초기화
        setStats({ total: 0, matched: 0, unmatched: 0 });
        setIntegrationStage('idle');
      } else {
        toast.error(`저장 실패: ${result.error}`, {
          duration: 4000,
          position: 'top-center',
          style: {
            marginTop: '50vh',
          },
        });
      }
    } catch (error: any) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.', {
        duration: 4000,
        position: 'top-center',
        style: {
          marginTop: '50vh',
        },
      });
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
          _optionNameVerified: false,  // 검증 전 상태
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

  // 문자열 유사도 계산 (Levenshtein Distance 기반)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // 완전 일치
    if (s1 === s2) return 1;

    // 포함 관계 체크 (높은 점수)
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8 + (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 0.2;
    }

    // Levenshtein Distance 계산
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  };

  // 가장 유사한 옵션명 찾기
  const findSimilarOptions = (targetOption: string, topN: number = 1): string[] => {
    if (!targetOption || optionProducts.size === 0) return [];

    const allOptions = Array.from(optionProducts.keys());

    // 각 옵션과의 유사도 계산
    const similarities = allOptions.map(option => ({
      option: optionProducts.get(option)!.option_name, // 원본 옵션명 (대소문자 유지)
      score: calculateSimilarity(targetOption, option)
    }));

    // 유사도 내림차순 정렬 후 상위 N개 반환
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .filter(item => item.score > 0.3) // 유사도 30% 이상만
      .map(item => item.option);
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

  // 옵션명 일괄수정 모달 열기
  const handleOpenBatchEdit = () => {
    if (orders.length === 0) {
      toast.error('수정할 주문 데이터가 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // 매칭 실패한 옵션명 수집 (동일한 옵션명별로 그룹화)
    const unmatchedOptions: Record<string, number> = {};

    orders.forEach(order => {
      if (order.match_status === 'unmatched' && order.field_11) {
        const optionName = order.field_11;
        unmatchedOptions[optionName] = (unmatchedOptions[optionName] || 0) + 1;
      }
    });

    if (Object.keys(unmatchedOptions).length === 0) {
      toast.error('매칭 실패한 옵션명이 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // 추천 옵션명 계산
    const recommendations: Record<string, string[]> = {};
    Object.keys(unmatchedOptions).forEach(optionName => {
      recommendations[optionName] = findSimilarOptions(optionName, 1);
    });
    setRecommendedOptions(recommendations);

    // batchEditData 초기화 (첫 번째 추천 옵션명을 기본값으로)
    const initialData: Record<string, string> = {};
    Object.keys(unmatchedOptions).forEach(optionName => {
      const firstRecommendation = recommendations[optionName]?.[0] || '';
      initialData[optionName] = firstRecommendation;
    });
    setBatchEditData(initialData);

    setShowBatchEditModal(true);
  };

  // 옵션명 일괄수정 적용
  const handleApplyBatchEdit = () => {
    // 입력된 대체 옵션명이 있는지 확인
    const hasReplacements = Object.values(batchEditData).some(v => v.trim() !== '');

    if (!hasReplacements) {
      toast.error('대체할 옵션명을 입력하세요.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    console.log('🔄 일괄수정 시작, batchEditData:', batchEditData);

    let modifiedCount = 0;

    // 동일한 옵션명을 가진 모든 주문에 일괄 적용
    const updatedOrders = orders.map((order, index) => {
      const currentOption = order.field_11;

      if (currentOption && batchEditData[currentOption] && batchEditData[currentOption].trim() !== '') {
        const newOptionName = batchEditData[currentOption].trim();

        console.log(`✏️ [${index}] 수정: "${currentOption}" → "${newOptionName}"`);

        // 새 옵션명이 DB에 있는지 확인
        const product = optionProducts.get(newOptionName.toLowerCase());

        modifiedCount++;

        const updatedOrder = {
          ...order,
          field_11: newOptionName,  // 먼저 field_11 업데이트
          _optionNameModified: true,
          _optionNameVerified: false,
        };

        if (product) {
          // 옵션상품 매핑 적용 (검증은 하지 않음)
          const mappedOrder = mapOptionProductToOrder(updatedOrder, product);
          const finalOrder = {
            ...mappedOrder,
            field_11: newOptionName,  // 매핑 후에도 field_11 유지
            _optionNameModified: true,
            _optionNameInDB: true,
            _optionNameVerified: false,
            match_status: 'matched' as const
          };
          console.log(`✓ [${index}] 매핑 완료:`, finalOrder.field_11);
          return finalOrder;
        } else {
          const finalOrder = {
            ...updatedOrder,
            _optionNameInDB: false,
            match_status: 'unmatched' as const
          };
          console.log(`⚠ [${index}] 매핑 실패 (DB에 없음):`, finalOrder.field_11);
          return finalOrder;
        }
      }

      // 수정되지 않은 항목도 새 객체로 복사 (얕은 비교 문제 해결)
      return { ...order };
    });

    console.log('✅ 일괄수정 완료, 수정된 주문 수:', modifiedCount);
    console.log('📊 updatedOrders 샘플 (처음 3개):', updatedOrders.slice(0, 3).map(o => o.field_11));

    setOrders(updatedOrders);

    // 통계 재계산
    const matchedCount = updatedOrders.filter((o) => o.match_status === 'matched').length;
    const unmatchedCount = updatedOrders.filter((o) => o.match_status === 'unmatched').length;

    setStats({
      total: updatedOrders.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
    });

    toast.success(`${modifiedCount}개 주문의 옵션명을 수정했습니다.`, {
      duration: 3000,
      position: 'top-center',
    });

    setShowBatchEditModal(false);
    setBatchEditData({});
  };

  return (
    <div className="space-y-4">
      <Toaster />
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
        <div>
          <EditableAdminGrid
            key={orders.length + '-' + orders.filter(o => o._optionNameModified).length + '-' + orders.filter(o => o._optionNameVerified).length}
            columns={columns}
            data={orders}
            onDataChange={handleDataChange}
            onDeleteSelected={handleDeleteRows}
            onSave={() => {}}
            height="calc(100vh - 450px)"
            enableFilter={true}
            enableCSVExport={true}
            enableCSVImport={false}
            enableCheckbox={false}
            enableDelete={false}
            enableCopy={false}
            enableAddRow={false}
            customActions={
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => {
                    setOrders([]);
                    setUploadedFiles([]);
                    setIntegrationStage('idle');
                    setStats({ total: 0, matched: 0, unmatched: 0 });
                  }}
                  className="px-2.5 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                >
                  초기화
                </button>
                <button
                  onClick={handleOpenBatchEdit}
                  disabled={loading || stats.unmatched === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 text-xs"
                  title={stats.unmatched === 0 ? '매칭 실패한 옵션명이 없습니다' : ''}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  옵션명 일괄수정
                </button>
                <button
                  onClick={handleApplyProductMatching}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {loading ? '검증 중...' : '옵션명 검증'}
                </button>
                <button
                  onClick={handleSaveToDatabase}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {loading ? '등록 중...' : '주문접수등록'}
                </button>
              </div>
            }
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

      {/* 통합 결과 모달 (옵션명 매칭 안내) */}
      {showResultModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
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

      {/* 주문접수등록 확인 모달 */}
      {showSaveConfirmModal && (() => {
        const unmatchedCount = orders.filter((o) => o.match_status === 'unmatched').length;
        return (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">주문접수등록 확인</h3>
              <div className="text-gray-700 mb-6">
                <p className="mb-3">
                  총 <strong className="text-blue-600">{orders.length}개</strong> 주문을 등록하시겠습니까?
                </p>
                {unmatchedCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-800 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>{unmatchedCount}개</strong> 주문이 옵션명 매칭되지 않았습니다.<br/>
                        출고 정보가 자동으로 입력되지 않았습니다.
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => executeSaveToDatabase(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 옵션명 일괄수정 모달 */}
      {showBatchEditModal && (() => {
        // 매칭 실패한 옵션명별 카운트
        const unmatchedOptions: Record<string, number> = {};
        orders.forEach(order => {
          if (order.match_status === 'unmatched' && order.field_11) {
            const optionName = order.field_11;
            unmatchedOptions[optionName] = (unmatchedOptions[optionName] || 0) + 1;
          }
        });

        return (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <div className="bg-white rounded-lg p-6 w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" style={{ maxWidth: '770px' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">옵션명 일괄수정</h3>
              <p className="text-sm text-gray-600 mb-4">
                매칭 실패한 옵션명을 일괄 수정합니다. <strong className="text-orange-600">동일한 옵션명은 모두 일괄 변경됩니다.</strong>
              </p>

              <div className="flex-1 overflow-y-auto mb-6 space-y-3">
                {Object.entries(unmatchedOptions).map(([optionName, count]) => {
                  const recommendations = recommendedOptions[optionName] || [];

                  return (
                    <div key={optionName} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" style={{ minWidth: '200px' }}>
                          <div className="text-sm font-medium text-gray-900">{optionName}</div>
                          <div className="text-xs text-red-600 font-normal">{count}개 주문</div>
                        </div>
                        <div className="text-gray-400 text-lg">→</div>
                        <input
                          type="text"
                          placeholder="대체할 옵션명"
                          value={batchEditData[optionName] || ''}
                          onChange={(e) => {
                            setBatchEditData({
                              ...batchEditData,
                              [optionName]: e.target.value
                            });
                          }}
                          style={{ color: '#dc2626', fontWeight: 'bold', width: '180px' }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-red-400"
                        />

                        {/* 추천 옵션명 - 같은 줄에 배치 */}
                        {recommendations.length > 0 && (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="text-xs text-gray-500">추천 옵션명</div>
                            {recommendations.map((recommendation, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setBatchEditData({
                                    ...batchEditData,
                                    [optionName]: recommendation
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs border border-blue-200 transition-colors"
                                title="클릭하여 선택"
                              >
                                {recommendation}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 추천 옵션이 없는 경우 */}
                        {recommendations.length === 0 && (
                          <div className="flex-1">
                            <div className="text-xs text-gray-400 italic">유사한 옵션명이 없습니다</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBatchEditModal(false);
                    setBatchEditData({});
                    setRecommendedOptions({});
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleApplyBatchEdit}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  일괄 수정 적용
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 중복 주문 확인 모달 */}
      {showDuplicateModal && duplicateInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">중복 주문 확인</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-700 mb-3">
                <p className="mb-1">📊 <strong>저장 대상 주문</strong></p>
                <div className="pl-5 space-y-1">
                  <p>• 중복주문: <strong className="text-red-600">{duplicateInfo.duplicateCount}건</strong></p>
                  <p>• 신규주문: <strong className="text-blue-600">{duplicateInfo.newCount}건</strong></p>
                </div>
              </div>

              {duplicateInfo.batchInfo && (
                <div className="text-sm text-gray-700 pt-3 border-t border-blue-200">
                  <p className="mb-1">🔢 <strong>연번 부여 안내</strong> (신규 주문만)</p>
                  <div className="pl-5 space-y-1">
                    <p>• 오늘 <strong className="text-purple-600">{duplicateInfo.batchInfo.currentBatch}회차</strong> 저장</p>
                    <p>• 전체 연번: <strong className="text-purple-600">{duplicateInfo.batchInfo.sequenceFormat}</strong></p>
                    <p className="text-xs text-gray-500">※ 마켓별 연번은 마켓마다 독립적으로 부여됩니다</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-gray-700 mb-6">
              <p className="text-sm text-gray-600 font-medium mb-2">중복된 주문을 어떻게 처리하시겠습니까?</p>
              <div className="space-y-2 text-xs text-gray-600 bg-gray-50 rounded p-3">
                <p>• <strong>덮어쓰기:</strong> 기존 데이터를 새 데이터로 업데이트 (연번 유지)</p>
                <p>• <strong>중복 제외:</strong> 신규 주문만 저장 (중복 건은 저장 안 함)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => executeSaveToDatabase(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                중복 제외
              </button>
              <button
                onClick={() => executeSaveToDatabase(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                덮어쓰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
