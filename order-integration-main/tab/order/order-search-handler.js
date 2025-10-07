window.OrderSearchHandler = {
    currentOrders: [],
    marketColors: {},
    tableHeaders: [],
    dateType: 'payment',
    currentCsOrder: null,
    columnWidths: {
        '연번': 50,
        '마켓명': 100,
        '마켓': 60,
        '결제일': 150,
        '주문번호': 140,
        '상품주문번호': 140,
        '주문자': 70,
        '수취인': 70,
        '수령인': 70,
        '주문자 전화번호': 150,
        '수취인 전화번호': 150,
        '수령인 전화번호': 150,
        '주소': 300,
        '수취인주소': 300,
        '수령인주소': 300,
        '배송메세지': 100,
        '배송메시지': 100,
        '옵션명': 160,
        '수량': 60,
        '확인': 160,
        '셀러': 80,
        '셀러공급가': 70,
        '출고처': 80,
        '송장주체': 60,
        '벤더사': 100,
        '발송지명': 100,
        '발송지주소': 300,
        '발송지연락처': 120,
        '출고비용': 90,
        '정산예정금액': 90,
        '정산대상금액': 90,
        '상품금액': 80,
        '최종결제금액': 90,
        '할인금액': 90,
        '마켓부담할인금액': 120,
        '판매자할인쿠폰할인': 120,
        '구매쿠폰적용금액': 120,
        '쿠폰할인금액': 100,
        '기타지원금할인금': 120,
        '수수료1': 70,
        '수수료2': 70,
        '판매아이디': 150,
        '분리배송 Y/N': 150,
        '택배비': 80,
        '발송일(송장입력일)': 200,
        '택배사': 80,
        '송장번호': 140
    },
    
    async init() {
    // 인스턴스 전역 등록
    window.OrderSearchHandlerInstance = this;
    
    this.dateType = 'sheet'; // 기본값을 주문통합일로 설정
    this.render();
        this.initializeFilters();
        await this.loadMarketList();
        await this.loadOrders();
        
        // 이벤트 리스너 추가
        document.getElementById('searchStartDate')?.addEventListener('change', () => this.loadOrders());
        document.getElementById('searchEndDate')?.addEventListener('change', () => this.loadOrders());
    },
    
    render() {
        const container = document.getElementById('om-panel-search');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .search-container {
                    padding: 0;
                    background: transparent;
                }

                .panel-header {
                    background: #ffffff;
                    padding: 24px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .panel-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #042848;
                    margin: 0;
                }

                .search-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .quick-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    padding-top: 16px;  // <- 상단 여백 추가
    flex-wrap: wrap;
}

                .quick-filter-btn {
                    padding: 6px 14px;
                    border: 1px solid #dee2e6;
                    border-radius: 20px;
                    background: #ffffff;
                    color: #042848;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-filter-btn:hover {
                    border-color: #2563eb;
                    background: #f0f8ff;
                }

                .quick-filter-btn.active {
                    background: #2563eb;
                    color: #ffffff;
                    border-color: #2563eb;
                }

                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }

                .filter-input,
                .filter-select {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    color: #042848;
                    background: #ffffff;
                    transition: all 0.2s;
                }

                .filter-input:focus,
                .filter-select:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .date-range-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .date-input {
                    flex: 1;
                }

                .date-separator {
                    color: #6c757d;
                    font-weight: 300;
                }

                .search-button-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn-search {
                    padding: 10px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: none;
                }

                .btn-search.primary {
                    background: #2563eb;
                    color: #ffffff;
                }

                .btn-search.primary:hover {
                    background: #1d4ed8;
                }

                .btn-search.secondary {
                    background: #ffffff;
                    color: #042848;
                    border: 1px solid #dee2e6;
                }

                .btn-search.secondary:hover {
                    background: #f0f8ff;
                }

                .btn-action {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #042848;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .btn-action:hover {
                    background: #f0f8ff;
                }

                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
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

                .table-header-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .table-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #042848;
                }

                .table-actions {
                    display: flex;
                    gap: 8px;
                }

                .table-wrapper {
                    overflow-x: auto;
                    overflow-y: auto;
                    height: calc(100vh - 500px);
                    min-height: 400px;
                    max-height: 700px;
                }
                
                .search-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1200px;
                    table-layout: fixed;
                }

                .search-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }

                .search-table th {
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 400;
                    color: #042848;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }

                .search-table td {
                    padding: 6px 8px;
                    font-size: 12px;
                    font-weight: 300;
                    color: #042848;
                    border-bottom: 1px solid #f1f3f5;
                    text-align: center;
                    height: 32px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-table tbody tr:hover {
                    background: #b7f7bd;
                }

                .search-table tbody tr.has-tracking {
                    background: #f0f3f7;
                }
                
                .search-table td.selected {
                    background: #e7f3ff !important;
                    outline: 2px solid #2563eb;
                    outline-offset: -2px;
                }
                
                .search-table td.selecting {
                    background: #f0f8ff !important;
                    outline: 1px solid #93c5fd;
                    outline-offset: -1px;
                }

                .checkbox-cell {
                    width: 50px;
                    text-align: center;
                }

                .checkbox-cell input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .result-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    font-size: 13px;
                    color: #6c757d;
                }

                .result-count {
                    color: #2563eb;
                    font-weight: 500;
                }

                .date-type-switch {
                    display: flex;
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 2px;
                }

                .switch-label {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 18px;
                }

                .switch-label input[type="radio"] {
                    display: none;
                }

                .switch-label input[type="radio"]:checked + span {
                    background: #2563eb;
                    color: #ffffff;
                    padding: 4px 10px;
                    border-radius: 16px;
                }

                .switch-label span {
                    font-size: 12px;
                    font-weight: 400;
                    padding: 4px 10px;
                    transition: all 0.2s;
                }

/* CS 모달 스타일 */
                .cs-modal-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .cs-modal-overlay.show {
                    display: flex;
                }

                .cs-modal {
                    background: #ffffff;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 900px;
                    height: 85vh;
                    max-height: 700px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .cs-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                    flex-shrink: 0;
                }

                .cs-modal-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #042848;
                }

                .cs-modal-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .cs-modal-close:hover {
                    background: #ffffff;
                }

                cs-modal-body {
                    padding: 20px;
                    flex: 1 1 auto;
                    overflow-y: auto;
                    overflow-x: hidden;
                    min-height: 0;
                }

                .cs-order-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .cs-info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-top: 12px;
                }

                .cs-info-item {
                    font-size: 13px;
                    color: #6c757d;
                    font-weight: 300;
                    line-height: 1.4;
                }

                .cs-info-value {
                    color: #042848;
                    font-weight: 400;
                }

                .cs-form-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .cs-form-group {
                    margin-bottom: 16px;
                }

                .cs-form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 13px;
                    font-weight: 400;
                    color: #042848;
                }

                .cs-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 300;
                    resize: vertical;
                }

                .cs-select {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 300;
                    background: #ffffff;
                }

                .cs-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 300;
}

.cs-input.amount {
    text-align: right;
}

/* date input 스타일 수정 - 날짜가 항상 보이도록 */
.filter-input.date-input {
    color: #212529 !important;
}

input[type="date"] {
    color: #212529 !important;
}

input[type="date"]::-webkit-datetime-edit {
    color: #212529 !important;
}

input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    color: #212529 !important;
}

