'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';

interface UploadedOrder {
  id?: number;
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

interface ProductMapping {
  option_name: string;
  shipping_source?: string;
  invoice_issuer?: string;
  vendor_name?: string;
  seller_supply_price?: number;
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
}

export default function ExcelTab() {
  const [orders, setOrders] = useState<UploadedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [productMappings, setProductMappings] = useState<Map<string, ProductMapping>>(new Map());
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

  // 제품 매핑, 마켓 템플릿, 표준 필드 로드
  useEffect(() => {
    loadProductMappings();
    loadMarketTemplates();
    loadStandardFields();
  }, []);

  // 마켓 템플릿이 로드되면 컬럼에 렌더러 추가 (한 번만)
  const [rendererAdded, setRendererAdded] = React.useState(false);

  useEffect(() => {
    console.log('useEffect 실행 - columns:', columns.length, 'marketTemplates:', marketTemplates.size, 'rendererAdded:', rendererAdded);

    if (columns.length > 0 && marketTemplates.size > 0 && !rendererAdded) {
      console.log('렌더러 추가 시작');

      const columnsWithRender = columns.map((col) => {
        if (col.key === 'field_1') {
          console.log('field_1에 렌더러 추가');
          return {
            ...col,
            renderer: (value: any, row: any, rowIndex: number) => {
              const marketName = value;
              if (!marketName) return marketName;

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
            }
          };
        }
        return col;
      });

      console.log('렌더러가 추가된 컬럼:', columnsWithRender[0]);
      setColumns(columnsWithRender);
      setRendererAdded(true);
    }
  }, [marketTemplates.size, columns.length, rendererAdded]);

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
              dynamicColumns.push({
                key: fieldKey,
                title: fieldValue,
                width: 120
              });
            }
          }

          console.log('생성된 컬럼:', dynamicColumns);
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

  const loadProductMappings = async () => {
    try {
      const response = await fetch('/api/product-mapping?limit=10000');
      const result = await response.json();

      if (result.success) {
        const mappingMap = new Map<string, ProductMapping>();
        result.data.forEach((mapping: ProductMapping) => {
          mappingMap.set(mapping.option_name.toLowerCase(), mapping);
        });
        setProductMappings(mappingMap);
      }
    } catch (error) {
      console.error('제품 매핑 로드 실패:', error);
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

  // 옵션명에 제품 매핑 적용
  const applyProductMapping = (orders: UploadedOrder[]): UploadedOrder[] => {
    return orders.map((order) => {
      if (!order.option_name) {
        return { ...order, match_status: 'unmatched' as const };
      }

      const mapping = productMappings.get(order.option_name.trim().toLowerCase());

      if (mapping) {
        return {
          ...order,
          shipping_source: order.shipping_source || mapping.shipping_source,
          invoice_issuer: order.invoice_issuer || mapping.invoice_issuer,
          vendor_name: order.vendor_name || mapping.vendor_name,
          seller_supply_price:
            order.seller_supply_price ||
            (mapping.seller_supply_price ? mapping.seller_supply_price * order.quantity : undefined),
          match_status: 'matched' as const,
        };
      } else {
        return { ...order, match_status: 'unmatched' as const };
      }
    });
  };

  // 파일명 또는 내용으로 마켓 템플릿 감지
  const detectMarketTemplate = (fileName: string, firstRow: any): MarketTemplate | null => {
    const lowerFileName = fileName.toLowerCase();
    const rowText = Object.keys(firstRow).join(',').toLowerCase();

    // 모든 템플릿을 순회하며 감지
    for (const template of marketTemplates.values()) {
      let matched = false;

      // 1. detect_string1로 파일명 검사
      if (template.detect_string1 && template.detect_string1.trim()) {
        const detectStrings = template.detect_string1.split(',').map(s => s.trim().toLowerCase());
        if (detectStrings.some(str => str && lowerFileName.includes(str))) {
          matched = true;
        }
      }

      // 2. detect_string2로 헤더 검사 (여러 개의 특수 컬럼명 중 하나라도 있으면 매칭)
      if (!matched && template.detect_string2 && template.detect_string2.trim()) {
        const headerStrings = template.detect_string2.split(',').map(s => s.trim().toLowerCase());
        // 하나라도 헤더에 있으면 매칭 (OR 조건)
        if (headerStrings.some(str => str && rowText.includes(str))) {
          matched = true;
        }
      }

      // 3. detect_string3으로 추가 검사
      if (!matched && template.detect_string3 && template.detect_string3.trim()) {
        const detectStrings = template.detect_string3.split(',').map(s => s.trim().toLowerCase());
        if (detectStrings.some(str => str && (lowerFileName.includes(str) || rowText.includes(str)))) {
          matched = true;
        }
      }

      if (matched) {
        return template;
      }
    }

    return null;
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

  // 템플릿 기반 필드 매핑 (field_1~field_43 구조로 변환)
  const mapFieldsUsingTemplate = (row: any, template: MarketTemplate, marketFieldMappings: any): any => {
    const mappedData: any = {
      field_1: template.market_name // 첫 번째 필드는 마켓명
    };

    // marketFieldMappings는 mapping_settings_standard_fields에서 해당 마켓의 매핑 정보
    // { field_3: "결제일", field_4: "주문번호", ... }
    for (let i = 1; i <= 43; i++) {
      const fieldKey = `field_${i}`;
      const marketFieldName = marketFieldMappings[fieldKey]; // 예: "결제일"

      if (marketFieldName && row[marketFieldName] !== undefined) {
        mappedData[fieldKey] = row[marketFieldName];
      }
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

        filePreviews.push({
          file,
          marketName: marketName || '알 수 없음',
          detectedTemplate: template,
          orderCount,
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
            const mapped = mapFieldsUsingTemplate(row, template, marketMapping);
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

      // 주문통합 완료 - 로컬에만 저장 (DB 저장 안 함)
      setOrders(allOrders);
      setIntegrationStage('integrated');

      // 통계 계산
      setStats({
        total: allOrders.length,
        matched: 0,
        unmatched: 0,
      });

      alert(
        `주문 통합 완료\n\n` +
          `총 ${allOrders.length}개 주문이 표준필드로 매핑되었습니다.\n\n` +
          `"옵션명 매칭" 버튼을 클릭하여 제품 정보를 매칭하세요.`
      );
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
      // 제품 매핑 데이터 로드
      let mappingMap = productMappings;
      if (mappingMap.size === 0) {
        const response = await fetch('/api/product-mapping?limit=10000');
        const result = await response.json();

        if (result.success) {
          mappingMap = new Map<string, ProductMapping>();
          result.data.forEach((mapping: ProductMapping) => {
            mappingMap.set(mapping.option_name.toLowerCase(), mapping);
          });
          setProductMappings(mappingMap);
          console.log('제품 매핑 로드 완료:', mappingMap.size, '개');
        } else {
          alert('제품 매핑 데이터를 불러오지 못했습니다.');
          return;
        }
      }

      console.log('매칭 시작 - 주문 수:', orders.length, '매핑 데이터 수:', mappingMap.size);

      // 제품 매핑 적용
      const ordersWithMapping = orders.map((order, index) => {
        if (!order.option_name) {
          console.log(`[${index}] 옵션명 없음`);
          return { ...order, match_status: 'unmatched' as const };
        }

        const trimmedOption = order.option_name.trim().toLowerCase();
        const mapping = mappingMap.get(trimmedOption);

        if (mapping) {
          console.log(`[${index}] 매칭 성공: "${order.option_name}" → ${mapping.vendor_name}`);
          return {
            ...order,
            shipping_source: order.shipping_source || mapping.shipping_source,
            invoice_issuer: order.invoice_issuer || mapping.invoice_issuer,
            vendor_name: order.vendor_name || mapping.vendor_name,
            seller_supply_price:
              order.seller_supply_price ||
              (mapping.seller_supply_price ? mapping.seller_supply_price * order.quantity : undefined),
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
        `옵션명 매칭 완료\n\n` +
          `✓ 매칭 성공: ${matchedCount}개\n` +
          `✗ 매칭 실패: ${unmatchedCount}개\n\n` +
          (unmatchedCount > 0
            ? `매칭 실패한 옵션명은 출고처, 송장주체, 벤더사 정보가 자동으로 입력되지 않습니다.`
            : `모든 주문이 성공적으로 매칭되었습니다!`)
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
      // sheet_date 추가
      const ordersToSave = orders.map((order) => ({
        ...order,
        sheet_date: new Date().toISOString().split('T')[0],
      }));

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
    setOrders(updatedData);

    // 통계 재계산
    const matchedCount = updatedData.filter((o) => o.match_status === 'matched').length;
    const unmatchedCount = updatedData.filter((o) => o.match_status === 'unmatched').length;

    setStats({
      total: updatedData.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
    });
  };

  // 행 삭제 핸들러
  const handleDeleteRows = (rowsToDelete: any[]) => {
    const remainingOrders = orders.filter((order) => !rowsToDelete.includes(order));
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
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
            <span>파일 <strong className="text-gray-900">{uploadedFiles.length}개</strong></span>
            <span>마켓 <strong className="text-gray-900">{new Set(uploadedFiles.map(f => f.marketName)).size}개</strong></span>
            <span>주문 <strong className="text-gray-900">{uploadedFiles.reduce((sum, f) => sum + f.orderCount, 0).toLocaleString()}건</strong></span>
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
              disabled={loading}
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
                {loading ? '매칭 중...' : '옵션명 매칭'}
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
            onSave={handleDataChange}
            onDelete={handleDeleteRows}
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
    </div>
  );
}
