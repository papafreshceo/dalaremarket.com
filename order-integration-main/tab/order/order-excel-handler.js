// order-excel-handler.js
window.OrderExcelHandler = {
    uploadedFiles: [],
    processedData: null,
    mappingData: null,
    ProductMatching: null,
    API_BASE: '',
    batchEditData: {},
    
    async init() {
        console.log('OrderExcelHandler 초기화 시작');
        this.setupParentReferences();
        await this.loadMappingData();
        this.render();
        this.setupEventListeners();
        console.log('OrderExcelHandler 초기화 완료');
    },
    
    setupParentReferences() {
    // iframe 환경 체크 및 부모 참조 설정
    if (parent.window !== window) {
        this.mappingData = parent.window.mappingData;
        this.ProductMatching = parent.window.ProductMatching;
        this.API_BASE = parent.window.API_BASE || '';
        window.showCenterMessage = parent.window.showCenterMessage || this.showMessage.bind(this);
    } else {
        this.mappingData = window.mappingData;
        this.ProductMatching = window.ProductMatching;
        this.API_BASE = window.API_BASE || '';
    }
    
    // ProductMatching이 없으면 생성
    if (!this.ProductMatching || !window.ProductMatching) {
        console.log('ProductMatching 내장 버전 생성');
        
        const ProductMatchingModule = {
            productData: {},
            isLoaded: false,
            
            async loadProductData() {
                try {
                    console.log('제품 데이터 로드 시작...');
                    const response = await fetch('/api/sheets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getProductData' })
                    });
                    
                    if (!response.ok) {
                        console.error('API 응답 실패:', response.status);
                        this.isLoaded = false;
                        return false;
                    }
                    
                    const result = await response.json();
                    if (result.productData) {
                        this.productData = result.productData;
                        window.productData = result.productData;
                        this.isLoaded = true;
                        console.log('제품 데이터 로드 완료:', Object.keys(this.productData).length + '개');
                        return true;
                    }
                    this.isLoaded = false;
                    return false;
                } catch (error) {
                    console.error('제품 데이터 로드 실패:', error);
                    this.isLoaded = false;
                    return false;
                }
            },
            
            getProductData() {
                return this.productData;
            },
            
            async applyProductInfo(orders) {
                if (!this.isLoaded) {
                    await this.loadProductData();
                }
                
                return orders.map(order => {
                    const optionName = order['옵션명'];
                    if (!optionName) return order;
                    
                    const trimmedOption = optionName.trim();
                    const productInfo = this.productData[trimmedOption];
                    
                    if (productInfo) {
                        // 디버그 로그
                        console.log(`매칭 성공: ${trimmedOption}`);
                        
                        return {
                            ...order,
                            셀러공급가: productInfo['셀러공급가'] || order['셀러공급가'] || '',
                            출고처: productInfo['출고처'] || order['출고처'] || '',
                            송장주체: productInfo['송장주체'] || order['송장주체'] || '',
                            벤더사: productInfo['벤더사'] || order['벤더사'] || '',
                            발송지명: productInfo['발송지명'] || order['발송지명'] || '',
                            발송지주소: productInfo['발송지주소'] || order['발송지주소'] || '',
                            발송지연락처: productInfo['발송지연락처'] || order['발송지연락처'] || '',
                            출고비용: parseFloat(productInfo['출고비용']) || 0,
                            _matchStatus: 'matched'
                        };
                    } else {
                        console.log(`매칭 실패: ${trimmedOption}`);
                        order._matchStatus = 'unmatched';
                    }
                    
                    return order;
                });
            }
        };
        
        this.ProductMatching = ProductMatchingModule;
        window.ProductMatching = ProductMatchingModule;
        window.productData = {};
    }
},
    
    async loadMappingData() {
        if (!this.mappingData) {
            try {
                const response = await fetch(`${this.API_BASE}/api/mapping`);
                const data = await response.json();
                if (!data.error) {
                    this.mappingData = data;
                    window.mappingData = data;
                }
            } catch (error) {
                console.error('매핑 데이터 로드 실패:', error);
            }
        }
    },
    
    render() {
        const container = document.getElementById('om-panel-excel');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .excel-container {
    padding: 40px;
    background: transparent;
}

@media (max-width: 768px) {
    .excel-container {
        padding: 20px;
    }
}
                
                /* 파일 업로드 섹션 */
                .upload-section {
                    background: #ffffff;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                    margin-bottom: 24px;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                
                .upload-section.dragover {
                    background: #e7f3ff;
                    border-color: #2563eb;
                }
                
                .upload-btn {
                    padding: 10px 24px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .upload-btn:hover {
                    background: #1d4ed8;
                }
                
                .file-input {
                    display: none;
                }
                

                /* 파일 리스트 */
                .file-list {
                    margin-bottom: 24px;
                }
                
                .file-item {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 12px 16px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .file-item.warning {
                    background: #fff8e1;
                    border-color: #f59e0b;
                }
                
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }
                
                .market-tag {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    color: white;
                }
                
                .file-summary {
                    display: flex;
                    gap: 24px;
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                
                .summary-item {
                    text-align: center;
                    flex: 1;
                }
                
                .summary-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 4px;
                }
                
                .summary-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2563eb;
                }
                
                /* 경고 박스 */
                .warning-box {
                    display: none;
                    background: #fff8e1;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                
                .warning-box.show {
                    display: block;
                }
                
                /* 버튼들 */
                .btn-action {
    padding: 0 16px;
    height: 34px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #ffffff;
    color: #212529;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
                
                .btn-action:hover {
                    background: #f8f9fa;
                    border-color: #2563eb;
                    color: #2563eb;
                }
                
                .btn-reset {
                    background: #dc3545;
                    color: white;
                    border-color: #dc3545;
                }
                
                .btn-reset:hover {
                    background: #c82333;
                }
                
                .btn-save {
                    background: #10b981;
                    color: white;
                    border-color: #10b981;
                }
                
                .btn-save:hover {
                    background: #059669;
                }
                
                .btn-success {
    padding: 0 12px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: #10b981;
    color: #ffffff;
    font-size: 12px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-success:hover {
    background: #059669;
}

.btn-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

                /* 테이블 섹션 - 발송관리와 동일 */
                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    overflow: hidden;
                    margin-top: 24px;
                }

                .table-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                }

                .table-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }

                .table-actions {
                    display: flex;
                    gap: 8px;
                }

                /* 테이블 */
                .table-wrapper {
                    overflow-x: auto;
                    height: calc(100vh - 450px);
                    min-height: 400px;
                    max-height: 700px;
                    overflow-y: auto;
                    position: relative;
}
                
                .result-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                
                .result-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8f9fa;
}


                
                .result-table th {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    text-align: center;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .result-table td {
    padding: 6px 8px;
    border: 1px solid #dee2e6;
    white-space: nowrap;
    background: white;
    overflow: hidden;
    text-overflow: ellipsis;

}
                

                
                /* 옵션명 매칭 상태 */
                .unmatched-cell {
                    background: #fee2e2 !important;
                    color: #dc3545;
                }
                
                .modified-cell {
                    background: #fff8e1 !important;
                    color: #f59e0b;
                }
                
                .editable-cell {
                    cursor: text;
                }
                
                .editable-cell:hover {
                    background: #e7f3ff !important;
                }
                
                /* 모달 */
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal.show {
                    display: flex;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .modal-close {
                    cursor: pointer;
                    font-size: 24px;
                    color: #6c757d;
                }
                
                /* 메시지 */
                .message-box {
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin: 16px 0;
                    display: none;
                    font-size: 14px;
                }
                
                .message-box.show {
                    display: block;
                }
                
                .message-box.error {
                    background: #fee2e2;
                    color: #dc3545;
                    border: 1px solid #fecaca;
                }
                
                .message-box.success {
                    background: #d1fae5;
                    color: #10b981;
                    border: 1px solid #a7f3d0;
                }
                
                .edit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                
                .edit-item.modified {
                    background: #fff8e1;
                    border-color: #f59e0b;
                }
                
                /* 토스트 메시지 스타일 - 콘텐츠 상단에 고정 */
                .toast-container {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }
                
                .toast-message {
                    min-width: 300px;
                    max-width: 500px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 14px;
                    font-weight: 400;
                    pointer-events: auto;
                    animation: slideDown 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .toast-message.error {
                    background: #fee2e2;
                    color: #dc3545;
                    border: 1px solid #fecaca;
                }
                
                .toast-message.success {
                    background: #d1fae5;
                    color: #10b981;
                    border: 1px solid #a7f3d0;
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .original-option {
                    flex: 1;
                    padding: 8px 12px;
                    background: #fee2e2;
                    color: #dc3545;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .replacement-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .replacement-input.has-value {
                    background: #d1fae5;
                    border-color: #10b981;
                }


                /* 매칭 상태 아이콘을 ::after 가상 요소로 표시 */
.unmatched-cell::after {
    content: '⚠️';
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    pointer-events: none;
}

.modified-cell::after {
    content: '✏️';
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    pointer-events: none;
}

.modified-matched-cell {
    background: #d1fae5 !important;
    color: #10b981;
}

            </style>
            
            <div class="excel-container">
               
                
                <!-- 토스트 메시지 컨테이너 -->
                <div class="toast-container" id="toastContainer"></div>
                
                <!-- 파일 업로드 -->
                <div class="upload-section" id="uploadSection">
                    <input type="file" id="fileInput" class="file-input" multiple accept=".xlsx,.xls,.csv">
                    <button class="upload-btn" id="uploadFileBtn">주문 파일 선택</button>
                    <p style="margin-top: 15px; color: #6c757d;">엑셀/CSV 파일을 선택하거나 여기로 드래그해주세요</p>
                </div>
                
                <!-- 파일 리스트 -->
                <div class="file-list" id="fileList"></div>
                
                <!-- 파일 요약 -->
                <div class="file-summary" id="fileSummary" style="display: none;">
                    <div class="summary-item">
                        <div class="summary-label">업로드 파일</div>
                        <div class="summary-value" id="totalFiles">0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">마켓 수</div>
                        <div class="summary-value" id="totalMarkets">0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">총 주문 수</div>
                        <div class="summary-value" id="totalOrders">0</div>
                    </div>
                </div>
                
                <!-- 경고 박스 -->
                <div class="warning-box" id="warningBox">
                    <h3 style="color: #f59e0b; margin: 0 0 12px 0;">⚠️ 주의: 오래된 파일이 감지되었습니다!</h3>
                    <ul id="warningList" style="margin: 0; padding-left: 20px;"></ul>
                    <div style="margin-top: 12px;">
                        <label>
                            <input type="checkbox" id="confirmOldFiles">
                            오늘 날짜가 아닌 파일은 통합에서 제외됩니다
                        </label>
                    </div>
                </div>
                
                <!-- 처리 버튼 -->
                <div style="text-align: center; margin: 30px 0;">
                    <button class="upload-btn" id="processBtn" style="display: none;">주문 통합 실행</button>
                </div>
                

                
                <!-- 결과 섹션 -->
                <!-- 테이블 섹션 -->
<div class="table-section" id="resultSection" style="display: none;">
<div class="table-header">
    <div style="display: flex; align-items: center; flex: 1;">
        <h3 class="table-title" style="margin: 0;">통합 결과</h3>
        <div style="margin-left: 20px; display: flex; gap: 8px;">
            <button class="btn-action btn-reset" onclick="OrderExcelHandler.resetResults()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                초기화
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.openBatchEdit()" style="background: #fee2e2; color: #dc3545; border-color: #fecaca;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                옵션명 일괄수정
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.verifyOptions()" style="background: #d1fae5; color: #10b981; border-color: #a7f3d0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                옵션명 검증
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.verifyDuplicate()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                중복발송검증
            </button>
        </div>
    </div>
    <div class="table-actions">
        <button class="btn-action" onclick="OrderExcelHandler.exportExcel()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            엑셀 다운로드
        </button>
        <button class="btn-success" onclick="OrderExcelHandler.saveToSheets()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            저장
        </button>
    </div>
</div>
    
    <div class="table-wrapper">
        <table class="result-table" id="excelResultTable">
            <thead id="excelResultHead"></thead>
            <tbody id="excelResultBody"></tbody>
        </table>
    </div>
</div>
            </div>
            
            <!-- 옵션명 일괄수정 모달 -->
            <div id="batchEditModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 style="margin: 0;">옵션명 일괄수정</h2>
                        <span class="modal-close" onclick="OrderExcelHandler.closeBatchEdit()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <p style="color: #6c757d;">매칭 실패한 옵션명을 일괄 수정합니다.</p>
                            <p style="color: #dc3545; font-weight: 500;">동일한 옵션명은 모두 일괄 변경됩니다.</p>
                        </div>
                        <div id="batchEditList"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-action" onclick="OrderExcelHandler.closeBatchEdit()">취소</button>
                        <button class="btn-action btn-save" onclick="OrderExcelHandler.applyBatchEdit()">적용</button>
                    </div>
                </div>
            </div>
        `;
        
       
    },
    
    setupEventListeners() {
        const uploadBtn = document.getElementById('uploadFileBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
        }
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processOrders());
        }
    },
    
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    },
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    },
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    },
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    },
    
    processFiles(files) {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        if (validFiles.length === 0) {
            this.showError('유효한 파일이 없습니다.');
            return;
        }
        
        validFiles.forEach(file => this.readFile(file));
    },
    
    async readFile(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let workbook;
                const isCsv = file.name.toLowerCase().endsWith('.csv');
                const isXls = file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx');
                const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
                
                if (isCsv) {
                    workbook = XLSX.read(e.target.result, { type: 'string' });
                } else if (isXls) {
    const data = e.target.result;
    const arr = new Uint8Array(data);
    
    try {
        // 첫 번째 시도: array 타입으로
        workbook = XLSX.read(arr, {
            type: 'array',
            cellDates: true,
            cellNF: true,
            cellText: false,
            dateNF: 'YYYY-MM-DD HH:mm:ss',
            codepage: 949  // 한글 인코딩
        });
        console.log(`${file.name}: .xls 파일 읽기 성공 (array)`);
        
    } catch (xlsError) {
        console.log('.xls array 읽기 실패, binary string 시도:', xlsError);
        
        // 두 번째 시도: binary string으로
        try {
            const binaryString = Array.from(arr, byte => String.fromCharCode(byte)).join('');
            workbook = XLSX.read(binaryString, {
                type: 'binary',
                cellDates: true,
                cellNF: true,
                cellText: false,
                dateNF: 'YYYY-MM-DD HH:mm:ss',
                codepage: 949
            });
            console.log(`${file.name}: .xls 파일 읽기 성공 (binary)`);
            
        } catch (binaryError) {
            console.log('.xls binary 읽기 실패, base64 시도:', binaryError);
            
            // 세 번째 시도: base64로
            try {
                const base64 = btoa(Array.from(arr, byte => String.fromCharCode(byte)).join(''));
                workbook = XLSX.read(base64, {
                    type: 'base64',
                    cellDates: true,
                    cellNF: true,
                    cellText: false,
                    dateNF: 'YYYY-MM-DD HH:mm:ss',
                    codepage: 949
                });
                console.log(`${file.name}: .xls 파일 읽기 성공 (base64)`);
                
            } catch (base64Error) {
                throw new Error('모든 .xls 읽기 방법 실패');
            }
        }
    }
                } else if (isXlsx) {
                    workbook = XLSX.read(e.target.result, { 
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false
                    });
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: '',
    blankrows: true,  // 빈 행도 포함
    raw: false
});
                
                await this.processExcelData(rawRows, file);
                
            } catch (error) {
                this.showError(`파일 읽기 실패: ${file.name}`);
            }
        };
        
        const fileName = file.name.toLowerCase();

if (fileName.endsWith('.csv')) {
    reader.readAsText(file, 'utf-8');
} else if (fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
    // .xls는 ArrayBuffer로 읽기
    reader.readAsArrayBuffer(file);
} else if (fileName.endsWith('.xlsx')) {
    // .xlsx는 BinaryString으로 읽기
    reader.readAsBinaryString(file);
} else {
    // 기타는 BinaryString으로 시도
    reader.readAsBinaryString(file);
}
    },
    
async processExcelData(rawRows, file) {
    // rawRows가 비어있는지만 확인
    if (!rawRows || rawRows.length === 0) {
        this.showError(`${file.name}: 파일이 비어있습니다.`);
        return;
    }
    
    // 헤더 위치 판단 - 매핑 시트의 헤더행 값 우선 사용
    let headerRowIndex = 0;
    const fileName = file.name.toLowerCase();
    
    // 마켓 감지를 위한 임시 헤더 추출
    let tempMarketName = null;
    
    // 파일명으로 마켓 추측
    if (this.mappingData && this.mappingData.markets) {
        for (const [marketName, market] of Object.entries(this.mappingData.markets)) {
            // 감지문자열로 확인
            const detectStrings = [
                market.detectString1,
                market.detectString2,
                marketName.toLowerCase()
            ].filter(s => s);
            
            if (detectStrings.some(str => fileName.includes(str.toLowerCase()))) {
                tempMarketName = marketName;
                break;
            }
        }
    }
    
    // 디버그: 감지된 마켓 확인
    console.log(`=== 헤더행 판단 시작 ===`);
    console.log(`파일명: ${file.name}`);
    console.log(`임시 감지 마켓: ${tempMarketName || '없음'}`);
    
// 토스 특별 처리
if (tempMarketName === '토스') {
    // 토스는 항상 2행이 헤더 (1행이 빈 행)
    // 첫 행이 실제로 빈 행인지 확인
    const firstRowEmpty = !rawRows[0] || rawRows[0].every(cell => !cell || String(cell).trim() === '');
    
    if (!firstRowEmpty) {
        // 첫 행이 빈 행이 아니면 이미 제거된 상태
        headerRowIndex = 0; // 현재 첫 행이 헤더
        console.log(`토스: 빈 행이 이미 제거됨, 현재 1행을 헤더로 사용 (인덱스: 0)`);
    } else {
        // 첫 행이 빈 행이면 2행이 헤더
        headerRowIndex = 1;
        console.log(`토스: 1행이 빈 행, 2행을 헤더로 사용 (인덱스: 1)`);
    }
    
    // 디버그: 실제 행 데이터 확인
    console.log(`rawRows[0] (1행):`, rawRows[0]?.slice(0, 5));
    console.log(`rawRows[1] (2행):`, rawRows[1]?.slice(0, 5));
    if (rawRows[2]) console.log(`rawRows[2] (3행):`, rawRows[2]?.slice(0, 5));
}
// 다른 마켓은 매핑 데이터 사용
else if (tempMarketName && this.mappingData?.markets?.[tempMarketName]?.headerRow) {
    const headerRowValue = this.mappingData.markets[tempMarketName].headerRow;
    headerRowIndex = Math.max(0, parseInt(headerRowValue) - 1);
    console.log(`매핑시트 헤더행 값: ${headerRowValue} → 인덱스: ${headerRowIndex}`);
    
    // 디버그: 실제 행 데이터 확인
    console.log(`rawRows[0] (1행):`, rawRows[0]?.slice(0, 5));
    console.log(`rawRows[1] (2행):`, rawRows[1]?.slice(0, 5));
    if (rawRows[2]) console.log(`rawRows[2] (3행):`, rawRows[2]?.slice(0, 5));



} else {

    // 매핑 데이터가 없으면 기본 로직 사용
    console.log(`매핑 데이터 없음 - 기본 로직 사용`);
    
    // 파일명 기반 기본 판단
    if (fileName.includes('전화주문') || fileName.includes('cs발송') || fileName.includes('cs재발송')) {
        headerRowIndex = 1;
    } else if (fileName.includes('스마트스토어') || fileName.includes('네이버')) {
        headerRowIndex = 1;
    } else if (fileName.includes('주문내역') && fileName.includes('상품준비중')) {
        headerRowIndex = 1;  // 토스 파일 패턴
        console.log(`토스 파일 패턴 감지 - 헤더행 2 설정`);
    } else {
        headerRowIndex = 0;
    }
}
    
    console.log(`최종 헤더행 인덱스: ${headerRowIndex} (실제 ${headerRowIndex + 1}행)`);
    console.log(`=== 헤더행 판단 완료 ===`);
    
    // rawRows에서 직접 헤더 추출 (빈 행 포함된 상태)
    const headers = rawRows[headerRowIndex]?.map(h => String(h || '').trim()) || [];
    
    // 헤더 이후의 데이터 행만 필터링 (빈 행 제거)
    const dataRows = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            dataRows.push(row);
        }
    }
    
    if (headers.length === 0 || dataRows.length === 0) {
        this.showError(`${file.name}: 유효한 데이터가 없습니다.`);
        return;
    }
    
    // 마켓 감지
    const marketName = await this.detectMarket(file.name, headers, dataRows[0] || []);
    
    if (!marketName) {
        this.showError(`${file.name}: 마켓을 인식할 수 없습니다.`);
        return;
    }
    
    // 날짜 확인
    const fileDate = new Date(file.lastModified);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fileDate.setHours(0, 0, 0, 0);
    const isToday = fileDate.getTime() === today.getTime();
    
    // 파일 정보 저장
    const fileInfo = {
        name: file.name,
        marketName: marketName,
        lastModified: file.lastModified,
        isToday: isToday,
        headers: headers,
        data: dataRows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] !== undefined ? row[i] : '';
            });
            return obj;
        }),
        rowCount: dataRows.length
    };
    
    this.uploadedFiles.push(fileInfo);
    this.updateFileList();
},
    
    async detectMarket(fileName, headers, firstDataRow) {
        try {
            const response = await fetch(`${this.API_BASE}/api/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, headers, firstDataRow })
            });
            
            const result = await response.json();
            return result.marketName;
            
        } catch (error) {
            // 폴백: 파일명으로 추측
            const fileNameLower = fileName.toLowerCase();
            if (fileNameLower.includes('스마트스토어')) return '스마트스토어';
            if (fileNameLower.includes('쿠팡')) return '쿠팡';
            if (fileNameLower.includes('11번가')) return '11번가';
            if (fileNameLower.includes('토스')) return '토스';
            return null;
        }
    },
    
    updateFileList() {
        const fileList = document.getElementById('fileList');
        const fileSummary = document.getElementById('fileSummary');
        const processBtn = document.getElementById('processBtn');
        
        fileList.innerHTML = '';
        
        if (this.uploadedFiles.length === 0) {
            fileSummary.style.display = 'none';
            processBtn.style.display = 'none';
            return;
        }
        
        let totalOrders = 0;
        const marketSet = new Set();
        
        this.uploadedFiles.forEach((file, index) => {
            totalOrders += file.rowCount;
            marketSet.add(file.marketName);
            
            const fileItem = document.createElement('div');
            fileItem.className = file.isToday ? 'file-item' : 'file-item warning';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const marketTag = document.createElement('span');
            marketTag.className = 'market-tag';
            marketTag.textContent = file.marketName;
            
            if (this.mappingData?.markets?.[file.marketName]) {
                const market = this.mappingData.markets[file.marketName];
                marketTag.style.background = `rgb(${market.color})`;
                const rgb = market.color.split(',').map(Number);
                const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                marketTag.style.color = brightness > 128 ? '#000' : '#fff';
            }
            
            const fileName = document.createElement('span');
fileName.textContent = file.name;
fileName.style.color = '#6c757d';  // 파일명 회색

const orderCount = document.createElement('span');
orderCount.innerHTML = `<strong style="color: #2563eb; font-weight: 600;">${file.rowCount}개</strong> <span style="color: #6c757d;">주문</span>`;
            
            const fileDate = document.createElement('span');
            fileDate.style.color = file.isToday ? '#10b981' : '#f59e0b';
            fileDate.textContent = new Date(file.lastModified).toLocaleDateString('ko-KR');
            
            fileInfo.appendChild(marketTag);
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(orderCount);
            fileInfo.appendChild(fileDate);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '삭제';
            removeBtn.className = 'btn-action';
            removeBtn.style.padding = '4px 12px';
            removeBtn.onclick = () => this.removeFile(index);
            
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });
        
        document.getElementById('totalFiles').textContent = this.uploadedFiles.length;
        document.getElementById('totalMarkets').textContent = marketSet.size;
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
        
        fileSummary.style.display = 'flex';
        processBtn.style.display = 'inline-block';
        
        this.checkWarnings();
        
        // 파일 리스트 표시 후 아래로 스크롤
        setTimeout(() => {
            const processBtn = document.getElementById('processBtn');
            if (processBtn && processBtn.style.display !== 'none') {
                processBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    },
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    checkWarnings() {
        const oldFiles = this.uploadedFiles.filter(f => !f.isToday);
        const warningBox = document.getElementById('warningBox');
        const processBtn = document.getElementById('processBtn');
        
        if (oldFiles.length > 0) {
            const warningList = document.getElementById('warningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                const date = new Date(file.lastModified).toLocaleDateString('ko-KR');
                li.textContent = `${file.name} (${date})`;
                warningList.appendChild(li);
            });
            
            warningBox.classList.add('show');
            
            if (processBtn) {
                processBtn.disabled = true;
                processBtn.style.opacity = '0.5';
                processBtn.title = '오래된 파일을 제거한 후 진행하세요.';
            }
        } else {
            warningBox.classList.remove('show');
            
            if (processBtn && this.uploadedFiles.length > 0) {
                processBtn.disabled = false;
                processBtn.style.opacity = '1';
                processBtn.title = '';
            }
        }
    },
    
    async processOrders() {
                const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        
        if (todayFiles.length === 0) {
            this.showError('오늘 날짜의 파일이 없습니다.');
            return;
        }
        
        // 로딩 오버레이 생성
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'processingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    width: 80px;
                    height: 80px;
                    border: 8px solid rgba(255, 255, 255, 0.3);
                    border-top: 8px solid #2563eb;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <div style="color: white; font-size: 20px; font-weight: 500; margin-bottom: 10px;">
                    주문 통합 중...
                </div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                    ${todayFiles.length}개 파일 처리 중
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingOverlay);
        
        try {
            // ProductMatching 초기화
            if (this.ProductMatching) {
                await this.ProductMatching.loadProductData();
            }
            
            // 데이터 통합
            const mergedData = await this.mergeOrderData(todayFiles);
            
// 제품 정보 적용 (옵션명으로 통합상품마스터 필드 매칭)
let enrichedData = mergedData;

// ProductMatching 로드 확인
if (!this.ProductMatching) {
    if (parent.window !== window && parent.window.ProductMatching) {
        this.ProductMatching = parent.window.ProductMatching;
    } else if (window.ProductMatching) {
        this.ProductMatching = window.ProductMatching;
    }
}

if (this.ProductMatching) {
    console.log('ProductMatching 적용 시작');
    
    // ProductMatching 데이터 로드 확인
    if (!this.ProductMatching.isLoaded) {
        await this.ProductMatching.loadProductData();
    }
    
    enrichedData = await this.ProductMatching.applyProductInfo(mergedData);
    
    // 출고비용 필드 명시적 처리
    enrichedData.forEach(row => {
        try {
            const optionName = row['옵션명'];
            if (optionName && this.ProductMatching && this.ProductMatching.productData) {
                const productInfo = this.ProductMatching.productData[optionName];
                if (productInfo) {
                    // 출고비용을 안전하게 처리
                    const outboundCost = productInfo['출고비용'] || productInfo.출고비용 || 0;
                    row['출고비용'] = typeof outboundCost === 'string' ? 
                        parseFloat(String(outboundCost).replace(/[^0-9.-]/g, '')) || 0 : 
                        outboundCost || 0;
                }
            }
        } catch (err) {
            console.log(`옵션명 '${row['옵션명']}' 처리 중 오류 (무시):`, err.message);
            row['출고비용'] = row['출고비용'] || 0;
        }
    });
    
    // 통합상품마스터 필드 매칭 검증
    const requiredFields = ['셀러공급가', '출고처', '송장주체', '벤더사', 
                           '발송지명', '발송지주소', '발송지연락처', '출고비용'];
    
    let matchedCount = 0;
    enrichedData.forEach(row => {
        // 최소 하나 이상의 필드가 매칭되었는지 확인
        const hasMatchedField = requiredFields.some(field => 
            row[field] && row[field] !== '' && row[field] !== 0
        );
        if (hasMatchedField) matchedCount++;
    });
    
    console.log(`ProductMatching 결과: ${matchedCount}/${enrichedData.length}개 행에서 통합상품마스터 매칭됨`);
} else {
    console.error('ProductMatching 모듈을 찾을 수 없습니다');
    
    // ProductMatching 없을 때 기본값 설정
    enrichedData.forEach(row => {
        row['셀러공급가'] = row['셀러공급가'] || '';
        row['출고처'] = row['출고처'] || '';
        row['송장주체'] = row['송장주체'] || '';
        row['벤더사'] = row['벤더사'] || '';
        row['발송지명'] = row['발송지명'] || '';
        row['발송지주소'] = row['발송지주소'] || '';
        row['발송지연락처'] = row['발송지연락처'] || '';
        row['출고비용'] = row['출고비용'] || 0;
    });
}
            
// 로컬과 전역 변수 동시 설정
this.processedData = {
    data: enrichedData,
    headers: this.mappingData?.standardFields || Object.keys(enrichedData[0] || {}),
    standardFields: this.mappingData?.standardFields || Object.keys(enrichedData[0] || {}),
    sheetName: new Date().toISOString().slice(0, 10).replace(/-/g, '')
};

// 전역 변수 확실하게 설정
window.processedData = this.processedData;
console.log('window.processedData 설정 완료:', window.processedData);

// 로딩 제거
const overlay = document.getElementById('processingOverlay');
if (overlay) overlay.remove();

this.displayResults();
this.showSuccess(`${enrichedData.length}개 주문 통합 완료`);

// 결과 테이블로 스크롤
setTimeout(() => {
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}, 300);

} catch (error) {
    // 로딩 제거
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.remove();
    
    this.showError('처리 중 오류 발생: ' + error.message);
}
    },
    
    async mergeOrderData(files) {
        const mergedData = [];
        let globalCounter = 0;
        const marketCounters = {};
        
        for (const file of files) {
            const marketName = file.marketName;
            const market = this.mappingData?.markets?.[marketName];
            
            if (!market) continue;
            
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }
            
            file.data.forEach(row => {
                globalCounter++;
                marketCounters[marketName]++;
                
                const mappedRow = {};
                
                // 표준 필드 매핑
                this.mappingData.standardFields.forEach(standardField => {
                    if (standardField === '마켓명') {
                        mappedRow['마켓명'] = marketName;
                    } else if (standardField === '연번') {
                        mappedRow['연번'] = globalCounter;
                    } else if (standardField === '마켓') {
                        const initial = market.initial || marketName.charAt(0);
                        mappedRow['마켓'] = initial + String(marketCounters[marketName]).padStart(3, '0');
                    } else {
                        const sourceField = market.mappings?.[standardField];
                        if (sourceField) {
                            mappedRow[standardField] = row[sourceField] || '';
                        } else {
                            mappedRow[standardField] = '';
                        }
                    }
                });
                
                // 정산예정금액 계산
                if (market.settlementFormula) {
    mappedRow['정산예정금액'] = this.calculateSettlement(mappedRow, market.settlementFormula, marketName);
} else {
    // 정산수식이 없으면 기본값 사용
    mappedRow['정산예정금액'] = mappedRow['상품금액'] || mappedRow['최종결제금액'] || 0;
    console.log(`${marketName}: 정산수식 없음 - 기본값 사용`);
}
                
                if (mappedRow['정산예정금액']) {
    mappedRow['정산예정금액'] = Math.round(mappedRow['정산예정금액']);
}

                mergedData.push(mappedRow);
            });
        }
        
        return mergedData;
    },
    
    calculateSettlement(row, formula, marketName) {
    try {
        if (!formula || formula.trim() === '') {
            console.log(`${marketName}: 정산수식이 없습니다`);
            return 0;
        }
        
        console.log(`${marketName} 원본 정산수식: ${formula}`);
        
        let calculation = formula;
        
        // 엑셀 함수 변환
        calculation = calculation.replace(/ROUND\(/gi, 'Math.round(');
        calculation = calculation.replace(/ABS\(/gi, 'Math.abs(');
        calculation = calculation.replace(/MIN\(/gi, 'Math.min(');
        calculation = calculation.replace(/MAX\(/gi, 'Math.max(');
        
        // 필드명을 값으로 치환
        Object.entries(row).forEach(([fieldName, fieldValue]) => {
            if (calculation.includes(fieldName)) {
                const numValue = typeof fieldValue === 'number' ? 
                    fieldValue : parseFloat(String(fieldValue).replace(/[^0-9.-]/g, '')) || 0;
                calculation = calculation.replace(new RegExp(fieldName, 'g'), numValue);
            }
        });
        
        console.log(`  변환된 계산식: ${calculation}`);
        
        // 계산 실행
        try {
            const result = Function('"use strict"; return (' + calculation + ')')();
            
            // 1원 단위로 반올림하여 정수 변환
            let finalResult = 0;
            if (!isNaN(result)) {
                finalResult = Math.round(result);
            }
            
            console.log(`  계산 결과: ${finalResult} (원본: ${result})`);
            return finalResult;
            
        } catch (evalError) {
            console.error(`  계산 실행 오류: ${evalError.message}`);
            return 0;
        }
        
    } catch (error) {
        console.error(`정산금액 계산 오류 (${marketName}):`, error);
        return 0;
    }
},
    
    
displayResults() {

const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    
    // 사용자 권한 확인
    const userRole = window.currentUser?.role || 'staff';
    const isAdmin = userRole === 'admin';
    
    // 금액 관련 필드 정의
    const amountFields = [
        '셀러공급가', '출고비용', '정산예정금액', '정산대상금액', 
        '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
        '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액',
        '기타지원금할인금', '수수료1', '수수료2'
    ];
    
    // 직원인 경우 금액 필드 제거
    let displayHeaders = this.processedData.headers;
    if (!isAdmin) {
        displayHeaders = this.processedData.headers.filter(h => !amountFields.includes(h));
    }
    
    // 열너비 설정
    const columnWidths = {
        '연번': 50, '마켓명': 100, '마켓': 60, '결제일': 150, '주문번호': 140,
        '상품주문번호': 140, '주문자': 70, '수취인': 70, '수령인': 70,
        '주문자 전화번호': 150, '수취인 전화번호': 150, '수령인 전화번호': 150,
        '주소': 300, '수취인주소': 300, '수령인주소': 300, '배송메세지': 100,
        '배송메시지': 100, '옵션명': 160, '수량': 60, '특이/요청사항': 300,
        '발송요청일': 150, '확인': 160, '셀러': 80, '셀러공급가': 80,
        '출고처': 80, '송장주체': 60, '벤더사': 150, '발송지명': 150,
        '발송지주소': 300, '발송지연락처': 120, '출고비용': 90,
        '정산예정금액': 90, '정산대상금액': 90, '상품금액': 80,
        '최종결제금액': 90, '할인금액': 90, '마켓부담할인금액': 120,
        '판매자할인쿠폰할인': 120, '구매쿠폰적용금액': 120, '쿠폰할인금액': 100,
        '기타지원금할인금': 120, '수수료1': 70, '수수료2': 70,
        '판매아이디': 120, '분리배송 Y/N': 100, '택배비': 80,
        '발송일(송장입력일)': 200, '택배사': 80, '송장번호': 140
    };
    
// 테이블 HTML 직접 생성
    const table = document.getElementById('excelResultTable');
    const totalWidth = this.processedData.headers.reduce((sum, h) => sum + (columnWidths[h] || 100), 0);
    
    // colgroup HTML
    let html = '<colgroup>';
    this.processedData.headers.forEach(h => {
        html += `<col style="width:${columnWidths[h] || 100}px">`;
    });
    html += '</colgroup>';
    
    // thead HTML
    html += '<thead id="excelResultHead"><tr>';
    displayHeaders.forEach(h => {
        html += `<th style="width:${columnWidths[h] || 100}px">${h}</th>`;
    });


    html += '</tr></thead><tbody id="excelResultBody"></tbody>';
    
    // 테이블에 적용
    table.innerHTML = html;
    table.style.tableLayout = 'fixed';
    table.style.width = totalWidth + 'px';
    
    // 변수 재설정
    const thead = document.getElementById('excelResultHead');
    const tbody = document.getElementById('excelResultBody');

        
        // 마켓 순서대로 정렬
if (this.mappingData && this.mappingData.marketOrder && this.mappingData.marketOrder.length > 0) {
    this.processedData.data.sort((a, b) => {
        const marketA = a['마켓명'];
        const marketB = b['마켓명'];
        const ia = this.mappingData.marketOrder.indexOf(marketA);
        const ib = this.mappingData.marketOrder.indexOf(marketB);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return marketA.localeCompare(marketB);
    });
}

// 연번 재할당 (정렬 후)
this.processedData.data.forEach((row, index) => {
    row['연번'] = index + 1;
});

// 바디 생성
tbody.innerHTML = '';
this.processedData.data.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
            
            // 필드별 정렬 설정
const centerAlignFields = ['마켓명', '연번', '결제일', '주문번호', '상품주문번호', '주문자', '수취인', '수령인', '옵션명', '수량', '마켓', '택배사', '송장번호'];
const leftAlignFields = ['주소', '수취인주소', '수령인주소', '배송메세지', '배송메시지', '발송지주소'];
const rightAlignFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '최종결제금액', '할인금액', '택배비'];
const phoneFields = ['주문자전화번호', '수취인전화번호', '수령인전화번호', '주문자 전화번호', '수취인 전화번호', '수령인 전화번호'];

function getAlignment(fieldName) {
        if (rightAlignFields.includes(fieldName)) return 'right';
        if (leftAlignFields.includes(fieldName)) return 'left';
        if (centerAlignFields.includes(fieldName)) return 'center';
        if (phoneFields.includes(fieldName)) return 'center';
        return 'center';
    }

    displayHeaders.forEach((header, colIndex) => {
const td = document.createElement('td');
    let value = row[header] || '';
    
    td.style.width = (columnWidths[header] || 100) + 'px';
    td.style.minWidth = (columnWidths[header] || 100) + 'px';
    td.style.textAlign = getAlignment(header);
    
    // 날짜 포맷팅
    if (header.includes('결제일') || header.includes('발송일') || header.includes('주문일')) {
        if (value) {
            // 날짜 형식 변환 로직
            const dateStr = String(value);
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                value = dateStr;
            } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                const parts = dateStr.split(' ');
                const dateParts = parts[0].split('/');
                const month = dateParts[0].padStart(2, '0');
                const day = dateParts[1].padStart(2, '0');
                let year = dateParts[2];
                if (year.length === 2) year = '20' + year;
                value = `${year}-${month}-${day}` + (parts[1] ? ' ' + parts[1] : '');
            }
        }
    }
    
// 금액 포맷팅 - 모든 금액 관련 필드 처리
const amountFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', 
                      '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액', 
                      '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액', 
                      '기타지원금할인금', '수수료1', '수수료2', '택배비'];

if (amountFields.some(field => header.includes(field))) {
    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
        // 0인 경우 빈 문자열로 처리
        if (numValue === 0) {
            value = '';
        } else {
            value = numValue.toLocaleString('ko-KR');
        }
        td.style.textAlign = 'right';
        td.classList.add('amount-field');
    }
}
    
    // 수량 강조
    if (header === '수량') {
        const quantity = parseInt(value);
        if (quantity >= 2) {
            td.style.color = '#dc3545';
            td.style.fontWeight = '500';
        }
    }
                
// 마켓명 배지 표시
if (header === '마켓명') {
    const marketName = String(value);
    if (this.mappingData?.markets?.[marketName]) {
        const market = this.mappingData.markets[marketName];
        const colorValue = `rgb(${market.color})`;
        const rgb = market.color.split(',').map(Number);
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        const textColor = brightness > 128 ? '#000' : '#fff';
        
        td.innerHTML = `
            <span style="
                display: inline-block;
                padding: 4px 10px;
                background: ${colorValue};
                color: ${textColor};
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            ">${marketName}</span>
        `;
        td.style.textAlign = 'center';
        td.style.background = '#ffffff';
    } else {
        td.textContent = marketName;
        td.style.textAlign = 'center';
    }
}
                

// 옵션명 매칭 상태 표시
if (header === '옵션명') {
    td.textContent = String(value);
    
    // 빈 값도 매칭 실패로 표시
    if (!value || value.trim() === '') {
        row['_matchStatus'] = 'unmatched';
    }
    
    // 매칭 실패 또는 수정된 상태 확인
    if (row['_matchStatus'] === 'unmatched' || row['_matchStatus'] === 'modified') {
        td.classList.add(row['_matchStatus'] === 'unmatched' ? 'unmatched-cell' : 'modified-cell');
        td.classList.add('editable-cell');
        td.contentEditable = true;
        td.style.position = 'relative';
        td.style.paddingRight = '20px';
        
        const originalValue = td.textContent;
        
        td.addEventListener('blur', () => {
            const newValue = td.textContent.trim();
            if (newValue !== originalValue) {
                row['옵션명'] = newValue;
                row['_matchStatus'] = 'modified';
                td.classList.remove('unmatched-cell');
                td.classList.add('modified-cell');
            }
        });
        
        td.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                td.blur();
            }
        });
    } else if (row['_matchStatus'] === 'modified-matched') {
        td.classList.add('modified-matched-cell');
        td.style.background = '#d1fae5';
        td.style.color = '#10b981';
    }
}
                
                // 금액 포맷팅 - 셀러공급가 포함 모든 금액 필드
