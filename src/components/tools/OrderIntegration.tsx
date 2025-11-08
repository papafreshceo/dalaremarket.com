'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { useCreditOnAction } from '@/hooks/useCreditOnAction';
import ExcelJS from 'exceljs';
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
          const data = await file.arrayBuffer();

          // 파일 읽기
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);

          const firstSheet = workbook.worksheets[0];

          // 헤더 행 감지
          const firstDataRow: any[] = [];
          const headerRow = firstSheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            firstDataRow[colNumber - 1] = cell.value;
          });

          const headerObj: any = {};
          firstDataRow.forEach((header: any, index: number) => {
            headerObj[header] = index;
          });

          // 마켓 감지
          const template = detectMarketTemplate(file.name, headerObj, templates);
          const marketName = template?.market_name || '알 수 없음';

          // 주문 건수 계산
          const headerRowIndex = (template?.header_row || 1);
          let orderCount = 0;
          firstSheet.eachRow((row, rowNumber) => {
            if (rowNumber > headerRowIndex) {
              orderCount++;
            }
          });

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

      setUploadedFiles(filePreviews);
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
      setIntegrating(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleIntegrate = async () => {
    // 크레딧 차감 (버튼 ID: 'integrate')
    const canProceed = await executeWithCredit('integrate');
    if (!canProceed) return;

    setIntegrating(true);

    try {
      // 엑셀 데이터를 통합하여 다운로드
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('통합주문');

      // 헤더 설정 (표준 형식)
      worksheet.columns = [
        { header: '마켓명', key: 'marketName', width: 15 },
        { header: '주문번호', key: 'orderNumber', width: 20 },
        { header: '주문자', key: 'orderer', width: 12 },
        { header: '주문자전화번호', key: 'ordererPhone', width: 15 },
        { header: '수령인', key: 'recipient', width: 12 },
        { header: '수령인전화번호', key: 'recipientPhone', width: 15 },
        { header: '주소', key: 'address', width: 40 },
        { header: '배송메시지', key: 'deliveryMessage', width: 25 },
        { header: '옵션명', key: 'optionName', width: 30 },
        { header: '수량', key: 'quantity', width: 8 },
        { header: '단가', key: 'unitPrice', width: 12 },
        { header: '특이사항', key: 'specialRequest', width: 25 },
      ];

      // 각 파일의 데이터 읽어서 추가
      for (const filePreview of uploadedFiles) {
        const arrayBuffer = await filePreview.file.arrayBuffer();
        const sourceWorkbook = new ExcelJS.Workbook();
        await sourceWorkbook.xlsx.load(arrayBuffer);
        const sourceSheet = sourceWorkbook.worksheets[0];

        const template = filePreview.detectedTemplate;
        const headerRowIndex = template?.header_row || 1;
        const fieldMappings = template?.field_mappings || {};

        // 헤더 읽기
        const headerRow = sourceSheet.getRow(headerRowIndex);
        const headers: any = {};
        headerRow.eachCell((cell, colNumber) => {
          headers[cell.value as string] = colNumber - 1;
        });

        // 데이터 행 읽기
        sourceSheet.eachRow((row, rowNumber) => {
          if (rowNumber <= headerRowIndex) return; // 헤더 행 건너뛰기

          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[colNumber - 1] = cell.value;
          });

          // 필드 매핑 적용
          const mappedData: any = {
            marketName: filePreview.marketName
          };

          // 각 표준 필드에 대해 매핑
          for (const [standardField, sourceField] of Object.entries(fieldMappings)) {
            const columnIndex = headers[sourceField];
            if (columnIndex !== undefined) {
              mappedData[standardField] = rowData[columnIndex];
            }
          }

          worksheet.addRow(mappedData);
        });
      }

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `통합주문_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${uploadedFiles.length}개 파일 통합 완료!`);
      setUploadedFiles([]);
    } catch (error) {
      console.error('통합 오류:', error);
      toast.error('통합 중 오류가 발생했습니다.');
    } finally {
      setIntegrating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    // 크레딧 차감 (버튼 ID: 'download')
    const canProceed = await executeWithCredit('download');
    if (!canProceed) return;

    try {
      // 표준 템플릿 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('주문템플릿');

      worksheet.columns = [
        { header: '마켓명', key: 'marketName', width: 15 },
        { header: '주문번호', key: 'orderNumber', width: 20 },
        { header: '주문자', key: 'orderer', width: 12 },
        { header: '주문자전화번호', key: 'ordererPhone', width: 15 },
        { header: '수령인', key: 'recipient', width: 12 },
        { header: '수령인전화번호', key: 'recipientPhone', width: 15 },
        { header: '주소', key: 'address', width: 40 },
        { header: '배송메시지', key: 'deliveryMessage', width: 25 },
        { header: '옵션명', key: 'optionName', width: 30 },
        { header: '수량', key: 'quantity', width: 8 },
        { header: '단가', key: 'unitPrice', width: 12 },
        { header: '특이사항', key: 'specialRequest', width: 25 },
      ];

      // 샘플 데이터 추가
      worksheet.addRow({
        marketName: '쿠팡',
        orderNumber: 'CP20250108-001',
        orderer: '홍길동',
        ordererPhone: '010-1234-5678',
        recipient: '김철수',
        recipientPhone: '010-9876-5432',
        address: '서울시 강남구 테헤란로 123',
        deliveryMessage: '문 앞에 놔주세요',
        optionName: '상품A 옵션1',
        quantity: 2,
        unitPrice: 15000,
        specialRequest: ''
      });

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '주문통합_템플릿.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('템플릿 다운로드 완료!');
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error);
      toast.error('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          마켓 주문 파일 통합
        </h3>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          여러 마켓의 주문 파일을 업로드하고 하나로 통합하세요
        </p>
      </div>

      {/* 파일 업로드 영역 */}
      {uploadedFiles.length === 0 ? (
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
            지원 형식: .xlsx, .xls (다중 선택 가능)
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
                accept=".xlsx,.xls"
                multiple
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
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

      {/* 템플릿 다운로드 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              엑셀 템플릿 다운로드
            </h5>
            <p style={{ fontSize: '12px', color: '#6c757d' }}>
              표준 형식의 주문 템플릿을 다운로드하세요
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={isProcessing}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            <Download size={16} />
            다운로드 (1 크레딧)
          </button>
        </div>
      </div>

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
