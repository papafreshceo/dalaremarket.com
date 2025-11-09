'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { getCurrentTimeUTC } from '@/lib/date';
import { showStatusToast, showErrorToast } from '../utils/statusToast';
import { createClient } from '@/lib/supabase/client';
import { applyOptionMapping } from '../utils/applyOptionMapping';
import MappingResultModal from '../modals/MappingResultModal';
import PasswordModal from '../modals/PasswordModal';
import OptionValidationModal from '../modals/OptionValidationModal';

interface SellerUploadedOrder {
  id?: number;
  _optionNameModified?: boolean;
  _optionNameInDB?: boolean;
  _optionNameVerified?: boolean;
  match_status?: 'matched' | 'unmatched';
  orderNumber?: string;      // 셀러주문번호
  orderer?: string;           // 주문자
  ordererPhone?: string;      // 주문자전화번호
  recipient?: string;         // 수령인
  recipientPhone?: string;    // 수령인전화번호
  address?: string;           // 주소
  deliveryMessage?: string;   // 배송메세지
  optionName?: string;        // 옵션상품
  quantity?: number;          // 수량
  unitPrice?: number;         // 공급단가
  specialRequest?: string;    // 특이/요청사항
  marketName?: string;        // 마켓명
  [key: string]: any;
}

interface MarketTemplate {
  id: number;
  market_name: string;
  initial: string;
  color_rgb: string;
  detect_string1: string;  // 파일명 감지용 (쉼표로 구분)
  detect_string2: string;  // 헤더 감지용 (쉼표로 구분)
  detect_string3?: string;
  header_row: number;      // 헤더 행 번호 (1-based)
  settlement_method: string;
  settlement_formula: string;
  field_mappings: Record<string, string>;
}

interface FilePreview {
  file: File;
  marketName: string;
  detectedTemplate: MarketTemplate | null;
  orderCount: number;
  isToday: boolean;
}

interface SellerExcelTabProps {
  onClose: () => void;
  onOrdersUploaded: () => void;
  userId: string; // UUID
  userEmail: string; // Email for display
}

