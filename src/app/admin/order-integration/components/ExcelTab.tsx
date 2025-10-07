'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, Save, RefreshCw, Edit, CheckCircle } from 'lucide-react';

interface UploadedFile {
  name: string;
  marketName: string;
  rowCount: number;
  isToday: boolean;
  lastModified: number;
}

export default function ExcelTab() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['xlsx', 'xls', 'csv'].includes(ext || '');
    });

    if (validFiles.length === 0) {
      alert('유효한 파일이 없습니다. (xlsx, xls, csv 파일만 업로드 가능)');
      return;
    }

    // 임시로 파일 정보만 저장
    const fileInfos: UploadedFile[] = validFiles.map(file => ({
      name: file.name,
      marketName: detectMarketFromFileName(file.name),
      rowCount: Math.floor(Math.random() * 100) + 10, // 임시 데이터
      isToday: isFileToday(file.lastModified),
      lastModified: file.lastModified,
    }));

    setUploadedFiles([...uploadedFiles, ...fileInfos]);
  };

  const detectMarketFromFileName = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('스마트스토어') || lower.includes('네이버')) return '스마트스토어';
    if (lower.includes('쿠팡')) return '쿠팡';
    if (lower.includes('11번가')) return '11번가';
    if (lower.includes('토스')) return '토스';
    return '알 수 없음';
  };

  const isFileToday = (timestamp: number): boolean => {
    const fileDate = new Date(timestamp);
    const today = new Date();
    return fileDate.toDateString() === today.toDateString();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      alert('업로드된 파일이 없습니다.');
      return;
    }

    const oldFiles = uploadedFiles.filter(f => !f.isToday);
    if (oldFiles.length > 0) {
      alert('오늘 날짜가 아닌 파일이 포함되어 있습니다. 해당 파일들을 제거해주세요.');
      return;
    }

    setProcessing(true);

    try {
      // TODO: 실제 엑셀 파일 읽기 및 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 임시 데이터
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        seq: i + 1,
        marketName: uploadedFiles[i % uploadedFiles.length].marketName,
        orderNumber: `ORD-${Date.now()}-${i}`,
        recipientName: `수취인${i + 1}`,
        optionName: `상품명${i + 1}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        sellerSupplyPrice: (Math.floor(Math.random() * 50) + 10) * 1000,
      }));

      setProcessedData(mockData);
      alert(`${mockData.length}개 주문이 통합되었습니다.`);
    } catch (error) {
      console.error('처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = () => {
    console.log('엑셀 다운로드');
    // TODO: 엑셀 다운로드 기능
    alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
  };

  const handleSave = () => {
    console.log('구글 시트 저장');
    // TODO: 구글 시트 저장 기능
    alert('저장 기능은 추후 구현 예정입니다.');
  };

  const handleReset = () => {
    if (confirm('모든 데이터를 초기화하시겠습니까?')) {
      setUploadedFiles([]);
      setProcessedData([]);
    }
  };

  const totalOrders = uploadedFiles.reduce((sum, file) => sum + file.rowCount, 0);
  const marketCount = new Set(uploadedFiles.map(f => f.marketName)).size;

  return (
    <div className="space-y-6">
      {/* 파일 업로드 */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:border-primary/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          주문 파일 선택
        </button>
        <p className="mt-4 text-text-secondary text-sm">
          엑셀/CSV 파일을 선택하거나 여기로 드래그해주세요
        </p>
      </div>

      {/* 파일 리스트 */}
      {uploadedFiles.length > 0 && (
        <>
          <div className="bg-surface-secondary border border-border rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-text-secondary mb-1">업로드 파일</div>
                <div className="text-2xl font-semibold text-primary">{uploadedFiles.length}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">마켓 수</div>
                <div className="text-2xl font-semibold text-primary">{marketCount}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">총 주문 수</div>
                <div className="text-2xl font-semibold text-primary">{totalOrders.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-4 border rounded-lg
                  ${file.isToday
                    ? 'bg-surface border-border'
                    : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                    {file.marketName}
                  </span>
                  <span className="text-sm text-text-secondary">{file.name}</span>
                  <span className="text-sm font-semibold text-primary">{file.rowCount}개</span>
                  <span className={`text-xs ${file.isToday ? 'text-green-600' : 'text-yellow-600'}`}>
                    {new Date(file.lastModified).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {processing ? '처리 중...' : '주문 통합 실행'}
            </button>
          </div>
        </>
      )}

      {/* 결과 테이블 */}
      {processedData.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-secondary">
            <h3 className="text-lg font-semibold text-text">
              통합 결과 ({processedData.length}건)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                초기화
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors"
              >
                <Download className="w-4 h-4" />
                엑셀 다운로드
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">연번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">마켓명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">수취인</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">옵션명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">셀러공급가</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {processedData.map((row, index) => (
                  <tr key={index} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{row.seq}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                        {row.marketName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{row.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{row.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-text">{row.optionName}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{row.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{row.sellerSupplyPrice.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 처리 중 오버레이 */}
      {processing && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-white/30 border-t-primary rounded-full animate-spin mx-auto mb-5" />
            <div className="text-white text-xl font-medium mb-2">주문 통합 중...</div>
            <div className="text-white/80 text-sm">{uploadedFiles.length}개 파일 처리 중</div>
          </div>
        </div>
      )}
    </div>
  );
}