input[type="date"]::-webkit-datetime-edit-year-field,
input[type="date"]::-webkit-datetime-edit-month-field,
input[type="date"]::-webkit-datetime-edit-day-field {
    color: #212529 !important;
}

                .cs-input-small {
                    width: 80px;
                    padding: 8px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                }

                .cs-refund-section {
                    display: none;
                    background: #e7f3ff;
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 12px;
                }

                .cs-refund-section.show {
                    display: block;
                }

                .cs-refund-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                    align-items: end;
                }

                .cs-refund-notice {
                    grid-column: 1 / -1;
                    font-size: 11px;
                    color: #6c757d;
                    font-weight: 300;
                    background: #ffffff;
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }

                .cs-refund-result {
                    padding: 8px;
                    background: #ffffff;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 400;
                    color: #042848;
                    text-align: center;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cs-resend-options {
                    display: none;
                    background: #f0f8ff;
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 12px;
                }
                
                .cs-resend-grid {
                    display: grid;
                    grid-template-columns: 3fr 80px 3fr;
                    gap: 12px;
                    align-items: start;
                }

                .cs-resend-options.show {
                    display: block;
                }

                .cs-modal-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    background: #f8f9fa;
                    flex-shrink: 0;
                    min-height: 60px;
                }

                .cs-btn {
                    padding: 8px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 400;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .cs-btn-cancel {
                    background: #ffffff;
                    color: #042848;
                    border: 1px solid #dee2e6;
                }

                .cs-btn-cancel:hover {
                    background: #f8f9fa;
                }

                .cs-btn-submit {
                    background: #2563eb;
                    color: #ffffff;
                }

                .cs-btn-submit:hover {
                    background: #1d4ed8;
                }


                
            </style>

            <div class="search-container">
                <div class="panel-header">
                    <h2 class="panel-title">주문조회</h2>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="date-type-switch">
                            <label class="switch-label">
                                <input type="radio" name="dateType" value="payment" onchange="OrderSearchHandler.changeDateType('payment')">
                                <span>결제일</span>
                            </label>
                            <label class="switch-label">
                                <input type="radio" name="dateType" value="sheet" checked onchange="OrderSearchHandler.changeDateType('sheet')">
                                <span>주문통합일</span>
                            </label>
                        </div>
                        <button class="btn-action" onclick="OrderSearchHandler.resetFilters()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            초기화
                        </button>
                    </div>
                </div>

                  <div class="quick-filters">
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('today', this)">오늘</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('yesterday', this)">어제</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('week', this)">이번 주</button>
                        <button class="quick-filter-btn active" onclick="OrderSearchHandler.setQuickFilter('last7', this)">최근 7일</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('month', this)">이번 달</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('last30', this)">최근 30일</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('custom', this)">직접 설정</button>
                    </div>

                    <div class="search-filters">
                        <div class="filter-group">
                            <label class="filter-label">기간</label>
                            <div class="date-range-container">
                                <input type="date" class="filter-input date-input" id="searchStartDate">
                                <span class="date-separator">~</span>
                                <input type="date" class="filter-input date-input" id="searchEndDate">
                            </div>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">마켓</label>
                            <select class="filter-select" id="searchMarketFilter">
                                <option value="">전체</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">주문 상태</label>
                            <select class="filter-select" id="searchStatusFilter">
                                <option value="">전체</option>
                                <option value="preparing">상품준비중</option>
                                <option value="shipped">발송완료</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">검색어</label>
                            <input type="text" class="filter-input" id="searchKeywordInput" 
                                   placeholder="주문번호, 수령인, 송장번호">
                        </div>
                    </div>

                    <div class="search-button-group">
                        <button class="btn-search secondary" onclick="OrderSearchHandler.exportToExcel()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            엑셀 다운로드
                        </button>
                        <button class="btn-search primary" onclick="OrderSearchHandler.loadOrders()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            검색
                        </button>
                    </div>
                </div>

                <div class="table-section">
                    <div class="table-header">
                        <div class="table-header-left">
                            <h3 class="table-title">주문 목록</h3>
                            <div class="result-info">
                                <span>검색결과: <span class="result-count" id="resultCount">0</span>건</span>
                            </div>
                        </div>
                        <div class="table-actions">
                            <button class="btn-action" onclick="OrderSearchHandler.openCsModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                </svg>
                                CS접수
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.openAdditionalOrderModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                추가주문접수
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.openMarketingModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                마케팅고객등록
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.refreshData()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 4v6h6M23 20v-6h-6"></path>
                                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                                </svg>
                                새로고침
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="search-table" id="searchTable">
                            <thead id="searchTableHead">
                            </thead>
                            <tbody id="searchTableBody">
                                <tr>
                                    <td colspan="100" style="text-align: center; padding: 40px; color: #6c757d;">
                                        조회 조건을 선택하고 검색 버튼을 클릭하세요.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- CS 모달 -->
            <div class="cs-modal-overlay" id="csModalOverlay">
                <div class="cs-modal">
                    <div class="cs-modal-header">
                        <h3 class="cs-modal-title">CS 접수</h3>
                        <button class="cs-modal-close" onclick="OrderSearchHandler.closeCsModal()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="cs-modal-body">
                        <div class="cs-order-info" id="csOrderInfo">
                            <!-- 주문 정보가 여기 표시됩니다 -->
                        </div>
                        
                        <div class="cs-form-row" style="display: flex; gap: 12px; align-items: flex-start;">
                            <div class="cs-form-group" style="width: 120px;">
                                <label class="cs-form-label">CS구분 <span style="color: #dc3545;">*</span></label>
                                <select class="cs-select" id="csCategory" style="border: 1px solid #dc3545;">
                                    <option value="">선택</option>
                                    <option value="파손">파손</option>
                                    <option value="썩음/상함">썩음/상함</option>
                                    <option value="맛 불만족">맛 불만족</option>
                                    <option value="분실">분실</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            
                            <div class="cs-form-group" style="flex: 1;">
                                <label class="cs-form-label">CS 내용 <span style="color: #dc3545;">*</span></label>
                                <textarea class="cs-textarea" id="csCustomerRequest" 
                                    placeholder="CS 내용을 입력하세요" 
                                    style="border: 1px solid #dc3545; height: 60px;"></textarea>
                            </div>
                            
                            <div class="cs-form-group" style="width: 140px;">
                                <label class="cs-form-label">해결방법 <span style="color: #dc3545;">*</span></label>
                                <select class="cs-select" id="csSolution" onchange="OrderSearchHandler.onSolutionChange()">
                                    <option value="">선택하세요</option>
                                    <option value="site-refund">사이트환불</option>
                                    <option value="partial-refund">부분환불</option>
                                    <option value="resend">재발송</option>
                                    <option value="partial-resend">부분재발송</option>
                                    <option value="return">반품</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="cs-refund-section" id="csRefundSection">
                            <div class="cs-refund-notice">
                                ※ 결제금액은 결제내역을 확인할 수 있는 캡쳐사진으로 확인해야 합니다
                            </div>
                            <div class="cs-refund-grid">
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">결제금액</label>
                                    <input type="number" class="cs-input" id="csPaymentAmount" placeholder="0" onchange="OrderSearchHandler.calculateRefund()">
                                </div>
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">환불 비율(%)</label>
                                    <input type="number" class="cs-input" id="csRefundPercent" min="0" max="100" placeholder="0" onchange="OrderSearchHandler.calculateRefund()">
                                </div>
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">환불금액</label>
                                    <div class="cs-refund-result" id="csRefundAmount">0원</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cs-resend-options" id="csResendOptions">
    <!-- 첫째 줄: 재발송상품, 수량, 추가금액, 특이사항 -->
    <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 12px;">
        <div class="cs-form-group" style="margin-bottom: 0; flex: 2;">
            <label class="cs-form-label">재발송 상품</label>
            <input type="text" class="cs-input" id="csResendOption" placeholder="옵션명">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0; width: 60px;">
            <label class="cs-form-label">수량</label>
            <input type="number" class="cs-input" id="csResendQty" min="1" value="1">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0; width: 100px;">
            <label class="cs-form-label">추가금액</label>
            <input type="text" class="cs-input amount" id="csAdditionalAmount" placeholder="0" 
                   oninput="OrderSearchHandler.formatAmountInput(this)">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0; flex: 2;">
            <label class="cs-form-label">특이/요청사항</label>
            <input type="text" class="cs-input" id="csResendNote" value="CS재발송, 싱싱하고 맛있는 것">
        </div>
    </div>
    
    <!-- 둘째 줄: 수령인, 수령인 전화번호 -->
    <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 12px;">
        <div class="cs-form-group" style="margin-bottom: 0; flex: 1;">
            <label class="cs-form-label">수령인</label>
            <input type="text" class="cs-input" id="csResendReceiver" placeholder="수령인">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0; flex: 1;">
            <label class="cs-form-label">수령인 전화번호</label>
            <input type="text" class="cs-input" id="csResendPhone" placeholder="수령인 전화번호">
        </div>
    </div>
    
    <!-- 셋째 줄: 주소, 발송요청일 -->
    <div style="display: flex; gap: 8px; align-items: flex-end;">
        <div class="cs-form-group" style="margin-bottom: 0; flex: 3;">
            <label class="cs-form-label">주소</label>
            <input type="text" class="cs-input" id="csResendAddress" placeholder="배송 주소">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0; width: 120px;">
            <label class="cs-form-label">발송요청일</label>
            <input type="date" class="cs-input" id="csRequestDate">
        </div>
    </div>
</div>
                        </div>
                    </div>
                    <div class="cs-modal-footer">
                        <button class="cs-btn cs-btn-cancel" onclick="OrderSearchHandler.closeCsModal()">취소</button>
                        <button class="cs-btn cs-btn-submit" onclick="OrderSearchHandler.submitCs()">접수</button>
                    </div>
                </div>
            </div>
        `;
        
        // 필터 이벤트 리스너 추가
        setTimeout(() => {
            document.getElementById('searchMarketFilter')?.addEventListener('change', () => this.updateTable());
            document.getElementById('searchStatusFilter')?.addEventListener('change', () => this.updateTable());
            document.getElementById('searchKeywordInput')?.addEventListener('input', () => this.updateTable());
        }, 100);
    },

     initializeFilters() {
        // 최근 7일을 기본값으로 설정 (한국 시간 기준)
        const today = this.getKoreanDate();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        
        document.getElementById('searchEndDate').value = this.formatDate(today);
        document.getElementById('searchStartDate').value = this.formatDate(sevenDaysAgo);
        
        // input type="date"의 표시 문제 해결
        this.fixDateInputDisplay();
    },
    
    getKoreanDate() {
        const now = new Date();
        const kstOffset = 9 * 60; // KST는 UTC+9
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utcTime + (kstOffset * 60000));
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    setQuickFilter(type, buttonElement) {
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (buttonElement) {
            buttonElement.classList.add('active');
        }

        const today = this.getKoreanDate();
        let startDate = new Date(today);
        let endDate = new Date(today);

        switch(type) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(today);
                break;
            case 'last7':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                endDate = new Date(today);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setDate(1);
                endDate = new Date(today);
                break;
            case 'last30':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                endDate = new Date(today);
                break;
            case 'custom':
                return;
        } 

        document.getElementById('searchStartDate').value = this.formatDate(startDate);
        document.getElementById('searchEndDate').value = this.formatDate(endDate);
        
        // 필터 변경 시 자동으로 데이터 로드
        this.loadOrders();
    },



fixDateInputDisplay() {
        // date input의 표시 문제 해결
        const startInput = document.getElementById('searchStartDate');
        const endInput = document.getElementById('searchEndDate');
        
        if (startInput && startInput.value) {
            startInput.style.color = '#212529';
            // 포커스 이벤트로 날짜 표시 강제
            startInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (endInput && endInput.value) {
            endInput.style.color = '#212529';
            endInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    },
    




    resetFilters() {
        const today = this.getKoreanDate();
        document.getElementById('searchStartDate').value = this.formatDate(today);
        document.getElementById('searchEndDate').value = this.formatDate(today);
        document.getElementById('searchMarketFilter').value = '';
        document.getElementById('searchStatusFilter').value = '';
        document.getElementById('searchKeywordInput').value = '';
        
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.quick-filter-btn').classList.add('active');
        
        this.loadOrders();
    },

    changeDateType(type) {
        this.dateType = type;
        this.loadOrders();
    },

    async loadMarketList() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: false
                })
            });
            
            if (!response.ok) {
                console.error('마켓 목록 로드 실패: HTTP', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('searchMarketFilter');
                if (select) {
                    select.innerHTML = '<option value="">전체</option>';
                    
                    Object.keys(data.colors || {}).forEach(market => {
                        select.innerHTML += `<option value="${market}">${market}</option>`;
                    });
                }
                
                this.marketColors = data.colors || {};
            }
        } catch (error) {
            console.error('마켓 목록 로드 실패:', error);
        }
    },

    async loadOrders() {
        this.showLoading();
        try {
            let response;
            
            if (this.dateType === 'sheet') {
                // 주문통합일 모드 - 날짜별 시트 읽기
                const startDate = document.getElementById('searchStartDate').value.replace(/-/g, '');
                const endDate = document.getElementById('searchEndDate').value.replace(/-/g, '');
                
                response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getOrdersByDateRange',
                        startDate: startDate,
                        endDate: endDate
                    })
                });
            } else {
                // 결제일 모드 - 전체 데이터
                response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getMarketData',
                        useMainSpreadsheet: true
                    })
                });
            }

            const result = await response.json();
            
            if (result.success) {
                // getOrdersByDateRange는 orders 필드로 반환
                this.currentOrders = result.orders || result.data || [];
                this.marketColors = result.colors || {};
                
                // 디버깅: 데이터 확인
                console.log('전체 주문 수:', this.currentOrders.length);
                if (this.currentOrders.length > 0) {
                    console.log('첫 번째 주문 데이터:', this.currentOrders[0]);
                    console.log('결제일 필드:', this.currentOrders[0]['결제일']);
                    this.tableHeaders = Object.keys(this.currentOrders[0]);
                }
                
                const today = document.getElementById('searchStartDate').value;
                console.log('오늘 날짜 필터:', today);
                
                this.updateTable();
            } else {
                this.showMessage('데이터를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('로드 오류:', error);
            this.showMessage('데이터 로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // 공백 제거
        dateStr = String(dateStr).trim();
        
        // YYYYMMDD 형식 (20240115)
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return new Date(year, month - 1, day);
        }
        
        // YYYY-MM-DD 형식
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return new Date(dateStr);
        }
        
        // YYYY/MM/DD 형식
        if (/^\d{4}\/\d{2}\/\d{2}/.test(dateStr)) {
            return new Date(dateStr.replace(/\//g, '-'));
        }
        
        // MM/DD/YYYY 또는 M/D/YYYY 형식
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
            const parts = dateStr.split('/');
            return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        
        return null;
    },

    updateTable() {
        const thead = document.getElementById('searchTableHead');
        const tbody = document.getElementById('searchTableBody');
        
        if (!thead || !tbody) return;
        
        // 헤더 생성
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        
        // 체크박스 컬럼
        const thCheckbox = document.createElement('th');
        thCheckbox.className = 'checkbox-cell';
        thCheckbox.innerHTML = '<input type="checkbox" onchange="OrderSearchHandler.toggleSelectAll(this)">';
        headerRow.appendChild(thCheckbox);
        
        // 매핑시트에서 가져온 모든 헤더 추가
        if (this.currentOrders.length > 0) {
            // 사용자 권한 확인
            const userRole = window.currentUser?.role || 'staff';
            const isAdmin = userRole === 'admin';
            
            // 금액 필드 정의
            const amountFields = [
                '셀러공급가', '출고비용', '정산예정금액', '정산대상금액',
                '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
                '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액',
                '기타지원금할인금', '수수료1', '수수료2', '택배비'
            ];
            
            // 테이블 전체 너비 계산
            let totalWidth = 50; // checkbox width
            this.tableHeaders = Object.keys(this.currentOrders[0]);
            
            // 직원이면 금액 필드 제외
            const visibleHeaders = this.tableHeaders.filter(header => 
                isAdmin || !amountFields.some(field => header.includes(field))
            );
            
            visibleHeaders.forEach(header => {
                totalWidth += this.columnWidths[header] || 100;
            });
            
            // 테이블에 최소 너비 설정
            const table = document.getElementById('searchTable');
            if (table) {
                table.style.minWidth = totalWidth + 'px';
                table.style.width = totalWidth + 'px';
            }
            
            visibleHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                const width = this.columnWidths[header] || 100;
                th.style.width = width + 'px';
                th.style.minWidth = width + 'px';
                th.style.maxWidth = width + 'px';
                headerRow.appendChild(th);
            });
        }
        
        thead.appendChild(headerRow);
        
        const filteredOrders = this.getFilteredOrders();
        
        tbody.innerHTML = '';
        
        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 40px; color: #6c757d;">조회된 주문이 없습니다.</td></tr>';
            document.getElementById('resultCount').textContent = '0';
            return;
        }
        
        document.getElementById('resultCount').textContent = filteredOrders.length;
        
        filteredOrders.forEach((order, index) => {
            const row = this.createTableRow(order, index + 1);
            tbody.appendChild(row);
        });
        
        // 우클릭 메뉴 이벤트 추가
        this.setupContextMenu();
    },
    
setupContextMenu() {
        // 기존 컨텍스트 메뉴 제거
        const existingMenu = document.getElementById('tableContextMenu');
        if (existingMenu) existingMenu.remove();
        
        // 셀 선택 이벤트 설정
        this.setupCellSelection();
        
        // 컨텍스트 메뉴 HTML 생성
        const contextMenuHtml = `
            <div id="tableContextMenu" style="
                display: none;
                position: fixed;
                background: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                padding: 4px 0;
                min-width: 180px;
            ">
                <div class="context-menu-item" onclick="OrderSearchHandler.copyCell()" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    셀 복사
                </div>
                <div class="context-menu-item" onclick="OrderSearchHandler.copyRow()" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    행 전체 복사
                </div>
                <div style="height: 1px; background: #dee2e6; margin: 4px 0;"></div>
                <div class="context-menu-item" onclick="OrderSearchHandler.openCsModalFromContext()" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                    CS 접수
                </div>
                <div class="context-menu-item" onclick="OrderSearchHandler.openAdditionalFromContext()" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    추가주문 접수
                </div>
                <div class="context-menu-item" onclick="OrderSearchHandler.openMarketingFromContext()" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    마케팅고객 등록
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', contextMenuHtml);
        
        const table = document.getElementById('searchTable');
        const contextMenu = document.getElementById('tableContextMenu');
        
        // 테이블 우클릭 이벤트
        table.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const td = e.target.closest('td');
            const tr = e.target.closest('tr');
            
            if (!td || !tr) return;
            
            // 현재 선택된 셀과 행 저장
            this.contextMenuTarget = {
                cell: td,
                row: tr,
                cellIndex: td.cellIndex,
                rowIndex: tr.rowIndex
            };
            
            // 메뉴 위치 설정
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            contextMenu.style.display = 'block';
        });
        
        // 다른 곳 클릭시 메뉴 숨기기
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });
    },
    
    copyCell() {
        if (!this.contextMenuTarget) return;
        const text = this.contextMenuTarget.cell.textContent;
        navigator.clipboard.writeText(text);
        this.showMessage('셀 내용이 복사되었습니다.', 'success');
    },
    
    copyRow() {
        if (!this.contextMenuTarget) return;
        const cells = this.contextMenuTarget.row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent).join('\t');
        navigator.clipboard.writeText(rowData);
        this.showMessage('행 전체가 복사되었습니다.', 'success');
    },
    
    openCsModalFromContext() {
        if (!this.contextMenuTarget) return;
        const rowIndex = this.contextMenuTarget.row.rowIndex - 1; // 헤더 제외
        const order = this.getFilteredOrders()[rowIndex];
        if (order) {
            this.currentCsOrder = order;
            this.displayCsOrderInfo(order);
            document.getElementById('csModalOverlay').classList.add('show');
        }
    },
    
    openAdditionalFromContext() {
        if (!this.contextMenuTarget) return;
        const rowIndex = this.contextMenuTarget.row.rowIndex - 1;
        const order = this.getFilteredOrders()[rowIndex];
        if (order) {
            this.currentAdditionalOrder = order;
            this.showAdditionalOrderModal(order);
        }
    },
    
    openMarketingFromContext() {
        if (!this.contextMenuTarget) return;
        const rowIndex = this.contextMenuTarget.row.rowIndex - 1;
        const order = this.getFilteredOrders()[rowIndex];
        if (order) {
            this.showMarketingCustomerModal(order);
        }
    },
    

