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
  optionName?: string;        // 옵션명
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

  // 옵션명 매핑 결과 모달 상태
  const [showMappingResultModal, setShowMappingResultModal] = useState(false);
  const [mappingResults, setMappingResults] = useState<any[]>([]);
  const [mappingStats, setMappingStats] = useState({ total: 0, mapped: 0 });

  // 옵션명 검증 모달 상태
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
        console.log('✓ 마켓별 필드 매핑 로드 완료:', mappings.size, '개');
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
      console.log('🔧 API Response:', data);

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
          const data = await file.arrayBuffer();

          // 파일 읽기 (복호화된 파일이므로 비밀번호 불필요)
          const workbook = XLSX.read(data, {
            type: 'array'
          });

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // 헤더 행 감지
          const allData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          const firstDataRow = allData[0] || [];
          const headerObj: any = {};
          firstDataRow.forEach((header: any, index: number) => {
            headerObj[header] = index;
          });

          // 마켓 감지
          const template = detectMarketTemplate(file.name, headerObj, templates);
          const marketName = template?.market_name || '알 수 없음';

          // 주문 건수 계산
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
            marketName,
            detectedTemplate: template,
            orderCount,
            isToday,
          });
        } catch (error: any) {
          // 암호화된 파일 감지
          console.log('파일 읽기 에러:', error.message, error);

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
            console.log('암호화된 파일 감지:', file.name);
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

      setUploadedFiles(filePreviews);
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
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 복호화에 실패했습니다.');
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
      console.error('복호화 오류:', error);
      toast.error(error.message || '비밀번호가 올바르지 않습니다.', {
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

        const workbook = XLSX.read(arrayBuffer, {
          type: 'array'
        });
        const sheetName = workbook.SheetNames[0];

        const orders = await processSheetAndReturnOrders(workbook, sheetName, filePreview.file.name);
        allOrders.push(...orders);
      }

      // 1. 옵션명 매핑 먼저 적용
      console.log('🔄 옵션명 매핑 적용 시작...');
      const { orders: mappedOrders, mappingResults, totalOrders, mappedOrders: mappedCount } =
        await applyOptionMapping(allOrders, userId);

      console.log('✅ 옵션명 매핑 완료:', {
        totalOrders,
        mappedOrders: mappedCount,
        mappingResults
      });

      // 2. 옵션 상품 데이터 로드 (매핑 후 검증용)
      const productMap = await loadOptionProducts();

      // 3. 매핑 후에도 매칭되지 않는 옵션명 찾기
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
      console.log('매칭 안된 옵션명:', hasUnmatched ? unmatchedOrders.length + '건' : '없음');

      // 6. 매칭 안된 옵션명 정보 저장
      setHasUnmatchedOptions(hasUnmatched);

      // 7. 매핑 결과가 있으면 먼저 매핑 결과 모달 표시
      if (mappingResults.length > 0) {
        console.log('📋 옵션명 매핑 변환 내역 표시');
        setShowMappingResultModal(true);
      } else if (hasUnmatched) {
        // 매핑 결과는 없지만 매칭 안된 옵션명이 있으면 바로 검증 모달 표시
        console.log('❌ 매칭되지 않은 옵션명 발견:', unmatchedOrders.length, '건');
        setShowOptionValidationModal(true);
      } else {
        // 매핑 결과도 없고 모든 옵션명이 매칭되었으면 바로 통합 완료
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

    console.log('마켓 감지 시작 - 파일명:', fileName);
    console.log('헤더:', rowText);

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
        console.log(`${template.market_name} - 점수: ${score}, 이유: ${reasons.join(' + ')}`);
      }
    }

    // 점수가 가장 높은 것 선택
    if (candidates.length === 0) {
      console.log('✗ 매칭되는 마켓을 찾을 수 없음');
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];
    console.log(`✓ 선택된 마켓: ${winner.template.market_name} (${winner.score}점)`);

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
    console.log('📋 Loaded templates:', templates.length);
    console.log('📋 Loaded mappings:', mappings.size);

    // 첫 번째 행을 헤더로 읽기 (마켓 감지용)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const firstDataRow = rawData[0] || [];
    const headerObj: any = {};
    firstDataRow.forEach((header: any, index: number) => {
      headerObj[header] = index;
    });

    // 마켓 감지
    let detected = detectMarketTemplate(fileName, headerObj, templates);
    setDetectedMarket(detected);

    if (!detected) {
      console.warn(`${fileName}: 마켓을 자동 감지하지 못했습니다.`);
      return [];
    }

    console.log('✓ 감지된 마켓:', detected.market_name);
    console.log('✓ 헤더 행:', detected.header_row);

    // 해당 마켓의 필드 매핑 가져오기
    const marketMapping = mappings.get(detected.market_name.toLowerCase());
    if (!marketMapping) {
      console.warn(`${detected.market_name}의 필드 매핑 정보가 없습니다.`);
      return [];
    }

    console.log('✓ 마켓 매핑:', marketMapping);

    // 헤더 행 기준으로 데이터 읽기 (header_row는 1-based, sheet_to_json range는 0-based)
    const headerRowIndex = (detected.header_row || 1) - 1;
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      range: headerRowIndex,
      defval: null
    }) as any[];

    console.log(`📊 읽은 데이터 행 수: ${jsonData.length}`);

    if (jsonData.length === 0) {
      console.warn(`${fileName}: 데이터가 없습니다.`);
      return [];
    }

    // 마켓별 필드 매핑을 사용하여 주문 데이터 생성
    // marketMapping의 field_4, field_5 등이 실제 엑셀 컬럼명을 가리킴
    const orders: SellerUploadedOrder[] = jsonData.map((row: any, index: number) => {
      return {
        id: index + 1,
        marketName: detected.market_name || '',
        orderNumber: row[marketMapping.field_4] || '',  // field_4 = 주문번호
        orderer: row[marketMapping.field_5] || '',      // field_5 = 주문자/구매자
        ordererPhone: row[marketMapping.field_6] || '', // field_6 = 주문자전화번호
        recipient: row[marketMapping.field_7] || '',    // field_7 = 수령인/수취인
        recipientPhone: row[marketMapping.field_8] || '', // field_8 = 수령인전화번호
        address: row[marketMapping.field_9] || '',      // field_9 = 주소
        deliveryMessage: row[marketMapping.field_10] || '', // field_10 = 배송메시지
        optionName: row[marketMapping.field_11] || '',  // field_11 = 옵션명
        quantity: Number(row[marketMapping.field_12] || 1), // field_12 = 수량
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

      console.log('📤 전송할 데이터:', ordersToInsert);
      console.log('📊 주문 개수:', ordersToInsert.length);

      const response = await fetch('/api/platform-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToInsert })
      });

      console.log('응답 상태:', response.status);

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
    { key: 'optionName', title: '옵션명', readOnly: false, align: 'left' as const },
    { key: 'quantity', title: '수량', type: 'number' as const, readOnly: false, align: 'center' as const }
  ];

  return (
    <div style={{ padding: '24px' }}>
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
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

      {/* 옵션명 검증 모달 */}
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
          console.log('✅ 옵션명 검증 완료. 발주서 등록 시작...');
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

      {/* 옵션명 매핑 결과 모달 */}
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

          // 매칭 안된 옵션명이 있으면 옵션명 검증 모달 표시
          if (hasUnmatchedOptions) {
            console.log('✋ 매핑 결과 확인 완료. 옵션명 검증 모달로 이동');
            setShowOptionValidationModal(true);
          } else {
            // 모든 옵션명이 매칭되었으면 통합 완료
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