if (header.includes('금액') || header.includes('공급가') || header === '셀러공급가' || header === '출고비용' || header === '택배비') {
    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue) && value !== '') {
        value = numValue.toLocaleString('ko-KR');
    }
}
                
                
        
        // 기본값 설정 (0은 빈 문자열로)
if (header !== '마켓명' && !td.textContent && !td.innerHTML) {
    // 숫자 0인 경우 빈 셀로 처리
    if (value === 0 || value === '0') {
        td.textContent = '';
    } else {
        td.textContent = String(value);
    }
}
    
    tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
});
},
    
async verifyOptions() {
    if (!this.processedData) {
        this.showError('처리된 주문 데이터가 없습니다. 먼저 주문 통합을 실행하세요.');
        return;
    }
    
    // ProductMatching 확인 및 로드
    if (!this.ProductMatching) {
        this.setupParentReferences();
    }
    
    if (this.ProductMatching && !this.ProductMatching.isLoaded) {
        await this.ProductMatching.loadProductData();
    }
    
    const productData = this.ProductMatching?.productData || window.productData || {};
    
    console.log('사용할 productData 키 개수:', Object.keys(productData).length);
    
    // 통계 변수 초기화
    let matchedCount = 0;           // 처음부터 매칭 성공
    let unmatchedCount = 0;         // 매칭 실패 (수정 안함)
    let modifiedMatchedCount = 0;   // 수정 후 매칭 성공
    let modifiedUnmatchedCount = 0; // 수정 후에도 매칭 실패
    
    // 모든 행 검증
    this.processedData.data.forEach((row) => {
        const optionName = row['옵션명'];
        const previousStatus = row['_matchStatus'];
        
        // 빈 값 처리
        if (!optionName || optionName.trim() === '') {
            if (previousStatus === 'modified') {
                modifiedUnmatchedCount++;
            } else {
                unmatchedCount++;
            }
            row['_matchStatus'] = previousStatus || 'unmatched';
            return;
        }
        
        // 제품 매칭 확인
        const trimmedOption = optionName.trim();
        let matchedProduct = productData[trimmedOption];
        
        // 대소문자 무시 매칭
        if (!matchedProduct) {
            const lowerOption = trimmedOption.toLowerCase();
            for (const [key, value] of Object.entries(productData)) {
                if (key.toLowerCase() === lowerOption) {
                    matchedProduct = value;
                    break;
                }
            }
        }
        
        if (matchedProduct) {
            // 매칭 성공
            if (previousStatus === 'modified' || previousStatus === 'modified-matched') {
                modifiedMatchedCount++;
                row['_matchStatus'] = 'modified-matched';
            } else {
                matchedCount++;
                row['_matchStatus'] = 'matched';
            }
            
            // 제품 정보 업데이트
            row['셀러공급가'] = matchedProduct['셀러공급가'] || row['셀러공급가'] || '';
            row['출고처'] = matchedProduct['출고처'] || row['출고처'] || '';
            row['송장주체'] = matchedProduct['송장주체'] || row['송장주체'] || '';
            row['벤더사'] = matchedProduct['벤더사'] || row['벤더사'] || '';
            row['발송지명'] = matchedProduct['발송지명'] || row['발송지명'] || '';
            row['발송지주소'] = matchedProduct['발송지주소'] || row['발송지주소'] || '';
            row['발송지연락처'] = matchedProduct['발송지연락처'] || row['발송지연락처'] || '';
            row['출고비용'] = matchedProduct['출고비용'] || 0;
        } else {
            // 매칭 실패
            if (previousStatus === 'modified' || previousStatus === 'modified-matched') {
                modifiedUnmatchedCount++;
                row['_matchStatus'] = 'modified';
            } else {
                unmatchedCount++;
                row['_matchStatus'] = 'unmatched';
            }
        }
    });
    
    // 전체 매칭 실패 건수 (수정 여부 관계없이)
    const totalUnmatched = unmatchedCount + modifiedUnmatchedCount;
    const totalMatched = matchedCount + modifiedMatchedCount;
    
    // 결과 표시 업데이트
    this.displayResults();
    
    // 결과 모달
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 500; color: #2563eb;">
            옵션명 검증 결과
        </h3>
        <div style="line-height: 2; font-size: 14px;">
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>전체 주문:</span>
                    <strong>${this.processedData.data.length}건</strong>
                </div>
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 8px 0;">
                <div style="display: flex; justify-content: space-between; color: #10b981;">
                    <span>✓ 전체 매칭 성공:</span>
                    <strong>${totalMatched}건</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #dc3545;">
                    <span>✗ 전체 매칭 실패:</span>
                    <strong>${totalUnmatched}건</strong>
                </div>
            </div>
            
            <div style="padding: 12px; background: #fff8e1; border-radius: 8px;">
                <div style="font-size: 13px; color: #6c757d; margin-bottom: 8px;">상세 내역:</div>
                <div style="font-size: 13px; line-height: 1.8;">
                    <div style="color: #10b981;">• 처음부터 매칭 성공: ${matchedCount}건</div>
                    <div style="color: #dc3545;">• 매칭 실패 (수정 안함): ${unmatchedCount}건</div>
                    ${modifiedMatchedCount > 0 ? `<div style="color: #10b981;">• 수정 후 매칭 성공: ${modifiedMatchedCount}건</div>` : ''}
                    ${modifiedUnmatchedCount > 0 ? `<div style="color: #f59e0b;">• 수정 후에도 실패: ${modifiedUnmatchedCount}건</div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '확인';
    closeButton.style.cssText = `
        margin-top: 20px;
        padding: 10px 24px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
    `;
    
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };
    
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
},


async verifyDuplicate() {
    if (!this.processedData) {
        this.showError('검증할 데이터가 없습니다.');
        return;
    }
    
    // 로딩 표시
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'duplicateCheckLoading';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 20px; margin-bottom: 10px;">중복 검증 중...</div>
            <div style="font-size: 14px;">과거 7일 데이터 조회 중</div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
    
    try {
        // 과거 7일 시트명 생성
        const sheetNames = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            sheetNames.push(`${year}${month}${day}`);
        }
        
        console.log('검증할 시트:', sheetNames);
        
        // 과거 주문 데이터 수집
        const pastOrders = [];
        
        for (const sheetName of sheetNames) {
            try {
                const response = await fetch(`${this.API_BASE}/api/sheets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getOrdersByDate',
                        sheetName: sheetName,
                        spreadsheetId: 'orders'
                    })
                });
                
                const result = await response.json();
                
                if (result.success && result.data && result.data.length > 0) {
                    result.data.forEach(order => {
                        order._sourceDate = sheetName;
                    });
                    pastOrders.push(...result.data);
                    console.log(`${sheetName}: ${result.data.length}건 로드`);
                }
            } catch (error) {
                console.log(`${sheetName} 시트 조회 실패:`, error.message);
            }
        }
        
        console.log(`총 과거 주문: ${pastOrders.length}건`);
        
        // 중복 검증
        let shippedDuplicates = 0;
        let unshippedDuplicates = 0;
        const duplicateDetails = [];
        
        this.processedData.data.forEach((currentOrder) => {
            // 현재 주문 정보
            const currentOrderNo = String(currentOrder['주문번호'] || '').trim();
            const currentRecipient = String(currentOrder['수령인'] || currentOrder['수취인'] || '').trim();
            const currentOption = String(currentOrder['옵션명'] || '').trim();
            const currentQuantity = String(currentOrder['수량'] || '1').trim();
            
            if (!currentOrderNo || !currentRecipient) return;
            
            // 과거 데이터에서 중복 찾기
            const duplicates = pastOrders.filter(pastOrder => {
                const pastOrderNo = String(pastOrder['주문번호'] || '').trim();
                const pastRecipient = String(pastOrder['수령인'] || pastOrder['수취인'] || '').trim();
                const pastOption = String(pastOrder['옵션명'] || '').trim();
                const pastQuantity = String(pastOrder['수량'] || '1').trim();
                
                return currentOrderNo === pastOrderNo && 
                       currentRecipient === pastRecipient &&
                       currentOption === pastOption &&
                       currentQuantity === pastQuantity;
            });
            
            if (duplicates.length > 0) {
                const hasShipped = duplicates.some(d => {
                    const invoice = String(d['송장번호'] || '').trim();
                    return invoice && invoice !== '';
                });
                
                if (hasShipped) {
                    shippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'shipped';
                    
                    const shippedOrder = duplicates.find(d => d['송장번호']);
                    duplicateDetails.push({
                        type: 'shipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        option: currentOption,
                        quantity: currentQuantity,
                        invoice: shippedOrder['송장번호'],
                        sourceDate: shippedOrder['_sourceDate'],
                        carrier: shippedOrder['택배사'] || ''
                    });
                } else {
                    unshippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'unshipped';
                    
                    duplicateDetails.push({
                        type: 'unshipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        option: currentOption,
                        quantity: currentQuantity,
                        sourceDate: duplicates[0]['_sourceDate']
                    });
                }
            } else {
                currentOrder['_duplicateStatus'] = null;
            }
        });
        
        // 로딩 제거
        document.getElementById('duplicateCheckLoading').remove();
        
        // 결과 테이블 업데이트
        this.displayResults();
        
        // 결과 모달 표시
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;
        
        let detailsHtml = '';
        if (duplicateDetails.length > 0) {
            const shippedItems = duplicateDetails.filter(d => d.type === 'shipped');
            const unshippedItems = duplicateDetails.filter(d => d.type === 'unshipped');
            
            if (shippedItems.length > 0) {
                detailsHtml += `
                    <div style="margin-top: 20px;">
                        <h4 style="color: #dc3545; font-size: 14px; margin-bottom: 10px;">
                            ⛔ 이미 발송된 중복 주문 (${shippedItems.length}건)
                        </h4>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px;">
                `;
                
                shippedItems.forEach(item => {
                    detailsHtml += `
                        <div style="margin-bottom: 10px; padding: 8px; background: #fee2e2; border-radius: 4px; font-size: 12px;">
                            <div>주문번호: ${item.orderNo}</div>
                            <div>수령인: ${item.recipient}</div>
                            <div>상품: ${item.option} (${item.quantity}개)</div>
                            <div style="color: #dc3545; font-weight: 500;">
                                송장: ${item.carrier} ${item.invoice} (${item.sourceDate})
                            </div>
                        </div>
                    `;
                });
                detailsHtml += '</div></div>';
            }
            
            if (unshippedItems.length > 0) {
                detailsHtml += `
                    <div style="margin-top: 20px;">
                        <h4 style="color: #f59e0b; font-size: 14px; margin-bottom: 10px;">
                            ⚠️ 미발송 중복 주문 (${unshippedItems.length}건)
                        </h4>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px;">
                `;
                
                unshippedItems.forEach(item => {
                    detailsHtml += `
                        <div style="margin-bottom: 10px; padding: 8px; background: #fff8e1; border-radius: 4px; font-size: 12px;">
                            <div>주문번호: ${item.orderNo}</div>
                            <div>수령인: ${item.recipient}</div>
                            <div>상품: ${item.option} (${item.quantity}개)</div>
                            <div style="color: #f59e0b;">날짜: ${item.sourceDate}</div>
                        </div>
                    `;
                });
                detailsHtml += '</div></div>';
            }
        }
        
        modalContent.innerHTML = `
            <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 500; color: #2563eb;">
                중복발송 검증 결과
            </h3>
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>검증 주문 수:</span>
                    <strong>${this.processedData.data.length}건</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>과거 7일 주문:</span>
                    <strong>${pastOrders.length}건</strong>
                </div>
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 8px 0;">
                ${shippedDuplicates > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #dc3545;">
                        <span>⛔ 발송 완료 중복:</span>
                        <strong>${shippedDuplicates}건 (제거 필요)</strong>
                    </div>
                ` : ''}
                ${unshippedDuplicates > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #f59e0b;">
                        <span>⚠️ 미발송 중복:</span>
                        <strong>${unshippedDuplicates}건 (확인 필요)</strong>
                    </div>
                ` : ''}
                ${shippedDuplicates === 0 && unshippedDuplicates === 0 ? `
                    <div style="color: #10b981; text-align: center; padding: 10px;">
                        ✅ 중복 주문이 없습니다.
                    </div>
                ` : ''}
            </div>
            ${detailsHtml}
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '확인';
        closeButton.style.cssText = `
            margin-top: 20px;
            padding: 10px 24px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
        `;
        
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };
        
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('중복 검증 오류:', error);
        const loading = document.getElementById('duplicateCheckLoading');
        if (loading) loading.remove();
        this.showError('중복 검증 중 오류가 발생했습니다: ' + error.message);
    }
},
    
    openBatchEdit() {
        if (!this.processedData) {
            this.showError('수정할 데이터가 없습니다.');
            return;
        }
        
        const unmatchedOptions = {};
        
        this.processedData.data.forEach(row => {
            if (row['_matchStatus'] === 'unmatched' || row['_matchStatus'] === 'modified') {
                const optionName = row['옵션명'];
                if (!unmatchedOptions[optionName]) {
                    unmatchedOptions[optionName] = 0;
                }
                unmatchedOptions[optionName]++;
            }
        });
        
        const listContainer = document.getElementById('batchEditList');
        listContainer.innerHTML = '';
        
        Object.entries(unmatchedOptions).forEach(([optionName, count]) => {
            const item = document.createElement('div');
            item.className = 'edit-item';
            item.innerHTML = `
                <div class="original-option">${optionName} (${count}개)</div>
                <span>→</span>
                <input type="text" class="replacement-input" placeholder="대체할 옵션명" 
                       data-original="${optionName}"
                       onchange="OrderExcelHandler.onReplacementChange(this)">
            `;
            listContainer.appendChild(item);
        });
        
        document.getElementById('batchEditModal').classList.add('show');
    },
    
    onReplacementChange(input) {
        const original = input.dataset.original;
        const replacement = input.value.trim();
        
        if (replacement) {
            this.batchEditData[original] = replacement;
            input.classList.add('has-value');
            input.closest('.edit-item').classList.add('modified');
        } else {
            delete this.batchEditData[original];
            input.classList.remove('has-value');
            input.closest('.edit-item').classList.remove('modified');
        }
    },
    
    closeBatchEdit() {
        document.getElementById('batchEditModal').classList.remove('show');
        this.batchEditData = {};
    },
    
    async applyBatchEdit() {
        if (Object.keys(this.batchEditData).length === 0) {
            this.showError('수정할 항목이 없습니다.');
            return;
        }
        
        let modifiedCount = 0;
        
        this.processedData.data.forEach(row => {
            const currentOption = row['옵션명'];
            if (this.batchEditData[currentOption]) {
                row['옵션명'] = this.batchEditData[currentOption];
                row['_matchStatus'] = 'modified-matched';
                modifiedCount++;
            }
        });
        
        // 제품 정보 재적용
        if (this.ProductMatching) {
            this.processedData.data = await this.ProductMatching.applyProductInfo(this.processedData.data);
        }
        
        this.displayResults();
        this.showSuccess(`${modifiedCount}개 주문의 옵션명을 수정했습니다.`);
        this.closeBatchEdit();
    },
    
    exportExcel() {
        if (!this.processedData) {
            this.showError('내보낼 데이터가 없습니다.');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(this.processedData.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '주문통합');
        
        const fileName = `주문통합_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showSuccess('엑셀 파일 다운로드 완료');
    },
    
