'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { useCreditOnAction } from '@/hooks/useCreditOnAction';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import PasswordModal from './PasswordModal';

interface FilePreview {
  file: File;
  name: string;
  size: number;
  marketName?: string;
  orderCount?: number;
  detectedTemplate?: MarketTemplate | null;
  isToday?: boolean;
}

interface MarketTemplate {
  id: number;
  market_name: string;
  initial: string;
  color_rgb: string;
  detect_string1: string;
  detect_string2: string;
  detect_string3?: string;
  header_row: number;
  settlement_method: string;
  settlement_formula: string;
  field_mappings: Record<string, string>;
}

export default function OrderIntegration() {
  const { executeWithCredit, isProcessing } = useCreditOnAction('order-integration');
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 암호화된 파일 처리 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPasswordFile, setCurrentPasswordFile] = useState<File | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [processedPreviews, setProcessedPreviews] = useState<FilePreview[]>([]);
  const [filePasswords, setFilePasswords] = useState<Map<string, string>>(new Map());

  // 통합 결과 상태
  const [integratedOrders, setIntegratedOrders] = useState<any[]>([]);
  const [showIntegratedResult, setShowIntegratedResult] = useState(false);

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

  // 마켓 필드 매핑 조회
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
        return mappings;
      }
      return new Map();
    } catch (error) {
      console.error('필드 매핑 로드 실패:', error);
      return new Map();
    }
  };

  // 마켓 템플릿 조회
  const fetchMarketTemplates = async (): Promise<MarketTemplate[]> => {
    try {
      const response = await fetch('/api/market-templates');
      if (!response.ok) throw new Error('마켓 템플릿을 불러오는데 실패했습니다.');
      const data = await response.json();

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

  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIntegrating(true);
    try {
      const templates = await fetchMarketTemplates();
      const filePreviews: FilePreview[] = [];

      // 모든 파일의 마켓명 감지
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // 중복 파일 검증 (파일명 기준)
          const isDuplicate = uploadedFiles.some(uploaded => uploaded.name === file.name);
          if (isDuplicate) {
            toast.error(`${file.name}은(는) 이미 추가된 파일입니다.`);
            continue;
          }

          // 파일 타입 검증 (xlsx, xls, csv 모두 허용)
          if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error(`${file.name}은(는) 지원되지 않는 파일 형식입니다. (xlsx, xls, csv만 가능)`);
            continue;
          }

          // 파일 크기 검증 (100MB 제한)
          if (file.size > 100 * 1024 * 1024) {
            toast.error(`${file.name}은(는) 파일 크기가 너무 큽니다. (최대 100MB)`);
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
            header: 1,
            defval: '',
            raw: false
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
            name: file.name,
            size: file.size,
            marketName,
            detectedTemplate: template,
            orderCount,
            isToday,
          });
        } catch (error: any) {
          // 암호화된 파일 감지
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
            setIntegrating(false);
            return; // 비밀번호 입력 대기
          } else {
            throw error; // 다른 에러는 상위로 전달
          }
        }
      }

      // 기존 파일에 새 파일 추가 (교체가 아닌 추가)
      setUploadedFiles(prev => [...prev, ...filePreviews]);
    } catch (error) {
      console.error('파일 읽기 실패:', error);
      toast.error('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIntegrating(false);
    }
  };

  // 비밀번호 제출 핸들러
  const handlePasswordSubmit = async (password: string) => {
    if (!currentPasswordFile) return;

    setIntegrating(true);

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
        setIntegrating(false);
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
      setIntegrating(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleIntegrate = async () => {
    console.log('🚀 통합 시작');

    // 크레딧 차감 (버튼 ID: 'integrate')
    const canProceed = await executeWithCredit('integrate');
    if (!canProceed) {
      console.log('❌ 크레딧 부족으로 중단');
      return;
    }

    setIntegrating(true);

    try {
      // 필드 매핑 가져오기
      console.log('📥 필드 매핑 로드 중...');
      const fieldMappings = await fetchMarketFieldMappings();
      console.log('✅ 필드 매핑 로드 완료:', fieldMappings.size, '개 마켓');

      // 통합 데이터를 담을 배열
      const integratedData: any[] = [];

      console.log('📂 처리할 파일 수:', uploadedFiles.length);

      // 각 파일의 데이터 읽어서 추가
      for (const filePreview of uploadedFiles) {
        console.log(`\n📄 파일 처리 시작: ${filePreview.name}`);
        const arrayBuffer = await filePreview.file.arrayBuffer();
        const sourceWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = sourceWorkbook.SheetNames[0];
        const sourceSheet = sourceWorkbook.Sheets[firstSheetName];

        const template = filePreview.detectedTemplate;
        if (!template) continue;

        const headerRowIndex = template.header_row || 1;

        // 마켓별 필드 매핑 가져오기
        const marketMapping = fieldMappings.get(template.market_name.toLowerCase());
        if (!marketMapping) {
          console.warn(`⚠️ ${template.market_name} 마켓의 필드 매핑을 찾을 수 없습니다.`);
          continue;
        }

        // 첫 번째 파일 처리 시 매핑 정보 출력
        if (uploadedFiles.indexOf(filePreview) === 0) {
          console.log(`📋 ${template.market_name} 마켓 매핑 정보:`, {
            field_4_주문번호: marketMapping.field_4,
            field_11_옵션상품: marketMapping.field_11,
          });
        }

        // SheetJS로 JSON 변환
        const allData = XLSX.utils.sheet_to_json(sourceSheet, {
          header: 1,
          defval: '',
          raw: false
        }) as any[][];

        if (!allData || allData.length === 0) continue;

        // 올바른 헤더 행 사용 (headerRowIndex는 1-based이므로 -1)
        const actualHeaderRowIndex = Math.max(0, headerRowIndex - 1);
        const actualHeaderRow = allData[actualHeaderRowIndex];

        // 헤더 이후의 데이터만 처리

        for (let i = headerRowIndex; i < allData.length; i++) {
          const rowArray = allData[i];
          const rowData: any = {};

          // DB 설정된 헤더 행 사용
          actualHeaderRow.forEach((header: any, colIndex: number) => {
            if (header) {
              rowData[String(header)] = rowArray[colIndex] || '';
            }
          });

          if (Object.keys(rowData).length === 0) continue;

          // 다중 필드 값 가져오기 헬퍼 함수
          // "필드1,필드2,필드3" 형식으로 설정된 경우 순서대로 확인하여 값이 있는 첫 번째 필드 반환
          const getFieldValue = (fieldMapping: string): string => {
            if (!fieldMapping) return '';

            // 쉼표로 구분된 여러 필드명 처리
            const fieldNames = fieldMapping.split(',').map(f => f.trim());

            // 디버깅 로그 (첫 번째 행만)
            if (i === headerRowIndex) {
              console.log('🔍 다중 필드 매핑 테스트:', {
                fieldMapping,
                fieldNames,
                availableFields: Object.keys(rowData).slice(0, 10),
              });
            }

            for (const fieldName of fieldNames) {
              const value = rowData[fieldName];
              if (value !== undefined && value !== null && value !== '') {
                // 값을 찾았을 때 로그 (첫 번째 행만)
                if (i === headerRowIndex) {
                  console.log(`✅ 값 발견: "${fieldName}" = "${value}"`);
                }
                return String(value);
              }
            }

            // 값을 못 찾았을 때 로그 (첫 번째 행만)
            if (i === headerRowIndex) {
              console.log(`❌ 모든 필드에서 값 없음:`, fieldNames);
            }

            return '';
          };

          // 필드 매핑 적용 (field_4 = 주문번호, field_5 = 주문자 등)
          const mappedData: any = {
            마켓명: template.market_name,
            주문번호: getFieldValue(marketMapping.field_4),
            주문자: getFieldValue(marketMapping.field_5),
            주문자전화번호: getFieldValue(marketMapping.field_6),
            수령인: getFieldValue(marketMapping.field_7),
            수령인전화번호: getFieldValue(marketMapping.field_8),
            주소: getFieldValue(marketMapping.field_9),
            배송메시지: getFieldValue(marketMapping.field_10),
            옵션상품: getFieldValue(marketMapping.field_11),
            수량: Number(getFieldValue(marketMapping.field_12) || 1),
          };

          integratedData.push(mappedData);
        }
      }

      // 통합 결과 저장하고 테이블로 표시
      setIntegratedOrders(integratedData);
      setShowIntegratedResult(true);
      toast.success(`${uploadedFiles.length}개 파일 통합 완료!`);
    } catch (error) {
      console.error('통합 오류:', error);
      toast.error('통합 중 오류가 발생했습니다.');
    } finally {
      setIntegrating(false);
    }
  };

  const handleDownloadIntegrated = () => {
    if (integratedOrders.length === 0) {
      toast.error('다운로드할 주문이 없습니다.');
      return;
    }

    try {
      // SheetJS로 엑셀 파일 생성
      const outputWorkbook = XLSX.utils.book_new();
      const outputWorksheet = XLSX.utils.json_to_sheet(integratedOrders);

      // 컬럼 너비 설정
      outputWorksheet['!cols'] = [
        { wch: 15 }, // 마켓명
        { wch: 20 }, // 주문번호
        { wch: 12 }, // 주문자
        { wch: 15 }, // 주문자전화번호
        { wch: 12 }, // 수령인
        { wch: 15 }, // 수령인전화번호
        { wch: 40 }, // 주소
        { wch: 25 }, // 배송메시지
        { wch: 30 }, // 옵션상품
        { wch: 8 },  // 수량
      ];

      XLSX.utils.book_append_sheet(outputWorkbook, outputWorksheet, '통합주문');

      // 파일 다운로드
      const buffer = XLSX.write(outputWorkbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `통합주문_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('엑셀 파일 다운로드 완료!');
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding: '24px' }}>

      {/* 통합 결과 테이블 */}
      {showIntegratedResult ? (
        <div>
          {/* 마켓별 통계와 새로 통합하기 버튼 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* 전체 건수 통계 카드 */}
            <div
              style={{
                padding: '12px',
                background: '#2563eb',
                border: '1px solid #2563eb',
                borderRadius: '8px',
                textAlign: 'center',
                minWidth: '120px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '4px' }}>
                전체
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                {integratedOrders.length}건
              </div>
            </div>

            {/* 마켓별 통계 카드들 */}
            {(() => {
              // 마켓별 건수 집계
              const marketStats = integratedOrders.reduce((acc, order) => {
                const market = order.마켓명 || '알 수 없음';
                acc[market] = (acc[market] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return Object.entries(marketStats).map(([market, count]) => (
                <div
                  key={market}
                  style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    {market}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                    {count}건
                  </div>
                </div>
              ));
            })()}

            {/* 새로 통합하기 버튼 (오른쪽 끝) */}
            <button
              onClick={() => {
                setShowIntegratedResult(false);
                setIntegratedOrders([]);
                setUploadedFiles([]);
              }}
              style={{
                padding: '10px 16px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                marginLeft: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              새로 통합하기
            </button>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderTop: 'none',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '500px',
            marginBottom: '16px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: '13px'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>마켓명</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>주문번호</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>주문자</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>주문자전화번호</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>수령인</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>수령인전화번호</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', minWidth: '200px', background: '#f8f9fa' }}>주소</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>배송메시지</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'left', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>옵션상품</th>
                  <th style={{ padding: '12px 12px 11px 12px', textAlign: 'center', borderTop: '2px solid #dee2e6', borderBottom: '2px solid #dee2e6', fontWeight: '600', background: '#f8f9fa' }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {integratedOrders.map((order, index) => (
                  <tr key={index} style={{
                    borderBottom: index < integratedOrders.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <td style={{ padding: '12px' }}>{order.마켓명}</td>
                    <td style={{ padding: '12px' }}>{order.주문번호}</td>
                    <td style={{ padding: '12px' }}>{order.주문자}</td>
                    <td style={{ padding: '12px' }}>{order.주문자전화번호}</td>
                    <td style={{ padding: '12px' }}>{order.수령인}</td>
                    <td style={{ padding: '12px' }}>{order.수령인전화번호}</td>
                    <td style={{ padding: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.주소}</td>
                    <td style={{ padding: '12px' }}>{order.배송메시지}</td>
                    <td style={{ padding: '12px' }}>{order.옵션상품}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{order.수량}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleDownloadIntegrated}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            엑셀 다운로드
          </button>
        </div>
      ) : uploadedFiles.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#2563eb' : '#dee2e6'}`,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            background: dragActive ? 'rgba(37, 99, 235, 0.05)' : '#f8f9fa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '24px'
          }}
        >
          <Upload size={48} style={{ color: '#6c757d', margin: '0 auto 16px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            마켓 파일 업로드
          </h4>
          <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
            클릭하거나 파일을 드래그하여 업로드하세요
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            지원 형식: .xlsx, .xls, .csv (다중 선택 가능)
          </p>
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
        </div>
      ) : (
        <>
          {/* 업로드된 파일 목록 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600' }}>
                업로드된 파일 ({uploadedFiles.length}개)
              </h4>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                + 파일 추가
              </button>
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
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
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
                    borderBottom: index < uploadedFiles.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                        {filePreview.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6c757d' }}>
                        {formatFileSize(filePreview.size)} • {filePreview.marketName} • {filePreview.orderCount || 0}건
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#dc3545',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setUploadedFiles([])}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              전체 취소
            </button>
            <button
              onClick={handleIntegrate}
              disabled={isProcessing || integrating}
              style={{
                flex: 2,
                padding: '12px',
                background: isProcessing || integrating ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isProcessing || integrating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {integrating ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  통합 중...
                </>
              ) : (
                '통합하기 (5 크레딧)'
              )}
            </button>
          </div>
        </>
      )}

      {/* 비밀번호 모달 */}
      <PasswordModal
        show={showPasswordModal}
        fileName={currentPasswordFile?.name || ''}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordModal(false);
          setCurrentPasswordFile(null);
          setPendingFiles(null);
          setProcessedPreviews([]);
        }}
      />

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