setupCellSelection() {
        const table = document.getElementById('searchTable');
        if (!table) return;
        
        // 테이블을 포커스 가능하게 만들기
        table.setAttribute('tabindex', '0');
        
        let selectedCell = null;
        
        // 모든 선택 제거
        const clearAllSelections = () => {
            table.querySelectorAll('td.selected').forEach(td => {
                td.classList.remove('selected');
            });
        };
        
        // 셀 클릭
        table.addEventListener('click', (e) => {
            const td = e.target.closest('td');
            if (!td || td.classList.contains('checkbox-cell')) return;
            
            clearAllSelections();
            td.classList.add('selected');
            selectedCell = td;
            table.focus();
        });
        
        // 키보드 이벤트
        table.addEventListener('keydown', (e) => {
            const selected = table.querySelector('td.selected');
            if (!selected) {
                // 선택된 셀이 없으면 첫 번째 셀 선택
                const firstCell = table.querySelector('tbody td:nth-child(2)');
                if (firstCell) {
                    firstCell.classList.add('selected');
                }
                return;
            }
            
            let newCell = null;
            const row = selected.parentElement;
            const cellIndex = selected.cellIndex;
            
            if (e.key === 'ArrowRight' && selected.nextElementSibling) {
                newCell = selected.nextElementSibling;
            } else if (e.key === 'ArrowLeft' && cellIndex > 1) {
                newCell = selected.previousElementSibling;
            } else if (e.key === 'ArrowDown') {
                const nextRow = row.nextElementSibling;
                if (nextRow) newCell = nextRow.cells[cellIndex];
            } else if (e.key === 'ArrowUp') {
                const prevRow = row.previousElementSibling;
                if (prevRow && prevRow.parentElement.tagName === 'TBODY') {
                    newCell = prevRow.cells[cellIndex];
                }
            } else if (e.key === 'Enter' || (e.key === 'c' && (e.ctrlKey || e.metaKey))) {
                // 복사
                const text = selected.textContent;
                navigator.clipboard.writeText(text);
                this.showMessage('복사되었습니다', 'success');
                return;
            } else if (e.key === 'Escape') {
                clearAllSelections();
                return;
            } else {
                return;
            }
            
            if (newCell && !newCell.classList.contains('checkbox-cell')) {
                e.preventDefault();
                clearAllSelections();
                newCell.classList.add('selected');
                newCell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        });
    },


    createTableRow(order, serialNumber) {
        const row = document.createElement('tr');
        const hasTracking = order['송장번호'] && order['송장번호'].trim() !== '';
        
        if (hasTracking) {
            row.classList.add('has-tracking');
        }
        
        // 사용자 권한 확인
        const userRole = window.currentUser?.role || 'staff';
        const isAdmin = userRole === 'admin';
        
        // 금액 필드 정의
        const amountFields = [
            '셀러공급가', '출고비용', '정산예정금액', '정산대상금액',
            '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
            '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액',
            '기타지원금할인금', '수수료1', '수수료2', '택배비'
        ];
        
        const tdCheckbox = document.createElement('td');
        tdCheckbox.className = 'checkbox-cell';
        tdCheckbox.style.width = '50px';
        tdCheckbox.innerHTML = `<input type="checkbox" class="order-checkbox" data-index="${serialNumber - 1}">`;
        row.appendChild(tdCheckbox);
        
        // 직원이면 금액 필드 제외한 헤더만 처리
        const visibleHeaders = this.tableHeaders.filter(header => 
            isAdmin || !amountFields.some(field => header.includes(field))
        );

        visibleHeaders.forEach(header => {
            
            const td = document.createElement('td');
            
            const width = this.columnWidths[header] || 100;
            td.style.width = width + 'px';
            td.style.minWidth = width + 'px';
            td.style.maxWidth = width + 'px';
            
            if (header === '연번') {
                td.textContent = serialNumber;
            } else if (header === '마켓명') {
                const marketName = order[header] || '';
                const marketColor = this.marketColors[marketName] || 'rgb(128,128,128)';
                td.innerHTML = `
                    <span style="display: inline-block; padding: 2px 6px; background: ${marketColor}; 
                         color: ${this.getTextColor(marketColor)}; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${marketName}
                    </span>
                `;
            } else {
                const value = order[header] || '';
                
                if (header.includes('금액') || header.includes('가격')) {
                    td.style.textAlign = 'right';
                    td.textContent = this.formatNumber(value);
                } else if (header === '수량') {
                    td.style.textAlign = 'right';
                    td.style.paddingRight = '12px';
                    td.textContent = value;
                } else {
                    td.textContent = value;
                }
                
                // 텍스트 정렬
                if (header === '옵션명' || header === '주소' || header === '배송메세지') {
                    td.style.textAlign = 'left';
                }
            }
            
            row.appendChild(td);
        });
        
        return row;
    },

    getFilteredOrders() {
        let filtered = [...this.currentOrders];
        
        // 날짜 필터링
        const startDate = document.getElementById('searchStartDate')?.value;
        const endDate = document.getElementById('searchEndDate')?.value;
        
        if (startDate && endDate && this.dateType === 'payment') {
            // 결제일 기준 필터링만 적용
            const startNum = parseInt(startDate.replace(/-/g, ''));
            const endNum = parseInt(endDate.replace(/-/g, ''));
            
            filtered = filtered.filter(order => {
                // 모든 날짜 관련 필드 확인
                const dateField = order['결제일'] || order['주문일'] || order['날짜'] || '';
                
                // 날짜 형식 변환
                let dateNum = 0;
                
                // YYYY/MM/DD HH:MM:SS 형식
                if (dateField.includes('/')) {
                    const datePart = dateField.split(' ')[0];
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        dateNum = parseInt(parts[0] + parts[1].padStart(2, '0') + parts[2].padStart(2, '0'));
                    }
                }
                // YYYY-MM-DD 형식
                else if (dateField.includes('-')) {
                    dateNum = parseInt(dateField.substring(0, 10).replace(/-/g, ''));
                }
                // YYYYMMDD 형식
                else if (/^\d{8}$/.test(dateField)) {
                    dateNum = parseInt(dateField);
                }
                
                return dateNum >= startNum && dateNum <= endNum;
            });
        }
        
        // 마켓 필터
        const marketFilter = document.getElementById('searchMarketFilter')?.value;
        if (marketFilter) {
            filtered = filtered.filter(order => order['마켓명'] === marketFilter);
        }
        
        // 상태 필터
        const statusFilter = document.getElementById('searchStatusFilter')?.value;
        if (statusFilter === 'preparing') {
            filtered = filtered.filter(order => !order['송장번호'] || order['송장번호'].trim() === '');
        } else if (statusFilter === 'shipped') {
            filtered = filtered.filter(order => order['송장번호'] && order['송장번호'].trim() !== '');
        }
        
        // 검색어 필터
        const keyword = document.getElementById('searchKeywordInput')?.value?.toLowerCase();
        if (keyword) {
            filtered = filtered.filter(order => {
                return Object.values(order).some(value => 
                    String(value).toLowerCase().includes(keyword)
                );
            });
        }
        
        return filtered;
    },

    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    },

    async exportToExcel() {
        const filteredOrders = this.getFilteredOrders();
        
        if (filteredOrders.length === 0) {
            this.showMessage('내보낼 데이터가 없습니다.', 'error');
            return;
        }
        
        // XLSX 라이브러리 확인
        if (typeof XLSX === 'undefined') {
            this.showMessage('엑셀 라이브러리를 로드하는 중입니다...', 'info');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => this.exportToExcel();
            document.head.appendChild(script);
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(filteredOrders);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '주문목록');
        
        const koreanDate = this.getKoreanDate();
        const date = koreanDate.toISOString().split('T')[0].replace(/-/g, '');
        XLSX.writeFile(wb, `주문조회_${date}.xlsx`);
    },

    refreshData() {
        this.loadOrders();
    },

    getTextColor(bgColor) {
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000' : '#fff';
        }
        return '#fff';
    },

    formatNumber(num) {
        if (!num) return '0';
        return Number(num).toLocaleString('ko-KR');
    },

    showLoading() {
        const loading = document.getElementById('om-loading');
        if (loading) loading.classList.add('show');
    },

    hideLoading() {
        const loading = document.getElementById('om-loading');
        if (loading) loading.classList.remove('show');
    },

    showMessage(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `om-message ${type} show`;
        div.textContent = message;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 3000);
    },



    formatAmountInput(input) {
    // 숫자만 추출
    let value = input.value.replace(/[^0-9]/g, '');
    
    // 천단위 쉼표 추가
    if (value) {
        value = parseInt(value).toLocaleString('ko-KR');
    }
    
    input.value = value;
},


