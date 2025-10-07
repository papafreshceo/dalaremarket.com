window.OrderShippingHandler = {
    currentOrders: [],
    bulkUploadData: [],
    marketFormats: {},
    marketColors: {},
    currentFilter: 'all',
    currentSearch: '',
    
    async init() {
        this.render();
        await this.loadTodayOrders();
        await this.loadMarketFormats();
        await this.loadVendorTemplates();
    },
    
    render() {
        const container = document.getElementById('om-panel-shipping');
        container.innerHTML = `
            <style>
                /* 발송관리 전용 스타일 */
                .shipping-container {
                    padding: 20px;
                    background: #fafafa;
                    min-height: calc(100vh - 200px);
                }

                /* 상단 통계 - 3개 카드 */
                .shipping-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 16px;
                }

                @media (max-width: 768px) {
                    .shipping-stats {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    
                    .stat-card {
                        padding: 12px;
                    }
                    
                    .stat-value {
                        font-size: 18px;
                    }
                }

                .stat-card {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                    margin-bottom: 4px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #212529;
                }

                /* 벤더사별 집계 테이블 */
                .vendor-stats-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .vendor-stats-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                    margin-bottom: 16px;
                }

                .vendor-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .vendor-table th {
                    background: #f8f9fa;
                    padding: 10px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                }

                .vendor-table td {
                    padding: 10px;
                    font-size: 14px;
                    font-weight: 300;
                    color: #212529;
                    border-bottom: 1px solid #f1f3f5;
                }

                .vendor-table .total-row {
                    font-weight: 500;
                    background: #f8f9fa;
                }

                /* 컴팩트 필터 섹션 */
                .filter-section-compact {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 8px 16px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    height: 40px;
                }

                .filter-tags {
                    display: flex;
                    gap: 8px;
                    margin-right: 16px;
                }

                .filter-tag {
                    padding: 4px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 20px;
                    background: #ffffff;
                    color: #6c757d;
                    font-size: 12px;
                    font-weight: 400;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .filter-tag:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                }

                .filter-tag.active {
                    background: #2563eb;
                    color: #ffffff;
                    border-color: #2563eb;
                }

                .filter-tag.active:hover {
                    background: #1d4ed8;
                    border-color: #1d4ed8;
                }
                
                .filter-title-compact {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                    margin: 0;
                    white-space: nowrap;
                }

                .search-box-compact {
                    flex: 1;
                    max-width: 400px;
                    display: flex;
                    align-items: center;
                    position: relative;
                }

                .search-input-compact {
                    width: 100%;
                    padding: 4px 32px 4px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                    height: 28px;
                    transition: all 0.2s;
                }

                .search-input-compact:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
                }

                .search-btn-compact {
                    position: absolute;
                    right: 4px;
                    padding: 4px 8px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #6c757d;
                    transition: all 0.2s;
                }

                .search-btn-compact:hover {
                    color: #2563eb;
                }

                /* 테이블 섹션 */
                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    overflow: hidden;
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

                .btn-action {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #495057;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .btn-action:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                }

                .btn-success {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    background: #10b981;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .btn-success:hover {
                    background: #059669;
                }

                .table-wrapper {
                    overflow-x: auto;
                    height: calc(100vh - 550px);
                    min-height: 400px;
                    max-height: 700px;
                    overflow-y: auto;
                    position: relative;
                }
                
                .shipping-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                .shipping-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }

                .shipping-table th {
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .shipping-table td {
                    padding: 6px 8px;
                    font-size: 12px;
                    font-weight: 300;
                    color: #212529;
                    border-bottom: 1px solid #f1f3f5;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    height: 32px;
                    line-height: 20px;
                }

                /* 송장번호 유무에 따른 행 스타일 */
                .shipping-table tbody tr.has-tracking td {
                    background-color: #f0f3f7 !important;
                }

                /* 호버 효과 */
                .shipping-table tbody tr:hover td {
                    background-color: #b7f7bd !important;
                }

                .vendor-table tbody tr:hover td,
                .preview-table tbody tr:hover td {
                    background-color: #ffe4e6 !important;
                }

                /* 선택된 행 스타일 */
                .shipping-table tbody tr.selected-row td {
                    color: #2563eb !important;
                    font-size: 14px !important;
                    background-color: #e7f3ff !important;
                }

                .shipping-table tbody tr.selected-row:hover td {
                    background-color: #dbeafe !important;
                }

                .checkbox-cell {
                    width: 50px;
                }

                .checkbox-cell input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                /* 입력 필드 스타일 */
                .tracking-input {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 12px;
                }

                .tracking-input:focus {
                    outline: none;
                    border-color: #2563eb;
                }

                .carrier-select {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 12px;
                    background: #ffffff;
                }

                .carrier-select:focus {
                    outline: none;
                    border-color: #2563eb;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    color: #212529;
                    background: #ffffff;
                    transition: all 0.2s;
                }

                .btn-primary {
                    padding: 10px 24px;
                    background: #2563eb;
                    color: #ffffff;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary:hover {
                    background: #1d4ed8;
                }

                .btn-secondary {
                    padding: 10px 24px;
                    background: #ffffff;
                    color: #495057;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-secondary:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                }


                .vendor-excel-btn {
                    padding: 6px 10px;
                    background: #ffffff;
                    border: 1px solid #10b981;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .vendor-excel-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
                }
                
                .vendor-excel-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.4), 
                        transparent);
                    transition: left 0.5s;
                }
                
                .vendor-excel-btn:hover::before {
                    left: 100%;
                }
                
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

            </style>

            <div class="shipping-container">
                <!-- 상단 통계 -->
                <div class="shipping-stats">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #e0e7ff; color: #4f46e5;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="9" x2="15" y2="9"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">전체</div>
                            <div class="stat-value" id="statTotal">0</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #fef3c7; color: #f59e0b;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">상품 준비중</div>
                            <div class="stat-value" id="statPreparing">0</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: #d1fae5; color: #10b981;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">발송완료</div>
                            <div class="stat-value" id="statShipped">0</div>
                        </div>
                    </div>
                </div>

                <!-- 벤더사별 집계 테이블 -->
                <div class="vendor-stats-section">
                    <h3 class="vendor-stats-title">벤더사별 발송 현황</h3>
                    <table class="vendor-table">
                        <thead>
                            <tr>
                                <th>벤더사</th>
                                <th style="text-align: center;">합계</th>
                                <th style="text-align: center;">상품 준비중</th>
                                <th style="text-align: center;">발송완료</th>
                                <th style="text-align: center;">전송파일</th>
                            </tr>
                        </thead>
                        <tbody id="vendorTableBody">
                            <!-- 동적 생성 -->
                        </tbody>
                    </table>
                </div>

                <!-- 필터 섹션 -->
                <div class="filter-section-compact">
                    <h2 class="filter-title-compact">발송 관리</h2>
                    <div class="filter-tags">
                        <button class="filter-tag active" data-filter="all" onclick="OrderShippingHandler.filterByStatus('all')">
                            전체
                        </button>
                        <button class="filter-tag" data-filter="preparing" onclick="OrderShippingHandler.filterByStatus('preparing')">
                            상품 준비중
                        </button>
                        <button class="filter-tag" data-filter="shipped" onclick="OrderShippingHandler.filterByStatus('shipped')">
                            발송완료
                        </button>
                    </div>
                    <div class="search-box-compact">
                        <input type="text" class="search-input-compact" id="searchKeyword" 
                               placeholder="주문번호, 수령인, 송장번호 검색" 
                               onkeyup="OrderShippingHandler.searchShipping(event)">
                        <button class="search-btn-compact" onclick="OrderShippingHandler.searchShipping()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 테이블 섹션 -->
                <div class="table-section">
                    <div class="table-header">
                        <div style="display: flex; align-items: center; flex: 1;">
                            <h3 class="table-title">발송 목록</h3>
                            <div style="margin-left: 100px; display: flex; align-items: center; gap: 8px;">
                                <select id="bulkCarrier" class="filter-select" style="width: 150px;">
                                    <option value="">택배사 일괄선택</option>
                                    <option value="CJ대한통운">CJ대한통운</option>
                                    <option value="한진택배">한진택배</option>
                                    <option value="롯데택배">롯데택배</option>
                                    <option value="우체국택배">우체국택배</option>
                                    <option value="로젠택배">로젠택배</option>
                                </select>
                                <button class="btn-action" onclick="OrderShippingHandler.applyBulkCarrier()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                    적용
                                </button>
                                <button class="btn-action" onclick="OrderShippingHandler.openBulkUploadModal()" style="margin-left: 8px; border: 1px solid #2563eb; color: #2563eb;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    송장일괄등록
                                </button>
                            </div>
                        </div>
                        <div class="table-actions">
                            <button class="btn-success" onclick="OrderShippingHandler.saveTrackingNumbers()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                저장
                            </button>
                            <button class="btn-action" onclick="OrderShippingHandler.openExportModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                내보내기
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="shipping-table" id="shippingTable">
                            <thead id="shippingTableHead">
                                <!-- 동적 생성 -->
                            </thead>
                            <tbody id="shippingTableBody">
                                <!-- 동적 생성 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // 모달들 추가
        this.addModals();
    },

    addModals() {
        // 기존 모달 제거
        ['bulkUploadModal', 'exportModal', 'loading', 'message'].forEach(id => {
            const existing = document.getElementById(id);
            if (existing) existing.remove();
        });

        // 모달 HTML 추가
        const modalsHTML = `
            <!-- 모달 스타일 추가 -->
            <style>
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    justify-content: center;
                    align-items: center;
                }

                .modal.show {
                    display: flex;
                }

                .modal-content {
                    background: #ffffff;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    font-size: 20px;
                    font-weight: 500;
                    color: #212529;
                }

                .btn-close {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #6c757d;
                    transition: all 0.2s;
                }

                .btn-close:hover {
                    color: #212529;
                }

                .modal-body {
                    padding: 24px;
                }

                .modal-footer {
                    padding: 24px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .upload-area {
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .upload-area:hover {
                    border-color: #2563eb;
                    background: #f8f9fa;
                }

                .upload-area.dragover {
                    border-color: #2563eb;
                    background: #e7f3ff;
                }

                .market-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 16px;
                    margin-top: 20px;
                }

                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                .preview-table th {
                    background: #f8f9fa;
                    padding: 8px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    border: 1px solid #dee2e6;
                }

                .preview-table td {
                    padding: 8px;
                    font-size: 12px;
                    border: 1px solid #dee2e6;
                }

                .loading {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 9999;
                }

                .loading.show {
                    display: block;
                }

                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2563eb;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 400;
                    z-index: 10000;
                    display: none;
                }

                .message.show {
                    display: block;
                    animation: slideIn 0.3s ease;
                }

                .message.success {
                    background: #10b981;
                    color: #ffffff;
                }

                .message.error {
                    background: #ef4444;
                    color: #ffffff;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>

            <!-- 일괄 등록 모달 -->
            <div class="modal" id="bulkUploadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">송장번호 일괄 등록</h3>
                        <button class="btn-close" onclick="OrderShippingHandler.closeBulkUploadModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="upload-area" onclick="document.getElementById('bulkFile').click()" 
                             ondrop="OrderShippingHandler.handleDrop(event)" 
                             ondragover="OrderShippingHandler.handleDragOver(event)" 
                             ondragleave="OrderShippingHandler.handleDragLeave(event)">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <p style="margin-top: 12px; color: #6c757d;">엑셀 파일을 드래그하거나 클릭하여 업로드</p>
                            <p style="margin-top: 4px; font-size: 12px; color: #adb5bd;">주문번호와 송장번호가 포함된 엑셀 파일</p>
                        </div>
                        <input type="file" id="bulkFile" accept=".xlsx,.xls" style="display: none;" onchange="OrderShippingHandler.handleBulkFile(event)">
                        
                        <div id="bulkPreview" style="display: none; margin-top: 20px;">
                            <h4 style="font-size: 16px; margin-bottom: 12px;">미리보기</h4>
                            <div id="bulkSummary" style="padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px;"></div>
                            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px;">
                                <table class="preview-table" id="bulkPreviewTable">
                                    <thead>
                                        <tr>
                                            <th>주문번호</th>
                                            <th>택배사</th>
                                            <th>송장번호</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="OrderShippingHandler.closeBulkUploadModal()">취소</button>
                        <button class="btn-primary" onclick="OrderShippingHandler.saveBulkTracking()" id="saveBulkBtn" style="display: none;">저장</button>
                    </div>
                </div>
            </div>

            <!-- 내보내기 모달 -->
            <div class="modal" id="exportModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">마켓별 송장 양식으로 내보내기</h3>
                        <button class="btn-close" onclick="OrderShippingHandler.closeExportModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p style="color: #6c757d; margin-bottom: 20px;">마켓을 선택하면 해당 마켓의 송장 업로드 양식에 맞춰 다운로드됩니다.</p>
                        <button class="btn-primary" onclick="OrderShippingHandler.exportAllMarkets()" style="width: 100%; margin-bottom: 20px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            모든 마켓 한번에 다운로드
                        </button>
                        <div class="market-cards" id="marketCards">
                            <!-- 동적 생성 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 로딩 -->
            <div class="loading" id="loading">
                <div class="spinner"></div>
            </div>

            <!-- 메시지 -->
            <div class="message" id="message"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    },

    // 나머지 메서드들은 기존 shipping-module.html의 함수들을 그대로 가져옴
    async loadTodayOrders() {
        this.showLoading();
        try {
// 한국 시간 기준 (UTC+9 직접 계산)
const now = new Date();
const kstOffset = 9 * 60; // KST는 UTC+9
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const koreaDate = new Date(utcTime + (kstOffset * 60000));

const today = koreaDate.getFullYear() + 
    String(koreaDate.getMonth() + 1).padStart(2, '0') + 
    String(koreaDate.getDate()).padStart(2, '0');

            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: true
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '주문 데이터를 불러올 수 없습니다.');
            }

            this.currentOrders = result.data || [];
            
            if (result.colors) {
                this.marketColors = result.colors;
                window.marketColors = result.colors;
            }
            
            this.updateStatistics();
            this.updateVendorTable();
            this.updateShippingTable();
            
        } catch (error) {
            console.error('주문 로드 오류:', error);
            this.showMessage('주문 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    updateStatistics() {
        const total = this.currentOrders.length;
        const preparing = this.currentOrders.filter(order => !order['송장번호']).length;
        const shipped = this.currentOrders.filter(order => order['송장번호']).length;
        
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statPreparing').textContent = preparing;
        document.getElementById('statShipped').textContent = shipped;
    },

        updateVendorTable() {
        const vendorStats = {};
        
        this.currentOrders.forEach(order => {
            const vendor = order['벤더사'] || '자사';
            if (!vendorStats[vendor]) {
                vendorStats[vendor] = { preparing: 0, shipped: 0 };
            }
            
            if (order['송장번호']) {
                vendorStats[vendor].shipped++;
            } else {
                vendorStats[vendor].preparing++;
            }
        });
        
        const tbody = document.getElementById('vendorTableBody');
        tbody.innerHTML = '';

        let totalPreparing = 0;
        let totalShipped = 0;
        
        Object.entries(vendorStats).forEach(([vendor, stats]) => {
            const row = tbody.insertRow();
            const total = stats.preparing + stats.shipped;
            row.innerHTML = `
                <td>${vendor}</td>
                <td style="text-align: center; font-weight: 500;">${total}</td>
                <td style="text-align: center; color: #f59e0b;">${stats.preparing}</td>
                <td style="text-align: center; color: #10b981;">${stats.shipped}</td>
                <td style="text-align: center;">
                    ${stats.preparing > 0 ? `
                        <button class="vendor-excel-btn" onclick="OrderShippingHandler.downloadVendorExcel('${vendor}')" title="엑셀 다운로드">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <path d="M9 15l2 2 4-4"></path>
                            </svg>
                        </button>
                    ` : '<span style="color: #adb5bd;">-</span>'}
                </td>
            `;

            totalPreparing += stats.preparing;
            totalShipped += stats.shipped;
        });
        
        const totalRow = tbody.insertRow();
        totalRow.className = 'total-row';
        const grandTotal = totalPreparing + totalShipped;
        totalRow.innerHTML = `
            <td>합계</td>
            <td style="text-align: center; font-weight: 600;">${grandTotal}</td>
            <td style="text-align: center; color: #f59e0b; font-weight: 600;">${totalPreparing}</td>
            <td style="text-align: center; color: #10b981; font-weight: 600;">${totalShipped}</td>
            <td style="text-align: center;">-</td>
        `;
    },

    updateShippingTable() {
        const thead = document.getElementById('shippingTableHead');
        const tbody = document.getElementById('shippingTableBody');
        
        // 사용자 권한 확인
        const userRole = window.currentUser?.role || 'staff';
        const isAdmin = userRole === 'admin';
        
        // 금액 관련 필드
        const amountFields = [
            '셀러공급가', '출고비용', '정산예정금액', '정산대상금액', 
            '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
            '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액',
            '기타지원금할인금', '수수료1', '수수료2'
        ];
        
        const columnWidths = {
            '연번': 40,
            '마켓명': 100,
            '마켓': 60,
            '결제일': 140,
            '주문번호': 140,
            '상품주문번호': 140,
            '주문자': 70,
            '수취인': 70,
            '수령인': 70,
            '주문자 전화번호': 150,
            '수취인 전화번호': 150,
            '수령인 전화번호': 150,
            '주소': 500,
            '수취인주소': 300,
            '수령인주소': 300,
            '배송메세지': 150,
            '배송메시지': 150,
            '옵션명': 160,
            '수량': 50,
            '택배사': 100,
            '송장번호': 150
        };
        
        
        
        const addressFields = ['주소', '수취인주소', '수령인주소', '발송지주소', '배송메세지', '배송메시지'];
        
        if (this.currentOrders.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 40px;">오늘 날짜의 주문이 없습니다.</td></tr>';
            return;
        }
        
        const originalHeaders = Object.keys(this.currentOrders[0]);
        
        // 직원이면 금액 필드를 완전히 제거한 헤더 배열 생성
        const headers = originalHeaders.filter(header => {
            // 택배사와 송장번호는 특별 처리
            if (header === '택배사' || header === '송장번호') {
                return false; // 일단 제외, 나중에 추가
            }
            // 직원이고 금액 필드면 제외
            if (!isAdmin && amountFields.some(field => header.includes(field))) {
                return false;
            }
            return true;
        });
        
        // 주문번호 뒤에 택배사, 송장번호 추가
        const orderIndex = headers.indexOf('주문번호');
        if (orderIndex !== -1) {
            headers.splice(orderIndex + 1, 0, '택배사', '송장번호');
        } else {
            // 주문번호가 없으면 끝에 추가
            if (!headers.includes('택배사')) headers.push('택배사');
            if (!headers.includes('송장번호')) headers.push('송장번호');
        }

        let totalWidth = 50;
        headers.forEach(header => {
            const width = columnWidths[header] || 100;
            totalWidth += width;
        });

        const table = document.getElementById('shippingTable');
        if (table) {
            table.style.minWidth = `${totalWidth}px`;
        }
        
        let fixedColIndex = 0;
        const phoneFields = ['수령인 전화번호', '수취인 전화번호', '수령인전화번호', '수취인전화번호'];

        for (let i = 0; i < headers.length; i++) {
            if (phoneFields.includes(headers[i])) {
                fixedColIndex = i + 1;
                break;
            }
        }
        
        let cumulativeWidths = [0, 50];
        headers.forEach(header => {
            const width = columnWidths[header] || 100;
            cumulativeWidths.push(cumulativeWidths[cumulativeWidths.length - 1] + width);
        });
        
        thead.innerHTML = `
            <tr>
                <th class="checkbox-cell" style="position: sticky; left: 0px; z-index: 11; background: #f8f9fa; width: 50px; text-align: center; padding: 8px;">
                    <input type="checkbox" onchange="OrderShippingHandler.toggleSelectAll(this)">
                </th>
                ${headers.map((header, index) => {
                    const width = columnWidths[header] || 100;
                    const colIndex = index + 1;
                    const isFixed = colIndex <= fixedColIndex;
                    const leftPos = cumulativeWidths[colIndex];
                    
                    const fixedStyle = isFixed ? 
                        `position: sticky; left: ${leftPos}px; z-index: 10; background: #f8f9fa;` : '';
                    
                    return `<th style="width: ${width}px; min-width: ${width}px; text-align: center; ${fixedStyle}">${header}</th>`;
                }).join('')}
            </tr>
        `;
        
        tbody.innerHTML = '';
        this.currentOrders.forEach((order, rowIndex) => {
            const row = tbody.insertRow();
            
            const hasTracking = order['송장번호'] && order['송장번호'].trim() !== '';
            const rowBgColor = hasTracking ? '#f0f3f7' : '#ffffff';
            
            row.innerHTML = `
                <td class="checkbox-cell" style="position: sticky; left: 0px; z-index: 6; background: ${rowBgColor}; width: 50px; text-align: center; padding: 8px;">
                    <input type="checkbox" data-index="${rowIndex}">
                </td>
                ${headers.map((header, colIdx) => {
                    const width = columnWidths[header] || 100;
                    const colIndex = colIdx + 1;
                    const isFixed = colIndex <= fixedColIndex;
                    const leftPos = cumulativeWidths[colIndex];
                    
                    const fixedStyle = isFixed ? 
                        `position: sticky; left: ${leftPos}px; z-index: 5; background: ${rowBgColor};` : `background: ${rowBgColor};`;
                    
                    let textAlign = 'center';
                    if (amountFields.includes(header)) {
                        textAlign = 'right';
                    } else if (addressFields.includes(header)) {
                        textAlign = 'left';
                    }
                    
                    let marketBadge = '';
                    if (header === '마켓명' && order[header]) {
                        const marketName = order[header];
                        const colorValue = this.marketColors[marketName] || 'rgb(128,128,128)';
                        
                        const match = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                        let textColor = '#fff';
                        if (match) {
                            const r = parseInt(match[1]);
                            const g = parseInt(match[2]);
                            const b = parseInt(match[3]);
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            textColor = brightness > 128 ? '#000' : '#fff';
                        }
                        
                        marketBadge = `
                            <span style="
                                display: inline-block;
                                padding: 2px 8px;
                                background: ${colorValue};
                                color: ${textColor};
                                border-radius: 4px;
                                font-size: 10px;
                                font-weight: 500;
                                white-space: nowrap;
                                line-height: 1.2;
                            ">${marketName}</span>
                        `;
                    }
                    
                    let displayValue = order[header] || '';
                    if (amountFields.includes(header) && displayValue) {
                        const numValue = parseFloat(String(displayValue).replace(/[^0-9.-]/g, ''));
                        if (!isNaN(numValue)) {
                            displayValue = numValue.toLocaleString('ko-KR');
                        }
                    }
                    
                    if (header === '택배사') {
                        return `<td style="width: ${width}px; min-width: ${width}px; text-align: ${textAlign}; ${fixedStyle}" onclick="OrderShippingHandler.selectRow(${rowIndex})">
                            <select class="carrier-select" data-index="${rowIndex}" style="width: 100%;">
                                <option value="">선택</option>
                                <option value="CJ대한통운" ${order[header] === 'CJ대한통운' ? 'selected' : ''}>CJ대한통운</option>
                                <option value="한진택배" ${order[header] === '한진택배' ? 'selected' : ''}>한진택배</option>
                                <option value="롯데택배" ${order[header] === '롯데택배' ? 'selected' : ''}>롯데택배</option>
                                <option value="우체국택배" ${order[header] === '우체국택배' ? 'selected' : ''}>우체국택배</option>
                                <option value="로젠택배" ${order[header] === '로젠택배' ? 'selected' : ''}>로젠택배</option>
                            </select>
                        </td>`;
                    } else if (header === '송장번호') {
                        const hasTracking = order[header] && order['택배사'];
                        return `<td style="width: ${width}px; min-width: ${width}px; text-align: ${textAlign}; ${fixedStyle}" onclick="OrderShippingHandler.selectRow(${rowIndex})">
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <input type="text" class="tracking-input" data-index="${rowIndex}" value="${order[header] || ''}" style="flex: 1;">
                                ${hasTracking ? `<button onclick="event.stopPropagation(); OrderShippingHandler.checkDeliveryStatus('${order['택배사']}', '${order[header]}', ${rowIndex})" class="btn-action" style="padding: 2px 6px; font-size: 11px;">조회</button>` : ''}
                            </div>
                        </td>`;
                    } else {
                        if (header === '마켓명' && marketBadge) {
                            return `<td style="width: ${width}px; min-width: ${width}px; text-align: center; ${fixedStyle}" 
                                    onclick="OrderShippingHandler.selectRow(${rowIndex})">${marketBadge}</td>`;
                        } else {
                            return `<td style="width: ${width}px; min-width: ${width}px; text-align: ${textAlign}; ${fixedStyle}" 
                                    title="${order[header] || ''}" 
                                    onclick="OrderShippingHandler.selectRow(${rowIndex})">${displayValue}</td>`;
                        }
                    }
                }).join('')}
            `;
            
            if (hasTracking) {
                row.classList.add('has-tracking');
            }
        });
    },

    selectRow(rowIndex) {
        const rows = document.querySelectorAll('#shippingTableBody tr');
        rows.forEach(row => row.classList.remove('selected-row'));
        if (rows[rowIndex]) {
            rows[rowIndex].classList.add('selected-row');
        }
    },

    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('#shippingTableBody input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    },

    applyBulkCarrier() {
        const selectedCarrier = document.getElementById('bulkCarrier').value;
        if (!selectedCarrier) {
            this.showMessage('택배사를 선택해주세요.', 'error');
            return;
        }
        
        const checkedBoxes = document.querySelectorAll('#shippingTableBody input[type="checkbox"]:checked');
        let updatedCount = 0;
        
        checkedBoxes.forEach(checkbox => {
            const index = checkbox.dataset.index;
            const carrierSelect = document.querySelector(`.carrier-select[data-index="${index}"]`);
            if (carrierSelect) {
                carrierSelect.value = selectedCarrier;
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            this.showMessage(`${updatedCount}건에 택배사를 적용했습니다.`, 'success');
        } else {
            this.showMessage('선택된 주문이 없습니다.', 'error');
        }
    },

    async saveTrackingNumbers() {
        const updates = [];
        const overwrites = [];
        
        document.querySelectorAll('.tracking-input').forEach(input => {
            const index = parseInt(input.dataset.index);
            const value = input.value.trim();
            const carrierSelect = document.querySelector(`.carrier-select[data-index="${index}"]`);
            const carrier = carrierSelect ? carrierSelect.value : '';
            
            if (value && carrier) {
                const order = this.currentOrders[index];
                const existingTracking = order['송장번호'];
                const existingCarrier = order['택배사'];
                
                if ((existingTracking && existingTracking !== value) || 
                    (existingCarrier && existingCarrier !== carrier)) {
                    overwrites.push({
                        orderNumber: order['주문번호'],
                        carrier: carrier,
                        trackingNumber: value,
                        oldTracking: existingTracking,
                        oldCarrier: existingCarrier
                    });
                } else if (!existingTracking) {
                    updates.push({
                        orderNumber: order['주문번호'],
                        carrier: carrier,
                        trackingNumber: value
                    });
                }
            }
        });
        
        if (updates.length === 0 && overwrites.length === 0) {
            this.showMessage('저장할 송장번호가 없습니다.', 'error');
            return;
        }
        
        let proceedWithOverwrites = true;
        if (overwrites.length > 0) {
            const message = `${overwrites.length}건의 기존 정보를 변경하시겠습니까?\n\n` + 
                overwrites.slice(0, 5).map(o => {
                    let changeInfo = `주문번호: ${o.orderNumber}\n`;
                    if (o.oldCarrier !== o.carrier) {
                        changeInfo += `택배사: ${o.oldCarrier || '없음'} → ${o.carrier}\n`;
                    }
                    if (o.oldTracking !== o.trackingNumber) {
                        changeInfo += `송장번호: ${o.oldTracking || '없음'} → ${o.trackingNumber}`;
                    }
                    return changeInfo;
                }).join('\n\n') +
                (overwrites.length > 5 ? `\n\n... 외 ${overwrites.length - 5}건` : '');
                
            proceedWithOverwrites = confirm(message);
        }
        
        if (!proceedWithOverwrites) {
            this.showMessage('송장번호 변경이 취소되었습니다.', 'info');
            return;
        }
        
        const allUpdates = [...updates, ...overwrites];
        
        this.showLoading();
        try {
            // 한국 시간 기준 (UTC+9 직접 계산)
const now = new Date();
const kstOffset = 9 * 60; // KST는 UTC+9
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const koreaDate = new Date(utcTime + (kstOffset * 60000));

const today = koreaDate.getFullYear() + 
    String(koreaDate.getMonth() + 1).padStart(2, '0') + 
    String(koreaDate.getDate()).padStart(2, '0');

            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateTracking',
                    sheetName: today,
                    updates: allUpdates
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '송장번호 저장에 실패했습니다.');
            }
            
            let message = '';
            if (updates.length > 0) {
                message += `신규 ${updates.length}건`;
            }
            if (overwrites.length > 0) {
                if (message) message += ', ';
                message += `수정 ${overwrites.length}건`;
            }
            message += '의 송장번호가 저장되었습니다.';
            
            this.showMessage(message, 'success');
            await this.loadTodayOrders();
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showMessage('저장 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    openBulkUploadModal() {
        document.getElementById('bulkUploadModal').classList.add('show');
        document.getElementById('bulkPreview').style.display = 'none';
        document.getElementById('saveBulkBtn').style.display = 'none';
        this.bulkUploadData = [];
    },

    closeBulkUploadModal() {
        document.getElementById('bulkUploadModal').classList.remove('show');
        document.getElementById('bulkFile').value = '';
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
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleBulkFile({ target: { files: files } });
        }
    },

    handleBulkFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                this.bulkUploadData = [];
                
                jsonData.forEach(row => {
                    let orderNumber = '';
                    let carrier = '';
                    let trackingNumber = '';
                    
                    if (row['주문번호'] && row['운송장번호'] && row['택배사']) {
                        orderNumber = String(row['주문번호']).trim();
                        carrier = String(row['택배사']).trim();
                        trackingNumber = String(row['운송장번호']).trim();
                    }
                    else if (row['주문번호'] && row['송장번호']) {
                        orderNumber = String(row['주문번호']).trim();
                        carrier = row['택배사'] || '';
                        trackingNumber = String(row['송장번호']).trim();
                    }
                    else if (row['OrderNumber'] || row['주문 번호'] || row['orderNumber']) {
                        orderNumber = String(row['OrderNumber'] || row['주문 번호'] || row['orderNumber']).trim();
                        trackingNumber = String(row['TrackingNumber'] || row['송장 번호'] || row['trackingNumber'] || row['운송장번호'] || '').trim();
                        carrier = row['Carrier'] || row['택배사'] || row['carrier'] || '';
                    }
                    
                    if (orderNumber && trackingNumber) {
                        this.bulkUploadData.push({
                            orderNumber: orderNumber,
                            carrier: carrier,
                            trackingNumber: trackingNumber
                        });
                    }
                });
                
                if (this.bulkUploadData.length === 0) {
                    this.showMessage('유효한 데이터가 없습니다. 파일 형식을 확인해주세요.', 'error');
                    return;
                }
                
                this.displayBulkPreview();
                
            } catch (error) {
                console.error('파일 파싱 오류:', error);
                this.showMessage('파일을 읽을 수 없습니다.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    },

    displayBulkPreview() {
        if (this.bulkUploadData.length === 0) {
            this.showMessage('유효한 데이터가 없습니다.', 'error');
            return;
        }
        
        document.getElementById('bulkPreview').style.display = 'block';
        document.getElementById('saveBulkBtn').style.display = 'inline-flex';
        
        const matchedOrders = [];
        const unmatchedTrackings = [];
        
        this.bulkUploadData.forEach(uploadItem => {
            const matchedOrder = this.currentOrders.find(order => 
                order['주문번호'] === uploadItem.orderNumber
            );
            
            if (matchedOrder) {
                matchedOrders.push({
                    marketName: matchedOrder['마켓명'] || '-',
                    orderNumber: uploadItem.orderNumber,
                    trackingNumber: uploadItem.trackingNumber,
                    carrier: uploadItem.carrier
                });
            } else {
                unmatchedTrackings.push(uploadItem);
            }
        });
        
        document.getElementById('bulkSummary').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div>
                    <span style="color: #6c757d; font-size: 12px;">업로드 송장</span>
                    <div style="font-size: 18px; font-weight: 600; color: #2563eb;">${this.bulkUploadData.length}건</div>
                </div>
                <div>
                    <span style="color: #6c757d; font-size: 12px;">매칭 성공</span>
                    <div style="font-size: 18px; font-weight: 600; color: #10b981;">${matchedOrders.length}건</div>
                </div>
                <div>
                    <span style="color: #6c757d; font-size: 12px;">매칭 실패</span>
                    <div style="font-size: 18px; font-weight: 600; color: #ef4444;">${unmatchedTrackings.length}건</div>
                </div>
            </div>
        `;
        
        document.querySelector('#bulkPreviewTable thead').innerHTML = `
            <tr>
                <th style="width: 100px;">마켓명</th>
                <th style="width: 150px;">주문번호</th>
                <th style="width: 150px;">송장번호</th>
            </tr>
        `;
        
        const tbody = document.querySelector('#bulkPreviewTable tbody');
        tbody.innerHTML = '';
        
        if (matchedOrders.length > 0) {
            matchedOrders.forEach(item => {
                const row = tbody.insertRow();
                
                const marketColor = this.marketColors[item.marketName] || 'rgb(128,128,128)';
                let textColor = '#fff';
                const match = marketColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                    const r = parseInt(match[1]);
                    const g = parseInt(match[2]);
                    const b = parseInt(match[3]);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    textColor = brightness > 128 ? '#000' : '#fff';
                }
                
                row.innerHTML = `
                    <td>
                        <span style="
                            display: inline-block;
                            padding: 2px 8px;
                            background: ${marketColor};
                            color: ${textColor};
                            border-radius: 4px;
                            font-size: 11px;
                            font-weight: 600;
                        ">${item.marketName}</span>
                    </td>
                    <td>${item.orderNumber}</td>
                    <td>${item.trackingNumber}</td>
                `;
            });
        } else {
            const row = tbody.insertRow();
            row.innerHTML = `<td colspan="3" style="text-align: center; padding: 20px; color: #6c757d;">매칭된 주문이 없습니다.</td>`;
        }
        
        if (unmatchedTrackings.length > 0) {
            const unmatchedInfo = document.createElement('div');
            unmatchedInfo.style.marginTop = '20px';
            unmatchedInfo.innerHTML = `
                <h4 style="font-size: 14px; color: #ef4444; margin-bottom: 8px;">
                    매칭 실패 (${unmatchedTrackings.length}건) - 주문번호를 찾을 수 없음
                </h4>
                <div style="max-height: 100px; overflow-y: auto; background: #fef2f2; padding: 8px; border-radius: 4px; font-size: 12px; color: #991b1b;">
                    ${unmatchedTrackings.map(item => `${item.orderNumber} (송장: ${item.trackingNumber})`).join(', ')}
                </div>
            `;
            
            const previewDiv = document.getElementById('bulkPreview');
            const existingUnmatched = previewDiv.querySelector('.unmatched-info');
            if (existingUnmatched) {
                existingUnmatched.remove();
            }
            unmatchedInfo.className = 'unmatched-info';
            previewDiv.appendChild(unmatchedInfo);
        }
    },

    async saveBulkTracking() {
        if (this.bulkUploadData.length === 0) return;
        
        const matchedUpdates = this.bulkUploadData.filter(uploadItem => {
            return this.currentOrders.some(order => 
                order['주문번호'] === uploadItem.orderNumber
            );
        });
        
        if (matchedUpdates.length === 0) {
            this.showMessage('매칭된 주문이 없습니다.', 'error');
            return;
        }
        
        this.showLoading();
        try {
            // 한국 시간 기준 (UTC+9 직접 계산)
const now = new Date();
const kstOffset = 9 * 60; // KST는 UTC+9
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const koreaDate = new Date(utcTime + (kstOffset * 60000));

const today = koreaDate.getFullYear() + 
    String(koreaDate.getMonth() + 1).padStart(2, '0') + 
    String(koreaDate.getDate()).padStart(2, '0');

            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateTracking',
                    sheetName: today,
                    updates: matchedUpdates
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '송장번호 저장에 실패했습니다.');
            }
            
            const actualUpdated = result.updated || matchedUpdates.length;
            const unmatchedCount = this.bulkUploadData.length - matchedUpdates.length;
            
            let message = `${actualUpdated}건의 송장번호가 등록되었습니다.`;
            if (unmatchedCount > 0) {
                message += ` (매칭 실패: ${unmatchedCount}건)`;
            }
            
            this.showMessage(message, 'success');
            this.closeBulkUploadModal();
            await this.loadTodayOrders();
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showMessage('저장 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    async loadMarketFormats() {
        try {
            const marketResponse = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: false
                })
            });
            
            const marketData = await marketResponse.json();
            
            this.marketFormats = {
                '스마트스토어': ['상품주문번호', '배송방법', '택배사', '송장번호'],
                '쿠팡': ['번호', '주문번호', '택배사', '운송장번호', '분리배송 Y/N'],
                'esm': ['판매아이디', '주문번호', '택배사', '운송장/등기번호'],
                '토스': ['주문번호', '택배사코드', '송장번호'],
                '올웨이즈': ['주문아이디', '택배사', '운송장번호'],
                '11번가': ['주문번호', '배송방법', '택배사코드', '송장/등기번호'],
                '달래마켓': ['주문번호', '택배사', '송장번호'],
                '카카오': ['주문번호', '배송방법', '택배사코드', '송장번호']
            };
            
            if (marketData.success) {
                window.marketList = marketData.markets || Object.keys(this.marketFormats);
                window.marketColors = marketData.colors || {};
                this.marketColors = marketData.colors || {};
            }
        } catch (error) {
            console.error('마켓 정보 로드 오류:', error);
            window.marketList = Object.keys(this.marketFormats);
        }
    },