async saveToSheets() {
    if (!this.processedData || !this.processedData.data || this.processedData.data.length === 0) {
        this.showCenterMessage('저장할 데이터가 없습니다. 먼저 주문을 처리해주세요.', 'error');
        return;
    }
    
    // 이미 저장 중인지 확인
    if (window.isSaving) {
        this.showCenterMessage('저장 중입니다. 잠시만 기다려주세요.', 'info');
        return;
    }
    
    window.isSaving = true;
    this.showLoading();
    
try {
    // 한국 시간 기준 날짜 생성 (UTC+9 직접 계산)
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const koreaTime = new Date(utcTime + (kstOffset * 60000));
    
    const year = koreaTime.getFullYear();
    const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getDate()).padStart(2, '0');
    const sheetName = `${year}${month}${day}`;
        
        console.log('저장할 시트명:', sheetName);
        
// 기존 데이터 가져오기
const getResponse = await fetch(`${this.API_BASE}/api/sheets`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'getMarketData',
        useMainSpreadsheet: true,
        sheetName: sheetName
    })
});

const getResult = await getResponse.json();
const existingData = getResult.data || [];
        
        console.log(`기존 데이터: ${existingData.length}건`);
        
        // 중복 체크를 위한 키 생성 함수
const createKey = (row) => {
    // 각 필드를 가져오되, 없으면 빈 문자열로 처리
    const orderNo = row['주문번호'] || '';
    const orderer = row['주문자'] || '';
    const recipient = row['수령인'] || row['수취인'] || '';
    const optionName = row['옵션명'] || '';
    
    // 키 생성 - 주문번호_수령인_옵션명 (주문자 제외)
    // 동일 주문번호라도 옵션명이 다르면 다른 주문으로 처리
    return `${orderNo}_${recipient}_${optionName}`;
};
        
        // 기존 데이터 맵 생성 (키 -> 행 인덱스)
        const existingMap = new Map();
        existingData.forEach((row, index) => {
            const key = createKey(row);
            existingMap.set(key, index);
        });
        