// CS 모달 열기
async openCsModal() {
    const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
    if (checkedBoxes.length === 0) {
        this.showMessage('CS 접수할 주문을 선택하세요.', 'error');
        return;
    }
    if (checkedBoxes.length > 1) {
        this.showMessage('CS 접수는 한 번에 하나의 주문만 처리할 수 있습니다.', 'error');
        return;
    }

    const index = checkedBoxes[0].dataset.index;
    const order = this.getFilteredOrders()[index];
    
    if (!order) {
        this.showMessage('주문 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    this.currentCsOrder = order;
    
    // 기존 CS 접수 내역 확인
    this.showLoading();
    try {
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getExistingCsRecord',
                orderData: {
                    주문번호: order['주문번호'] || '',
                    주문자: order['주문자'] || '',
                    수령인: order['수령인'] || order['수취인'] || '',
                    옵션명: order['옵션명'] || ''
                }
            })
        });
        
        const result = await response.json();
        if (result.success && result.csRecord) {
            // 기존 CS 접수 내역이 있으면 확인 모달 표시
            const proceedWithEdit = await this.showExistingCsModal(result.csRecord);
            if (!proceedWithEdit) {
                this.hideLoading();
                return;
            }
            // 기존 데이터로 폼 채우기
            if (this.isEditingCs) {
                this.fillCsFormWithExisting(result.csRecord);
            }
        }
    } catch (error) {
        console.error('기존 CS 확인 실패:', error);
    } finally {
        this.hideLoading();
    }
    
    this.displayCsOrderInfo(order);
    const modal = document.getElementById('csModalOverlay');
    if (modal) modal.classList.add('show');
},




// 기존 CS 접수 내역 모달
async showExistingCsModal(csRecord) {
    return new Promise((resolve) => {
        const existingModal = document.getElementById('existingCsModal');
        if (existingModal) existingModal.remove();
        
        const modalHtml = `
            <div id="existingCsModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                 background: rgba(0,0,0,0.5); z-index: 2001; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: 16px; max-width: 700px; width: 90%; 
                     max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div style="padding: 20px; border-bottom: 1px solid #dee2e6; background: #fff4e6;">
                        <h3 style="font-size: 18px; font-weight: 500; color: #f59e0b; margin: 0;">
                            ⚠️ 기존 CS 접수 내역이 있습니다
                        </h3>
                    </div>
                    
                    <div style="padding: 20px;">
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h4 style="font-size: 14px; font-weight: 500; color: #042848; margin-bottom: 12px;">기존 접수 정보</h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
                                <div><strong>접수번호:</strong> ${csRecord.접수번호 || ''}</div>
                                <div><strong>접수일:</strong> ${csRecord.접수일 || ''}</div>
                                <div><strong>해결방법:</strong> ${csRecord.해결방법 || ''}</div>
                                <div><strong>상태:</strong> ${csRecord.상태 || '접수'}</div>
                                <div style="grid-column: 1 / -1;">
                                    <strong>CS 내용:</strong> ${csRecord['CS 내용'] || ''}
                                </div>
                                ${csRecord.재발송상품 ? `
                                    <div><strong>재발송상품:</strong> ${csRecord.재발송상품}</div>
                                    <div><strong>재발송수량:</strong> ${csRecord.재발송수량 || ''}</div>
                                ` : ''}
                                ${csRecord.부분환불금액 ? `
                                    <div style="grid-column: 1 / -1;">
                                        <strong>부분환불금액:</strong> ${Number(csRecord.부분환불금액).toLocaleString()}원
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div style="background: #e7f3ff; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                            <p style="font-size: 13px; color: #2563eb; margin: 0; line-height: 1.6;">
                                이미 접수된 CS 건입니다.<br>
                                기존 내용을 수정하시려면 '수정하기'를,<br>
                                새로운 CS를 추가 접수하시려면 '새로 접수'를 선택하세요.
                            </p>
                        </div>
                    </div>
                    
                    <div style="padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px; background: #f8f9fa;">
                        <button onclick="document.getElementById('existingCsModal').remove(); window.OrderSearchHandlerInstance.existingCsResolve('cancel');"
                                style="padding: 8px 20px; border: 1px solid #dee2e6; background: white; 
                                       color: #042848; border-radius: 6px; font-size: 13px; cursor: pointer;">
                            취소
                        </button>
                        <button onclick="document.getElementById('existingCsModal').remove(); window.OrderSearchHandlerInstance.existingCsResolve('new');"
                                style="padding: 8px 20px; border: none; background: #10b981; 
                                       color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
                            새로 접수
                        </button>
                        <button onclick="document.getElementById('existingCsModal').remove(); window.OrderSearchHandlerInstance.existingCsResolve('edit');"
                                style="padding: 8px 20px; border: none; background: #2563eb; 
                                       color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
                            수정하기
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        window.OrderSearchHandlerInstance.existingCsResolve = (action) => {
    if (action === 'cancel') {
        resolve(false);
    } else if (action === 'new') {
        this.isNewCsRecord = true;
        this.isEditingCs = false;
        resolve(true);
    } else if (action === 'edit') {
        this.isEditingCs = true;
        this.editingCsRecord = csRecord;
        this.isNewCsRecord = false;
        resolve(true);
    }
};
    });
},