async loadVendorTemplates() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getVendorTemplates',
                    range: '벤더사템플릿!A:Z'
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.vendorTemplates = this.parseVendorTemplates(result.data);
                console.log('벤더사 템플릿 로드 성공:', this.vendorTemplates);
            }
        } catch (error) {
            console.error('벤더사 템플릿 로드 오류:', error);
        }
    },
    
        parseVendorTemplates(data) {
        const templates = {};
        
        if (!data || data.length < 3) return templates;
        
        // 짝수 행(2, 4, 6...)은 벤더사 정보와 헤더
        // 홀수 행(3, 5, 7...)은 표준필드 매핑
        for (let i = 1; i < data.length; i += 2) {
            const vendorRow = data[i];
            const mappingRow = data[i + 1];
            
            if (!vendorRow || !mappingRow) continue;
            
            const vendorName = vendorRow[0]; // A열: 벤더사명
            if (!vendorName) continue;
            
            templates[vendorName] = {
                fileName: vendorRow[1] || '발송_{날짜}.xlsx', // B열: 파일명형식
                extension: vendorRow[2] || 'xlsx', // C열: 파일확장자
                encoding: vendorRow[3] || 'UTF-8', // D열: 인코딩
                delimiter: '', // 구분자는 없음
                hasHeader: true,
                fixedValues: {},
                fieldMapping: {}
            };
            
            // F열부터 헤더와 표준필드 매핑
            for (let j = 5; j < vendorRow.length; j++) {
                const headerField = vendorRow[j]; // 벤더사 헤더 필드
                const standardField = mappingRow[j]; // 표준필드
                
                if (!headerField) continue;
                
                // (지정) 표시가 있는 필드는 고정값으로 처리
                if (headerField.includes('(지정)')) {
                    const cleanField = headerField.replace('(지정)', '').trim();
                    // 고정값은 표준필드 행에 있음
                    if (standardField) {
                        templates[vendorName].fixedValues[cleanField] = standardField;
                    }
                } else {
                    // 일반 필드 매핑
                    if (standardField) {
                        templates[vendorName].fieldMapping[headerField] = standardField;
                    }
                }
            }
        }
        
        console.log('파싱된 벤더사 템플릿:', templates);
        return templates;
    },
    
    async downloadVendorExcel(vendorName) {
        this.showLoading();
        try {
            // 템플릿이 없으면 먼저 로드
            if (!this.vendorTemplates || Object.keys(this.vendorTemplates).length === 0) {
                await this.loadVendorTemplates();
            }
            
            const template = this.vendorTemplates[vendorName];
            if (!template) {
                this.showMessage(`${vendorName}의 템플릿 정보가 없습니다.`, 'error');
                return;
            }
            
            // 미발송 주문 필터링
            const unshippedOrders = this.currentOrders.filter(order => 
                order['벤더사'] === vendorName && !order['송장번호']
            );
            
            if (unshippedOrders.length === 0) {
                this.showMessage(`${vendorName}의 미발송 주문이 없습니다.`, 'error');
                return;
            }
            
            // 엑셀 데이터 생성
            const exportData = this.mapVendorData(unshippedOrders, template);
            
            // 엑셀 파일 생성 (헤더 포함)
            const headers = Object.keys(exportData[0] || {});
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // 열 너비 자동 조정
            const colWidths = [];
            headers.forEach((header, idx) => {
                let maxWidth = header.length;
                exportData.forEach(row => {
                    const cellValue = String(row[header] || '');
                    if (cellValue.length > maxWidth) {
                        maxWidth = cellValue.length;
                    }
                });
                // 최소 8, 최대 50 너비로 제한
                colWidths.push({ wch: Math.min(Math.max(maxWidth + 2, 8), 50) });
            });
            ws['!cols'] = colWidths;
            
            // 범위 설정
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // 스타일 적용
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    
                    if (!ws[cellAddress]) {
                        ws[cellAddress] = { t: 's', v: '' };
                    }
                    
                    if (!ws[cellAddress].s) {
                        ws[cellAddress].s = {};
                    }
                    
                    // 헤더 행 (첫 번째 행)
                    if (R === 0) {
                        ws[cellAddress].s = {
                            fill: {
                                patternType: 'solid',
                                fgColor: { rgb: '87CEEB' } // 하늘색
                            },
                            alignment: {
                                horizontal: 'center',
                                vertical: 'center'
                            },
                            font: {
                                bold: true,
                                color: { rgb: '000000' }
                            },
                            border: {
                                top: { style: 'thin', color: { rgb: '000000' } },
                                left: { style: 'thin', color: { rgb: '000000' } },
                                bottom: { style: 'thin', color: { rgb: '000000' } },
                                right: { style: 'thin', color: { rgb: '000000' } }
                            }
                        };
                    } else {
                        // 데이터 행
                        const header = headers[C];
                        const cellValue = exportData[R - 1][header];
                        
                        // 기본 스타일
                        ws[cellAddress].s = {
                            alignment: {
                                vertical: 'center'
                            },
                            border: {
                                top: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                left: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                right: { style: 'thin', color: { rgb: 'D3D3D3' } }
                            }
                        };
                        
                        // 수량 필드 처리
                        if (header === '수량' || header.includes('수량') || header === '내품수량1' || header === '상품수량') {
                            ws[cellAddress].s.alignment.horizontal = 'center';
                            
                            const quantity = parseInt(cellValue);
                            if (quantity >= 2) {
                                ws[cellAddress].s.fill = {
                                    patternType: 'solid',
                                    fgColor: { rgb: 'FFB6C1' } // 분홍색
                                };
                            }
                        }
                    }
                }
            }
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '발송처리');
            
            // 파일명 생성
            const today = new Date();
            const dateStr = today.getFullYear() + 
                           String(today.getMonth() + 1).padStart(2, '0') + 
                           String(today.getDate()).padStart(2, '0');
            const fileName = template.fileName.replace('{날짜}', dateStr);
            
            // 다운로드 (스타일 포함)
            XLSX.writeFile(wb, fileName, { 
                bookType: 'xlsx',
                bookSST: false,
                type: 'binary',
                cellStyles: true
            });
            
            this.showMessage(`${vendorName} 발송파일이 다운로드되었습니다. (${unshippedOrders.length}건)`, 'success');
            
        } catch (error) {
            console.error('벤더사 엑셀 다운로드 오류:', error);
            this.showMessage('파일 다운로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },
    
    mapVendorData(orders, template) {
        return orders.map(order => {
            const row = {};
            
            // 고정값 설정
            Object.entries(template.fixedValues).forEach(([field, value]) => {
                row[field.replace('(지정)', '')] = value;
            });
            
            // 필드 매핑
            Object.entries(template.fieldMapping).forEach(([targetField, sourceField]) => {
                if (sourceField && order[sourceField]) {
                    row[targetField] = order[sourceField];
                } else {
                    row[targetField] = '';
                }
            });
            
            return row;
        });
    },

    openExportModal() {
        document.getElementById('exportModal').classList.add('show');
        
        const container = document.getElementById('marketCards');
        container.innerHTML = '';
        
        const markets = window.marketList || ['쿠팡', '네이버', '11번가', '지마켓', '옥션'];
        const colors = window.marketColors || {};
        
        markets.forEach(market => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.onclick = () => this.exportByMarket(market);
            
            const marketColor = colors[market] || 'rgb(37, 99, 235)';
            
            let textColor = '#fff';
            const match = marketColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                textColor = brightness > 128 ? '#000' : '#fff';
            }
            
            card.innerHTML = `
                <div style="
                    padding: 12px 16px;
                    background: ${marketColor};
                    color: ${textColor};
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                    ${market}
                </div>
            `;
            container.appendChild(card);
        });
    },

    closeExportModal() {
        document.getElementById('exportModal').classList.remove('show');
    },

    async exportByMarket(marketName) {
        // XLSX 라이브러리 확인
        if (typeof XLSX === 'undefined') {
            this.showMessage('엑셀 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.', 'info');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                this.showMessage('엑셀 라이브러리가 로드되었습니다. 다시 시도해주세요.', 'success');
            };
            document.head.appendChild(script);
            return;
        }
        
        this.showLoading();
        try {
            const marketOrders = this.currentOrders.filter(order => order['마켓명'] === marketName);
            
            if (marketOrders.length === 0) {
                this.showMessage(`${marketName}의 주문이 없습니다.`, 'error');
                this.hideLoading();
                return;
            }
            
            const format = this.marketFormats[marketName] || [];
            const exportData = marketOrders.map((order, index) => {
                const row = {};
                
                if (marketName === '스마트스토어') {
                    row['상품주문번호'] = order['상품주문번호'] || order['주문번호'];
                    row['배송방법'] = '택배';
                    row['택배사'] = order['택배사'] || '';
                    row['송장번호'] = order['송장번호'] || '';
                } else if (marketName === '쿠팡') {
                    row['번호'] = index + 1;
                    row['주문번호'] = order['주문번호'];
                    row['택배사'] = order['택배사'] || '';
                    row['운송장번호'] = order['송장번호'] || '';
                    row['분리배송 Y/N'] = 'N';
                } else if (marketName === 'esm' || marketName === 'ESM') {
                    row['판매아이디'] = order['판매아이디'] || '';
                    row['주문번호'] = order['주문번호'];
                    row['택배사'] = order['택배사'] || '';
                    row['운송장/등기번호'] = order['송장번호'] || '';
                } else if (marketName === '토스') {
                    row['주문번호'] = order['주문번호'];
                    row['택배사코드'] = this.getCarrierCode(order['택배사']);
                    row['송장번호'] = order['송장번호'] || '';
                } else if (marketName === '올웨이즈') {
                    row['주문아이디'] = order['주문번호'];
                    row['택배사'] = order['택배사'] || '';
                    row['운송장번호'] = order['송장번호'] || '';
                } else if (marketName === '11번가') {
                    row['주문번호'] = order['주문번호'];
                    row['배송방법'] = '택배';
                    row['택배사코드'] = this.getCarrierCode(order['택배사']);
                    row['송장/등기번호'] = order['송장번호'] || '';
                } else {
                    row['주문번호'] = order['주문번호'];
                    row['택배사'] = order['택배사'] || '';
                    row['송장번호'] = order['송장번호'] || '';
                }
                
                return row;
            });

            exportData.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (key.includes('송장') || key.includes('운송장')) {
                        if (row[key] === '-' || row[key] === '') {
                            row[key] = '';
                        } else if (row[key]) {
                            row[key] = "'" + String(row[key]).replace(/^'/, '');
                        }
                    }
                });
            });
            
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '발송처리');
            
            const today = new Date();
            const dateStr = today.getFullYear() + 
                           String(today.getMonth() + 1).padStart(2, '0') + 
                           String(today.getDate()).padStart(2, '0');
            
            XLSX.writeFile(wb, `(송장등록)_${marketName}_${dateStr}.xlsx`);
            
            this.showMessage(`${marketName} 송장 파일이 다운로드되었습니다.`, 'success');
            this.closeExportModal();
            
        } catch (error) {
            console.error('내보내기 오류:', error);
            this.showMessage('내보내기 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    async exportAllMarkets() {
        this.showLoading();
        try {
            const marketsInOrders = [...new Set(this.currentOrders.map(order => order['마켓명']).filter(market => market))];
            
            if (marketsInOrders.length === 0) {
                this.showMessage('발송 목록에 주문이 없습니다.', 'error');
                this.hideLoading();
                return;
            }
            
            const today = new Date();
            const dateStr = today.getFullYear() + 
                           String(today.getMonth() + 1).padStart(2, '0') + 
                           String(today.getDate()).padStart(2, '0');
            
            let successCount = 0;
            
            for (const marketName of marketsInOrders) {
                const marketOrders = this.currentOrders.filter(order => order['마켓명'] === marketName);
                
                if (marketOrders.length === 0) continue;
                
                const exportData = marketOrders.map((order, index) => {
                    const row = {};
                    
                    if (marketName === '스마트스토어') {
                        row['상품주문번호'] = order['상품주문번호'] || order['주문번호'];
                        row['배송방법'] = '택배';
                        row['택배사'] = order['택배사'] || '';
                        row['송장번호'] = order['송장번호'] || '';
                    } else if (marketName === '쿠팡') {
                        row['번호'] = index + 1;
                        row['주문번호'] = order['주문번호'];
                        row['택배사'] = order['택배사'] || '';
                        row['운송장번호'] = order['송장번호'] || '';
                        row['분리배송 Y/N'] = 'N';
                    } else {
                        row['주문번호'] = order['주문번호'];
                        row['택배사'] = order['택배사'] || '';
                        row['송장번호'] = order['송장번호'] || '';
                    }
                    
                    return row;
                });
                
                exportData.forEach(row => {
                    Object.keys(row).forEach(key => {
                        if (key.includes('송장') || key.includes('운송장')) {
                            if (row[key] === '-' || row[key] === '') {
                                row[key] = '';
                            } else if (row[key]) {
                                row[key] = "'" + String(row[key]).replace(/^'/, '');
                            }
                        }
                    });
                });
                
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '발송처리');
                
                XLSX.writeFile(wb, `(송장등록)_${marketName}_${dateStr}.xlsx`);
                successCount++;
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            this.showMessage(`${successCount}개 마켓의 송장 파일이 다운로드되었습니다.`, 'success');
            this.closeExportModal();
            
        } catch (error) {
            console.error('일괄 내보내기 오류:', error);
            this.showMessage('일괄 다운로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    getCarrierCode(carrierName) {
        const codes = {
            'CJ대한통운': '04',
            '한진택배': '05',
            '롯데택배': '08',
            '우체국택배': '01',
            '로젠택배': '06'
        };
        return codes[carrierName] || carrierName;
    },

    searchShipping(event) {
        if (event && event.type === 'keyup' && event.key !== 'Enter') {
            return;
        }
        
        this.currentSearch = document.getElementById('searchKeyword').value;
        this.applyFilters();
    },

    filterByStatus(status) {
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        document.querySelector(`[data-filter="${status}"]`).classList.add('active');
        
        this.currentFilter = status;
        this.applyFilters();
    },

    applyFilters() {
        const rows = document.querySelectorAll('#shippingTableBody tr');
        
        rows.forEach(row => {
            const trackingInput = row.querySelector('.tracking-input');
            const hasTracking = trackingInput && trackingInput.value.trim() !== '';
            
            let statusMatch = true;
            if (this.currentFilter === 'preparing') {
                statusMatch = !hasTracking;
            } else if (this.currentFilter === 'shipped') {
                statusMatch = hasTracking;
            }
            
            let searchMatch = true;
            if (this.currentSearch) {
                const text = row.textContent.toLowerCase();
                searchMatch = text.includes(this.currentSearch.toLowerCase());
            }
            
            if (statusMatch && searchMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    async checkDeliveryStatus(carrier, trackingNumber, index) {
        if (!carrier || !trackingNumber) {
            this.showMessage('택배사와 송장번호가 필요합니다.', 'error');
            return;
        }
        
        this.showLoading();
        try {
            const response = await fetch('/api/delivery-tracking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: carrier,
                    trackingNumber: trackingNumber
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '조회 실패');
            }
            
            this.showDeliveryModal(data, carrier, trackingNumber);
            
        } catch (error) {
            console.error('배송 조회 오류:', error);
            this.showMessage(error.message || '배송 정보를 조회할 수 없습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    showDeliveryModal(data, carrier, trackingNumber) {
        const existingModal = document.getElementById('deliveryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'deliveryModal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">배송 추적 정보</h3>
                    <button class="btn-close" onclick="this.closest('.modal').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">택배사</span>
                                <div style="font-weight: 500;">${carrier}</div>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">송장번호</span>
                                <div style="font-weight: 500;">${trackingNumber}</div>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">보낸사람</span>
                                <div style="font-weight: 500;">${data.senderName || '-'}</div>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">받는사람</span>
                                <div style="font-weight: 500;">${data.receiverName || '-'}</div>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">상품명</span>
                                <div style="font-weight: 500;">${data.itemName || '-'}</div>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-size: 12px;">배송상태</span>
                                <div style="font-weight: 600; color: ${data.complete ? '#10b981' : '#f59e0b'};">
                                    ${data.status || '조회중'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">배송 추적 내역</h4>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    <th style="width: 140px;">시간</th>
                                    <th style="width: 150px;">현재 위치</th>
                                    <th>배송 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.trackingDetails && data.trackingDetails.length > 0 ? 
                                    data.trackingDetails.map(detail => `
                                        <tr>
                                            <td>${detail.timeString || ''}</td>
                                            <td>${detail.where || ''}</td>
                                            <td>${detail.kind || ''}</td>
                                        </tr>
                                    `).join('') : 
                                    '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #6c757d;">배송 정보가 없습니다.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showLoading() {
        document.getElementById('loading').classList.add('show');
    },

    hideLoading() {
        document.getElementById('loading').classList.remove('show');
    },

    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type} show`;
        
        setTimeout(() => {
            message.classList.remove('show');
        }, 3000);
    },
    
    // OrderShippingHandler용 fullReset
    fullReset() {
        // 모든 데이터 초기화
        this.currentOrders = [];
        this.bulkUploadData = [];
        this.marketFormats = {};
        this.marketColors = {};
        this.currentFilter = 'all';
        this.currentSearch = '';
        
        // DOM 완전 재렌더링
        const container = document.getElementById('om-panel-shipping');
        if (container) {
            container.innerHTML = '';
            this.render();
            this.loadTodayOrders();
            this.loadMarketFormats();
        }
        
        console.log('OrderShippingHandler 완전 초기화 완료');
    }
};