// 신규 및 업데이트 데이터 분류
const updateRows = [];
const newRows = [];
const duplicateKeys = [];

this.processedData.data.forEach(row => {
    const key = createKey(row);
    if (existingMap.has(key)) {
        // 중복 발견
        duplicateKeys.push({
            key: key,
            row: row,
            index: existingMap.get(key)
        });
    } else {
        // 신규
        newRows.push(row);
    }
});

console.log(`중복 ${duplicateKeys.length}건, 신규 ${newRows.length}건 발견`);




// 중복된 항목 상세
if (duplicateKeys.length > 0) {
    console.log('--- 중복 항목 ---');
    duplicateKeys.forEach((d, idx) => {
        console.log(`중복 ${idx + 1}: 주문번호=${d.row['주문번호']}, 수령인=${d.row['수령인'] || d.row['수취인']}, 마켓=${d.row['마켓']}`);
    });
}

// 신규 항목 상세 (처음 5개만)
if (newRows.length > 0) {
    console.log('--- 신규 항목 (최대 5개) ---');
    newRows.slice(0, 5).forEach((row, idx) => {
        const key = createKey(row);
        console.log(`신규 ${idx + 1}: 키=${key}`);
        console.log(`  주문번호=${row['주문번호']}, 수령인=${row['수령인'] || row['수취인']}, 마켓=${row['마켓']}`);
    });
}