// 기존 CS 데이터로 폼 채우기
fillCsFormWithExisting(csRecord) {
    setTimeout(() => {
        document.getElementById('csCustomerRequest').value = csRecord['CS 내용'] || '';
        
        // 해결방법 매핑
        const solutionMap = {
            '사이트환불': 'site-refund',
            '부분환불': 'partial-refund',
            '재발송': 'resend',
            '부분재발송': 'partial-resend',
            '반품': 'return'
        };
        const solutionValue = solutionMap[csRecord.해결방법] || '';
        document.getElementById('csSolution').value = solutionValue;
        
        // 해결방법에 따른 추가 필드 표시
        this.onSolutionChange();
        
        // 재발송 정보
        if (solutionValue === 'resend' || solutionValue === 'partial-resend') {
            document.getElementById('csResendOption').value = csRecord.재발송상품 || '';
            document.getElementById('csResendQty').value = csRecord.재발송수량 || '1';
            document.getElementById('csResendNote').value = csRecord['특이/요청사항'] || '';
            document.getElementById('csRequestDate').value = csRecord.발송요청일 || '';
            document.getElementById('csResendReceiver').value = csRecord.수령인 || '';
            document.getElementById('csResendPhone').value = csRecord['수령인 전화번호'] || '';
            document.getElementById('csResendAddress').value = csRecord.주소 || '';
        }
        
        // 부분환불 정보
        if (solutionValue === 'partial-refund' && csRecord.부분환불금액) {
            document.getElementById('csRefundAmount').textContent = 
                Number(csRecord.부분환불금액).toLocaleString() + '원';
        }
    }, 100);
},





displayCsOrderInfo(order) {
        const infoDiv = document.getElementById('csOrderInfo');
        if (!infoDiv) return;

        const marketColor = this.marketColors[order['마켓명']] || 'rgb(128,128,128)';
        
        // 전화번호 필드 확인 - 다양한 필드명 처리
        const orderPhone = order['주문자전화번호'] || order['주문자연락처'] || order['주문자 전화번호'] || '';
        const receiverPhone = order['수령인전화번호'] || order['수취인전화번호'] || 
                              order['수령인연락처'] || order['수취인연락처'] || 
                              order['수령인 전화번호'] || order['수취인 전화번호'] || '';
        
        infoDiv.innerHTML = `
            <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 8px; background: ${marketColor}; 
                     color: ${this.getTextColor(marketColor)}; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${order['마켓명'] || ''}
                </span>
            </div>
            <div class="cs-info-grid">
                <div class="cs-info-item">
                    <span class="cs-info-label">결제일: <span style="color: #042848; font-weight: 400;">${order['결제일'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문번호: <span style="color: #042848; font-weight: 400;">${order['주문번호'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문자: <span style="color: #042848; font-weight: 400;">${order['주문자'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문자 전화번호: <span style="color: #042848; font-weight: 400;">${orderPhone}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수령인: <span style="color: #042848; font-weight: 400;">${order['수령인'] || order['수취인'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수령인 전화번호: <span style="color: #042848; font-weight: 400;">${receiverPhone}</span></span>
                </div>
                <div class="cs-info-item" style="grid-column: 1 / -1;">
                    <span class="cs-info-label">주소: <span style="color: #042848; font-weight: 400;">${order['주소'] || order['수령인주소'] || order['수취인주소'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">옵션명: <span style="color: #042848; font-weight: 400;">${order['옵션명'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수량: <span style="color: #042848; font-weight: 400;">${order['수량'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">상품금액: <span style="color: #042848; font-weight: 400;">${this.formatNumber(order['상품금액'] || 0)}</span></span>
                </div>
            </div>
        `;
    },

    closeCsModal() {
    const modal = document.getElementById('csModalOverlay');
    if (modal) modal.classList.remove('show');
    
    // 폼 초기화
    document.getElementById('csCustomerRequest').value = '';
    document.getElementById('csSolution').value = '';
    document.getElementById('csRefundPercent').value = '';
    document.getElementById('csResendOption').value = '';
    document.getElementById('csResendQty').value = '1';
    document.getElementById('csResendNote').value = '';
    document.getElementById('csPaymentAmount').value = '';
    document.getElementById('csRefundAmount').textContent = '0원';
    document.getElementById('csRequestDate').value = '';
    document.getElementById('csResendReceiver').value = '';
    document.getElementById('csResendPhone').value = '';
    document.getElementById('csResendAddress').value = '';
    
    // 추가 옵션 숨기기
    const refundSection = document.getElementById('csRefundSection');
    const resendOptions = document.getElementById('csResendOptions');
    if (refundSection) refundSection.classList.remove('show');
    if (resendOptions) resendOptions.classList.remove('show');
    
    // 수정 모드 초기화
    this.isEditingCs = false;
    this.editingCsRecord = null;
    this.isNewCsRecord = false;
    this.currentCsOrder = null;
},

onSolutionChange() {
        const solution = document.getElementById('csSolution').value;
        const refundSection = document.getElementById('csRefundSection');
        const resendDiv = document.getElementById('csResendOptions');
        
        // 모든 추가 옵션 숨기기
        refundSection.classList.remove('show');
        resendDiv.classList.remove('show');
        
        // 선택에 따라 표시
        if (solution === 'partial-refund') {
            refundSection.classList.add('show');
        } else if (solution === 'resend' || solution === 'partial-resend') {
            resendDiv.classList.add('show');
            // 기본값 설정
            if (this.currentCsOrder) {
                document.getElementById('csResendOption').value = this.currentCsOrder['옵션명'] || '';
                document.getElementById('csResendReceiver').value = this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'] || '';
                
                // 전화번호 필드 - 다양한 필드명 체크
                const phoneValue = this.currentCsOrder['수령인전화번호'] || 
                                  this.currentCsOrder['수취인전화번호'] || 
                                  this.currentCsOrder['수령인연락처'] || 
                                  this.currentCsOrder['수취인연락처'] ||
                                  this.currentCsOrder['수령인 전화번호'] ||
                                  this.currentCsOrder['수취인 전화번호'] || '';
                                  
                document.getElementById('csResendPhone').value = phoneValue;
                
                // 주소 필드
                const addressValue = this.currentCsOrder['주소'] || 
                                    this.currentCsOrder['수령인주소'] || 
                                    this.currentCsOrder['수취인주소'] ||
                                    this.currentCsOrder['배송지주소'] || '';
                                    
                document.getElementById('csResendAddress').value = addressValue;
                
                // 디버깅용 로그
                console.log('재발송 기본값 설정:', {
                    옵션명: document.getElementById('csResendOption').value,
                    수령인: document.getElementById('csResendReceiver').value,
                    전화번호: phoneValue,
                    주소: addressValue,
                    원본데이터: this.currentCsOrder
                });
            }
        }
    },

    calculateRefund() {
        const paymentAmount = parseFloat(document.getElementById('csPaymentAmount').value) || 0;
        const refundPercent = parseFloat(document.getElementById('csRefundPercent').value) || 0;
        const refundAmount = Math.round(paymentAmount * (refundPercent / 100));
        
        document.getElementById('csRefundAmount').textContent = this.formatNumber(refundAmount) + '원';
    },