export default function SellerExcelTab({ onClose, onOrdersUploaded, userId, userEmail }: SellerExcelTabProps) {
  const [uploadedOrders, setUploadedOrders] = useState<SellerUploadedOrder[]>([]);
  const [detectedMarket, setDetectedMarket] = useState<MarketTemplate | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);
  const [integrationStage, setIntegrationStage] = useState<'idle' | 'file-preview' | 'integrated'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [marketFieldMappings, setMarketFieldMappings] = useState<Map<string, any>>(new Map());

  // 옵션상품 매핑 결과 모달 상태
  const [showMappingResultModal, setShowMappingResultModal] = useState(false);
  const [mappingResults, setMappingResults] = useState<any[]>([]);
  const [mappingStats, setMappingStats] = useState({ total: 0, mapped: 0 });

  // 옵션상품 검증 모달 상태
  const [showOptionValidationModal, setShowOptionValidationModal] = useState(false);
  const [optionProducts, setOptionProducts] = useState<Map<string, any>>(new Map());
  const [hasUnmatchedOptions, setHasUnmatchedOptions] = useState(false);

  // 비밀번호 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPasswordFile, setCurrentPasswordFile] = useState<File | null>(null);
  const [filePasswords, setFilePasswords] = useState<Map<string, string>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [processedPreviews, setProcessedPreviews] = useState<FilePreview[]>([]);

  // mapping_settings_standard_fields에서 마켓별 필드 매핑 로드
  const fetchMarketFieldMappings = async () => {
    try {
      const response = await fetch('/api/mapping-settings/fields');
      const result = await response.json();

      if (result.success && result.data) {
        const mappings = new Map<string, any>();
        result.data.forEach((row: any) => {
          if (row.market_name !== '표준필드') {
            mappings.set(row.market_name.toLowerCase(), row);
          }
        });
        setMarketFieldMappings(mappings);
        return mappings;
      }
      return new Map();
    } catch (error) {
      console.error('필드 매핑 로드 실패:', error);
      return new Map();
    }
  };

  // 마켓 템플릿 가져오기
  const fetchMarketTemplates = async () => {
    try {
      const response = await fetch('/api/market-templates');
      if (!response.ok) throw new Error('마켓 템플릿을 불러오는데 실패했습니다.');
      const data = await response.json();

      // API 응답이 배열인지 확인하고, 아니면 data 속성에서 추출
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else if (data && Array.isArray(data.templates)) {
        return data.templates;
      }
      return [];
    } catch (error) {
      console.error('마켓 템플릿 조회 오류:', error);
      toast.error('마켓 템플릿을 불러오는데 실패했습니다.');
      return [];
    }
  };

  // 1단계: 파일 선택 (파일 목록만 표시)
  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const templates = await fetchMarketTemplates();
      const filePreviews: FilePreview[] = [];

      // 모든 파일의 마켓명 감지
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // 중복 파일 검증 (파일명 기준)
          const isDuplicate = uploadedFiles.some(uploaded => uploaded.file.name === file.name);
          if (isDuplicate) {
            toast.error(`${file.name}은(는) 이미 추가된 파일입니다.`);
            continue;
          }

          // 파일 타입 검증 (xlsx, xls, csv 모두 허용)
          if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error(`${file.name}은(는) 지원되지 않는 파일 형식입니다. (xlsx, xls, csv만 가능)`);
            continue;
          }

          const data = await file.arrayBuffer();

          // SheetJS로 파일 읽기 (XLS, XLSX, CSV 모두 지원)
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });

          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = workbook.Sheets[firstSheetName];

          // SheetJS로 JSON 변환 (헤더 포함)
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,  // 배열 형식으로 (헤더를 숫자 인덱스로)
            defval: '',  // 빈 셀 기본값
            raw: false   // 문자열로 변환
          });

          if (!jsonData || jsonData.length === 0) {
            toast.error(`${file.name}에 데이터가 없습니다.`);
            continue;
          }

          // 첫 번째 행을 헤더로 사용
          const firstDataRow = jsonData[0] as any[];
          const headerObj: any = {};
          firstDataRow.forEach((header: any, index: number) => {
            if (header) {
              headerObj[header] = index;
            }
          });

          // 마켓 감지
          const template = detectMarketTemplate(file.name, headerObj, templates);
          const marketName = template?.market_name || '알 수 없음';

          // 주문 건수 계산 (헤더 제외)
          const headerRowIndex = (template?.header_row || 1);
          const orderCount = jsonData.length - headerRowIndex;

          // 파일이 오늘 수정되었는지 확인
          const today = new Date();
          const fileDate = new Date(file.lastModified);
          const isToday =
            fileDate.getFullYear() === today.getFullYear() &&
            fileDate.getMonth() === today.getMonth() &&
            fileDate.getDate() === today.getDate();

          filePreviews.push({
            file,
            marketName,
            detectedTemplate: template,
            orderCount,
            isToday,
          });
        } catch (error: any) {
          // 암호화된 파일 감지

          // CFB (Compound File Binary) 형식의 암호화된 파일 감지
          if (
            error.message && (
              error.message.includes('password') ||
              error.message.includes('encrypted') ||
              error.message.includes('Unsupported') ||
              error.message.includes('CFB') ||
              error.message.toLowerCase().includes('encryption')
            )
          ) {
            // 이미 처리된 파일들을 저장
            setProcessedPreviews(filePreviews);
            // 원본 FileList 저장
            setPendingFiles(files);
            // 암호화된 파일 설정
            setCurrentPasswordFile(file);
            setShowPasswordModal(true);
            setIsProcessing(false);
            return; // 비밀번호 입력 대기
          } else {
            throw error; // 다른 에러는 상위로 전달
          }
        }
      }

      // 기존 파일에 새 파일 추가 (교체가 아닌 추가)
      setUploadedFiles(prev => [...prev, ...filePreviews]);
      setIntegrationStage('file-preview');
    } catch (error) {
      console.error('파일 읽기 실패:', error);
      toast.error('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 비밀번호 제출 핸들러
  const handlePasswordSubmit = async (password: string) => {
    if (!currentPasswordFile) return;

    setIsProcessing(true);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', currentPasswordFile);
      formData.append('password', password);

      // 서버에 복호화 요청
      const response = await fetch('/api/decrypt-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = '비밀번호가 올바르지 않습니다. 다시 시도해주세요.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        // 에러 발생 시 toast만 표시하고 모달 유지
        toast.error(errorMessage, {
          duration: 3000,
          position: 'top-center',
        });
        setIsProcessing(false);
        return; // 모달을 닫지 않고 다시 입력 대기
      }

      // 복호화된 파일 받기
      const decryptedBuffer = await response.arrayBuffer();

      // 복호화된 파일을 새 File 객체로 생성
      const decryptedFile = new File([decryptedBuffer], currentPasswordFile.name, {
        type: currentPasswordFile.type,
        lastModified: currentPasswordFile.lastModified,
      });

      // 비밀번호와 복호화된 파일 저장
      const newPasswords = new Map(filePasswords);
      newPasswords.set(currentPasswordFile.name, password);
      setFilePasswords(newPasswords);

      // 모달 닫기
      setShowPasswordModal(false);
      const passwordFileName = currentPasswordFile.name;
      setCurrentPasswordFile(null);

      // 모든 파일을 다시 조합 (이미 처리된 파일 + 복호화된 파일 + 나머지 파일)
      const fileList = new DataTransfer();

      if (pendingFiles) {
        // 모든 원본 파일을 순회하며 추가
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          if (file.name === passwordFileName) {
            // 암호화된 파일 대신 복호화된 파일 추가
            fileList.items.add(decryptedFile);
          } else {
            // 일반 파일은 그대로 추가
            fileList.items.add(file);
          }
        }
      } else {
        // pendingFiles가 없으면 복호화된 파일만 추가
        fileList.items.add(decryptedFile);
      }

      // 상태 초기화
      setPendingFiles(null);
      setProcessedPreviews([]);

      // 모든 파일 다시 처리
      await handleFileSelect(fileList.files);
    } catch (error: any) {
      // 예상치 못한 에러만 여기서 처리
      console.error('복호화 처리 오류:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 옵션 상품 데이터 로드
  const loadOptionProducts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('option_products')
        .select('option_name, option_code, seller_supply_price');

      if (error) throw error;

      const productMap = new Map<string, any>();
      data?.forEach((product) => {
        const key = product.option_name.trim().toLowerCase();
        productMap.set(key, product);
      });

      setOptionProducts(productMap);
      return productMap;
    } catch (error) {
      console.error('옵션 상품 로드 오류:', error);
      return new Map();
    }
  };

  // 2단계: 통합 버튼 클릭 (실제 데이터 로드)
  const handleIntegrateFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    const allOrders: SellerUploadedOrder[] = [];

    try {
      // 엑셀 파일에서 주문 데이터 추출
      for (const filePreview of uploadedFiles) {
        const arrayBuffer = await filePreview.file.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];

        const orders = await processSheetAndReturnOrders(workbook, sheetName, filePreview.file.name);
        allOrders.push(...orders);
      }

      // 1. 옵션상품 매핑 먼저 적용
      const { orders: mappedOrders, mappingResults, totalOrders, mappedOrders: mappedCount } =
        await applyOptionMapping(allOrders, userId);

      console.log('✅ 옵션상품 매핑 완료:', {
        totalOrders,
        mappedOrders: mappedCount,
        mappingResults
      });

      // 2. 옵션 상품 데이터 로드 (매핑 후 검증용)
      const productMap = await loadOptionProducts();

      // 3. 매핑 후에도 매칭되지 않는 옵션상품 찾기
      const unmatchedOrders = mappedOrders.filter(order => {
        const optionName = order.optionName || '';
        const trimmedOption = optionName.trim().toLowerCase();
        return optionName && !productMap.has(trimmedOption);
      });

      // 4. 주문 데이터 저장
      setUploadedOrders(mappedOrders);
      setIntegrationStage('integrated');

      // 5. 매핑 결과 및 매칭 실패 정보 저장
      if (mappingResults.length > 0) {
        setMappingResults(mappingResults);
        setMappingStats({ total: totalOrders, mapped: mappedCount });
      }

      const hasUnmatched = unmatchedOrders.length > 0;

      // 6. 매칭 안된 옵션상품 정보 저장
      setHasUnmatchedOptions(hasUnmatched);

      // 7. 매핑 결과가 있으면 먼저 매핑 결과 모달 표시
      if (mappingResults.length > 0) {
        setShowMappingResultModal(true);
      } else if (hasUnmatched) {
        // 매핑 결과는 없지만 매칭 안된 옵션상품이 있으면 바로 검증 모달 표시
        setShowOptionValidationModal(true);
      } else {
        // 매핑 결과도 없고 모든 옵션상품이 매칭되었으면 바로 통합 완료
        showStatusToast('registered', `${uploadedFiles.length}개 파일 ${mappedOrders.length}건 통합 완료`);
      }
    } catch (error) {
      console.error('파일 통합 오류:', error);
      showErrorToast('파일 통합 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 마켓 템플릿 감지 (파일명과 헤더로 점수 기반 매칭)
  const detectMarketTemplate = (fileName: string, firstRow: any, templates: MarketTemplate[]): MarketTemplate | null => {
    const lowerFileName = fileName.toLowerCase();
    const rowText = Object.keys(firstRow).join(',').toLowerCase();


    // 각 템플릿별 매칭 점수 계산
    const candidates: Array<{ template: MarketTemplate; score: number; reason: string }> = [];

    for (const template of templates) {
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
      }
    }

    // 점수가 가장 높은 것 선택
    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];

    return winner.template;
  };

  // 시트 처리하고 주문 데이터 반환
  const processSheetAndReturnOrders = async (workbook: XLSX.WorkBook, sheetName: string, fileName: string = 'unknown'): Promise<SellerUploadedOrder[]> => {
    const worksheet = workbook.Sheets[sheetName];

    // 마켓 템플릿과 필드 매핑 병렬 로드
    const [templates, mappings] = await Promise.all([
      fetchMarketTemplates(),
      fetchMarketFieldMappings()
    ]);

    // SheetJS로 JSON 변환
    const allData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    }) as any[][];

    if (!allData || allData.length === 0) {
      return [];
    }

    // 첫 번째 행으로 일단 마켓 감지 (파일명으로 주로 감지됨)
    const firstDataRow = allData[0];
    const headerObj: any = {};
    firstDataRow.forEach((header: any, index: number) => {
      if (header) {
        headerObj[header] = index;
      }
    });

    // 마켓 감지
    let detected = detectMarketTemplate(fileName, headerObj, templates);
    setDetectedMarket(detected);

    if (!detected) {
      return [];
    }

    // 해당 마켓의 필드 매핑 가져오기
    const marketMapping = mappings.get(detected.market_name.toLowerCase());

    if (!marketMapping) {
      return [];
    }

    // 실제 헤더 행 읽기 (DB에 설정된 header_row 사용)
    const headerRowIndex = (detected.header_row || 1);
    const actualHeaderRowIndex = Math.max(0, headerRowIndex - 1);
    const actualHeaderRow = allData[actualHeaderRowIndex];

    const jsonData: any[] = [];

    // 헤더 이후의 데이터만 처리
    for (let i = headerRowIndex; i < allData.length; i++) {
      const rowArray = allData[i];
      const rowData: any = {};

      // actualHeaderRow 사용 (DB 설정된 헤더 행)
      actualHeaderRow.forEach((header: any, colIndex: number) => {
        if (header) {
          rowData[String(header)] = rowArray[colIndex] || '';
        }
      });

      if (Object.keys(rowData).length > 0) {
        jsonData.push(rowData);
      }
    }


    if (jsonData.length === 0) {
      return [];
    }

    // 다중 필드 값 가져오기 헬퍼 함수
    // "필드1,필드2,필드3" 형식으로 설정된 경우 순서대로 확인하여 값이 있는 첫 번째 필드 반환
    const getFieldValue = (row: any, fieldMapping: string): string => {
      if (!fieldMapping) return '';

      // 쉼표로 구분된 여러 필드명 처리
      const fieldNames = String(fieldMapping).split(',').map(f => f.trim());

      for (const fieldName of fieldNames) {
        const value = row[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }

      return '';
    };

    // 마켓별 필드 매핑을 사용하여 주문 데이터 생성
    // marketMapping의 field_4, field_5 등이 실제 엑셀 컬럼명을 가리킴
    const orders: SellerUploadedOrder[] = jsonData.map((row: any, index: number) => {
      return {
        id: index + 1,
        marketName: detected.market_name || '',
        orderNumber: getFieldValue(row, marketMapping.field_4),  // field_4 = 주문번호
        orderer: getFieldValue(row, marketMapping.field_5),      // field_5 = 주문자/구매자
        ordererPhone: getFieldValue(row, marketMapping.field_6), // field_6 = 주문자전화번호
        recipient: getFieldValue(row, marketMapping.field_7),    // field_7 = 수령인/수취인
        recipientPhone: getFieldValue(row, marketMapping.field_8), // field_8 = 수령인전화번호
        address: getFieldValue(row, marketMapping.field_9),      // field_9 = 주소
        deliveryMessage: getFieldValue(row, marketMapping.field_10), // field_10 = 배송메시지
        optionName: getFieldValue(row, marketMapping.field_11),  // field_11 = 옵션상품
        quantity: Number(getFieldValue(row, marketMapping.field_12) || 1), // field_12 = 수량
      };
    });

    // 필터링된 주문 반환
    return orders.filter(order =>
      order.orderNumber || order.recipient || order.optionName
    );
  };

  // 파일 저장 (platform orders로 등록)
  const handleSaveOrders = async () => {
    if (uploadedOrders.length === 0) {
      toast.error('저장할 주문이 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const utcTime = getCurrentTimeUTC();
      const dateOnly = utcTime.split('T')[0];

      // 최소한의 정보만 전송 - 서버에서 enrichOrdersWithOptionInfo()가 자동 처리
      const ordersToInsert = uploadedOrders.map(order => {
        const quantity = parseInt(String(order.quantity)) || 1;

        return {
          seller_market_name: order.marketName,
          seller_order_number: order.orderNumber,
          buyer_name: order.orderer,
          buyer_phone: order.ordererPhone,
          recipient_name: order.recipient,
          recipient_phone: order.recipientPhone,
          recipient_address: order.address,
          delivery_message: order.deliveryMessage,
          option_name: order.optionName,        // 서버에서 이걸로 자동 매핑
          quantity: String(quantity),
          sheet_date: dateOnly,
          payment_date: dateOnly,
          shipping_status: '발주서등록',
          seller_id: userId,
          created_by: userId,
          created_at: utcTime,
          is_deleted: false
        };
      });


      const response = await fetch('/api/platform-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToInsert })
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        throw new Error(error.error || '주문 저장에 실패했습니다.');
      }

      const result = await response.json();
      showStatusToast('registered', `${result.count || uploadedOrders.length}건의 주문이 등록되었습니다.`, 3000);

      setUploadedOrders([]);
      setUploadedFiles([]);
      setIntegrationStage('idle');
      setDetectedMarket(null);

      onOrdersUploaded();
      onClose();
    } catch (error: any) {
      console.error('주문 저장 오류:', error);
      console.error('응답 상태:', error);
      toast.error(error.message || '주문 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const columns = [
    { key: 'marketName', title: '마켓명', readOnly: false, align: 'center' as const },
    { key: 'orderNumber', title: '주문번호', readOnly: false, align: 'center' as const },
    { key: 'orderer', title: '주문자', readOnly: false, align: 'center' as const },
    { key: 'ordererPhone', title: '주문자전화번호', readOnly: false, align: 'center' as const },
    { key: 'recipient', title: '수령인', readOnly: false, align: 'center' as const },
    { key: 'recipientPhone', title: '수령인전화번호', readOnly: false, align: 'center' as const },
    { key: 'address', title: '주소', readOnly: false, align: 'left' as const },
    { key: 'deliveryMessage', title: '배송메세지', readOnly: false, align: 'left' as const },
    { key: 'optionName', title: '옵션상품', readOnly: false, align: 'left' as const },
    { key: 'quantity', title: '수량', type: 'number' as const, readOnly: false, align: 'center' as const }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 숨겨진 파일 input (항상 렌더링) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        onClick={(e) => {
          // 같은 파일을 다시 선택할 수 있도록 value 초기화
          (e.target as HTMLInputElement).value = '';
        }}
        style={{ display: 'none' }}
      />

      {/* 파일 업로드 영역 */}
      {integrationStage === 'idle' && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#2563eb' : 'var(--color-border)'}`,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            background: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-surface)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '24px'
          }}
        >
          <Upload size={48} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
            마켓 파일 업로드
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            클릭하거나 파일을 드래그하여 업로드하세요 (다중 선택 가능)
          </p>
        </div>
      )}

      {/* 처리 중 표시 */}
      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <RefreshCw size={48} style={{ color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: 'var(--color-text)' }}>파일 처리 중...</p>
        </div>
      )}

      {/* 파일 목록 미리보기 */}
      {integrationStage === 'file-preview' && !isProcessing && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
              업로드된 파일 ({uploadedFiles.length}개)
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + 파일 추가
              </button>
              <button
                onClick={() => {
                  setUploadedFiles([]);
                  setIntegrationStage('idle');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleIntegrateFiles}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                통합하기
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {uploadedFiles.map((filePreview, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: index < uploadedFiles.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', margin: 0 }}>
                      {filePreview.file.name}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', margin: 0 }}>
                      {filePreview.orderCount}건의 주문
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px',
                  background: filePreview.detectedTemplate?.color_rgb
                    ? (filePreview.detectedTemplate.color_rgb.includes(',')
                      ? `rgb(${filePreview.detectedTemplate.color_rgb})`
                      : filePreview.detectedTemplate.color_rgb)
                    : '#6B7280',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {filePreview.marketName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데이터 그리드 */}
      {uploadedOrders.length > 0 && (
        <>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                  업로드된 주문 ({uploadedOrders.length}건)
                </h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(() => {
                    // 마켓별 주문 건수 계산
                    const marketCounts = new Map<string, number>();
                    uploadedOrders.forEach(order => {
                      const market = order.marketName || '알 수 없음';
                      marketCounts.set(market, (marketCounts.get(market) || 0) + 1);
                    });

                    // 마켓별 색상 가져오기
                    const marketColors = new Map<string, string>();
                    uploadedFiles.forEach(file => {
                      if (file.detectedTemplate?.color_rgb) {
                        const color = file.detectedTemplate.color_rgb.includes(',')
                          ? `rgb(${file.detectedTemplate.color_rgb})`
                          : file.detectedTemplate.color_rgb;
                        marketColors.set(file.marketName, color);
                      }
                    });

                    return Array.from(marketCounts.entries()).map(([market, count]) => (
                      <span
                        key={market}
                        style={{
                          padding: '2px 8px',
                          background: marketColors.get(market) || '#6B7280',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {market} {count}건
                      </span>
                    ));
                  })()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setUploadedOrders([]);
                    setUploadedFiles([]);
                    setIntegrationStage('idle');
                    setDetectedMarket(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  초기화
                </button>
                <button
                  onClick={handleSaveOrders}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  {isSaving ? '저장 중...' : '발주서로 등록'}
                </button>
              </div>
            </div>

            <EditableAdminGrid
              data={uploadedOrders}
              columns={columns}
              onDataChange={setUploadedOrders}
              enableFilter={false}
              enableCSVExport={false}
              enableCSVImport={false}
              enableAddRow={false}
              enableDelete={false}
              enableCheckbox={false}
              enableCopy={false}
            />
          </div>
        </>
      )}

      {/* 옵션상품 검증 모달 */}
      <OptionValidationModal
        show={showOptionValidationModal}
        onClose={() => {
          setShowOptionValidationModal(false);
        }}
        orders={uploadedOrders}
        onSave={async (validatedOrders) => {
          // 검증된 주문으로 업데이트
          setUploadedOrders(validatedOrders);
          setShowOptionValidationModal(false);

          // 바로 DB에 저장 (매칭 실패가 0건이므로)
          setIsSaving(true);

          try {
            const utcTime = getCurrentTimeUTC();
            const dateOnly = utcTime.split('T')[0];

            // 최소한의 정보만 전송 - 서버에서 enrichOrdersWithOptionInfo()가 자동 처리
            const ordersToInsert = validatedOrders.map(order => {
              const quantity = parseInt(String(order.quantity)) || 1;

              return {
                seller_market_name: order.marketName,
                seller_order_number: order.orderNumber,
                buyer_name: order.orderer,
                buyer_phone: order.ordererPhone,
                recipient_name: order.recipient,
                recipient_phone: order.recipientPhone,
                recipient_address: order.address,
                delivery_message: order.deliveryMessage,
                option_name: order.optionName,        // 서버에서 이걸로 자동 매핑
                quantity: String(quantity),
                sheet_date: dateOnly,
                payment_date: dateOnly,
                shipping_status: '발주서등록',
                seller_id: userId,
                created_by: userId,
                created_at: utcTime,
                is_deleted: false
              };
            });

            const response = await fetch('/api/platform-orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orders: ordersToInsert })
            });

            if (!response.ok) {
              const errorText = await response.text();
              let error;
              try {
                error = JSON.parse(errorText);
              } catch {
                error = { error: errorText };
              }
              throw new Error(error.error || '주문 저장에 실패했습니다.');
            }

            const result = await response.json();
            showStatusToast('registered', `${result.count || validatedOrders.length}건의 주문이 등록되었습니다.`, 3000);

            setUploadedOrders([]);
            setUploadedFiles([]);
            setIntegrationStage('idle');
            onOrdersUploaded();
            onClose(); // 마켓파일 업로드 모달 닫기
          } catch (error: any) {
            console.error('주문 저장 오류:', error);
            showErrorToast(error.message || '주문 저장에 실패했습니다.');
          } finally {
            setIsSaving(false);
          }
        }}
        optionProducts={optionProducts}
      />

      {/* 옵션상품 매핑 결과 모달 */}
      <MappingResultModal
        show={showMappingResultModal}
        onClose={() => {
          setShowMappingResultModal(false);
          setMappingResults([]);
          setMappingStats({ total: 0, mapped: 0 });
          setHasUnmatchedOptions(false);
        }}
        onContinue={() => {
          setShowMappingResultModal(false);

          // 매칭 안된 옵션상품이 있으면 옵션상품 검증 모달 표시
          if (hasUnmatchedOptions) {
            setShowOptionValidationModal(true);
          } else {
            // 모든 옵션상품이 매칭되었으면 통합 완료
            showStatusToast('registered', `${uploadedFiles.length}개 파일 ${uploadedOrders.length}건 통합 완료`);
            setHasUnmatchedOptions(false);
          }
        }}
        results={mappingResults}
        totalOrders={mappingStats.total}
        mappedOrders={mappingStats.mapped}
      />

      {/* 비밀번호 입력 모달 */}
      <PasswordModal
        show={showPasswordModal}
        fileName={currentPasswordFile?.name || ''}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordModal(false);
          setCurrentPasswordFile(null);
        }}
      />
    </div>
  );
}