console.log('=========================');


// 중복이 있는 경우 사용자에게 확인
if (duplicateKeys.length > 0) {
    const confirmMessage = 
        `📊 중복 확인\n\n` +
        `🔍 중복 발견: ${duplicateKeys.length}건\n` +
        `✅ 신규 추가: ${newRows.length}건\n\n` +
        `📋 중복 주문 상세 (총 ${duplicateKeys.length}건)\n` +
        duplicateKeys.map((d, idx) => {
            const row = d.row;
            return `${idx + 1}. 주문번호: ${row['주문번호'] || '(없음)'}
   마켓명: ${row['마켓명'] || '-'}
   주문자: ${row['주문자'] || '-'}
   수령인: ${row['수령인'] || row['수취인'] || '-'}
   옵션명: ${row['옵션명'] || '-'}`;
        }).join('\n\n') +
        `\n\n중복된 주문을 덮어쓰시겠습니까?`;
    
    // Promise와 함께 컨펌 모달 표시
    const shouldOverwrite = await new Promise((resolve) => {
        this.showConfirmModal(confirmMessage, 
            (overwrite) => resolve({ save: true, overwrite }),  // true=모두저장, false=신규만
            () => resolve({ save: false })  // 취소
        );
    });
    
    if (!shouldOverwrite.save) {
        // 저장 취소
        console.log('사용자가 저장 취소');
        this.hideLoading();
        window.isSaving = false;
        return;
    }
    
    if (shouldOverwrite.overwrite) {
        // 모두 저장 - 덮어쓰기 처리
        duplicateKeys.forEach(({ key, row, index }) => {
            updateRows.push({ index, data: row });
        });
        console.log(`사용자가 모두 저장 선택: 중복 ${duplicateKeys.length}건 덮어쓰기, 신규 ${newRows.length}건 추가`);
    } else {
        // 중복제외 저장 - 신규만 추가
        console.log(`사용자가 중복제외 저장 선택: 신규 ${newRows.length}건만 추가`);
        // updateRows는 비워둠 (덮어쓰기 안함)
    }
}