// CS 제출
async submitCs() {
    const csCategory = document.getElementById('csCategory').value;
    const customerRequest = document.getElementById('csCustomerRequest').value;
    const solution = document.getElementById('csSolution').value;
    
    if (!csCategory || !customerRequest || !solution) {
        this.showMessage('CS구분, CS 내용, 해결방법을 모두 입력하세요.', 'error');
        return;
    }

    // 수정 모드인지 확인
    if (this.isEditingCs && this.editingCsRecord) {
        // CS 수정 처리
        this.showLoading();
        try {
            const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'CS';
            const csData = {
            userEmail: userEmail,
            마켓명: this.currentCsOrder['마켓명'] || '',
            'CS구분': csCategory,
            해결방법: this.getSolutionText(solution),
            'CS 내용': customerRequest,
                결제일: this.currentCsOrder['결제일'] || '',
                주문번호: this.currentCsOrder['주문번호'] || '',
                주문자: this.currentCsOrder['주문자'] || '',
                '주문자 전화번호': this.currentCsOrder['주문자전화번호'] || 
                                  this.currentCsOrder['주문자 전화번호'] || '',
                수령인: this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'] || '',
                '수령인 전화번호': this.currentCsOrder['수령인전화번호'] || 
                                  this.currentCsOrder['수령인 전화번호'] || '',
                주소: this.currentCsOrder['주소'] || '',
                배송메세지: this.currentCsOrder['배송메세지'] || '',
                옵션명: this.currentCsOrder['옵션명'] || '',
                수량: this.currentCsOrder['수량'] || '',
                재발송상품: '',
                재발송수량: '',
                부분환불금액: '',
                '특이/요청사항': '',
                발송요청일: ''
            };
            
            // 해결방법별 추가 데이터
        if (solution === 'partial-refund') {
            const refundAmount = Math.round(
                (parseFloat(document.getElementById('csPaymentAmount').value) || 0) * 
                (parseFloat(document.getElementById('csRefundPercent').value) || 0) / 100
            );
            csData.부분환불금액 = refundAmount;
        } else if (solution === 'resend' || solution === 'partial-resend') {
            csData.재발송상품 = document.getElementById('csResendOption').value;
            csData.재발송수량 = document.getElementById('csResendQty').value;
            csData.수령인 = document.getElementById('csResendReceiver').value;
            csData['수령인 전화번호'] = document.getElementById('csResendPhone').value;
            csData.주소 = document.getElementById('csResendAddress').value;
            csData['특이/요청사항'] = document.getElementById('csResendNote').value || '';
            csData.발송요청일 = document.getElementById('csRequestDate').value || '';
            // 천단위 쉼표 제거 후 파싱
            const additionalAmountStr = document.getElementById('csAdditionalAmount').value;
            csData.추가금액 = parseFloat(String(additionalAmountStr).replace(/,/g, '')) || 0;
        }
            
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateCsRecord',
                    data: csData,
                    rowIndex: this.editingCsRecord.rowIndex
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showMessage('CS 기록이 수정되었습니다.', 'success');
                this.closeCsModal();
            } else {
                throw new Error('CS 수정 실패');
            }
        } catch (error) {
            console.error('CS 수정 오류:', error);
            this.showMessage('CS 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
        return;
    }

    // 신규 접수인 경우
    if (!this.isNewCsRecord) {
        const duplicateCheck = await this.checkDuplicateCs();
        
        if (duplicateCheck && (duplicateCheck.csRecord || duplicateCheck.tempSave)) {
            const confirmResult = await this.showCsConfirmModal(customerRequest, solution, duplicateCheck);
            
            if (!confirmResult) {
                return;
            }
        }
    }

    // 신규 CS 접수 처리
    this.showLoading();
    try {
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'CS';
        
        const csData = {
            userEmail: userEmail,
            마켓명: this.currentCsOrder['마켓명'] || '',
            'CS구분': csCategory,
            해결방법: this.getSolutionText(solution),
            'CS 내용': customerRequest,
            결제일: this.currentCsOrder['결제일'] || '',
            주문번호: this.currentCsOrder['주문번호'] || '',
            주문자: this.currentCsOrder['주문자'] || '',
            '주문자 전화번호': this.currentCsOrder['주문자전화번호'] || 
                              this.currentCsOrder['주문자 전화번호'] || '',
            수령인: this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'] || '',
            '수령인 전화번호': this.currentCsOrder['수령인전화번호'] || 
                              this.currentCsOrder['수령인 전화번호'] || '',
            주소: this.currentCsOrder['주소'] || '',
            배송메세지: this.currentCsOrder['배송메세지'] || '',
            옵션명: this.currentCsOrder['옵션명'] || '',
            수량: this.currentCsOrder['수량'] || '',
            재발송상품: '',
            재발송수량: '',
            부분환불금액: '',
            '특이/요청사항': '',
            발송요청일: ''
        };
        
        // 해결방법별 추가 데이터
        if (solution === 'partial-refund') {
            const refundAmount = Math.round(
                (parseFloat(document.getElementById('csPaymentAmount').value) || 0) * 
                (parseFloat(document.getElementById('csRefundPercent').value) || 0) / 100
            );
            csData.부분환불금액 = refundAmount;
        } else if (solution === 'resend' || solution === 'partial-resend') {
            csData.재발송상품 = document.getElementById('csResendOption').value;
            csData.재발송수량 = document.getElementById('csResendQty').value;
            csData.수령인 = document.getElementById('csResendReceiver').value;
            csData['수령인 전화번호'] = document.getElementById('csResendPhone').value;
            csData.주소 = document.getElementById('csResendAddress').value;
            csData['특이/요청사항'] = document.getElementById('csResendNote').value || '';
            csData.발송요청일 = document.getElementById('csRequestDate').value || '';
            // 천단위 쉼표 제거 후 파싱
            const additionalAmountStr = document.getElementById('csAdditionalAmount').value;
            csData.추가금액 = parseFloat(String(additionalAmountStr).replace(/,/g, '')) || 0;
        }

        // CS기록 저장
        const csResponse = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveCsRecord',
                data: csData
            })
        });

        const csResult = await csResponse.json();
        if (!csResult.success) {
            throw new Error('CS 기록 저장 실패');
        }

        this.showMessage('CS 접수가 완료되었습니다.', 'success');
        this.closeCsModal();
        
    } catch (error) {
        console.error('CS 접수 오류:', error);
        this.showMessage('CS 접수 중 오류가 발생했습니다.', 'error');
    } finally {
        this.hideLoading();
        this.isNewCsRecord = false;
    }
},

    getSolutionText(value) {
        const solutionMap = {
            'site-refund': '사이트환불',
            'partial-refund': '부분환불',
            'resend': '재발송',
            'partial-resend': '부분재발송',
            'return': '반품'
        };
        return solutionMap[value] || value;
    },
    // 추가주문접수 모달
async openAdditionalOrderModal() {
    const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
    if (checkedBoxes.length === 0) {
        this.showMessage('추가주문을 접수할 주문을 선택하세요.', 'error');
        return;
    }
    if (checkedBoxes.length > 1) {
        this.showMessage('추가주문 접수는 한 번에 하나의 주문만 처리할 수 있습니다.', 'error');
        return;
    }

    const index = checkedBoxes[0].dataset.index;
    const order = this.getFilteredOrders()[index];
    
    if (!order) {
        this.showMessage('주문 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    this.currentAdditionalOrder = order;
    this.showAdditionalOrderModal(order);
},

showAdditionalOrderModal(order) {
    // 기존 모달 제거
    const existingModal = document.getElementById('additionalOrderModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div id="additionalOrderModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
             background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 16px; max-width: 900px; width: 90%; 
                 max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid #dee2e6; background: #f8f9fa;">
                    <h3 style="font-size: 18px; font-weight: 500; color: #042848; margin: 0;">추가주문 접수</h3>
                </div>
                
                <div style="padding: 20px;">
    <!-- 기본 주문 정보 표시 -->
    <div style="background: #e7f3ff; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        <div style="font-size: 12px; color: #2563eb; margin-bottom: 8px;">기존 주문 정보</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
            <div><strong>마켓:</strong> ${order['마켓명'] || ''}</div>
            <div><strong>주문번호:</strong> ${order['주문번호'] || ''}</div>
        </div>
    </div>
    
    <!-- 첫 번째 줄: 마켓명, 옵션명 -->
    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                마켓명 <span style="color: #dc3545;">*</span>
            </label>
            <input type="text" id="addOrderMarket" value="전화주문" readonly
                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                          border-radius: 6px; font-size: 13px; background: #f8f9fa;">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                옵션명 <span style="color: #dc3545;">*</span>
            </label>
            <input type="text" id="addOrderOption" value="${order['옵션명'] || ''}" 
                   style="width: 100%; padding: 8px; border: 2px solid #ec4899; 
                          border-radius: 6px; font-size: 13px;">
        </div>
    </div>
    
    <!-- 두 번째 줄: 수량, 단가, 택배비, 판매가 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 12px; margin-bottom: 12px;">
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                수량 <span style="color: #dc3545;">*</span>
            </label>
            <input type="number" id="addOrderQty" value="1" min="1"
                   style="width: 100%; padding: 8px; border: 2px solid #ec4899; 
                          border-radius: 6px; font-size: 13px;"
                   oninput="OrderSearchHandlerInstance.calculateTotalPrice()">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                단가
            </label>
            <input type="text" id="addOrderPrice" placeholder="0"
                   style="width: 100%; padding: 8px; border: 2px solid #ec4899; 
                          border-radius: 6px; font-size: 13px; text-align: right;"
                   oninput="OrderSearchHandlerInstance.formatAmountInput(this); OrderSearchHandlerInstance.calculateTotalPrice();">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                택배비
            </label>
            <input type="text" id="addOrderShipping" placeholder="0"
                   style="width: 100%; padding: 8px; border: 2px solid #ec4899; 
                          border-radius: 6px; font-size: 13px; text-align: right;"
                   oninput="OrderSearchHandlerInstance.formatAmountInput(this); OrderSearchHandlerInstance.calculateTotalPrice();">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                판매가 (단가×수량+택배비)
            </label>
            <div id="addOrderTotalPrice" 
                 style="width: 100%; padding: 8px; border: 2px solid #ec4899; 
                        border-radius: 6px; font-size: 13px; text-align: right;
                        background: #f0f8ff; color: #2563eb; font-weight: 500;">0</div>
        </div>
    </div>
    
    <!-- 세 번째 줄: 주문자 정보 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                주문자 <span style="color: #dc3545;">*</span>
            </label>
            <input type="text" id="addOrderBuyer" value="${order['주문자'] || ''}"
                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                          border-radius: 6px; font-size: 13px; color: #1d4ed8; font-weight: 500;">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                주문자 전화번호
            </label>
            <input type="text" id="addOrderBuyerPhone" 
                   value="${order['주문자전화번호'] || order['주문자 전화번호'] || ''}"
                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                          border-radius: 6px; font-size: 13px; color: #1d4ed8; font-weight: 500;">
        </div>
    </div>
    
    <!-- 네 번째 줄: 수령인 정보 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                수령인 <span style="color: #dc3545;">*</span>
            </label>
            <input type="text" id="addOrderReceiver" 
                   value="${order['수령인'] || order['수취인'] || ''}"
                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                          border-radius: 6px; font-size: 13px; color: #1d4ed8; font-weight: 500;">
        </div>
        <div>
            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                수령인 전화번호
            </label>
            <input type="text" id="addOrderReceiverPhone" 
                   value="${order['수령인전화번호'] || order['수취인전화번호'] || order['수령인 전화번호'] || ''}"
                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                          border-radius: 6px; font-size: 13px; color: #1d4ed8; font-weight: 500;">
        </div>
    </div>
                    
                    <!-- 다섯 번째 줄: 주소 (전체 너비) -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            주소 <span style="color: #dc3545;">*</span>
                        </label>
                        <input type="text" id="addOrderAddress" 
                               value="${order['주소'] || order['수령인주소'] || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                      border-radius: 6px; font-size: 13px;">
                    </div>
                    
                    <!-- 여섯 번째 줄: 배송메세지 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            배송메세지
                        </label>
                        <input type="text" id="addOrderMessage" value="${order['배송메세지'] || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                      border-radius: 6px; font-size: 13px;">
                    </div>
                    
                    <!-- 일곱 번째 줄: 특이사항, 발송요청일 -->
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                특이/요청사항
                            </label>
                            <input type="text" id="addOrderNote" value="고객 추가주문(포장동일,특품으로 발송)"
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                발송요청일
                            </label>
                            <input type="date" id="addOrderRequestDate" value=""
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                    </div>
                </div>
                
                <div style="padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; 
                     justify-content: flex-end; gap: 10px; background: #f8f9fa;">
                    <button onclick="document.getElementById('additionalOrderModal').remove();"
                            style="padding: 8px 20px; border: 1px solid #dee2e6; background: white; 
                                   color: #042848; border-radius: 6px; font-size: 13px; cursor: pointer;">
                        취소
                    </button>
                    <button onclick="OrderSearchHandlerInstance.submitAdditionalOrder();"
                            style="padding: 8px 20px; border: none; background: #2563eb; 
                                   color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
                        주문접수
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
},

// 판매가 계산 함수 추가
calculateTotalPrice() {
    const qty = parseInt(document.getElementById('addOrderQty').value) || 0;
    const price = parseFloat(String(document.getElementById('addOrderPrice').value || 0).replace(/,/g, '')) || 0;
    const shipping = parseFloat(String(document.getElementById('addOrderShipping').value || 0).replace(/,/g, '')) || 0;
    const total = (price * qty) + shipping;
    
    document.getElementById('addOrderTotalPrice').textContent = total.toLocaleString('ko-KR');
},


async submitAdditionalOrder() {
    // 필수 필드 검증
    const market = document.getElementById('addOrderMarket').value;
    const option = document.getElementById('addOrderOption').value;
    const qty = document.getElementById('addOrderQty').value;
    const buyer = document.getElementById('addOrderBuyer').value;
    const receiver = document.getElementById('addOrderReceiver').value;
    const address = document.getElementById('addOrderAddress').value;
    
    if (!market || !option || !qty || !buyer || !receiver || !address) {
        this.showMessage('필수 항목을 모두 입력하세요.', 'error');
        return;
    }
    
    this.showLoading();
    
    try {
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
        
        // 금액 필드 파싱 (천단위 쉼표 제거)
        const price = parseFloat(String(document.getElementById('addOrderPrice').value || 0).replace(/,/g, '')) || 0;
        const shipping = parseFloat(String(document.getElementById('addOrderShipping').value || 0).replace(/,/g, '')) || 0;
        const totalAmount = (price * parseInt(qty)) + shipping;
        
        const orderData = {
            userEmail: userEmail,
            orderData: {
                마켓명: market,
                옵션명: option,
                수량: qty,
                단가: price,
                택배비: shipping,
                상품금액: totalAmount,
                주문자: buyer,
                '주문자 전화번호': document.getElementById('addOrderBuyerPhone').value,
                수령인: receiver,
                '수령인 전화번호': document.getElementById('addOrderReceiverPhone').value,
                주소: address,
                배송메세지: document.getElementById('addOrderMessage').value,
                '특이/요청사항': document.getElementById('addOrderNote').value,
                발송요청일: document.getElementById('addOrderRequestDate').value
            }
        };
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'appendTempOrder',
                ...orderData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
    // 모달 닫기
    document.getElementById('additionalOrderModal').remove();
    
    // 결과 안내 모달 표시
    this.showOrderConfirmModal(result.receiptNumber, result.orderTime, orderData.orderData);
    
    // OrderInputHandler의 loadTempOrders 호출하여 화면 갱신
    if (window.OrderInputHandler) {
        window.OrderInputHandler.loadTempOrders();
    }
} else {
    throw new Error('추가주문 접수 실패');
}
        
    } catch (error) {
        console.error('추가주문 접수 오류:', error);
        this.showMessage('추가주문 접수 중 오류가 발생했습니다.', 'error');
    } finally {
        this.hideLoading();
    }
},



// 주문 접수 완료 확인 모달
showOrderConfirmModal(receiptNumber, orderTime, orderData) {
    // 기존 모달 제거
    const existingModal = document.getElementById('orderConfirmModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div id="orderConfirmModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
             background: rgba(0,0,0,0.5); z-index: 1001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 16px; max-width: 500px; width: 90%; 
                 box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid #dee2e6; background: #f8f9fa;">
                    <h3 style="font-size: 18px; font-weight: 500; color: #042848; margin: 0; text-align: center;">
                        ✅ 추가주문 접수 완료
                    </h3>
                </div>
                
                <div style="padding: 24px;">
                    <div style="background: #e7f3ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="text-align: center; color: #2563eb; font-size: 14px; font-weight: 500; margin-bottom: 12px;">
                            주문이 정상적으로 접수되었습니다
                        </div>
                        
                        <div style="background: white; padding: 12px; border-radius: 6px;">
                            <table style="width: 100%; font-size: 13px;">
                                <tr style="border-bottom: 1px solid #f1f3f5;">
                                    <td style="padding: 8px; color: #6c757d; width: 30%;">접수번호</td>
                                    <td style="padding: 8px; color: #042848; font-weight: 500;">
                                        ${receiptNumber || '자동생성됨'}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f3f5;">
                                    <td style="padding: 8px; color: #6c757d;">접수일시</td>
                                    <td style="padding: 8px; color: #042848;">
                                        ${orderTime || new Date().toLocaleString('ko-KR')}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f3f5;">
                                    <td style="padding: 8px; color: #6c757d;">주문자</td>
                                    <td style="padding: 8px; color: #042848; font-weight: 500;">
                                        ${orderData.주문자}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f3f5;">
                                    <td style="padding: 8px; color: #6c757d;">수령인</td>
                                    <td style="padding: 8px; color: #042848;">
                                        ${orderData.수령인}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f3f5;">
                                    <td style="padding: 8px; color: #6c757d;">옵션명</td>
                                    <td style="padding: 8px; color: #042848; font-weight: 500;">
                                        ${orderData.옵션명}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; color: #6c757d;">수량</td>
                                    <td style="padding: 8px; color: #042848; font-weight: 500;">
                                        ${orderData.수량}개
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                        <div style="font-size: 12px; color: #6c757d; text-align: center; line-height: 1.6;">
                            주문이 '주문접수' 시트에 저장되었습니다.<br>
                            주문입력 탭에서 확인하실 수 있습니다.
                        </div>
                    </div>
                </div>
                
                <div style="padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; 
                     justify-content: center; background: #f8f9fa;">
                    <button onclick="document.getElementById('orderConfirmModal').remove();"
                            style="padding: 10px 32px; border: none; background: #2563eb; 
                                   color: white; border-radius: 6px; font-size: 14px; font-weight: 500;
                                   cursor: pointer; transition: all 0.2s;">
                        확인
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // ESC 키로 닫기
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            document.getElementById('orderConfirmModal')?.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
},










// 마케팅고객등록 모달
async openMarketingModal() {
    const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
    if (checkedBoxes.length === 0) {
        this.showMessage('마케팅 고객으로 등록할 주문을 선택하세요.', 'error');
        return;
    }
    if (checkedBoxes.length > 1) {
        this.showMessage('마케팅 고객 등록은 한 번에 하나의 주문만 처리할 수 있습니다.', 'error');
        return;
    }

    const index = checkedBoxes[0].dataset.index;
    const order = this.getFilteredOrders()[index];
    
    if (!order) {
        this.showMessage('주문 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    this.showMarketingCustomerModal(order);
},

showMarketingCustomerModal(order) {
    // 기존 모달 제거
    const existingModal = document.getElementById('marketingModal');
    if (existingModal) existingModal.remove();
    
    // 결제일 처리 - 다양한 필드명 체크
    const paymentDate = order['결제일'] || order['주문일시'] || order['주문일'] || '';
    
    const modalHtml = `
        <div id="marketingModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
             background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 16px; max-width: 700px; width: 90%; 
                 max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid #dee2e6; background: #f8f9fa;">
                    <h3 style="font-size: 18px; font-weight: 500; color: #042848; margin: 0;">마케팅 고객 등록</h3>
                </div>
                
                <div style="padding: 20px;">
                    <!-- 안내 메시지 -->
                    <div style="background: #e7f3ff; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                        <div style="font-size: 13px; color: #2563eb;">
                            주문 정보를 기반으로 문자 마케팅 대상 고객으로 등록합니다.<br>
                            모든 항목은 수정 가능합니다.
                        </div>
                    </div>
                    
                    <!-- 첫 번째 줄: 이름, 전화번호 -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                이름 <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="text" id="marketingName" value="${order['주문자'] || ''}"
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                전화번호 <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="text" id="marketingPhone" 
                                   value="${order['주문자전화번호'] || order['주문자 전화번호'] || ''}"
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                    </div>
                    
                    <!-- 두 번째 줄: 주소 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            주소
                        </label>
                        <input type="text" id="marketingAddress" 
                               value="${order['주소'] || order['수령인주소'] || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                      border-radius: 6px; font-size: 13px;">
                    </div>
                    
                    <!-- 세 번째 줄: 이용마켓, 구매상품 -->
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 12px; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                이용마켓
                            </label>
                            <input type="text" id="marketingMarket" value="${order['마켓명'] || ''}"
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                                구매상품
                            </label>
                            <input type="text" id="marketingProduct" value="${order['옵션명'] || ''}"
                                   style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                          border-radius: 6px; font-size: 13px;">
                        </div>
                    </div>
                    
                    <!-- 네 번째 줄: 결제일 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            결제일
                        </label>
                        <input type="text" id="marketingPaymentDate" value="${paymentDate}"
                               style="width: 200px; padding: 8px; border: 1px solid #dee2e6; 
                                      border-radius: 6px; font-size: 13px;">
                    </div>
                    
                    <!-- 다섯 번째 줄: 고객정보 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            고객정보 (특이사항, 관심사, 구매패턴 등)
                        </label>
                        <textarea id="marketingCustomerInfo" 
                                  placeholder="예: VIP 고객, 정기구매, 선물용 구매 등"
                                  style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                         border-radius: 6px; font-size: 13px; min-height: 80px; resize: vertical;"></textarea>
                    </div>
                    
                    <!-- 여섯 번째 줄: 비고 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 400; color: #042848; margin-bottom: 4px;">
                            비고
                        </label>
                        <textarea id="marketingNote" 
                                  placeholder="추가 메모사항"
                                  style="width: 100%; padding: 8px; border: 1px solid #dee2e6; 
                                         border-radius: 6px; font-size: 13px; min-height: 60px; resize: vertical;"></textarea>
                    </div>
                </div>
                
                <div style="padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; 
                     justify-content: flex-end; gap: 10px; background: #f8f9fa;">
                    <button onclick="document.getElementById('marketingModal').remove();"
                            style="padding: 8px 20px; border: 1px solid #dee2e6; background: white; 
                                   color: #042848; border-radius: 6px; font-size: 13px; cursor: pointer;">
                        취소
                    </button>
                    <button onclick="OrderSearchHandlerInstance.submitMarketingCustomer();"
                            style="padding: 8px 20px; border: none; background: #2563eb; 
                                   color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
                        고객 등록
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
},

async submitMarketingCustomer() {
    // 필수 필드 검증
    const name = document.getElementById('marketingName').value.trim();
    const phone = document.getElementById('marketingPhone').value.trim();
    
    if (!name || !phone) {
        this.showMessage('이름과 전화번호는 필수 입력 항목입니다.', 'error');
        return;
    }
    
    this.showLoading();
    
    try {
        // 한국 시간 기준 날짜
        const now = new Date();
        const kstOffset = 9 * 60;
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const koreaDate = new Date(utcTime + (kstOffset * 60000));
        
        const registerDate = koreaDate.getFullYear() + '-' + 
                           String(koreaDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(koreaDate.getDate()).padStart(2, '0');
        
        const customerData = {
            등록일: registerDate,
            이름: name,
            전화번호: phone,
            주소: document.getElementById('marketingAddress').value.trim(),
            이용마켓: document.getElementById('marketingMarket').value.trim(),
            구매상품: document.getElementById('marketingProduct').value.trim(),
            결제일: document.getElementById('marketingPaymentDate').value.trim(),
            고객정보: document.getElementById('marketingCustomerInfo').value.trim(),
            비고: document.getElementById('marketingNote').value.trim()
        };
        
        const response = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'saveMarketingCustomer',
        data: customerData
    })
});
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('marketingModal').remove();
            
            // 성공 메시지 모달
            this.showMarketingSuccessModal(name, result.serialNumber);
        } else {
            throw new Error('고객 등록 실패');
        }
        
    } catch (error) {
        console.error('마케팅 고객 등록 오류:', error);
        this.showMessage('고객 등록 중 오류가 발생했습니다.', 'error');
    } finally {
        this.hideLoading();
    }
},

showMarketingSuccessModal(customerName, serialNumber) {
    const modalHtml = `
        <div id="marketingSuccessModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
             background: rgba(0,0,0,0.5); z-index: 1001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 16px; max-width: 400px; width: 90%; 
                 box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h3 style="font-size: 18px; font-weight: 500; color: #042848; margin-bottom: 12px;">
                        마케팅 고객 등록 완료
                    </h3>
                    <p style="font-size: 14px; color: #6c757d; margin-bottom: 20px;">
                        <strong style="color: #2563eb;">${customerName}</strong>님이<br>
                        문자 마케팅 대상 고객으로 등록되었습니다.<br>
                        <span style="font-size: 12px;">(등록번호: ${serialNumber || '자동생성'})</span>
                    </p>
                    <button onclick="document.getElementById('marketingSuccessModal').remove();"
                            style="padding: 10px 32px; border: none; background: #2563eb; 
                                   color: white; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        확인
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 3초 후 자동 닫기
    setTimeout(() => {
        const modal = document.getElementById('marketingSuccessModal');
        if (modal) modal.remove();
    }, 3000);
},






    // fullReset 추가
fullReset() {
    // 모든 데이터 초기화
    this.currentOrders = [];
    this.marketColors = {};
    this.tableHeaders = [];
    this.currentCsOrder = null;
    
    // 필터 초기화
    this.resetFilters();
    
    // DOM 완전 재렌더링
    const container = document.getElementById('om-panel-search');
    if (container) {
        container.innerHTML = '';
        this.render();
        this.initializeFilters();
        this.loadMarketList().then(() => {
            this.loadOrders();
        });
    }
    
    console.log('OrderSearchHandler 완전 초기화 완료');
},

async checkDuplicateCs() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'checkCsDuplicate',
                    orderData: {
                        주문번호: this.currentCsOrder['주문번호'] || '',
                        주문자: this.currentCsOrder['주문자'] || '',
                        수령인: this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'] || '',
                        옵션명: this.currentCsOrder['옵션명'] || ''
                    }
                })
            });
            
            const result = await response.json();
            return result.duplicate || { csRecord: false, tempSave: false };
        } catch (error) {
            console.error('중복 체크 실패:', error);
            return { csRecord: false, tempSave: false };
        }
    },

    async showCsConfirmModal(customerRequest, solution, duplicateCheck) {
        return new Promise((resolve) => {
            // 기존 확인 모달 제거
            const existingModal = document.getElementById('csConfirmModal');
            if (existingModal) existingModal.remove();
            
            // 해결방법 텍스트
            const solutionText = this.getSolutionText(solution);
            
            // 재발송 정보
            let resendInfo = '';
            if (solution === 'resend' || solution === 'partial-resend') {
                const resendOption = document.getElementById('csResendOption').value;
                const resendQty = document.getElementById('csResendQty').value;
                const resendReceiver = document.getElementById('csResendReceiver').value;
                const resendPhone = document.getElementById('csResendPhone').value;
                const resendAddress = document.getElementById('csResendAddress').value;
                const requestDate = document.getElementById('csRequestDate').value;
                
                resendInfo = `
                    <div style="background: #f0f8ff; padding: 12px; border-radius: 6px; margin-top: 12px;">
                        <h4 style="font-size: 14px; font-weight: 500; color: #2563eb; margin-bottom: 8px;">재발송 정보</h4>
                        <div style="font-size: 12px; color: #495057; line-height: 1.8;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <label style="min-width: 60px;">상품:</label>
                                <input type="text" id="confirmResendOption" value="${resendOption}" 
                                       style="flex: 1; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <label style="min-width: 60px;">수량:</label>
                                <input type="number" id="confirmResendQty" value="${resendQty}" min="1"
                                       style="width: 80px; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <label style="min-width: 60px;">수령인:</label>
                                <input type="text" id="confirmResendReceiver" value="${resendReceiver}" 
                                       style="flex: 1; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px; margin-right: 8px;">
                                <input type="text" id="confirmResendPhone" value="${resendPhone}" placeholder="전화번호"
                                       style="width: 120px; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <label style="min-width: 60px;">주소:</label>
                                <input type="text" id="confirmResendAddress" value="${resendAddress}" 
                                       style="flex: 1; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px;">
                            </div>
                            ${requestDate ? `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label style="min-width: 60px;">발송요청일:</label>
                                <input type="date" id="confirmRequestDate" value="${requestDate}" 
                                       style="padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px;">
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            // 부분환불 정보
            let refundInfo = '';
            if (solution === 'partial-refund') {
                const refundAmount = document.getElementById('csRefundAmount').textContent;
                refundInfo = `
                    <div style="background: #fff4e6; padding: 12px; border-radius: 6px; margin-top: 12px;">
                        <h4 style="font-size: 14px; font-weight: 500; color: #f59e0b; margin-bottom: 8px;">환불 정보</h4>
                        <div style="font-size: 12px; color: #495057;">
                            환불금액: <strong>${refundAmount}</strong>
                        </div>
                    </div>
                `;
            }
            
            // 중복 경고
            let duplicateWarning = '';
            if (duplicateCheck.csRecord && duplicateCheck.tempSave) {
                duplicateWarning = `
                    <div style="background: #fee2e2; padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #fecaca;">
                        <div style="color: #dc3545; font-weight: 500; font-size: 13px; margin-bottom: 4px;">⚠️ 중복 경고</div>
                        <div style="color: #7f1d1d; font-size: 12px;">
                            이 주문번호는 이미 CS기록과 주문접수에 등록되어 있습니다.<br>
                            중복 접수는 권장하지 않습니다. CS 접수를 취소하시겠습니까?
                        </div>
                    </div>
                `;
            } else if (duplicateCheck.csRecord) {
                duplicateWarning = `
                    <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #fde68a;">
                        <div style="color: #f59e0b; font-weight: 500; font-size: 13px; margin-bottom: 4px;">⚠️ 주의</div>
                        <div style="color: #78350f; font-size: 12px;">
                            이 주문번호는 이미 CS기록에 등록되어 있습니다.<br>
                            추가 재발송이 필요한 경우 계속 진행하세요.
                        </div>
                    </div>
                `;
            }
            
            const modalHtml = `
                <div id="csConfirmModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                     background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; border-radius: 16px; max-width: 600px; width: 90%; 
                         max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                        <div style="padding: 20px; border-bottom: 1px solid #dee2e6;">
                            <h3 style="font-size: 18px; font-weight: 500; color: #042848; margin: 0;">CS 접수 확인</h3>
                        </div>
                        
                        <div style="padding: 20px;">
                            ${duplicateWarning}
                            
                            <!-- 기본 정보 -->
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px; color: #495057;">
                                    <div><strong>마켓:</strong> ${this.currentCsOrder['마켓명']}</div>
                                    <div><strong>주문번호:</strong> ${this.currentCsOrder['주문번호']}</div>
                                    <div><strong>주문자:</strong> ${this.currentCsOrder['주문자']} (${this.currentCsOrder['주문자전화번호'] || ''})</div>
                                    <div><strong>수령인:</strong> ${this.currentCsOrder['수령인'] || this.currentCsOrder['수취인']} (${this.currentCsOrder['수령인전화번호'] || ''})</div>
                                    <div style="grid-column: 1 / -1;"><strong>주소:</strong> ${this.currentCsOrder['주소'] || ''}</div>
                                    <div><strong>상품:</strong> ${this.currentCsOrder['옵션명']}</div>
                                    <div><strong>수량:</strong> ${this.currentCsOrder['수량']}</div>
                                </div>
                            </div>
                            
                            <!-- CS 정보 -->
                            <div style="margin-bottom: 12px;">
                                <h4 style="font-size: 14px; font-weight: 500; color: #042848; margin-bottom: 8px;">CS 내용</h4>
                                <div style="background: white; border: 1px solid #dee2e6; padding: 10px; border-radius: 6px; 
                                     font-size: 13px; color: #495057; min-height: 60px;">
                                    ${customerRequest}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 12px;">
                                <h4 style="font-size: 14px; font-weight: 500; color: #042848; margin-bottom: 8px;">해결방법</h4>
                                <div style="background: #e7f3ff; padding: 8px 12px; border-radius: 6px; 
                                     font-size: 13px; color: #2563eb; font-weight: 500;">
                                    ${solutionText}
                                </div>
                            </div>
                            
                            ${resendInfo}
                            ${refundInfo}
                        </div>
                        
                        <div style="padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px;">
                            <button onclick="document.getElementById('csConfirmModal').remove(); window.OrderSearchHandlerInstance.confirmModalResolve(false);"
                                    style="padding: 8px 20px; border: 1px solid #dee2e6; background: white; 
                                           color: #042848; border-radius: 6px; font-size: 13px; cursor: pointer;">
                                취소
                            </button>
                            <button onclick="document.getElementById('csConfirmModal').remove(); window.OrderSearchHandlerInstance.confirmModalResolve(true);"
                                    style="padding: 8px 20px; border: none; background: ${duplicateCheck.csRecord && duplicateCheck.tempSave ? '#dc3545' : '#2563eb'}; 
                                           color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
                                ${duplicateCheck.csRecord && duplicateCheck.tempSave ? '그래도 접수' : 'CS 접수'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // resolve 함수를 전역에 저장
            window.OrderSearchHandlerInstance.confirmModalResolve = resolve;
        });
    },


};