console.log(`최종 처리: 덮어쓰기 ${updateRows.length}건, 신규 추가 ${newRows.length}건`);
        
// 헤더 행 준비
const headers = this.processedData.headers || this.mappingData.standardFields;

// 전체 데이터 구성 (기존 + 업데이트 + 신규)
const finalData = [...existingData];

// 덮어쓰기 처리
updateRows.forEach(({index, data}) => {
    finalData[index] = data;
});

// 신규 데이터 추가
finalData.push(...newRows);

// 시트 데이터 준비 (헤더 + 데이터)
const values = [headers];
finalData.forEach(row => {
    const rowValues = headers.map(header => {
        const value = row[header];
        return value !== undefined && value !== null ? String(value) : '';
    });
    values.push(rowValues);
});

// 마켓 색상 매핑 준비
const marketColors = {};
if (this.mappingData && this.mappingData.markets) {
    Object.entries(this.mappingData.markets).forEach(([marketName, market]) => {
        if (market.color) {
            const rgb = market.color.split(',').map(Number);
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            marketColors[marketName] = {
                color: market.color,
                textColor: brightness > 128 ? '#000' : '#fff'
            };
        }
    });
}

// API 호출 - 전체 시트 덮어쓰기
const response = await fetch(`${this.API_BASE}/api/sheets`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'saveToSheet',
        sheetName: sheetName,
        values: values,
        marketColors: marketColors,
        spreadsheetId: '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg',
        forceTextColumns: ['수령인', '수취인', '주문자전화번호', '수취인전화번호', '수령인전화번호']
    })
});

const result = await response.json();


if (result.success) {
    // 실제 처리된 건수 계산
    // 실제 처리된 건수 계산
    const duplicateNotSaved = duplicateKeys.length - updateRows.length;
    const totalOrderCount = finalData.length;
    
    // 중복 주문 상세 정보 생성
    let duplicateDetails = '';
    if (duplicateKeys.length > 0) {
        duplicateDetails = `\n📋 중복 주문 상세\n━━━━━━━━━━━━━━━━━━━━\n`;
        duplicateKeys.forEach((d, idx) => {
            const row = d.row;
            duplicateDetails += `${idx + 1}. 주문번호: ${row['주문번호'] || '(없음)'}
   마켓명: ${row['마켓명'] || '-'}
   주문자: ${row['주문자'] || '-'}
   수령인: ${row['수령인'] || row['수취인'] || '-'}
   옵션명: ${row['옵션명'] || '-'}
   상태: ${updateRows.some(u => u.index === d.index) ? '✅ 덮어쓰기됨' : '❌ 제외됨'}\n\n`;
        });
    }

    const message = 
        `📊 처리 결과\n━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ 신규 추가: ${newRows.length}건\n` +
        `🔍 중복 발견: ${duplicateKeys.length}건\n` +
        `  ㄴ 🔄 덮어쓰기: ${updateRows.length}건\n` +
        duplicateDetails +
        `\n📈 최종 현황\n━━━━━━━━━━━━━━━━━━━━\n` +
        `• 처리 전 주문: ${existingData.length}건\n` +
        `• 처리 후 주문: ${result.totalRows || finalData.length - 1}건\n` +
        `• 증가: +${newRows.length}건`;
    
    this.showCenterMessage(message, 'success');
    console.log(message.replace(/\n/g, ' '));
} else {
    console.error('시트 저장 실패:', result.error);
    this.showCenterMessage('시트 저장 실패: ' + (result.error || '알 수 없는 오류'), 'error');
}

// ===== 아래 유지코드 5줄 ===== //
    } catch (error) {
        console.error('저장 중 오류:', error);
        this.showCenterMessage('저장 중 오류 발생: ' + error.message, 'error');
    } finally {
        this.hideLoading();
        window.isSaving = false;
    }
},

// 화면 중앙 메시지 표시 함수 추가
// 화면 중앙 메시지 표시 함수 + 확인 모달 함수 (원본 긴 버전 유지, 중첩 제거)
// OrderExcelHandler 객체의 메서드 레벨에 그대로 붙여넣으세요.

showCenterMessage(message, type, autoClose = false) {
    // 기존 메시지 제거
    const existingMsg = document.getElementById('centerMessageModal');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // 모달 배경
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'centerMessageModal';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // 모달 컨테이너
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #ffffff;
        border-radius: 16px;
        min-width: 800px;
        max-width: 1100px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // 색상 설정
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb'
    };
    const color = colors[type] || colors.info;
    
    // 아이콘과 제목
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    const titles = {
        success: '처리 완료',
        error: '오류 발생',
        info: '알림'
    };
    
    // 메시지 파싱
    const lines = String(message || '').split('\n');
    let processedMessage = '<div style="padding: 24px;">';
    
    let inResultSection = false;
    let inDuplicateSection = false;
    let duplicateItems = [];
    let currentItem = null;
    
    lines.forEach((line, lineIndex) => {
        if (line.includes('처리 결과')) {
            processedMessage += `<h3 style="margin: 20px 0 16px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            processedMessage += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">';
            inResultSection = true;
            inDuplicateSection = false;
        } else if (line.includes('중복 주문 상세')) {
            if (inResultSection) processedMessage += '</div>';
            processedMessage += `<h3 style="margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            inResultSection = false;
            inDuplicateSection = true;
            duplicateItems = [];
            currentItem = null;
        } else if (line.includes('최종 현황')) {
            if (inResultSection) processedMessage += '</div>';
            // 마지막 항목 처리 (CS발송 등)
            if (currentItem && inDuplicateSection) {
                duplicateItems.push(currentItem);
                currentItem = null;
            }
            if (inDuplicateSection && duplicateItems.length > 0) {
    // 10개만 표시, 나머지는 스크롤
    const displayItems = duplicateItems.slice(0, Math.min(10, duplicateItems.length));
    const hasMore = duplicateItems.length > 10;
    
    processedMessage += `
        <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            ${hasMore ? `<div style="padding: 8px; background: #fff8e1; font-size: 12px; text-align: center;">
                총 ${duplicateItems.length}건 중 상위 10건만 표시 (스크롤하여 확인)
            </div>` : ''}
            <div style="max-height: 280px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; min-width: 120px;">주문번호</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                        <th style="padding: 8px 10px; text-align: center; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 90px;">상태</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
                duplicateItems.forEach((item, idx) => {
                    const statusBadge = item.status && item.status.includes('덮어쓰기') ? 
                        '<span style="color: #1d4ed8; font-weight: 500;">🔄 덮어쓰기</span>' : 
                        '<span style="color: #dc2626; font-weight: 500;">❌ 제외</span>';
                    
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    
                    processedMessage += `
                        <tr style="background: ${rowBg};">
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                                ${item.orderNo || '(없음)'}
                            </td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; text-align: center;">${statusBadge}</td>
                        </tr>`;
                });
                
                processedMessage += '</tbody></table></div></div>';
            }
            processedMessage += `<h3 style="margin: 20px 0 16px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            processedMessage += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">';
            inResultSection = true;
            inDuplicateSection = false;
        } else if (line.includes('━━━')) {
            // 구분선 무시
        } else if (line.trim()) {
            if (inResultSection) {
                // 통계 카드
                if (line.includes(':')) {
                    const [label, value] = line.split(':').map(s => s.trim());
                    let cardColor = '#f8f9fa';
                    let textColor = '#495057';
                    
                    if (label.includes('✅') || label.includes('신규')) {
                        cardColor = '#d1fae5';
                        textColor = '#059669';
                    } else if (label.includes('🔄') || label.includes('덮어쓰기')) {
                        cardColor = '#dbeafe';
                        textColor = '#1d4ed8';
                    } else if (label.includes('🔍') || label.includes('중복')) {
                        cardColor = '#fef3c7';
                        textColor = '#d97706';
                    }
                    
                    const cleanLabel = label.replace(/[✅🔄🔍📋📈•ㄴ]/g, '').trim();
                    
                    processedMessage += `
                        <div style="background: ${cardColor}; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">
                                ${cleanLabel}
                            </div>
                            <div style="font-size: 20px; font-weight: 600; color: ${textColor};">
                                ${value}
                            </div>
                        </div>`;
                }
            } else if (inDuplicateSection) {
                // 중복 항목 파싱
                const trimmedLine = line.trim();
                
                if (/^\d+\./.test(trimmedLine)) {
                    // 새 항목 시작
                    if (currentItem) {
                        duplicateItems.push(currentItem);
                    }
                    currentItem = { 
                        num: trimmedLine.match(/^\d+/)[0],
                        orderNo: '',
                        marketName: '',
                        orderer: '',
                        recipient: '',
                        option: '',
                        status: ''
                    };
                    
                    // 같은 줄에 주문번호가 있을 수 있음 - (없음) 처리 포함
                    if (trimmedLine.includes('주문번호:')) {
                        const parts = trimmedLine.split('주문번호:');
                        if (parts[1]) {
                            const orderValue = parts[1].trim().split(/\s{2,}/)[0];
                            // (없음) 또는 빈 값 처리
                            currentItem.orderNo = (orderValue === '(없음)' || !orderValue) ? '(없음)' : orderValue;
                        }
                    }
                } else if (currentItem) {
                    // 현재 항목에 정보 추가
                    if (trimmedLine.includes('주문번호:') && !currentItem.orderNo) {
                        currentItem.orderNo = trimmedLine.split('주문번호:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('마켓명:')) {
                        currentItem.marketName = trimmedLine.split('마켓명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('주문자:')) {
                        currentItem.orderer = trimmedLine.split('주문자:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('수령인:')) {
                        currentItem.recipient = trimmedLine.split('수령인:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('옵션명:')) {
                        currentItem.option = trimmedLine.split('옵션명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('상태:')) {
                        currentItem.status = trimmedLine.split('상태:')[1]?.trim() || '';
                    }
                }
            } else {
                // 일반 텍스트
                processedMessage += `<div style="margin-bottom: 8px; line-height: 1.6;">${line}</div>`;
            }
        }
    });
    
    // 마지막 항목 처리
    if (currentItem && inDuplicateSection) {
        duplicateItems.push(currentItem);
    }
    
    if (inResultSection) processedMessage += '</div>';
    if (inDuplicateSection && duplicateItems.length > 0 && !message.includes('최종 현황')) {
        // 최종 현황이 없는 경우 중복 테이블 생성
        processedMessage += `
            <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <div style="max-height: 300px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead style="position: sticky; top: 0; background: #f8f9fa;">
                            <tr>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; min-width: 120px;">주문번호</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                <th style="padding: 8px 10px; text-align: center; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 90px;">상태</th>
                            </tr>
                        </thead>
                        <tbody>`;
        
        duplicateItems.forEach((item, idx) => {
            const statusBadge = item.status && item.status.includes('덮어쓰기') ? 
                '<span style="color: #1d4ed8; font-weight: 500;">🔄 덮어쓰기</span>' : 
                '<span style="color: #dc2626; font-weight: 500;">❌ 제외</span>';
            
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
            
            processedMessage += `
                <tr style="background: ${rowBg};">
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                        ${item.orderNo || '(없음)'}
                    </td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; text-align: center;">${statusBadge}</td>
                </tr>`;
        });
        
        processedMessage += '</tbody></table></div></div>';
    }
    
    processedMessage += '</div>';
    
    // HTML 구성
    modalContent.innerHTML = `
        <div style="
            padding: 20px 24px;
            background: linear-gradient(135deg, ${color}, ${color}dd);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${icons[type] || icons.info}</span>
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">
                    ${titles[type] || titles.info}
                </h2>
            </div>
            <button onclick="document.getElementById('centerMessageModal').remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
               onmouseout="this.style.background='none'">×</button>
        </div>
        
        <div style="max-height: calc(80vh - 140px); overflow-y: auto;">
            ${processedMessage}
        </div>
        
        <div style="
            padding: 16px 24px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            text-align: right;
        ">
            <button onclick="document.getElementById('centerMessageModal').remove()" style="
                padding: 10px 32px;
                background: ${color};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='0.9'" 
               onmouseout="this.style.opacity='1'">확인</button>
        </div>`;
    
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
    
    // 애니메이션 스타일
    if (!document.getElementById('modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
    
    // 배경 클릭으로 닫기
    modalBackdrop.onclick = (e) => {
        if (e.target === modalBackdrop) modalBackdrop.remove();
    };
    
    // ESC 키로 닫기
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('centerMessageModal');
            if (modal) modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // 자동 닫기
    if (autoClose) {
        setTimeout(() => {
            const modal = document.getElementById('centerMessageModal');
            if (modal) modal.remove();
        }, 1500);
    }
},  // ← showCenterMessage 끝 (콤마 유지)

showConfirmModal(message, onConfirm, onCancel) {
    // 기존 모달 제거
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();
    
    // 모달 배경
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'confirmModal';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // 모달 컨테이너
const modalContent = document.createElement('div');
modalContent.style.cssText = `
    background: #ffffff;
    border-radius: 16px;
    min-width: 700px;
    max-width: 900px;
    width: 80%;
    max-height: 85vh;
    min-height: 500px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // 메시지 파싱
    const lines = String(message || '').split('\n');
    let processedMessage = '<div style="padding: 24px;">';
    let duplicateItems = [];
    let currentItem = null;
    let inDuplicateSection = false;
    
    lines.forEach(line => {
        if (line.includes('📊 중복 확인')) {
            // 통계 정보 추가
            const stats = message.match(/중복 발견: (\d+)건/);
            const newCount = message.match(/신규 추가: (\d+)건/);
            
            processedMessage += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div style="padding: 16px; background: #d1fae5; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 600; color: #10b981;">${newCount ? newCount[1] : '0'}건</div>
                        <div style="font-size: 14px; color: #059669;">신규 주문</div>
                    </div>
                    <div style="padding: 16px; background: #fef3c7; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 600; color: #f59e0b;">${stats ? stats[1] : '0'}건</div>
                        <div style="font-size: 14px; color: #d97706;">중복 주문</div>
                    </div>
                </div>`;
        } else if (line.includes('중복 주문 상세')) {
            processedMessage += `<h3 style="margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            inDuplicateSection = true;
            duplicateItems = [];
            currentItem = null;
        } else if (line.includes('중복된 주문을 덮어쓰시겠습니까')) {
            if (currentItem && inDuplicateSection) {
                duplicateItems.push(currentItem);
                currentItem = null;
            }
            
            if (inDuplicateSection && duplicateItems.length > 0) {
                // 중복 테이블 생성
                processedMessage += `
                    <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <div style="max-height: 250px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문번호</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
// 최대 10개만 표시
const itemsToShow = duplicateItems.slice(0, 10);
const remainingCount = duplicateItems.length - 10;

itemsToShow.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    processedMessage += `
                        <tr style="background: ${rowBg};">
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                                ${item.orderNo || '(없음)'}
                            </td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                        </tr>`;
                });
                
                processedMessage += '</tbody></table>';

// 10개 이상일 경우 추가 메시지
if (remainingCount > 0) {
    processedMessage += `
        <div style="padding: 10px; background: #f8f9fa; text-align: center; border-top: 1px solid #dee2e6;">
            <span style="color: #6c757d; font-size: 12px;">
                ... 외 ${remainingCount}건 더 있음
            </span>
        </div>`;
}

processedMessage += '</div></div>';
            }
            processedMessage += `<div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; text-align: center;">
                <span style="color: #d97706; font-size: 14px; font-weight: 500;">⚠️ ${line}</span>
            </div>`;
            inDuplicateSection = false;
        } else if (line.trim()) {
            if (inDuplicateSection) {
                const trimmedLine = line.trim();
                
                if (/^\d+\./.test(trimmedLine)) {
                    if (currentItem) {
                        duplicateItems.push(currentItem);
                    }
                    currentItem = { 
                        num: trimmedLine.match(/^\d+/)[0],
                        orderNo: '',
                        marketName: '',
                        orderer: '',
                        recipient: '',
                        option: ''
                    };
                    
                    if (trimmedLine.includes('주문번호:')) {
                        const parts = trimmedLine.split('주문번호:');
                        if (parts[1]) {
                            currentItem.orderNo = parts[1].trim().split(/\s{2,}/)[0] || '';
                        }
                    }
                } else if (currentItem) {
                    if (trimmedLine.includes('주문번호:') && !currentItem.orderNo) {
                        currentItem.orderNo = trimmedLine.split('주문번호:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('마켓명:')) {
                        currentItem.marketName = trimmedLine.split('마켓명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('주문자:')) {
                        currentItem.orderer = trimmedLine.split('주문자:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('수령인:')) {
                        currentItem.recipient = trimmedLine.split('수령인:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('옵션명:')) {
                        currentItem.option = trimmedLine.split('옵션명:')[1]?.trim() || '';
                    }
                }
            }
        }
    });
    
    if (currentItem && inDuplicateSection) {
        duplicateItems.push(currentItem);
    }

    processedMessage += '</div>';

    // HTML 구성
    modalContent.innerHTML = `
<div style="
            padding: 20px 24px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">⚠️</span>
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">중복 확인</h2>
            </div>
        </div>
        
        <div style="max-height: calc(70vh - 180px); overflow-y: auto;">
            ${processedMessage}
        </div>
        
        <div style="
            padding: 20px 24px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
        ">
            <div style="margin-bottom: 15px; padding: 12px; background: #fff8e1; border-radius: 8px;">
                <div style="font-size: 14px; color: #495057; line-height: 1.6;">
                    <div style="font-weight: 500; margin-bottom: 8px;">저장 옵션을 선택하세요:</div>
                    <div style="margin-left: 10px;">
                        • <strong>취소</strong>: 저장하지 않고 돌아가기<br>
                        • <strong>중복제외 저장</strong>: 신규 주문만 추가 (중복 건은 무시)<br>
                        • <strong>모두 저장</strong>: 중복은 덮어쓰고 신규는 추가
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button id="confirmCancel" style="
                    padding: 10px 28px;
                    background: #ffffff;
                    color: #495057;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">취소</button>
                <button id="confirmExcludeDuplicate" style="
                    padding: 10px 28px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">중복제외 저장</button>
                <button id="confirmSaveAll" style="
                    padding: 10px 28px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">모두 저장</button>
            </div>
        </div>`;

    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
    
    // 버튼 이벤트
    document.getElementById('confirmSaveAll').onclick = () => {
        modalBackdrop.remove();
        if (onConfirm) onConfirm(true);  // true = 덮어쓰기 포함
    };
    
    document.getElementById('confirmExcludeDuplicate').onclick = () => {
        modalBackdrop.remove();
        if (onConfirm) onConfirm(false);  // false = 신규만
    };
    
    document.getElementById('confirmCancel').onclick = () => {
        modalBackdrop.remove();
        if (onCancel) onCancel();
    };
    
    // 애니메이션 스타일
    if (!document.getElementById('modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
},  // ← showConfirmModal 끝 (콤마 유지)









async resetResults() {
    const confirmed = await modal.confirm('결과를 초기화하시겠습니까?', '초기화');
    if (!confirmed) return;

    this.processedData = null;
    document.getElementById('resultSection').style.display = 'none';
    this.showSuccess('초기화 완료');
},

showError(message) {
    this.showToast(message, 'error');
},

showSuccess(message) {
    this.showToast(message, 'success');
},

showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    // 아이콘 추가
    const icon = type === 'error' ? '❌' : '✅';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
},

showMessage(message, type) {
    if (type === 'error') {
        this.showError(message);
    } else {
        this.showSuccess(message);
    }
},

showLoading() {
    if (window.OrderManage) {
        window.OrderManage.showLoading();
    } else {
        console.log('로딩 중...');
    }
},

hideLoading() {
    if (window.OrderManage) {
        window.OrderManage.hideLoading();
    } else {
        console.log('로딩 완료');
    }
},

fullReset() {
    this.uploadedFiles = [];
    this.processedData = null;
    this.batchEditData = {};
    
    const container = document.getElementById('om-panel-excel');
    if (container) {
        container.innerHTML = '';
        this.render();
        this.setupEventListeners();
    }
    
    console.log('OrderExcelHandler 완전 초기화 완료');
}
};