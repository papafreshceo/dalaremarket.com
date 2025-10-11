window.OrderCsHandler = {
    csRecords: [],
    filteredRecords: [],
    currentPage: 1,
    recordsPerPage: 20,
    
    async init() {
        this.render();
        await this.loadCsRecords(); // 먼저 데이터 로드
        this.onDateRangeChange(); // 그 다음 날짜 설정 및 검색
    },




    setDefaultDateRange() {
        // setTimeout으로 DOM이 완전히 로드된 후 실행
        setTimeout(() => {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            // 날짜 포맷 (YYYY-MM-DD)
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const startDateInput = document.getElementById('searchStartDate');
            const endDateInput = document.getElementById('searchEndDate');
            
            if (startDateInput && endDateInput) {
                startDateInput.value = formatDate(sevenDaysAgo);
                endDateInput.value = formatDate(today);
                console.log('날짜 설정 완료:', formatDate(sevenDaysAgo), '~', formatDate(today));
            }
        }, 100);
    },



onDateRangeChange() {
        const range = document.getElementById('searchDateRange').value;
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();
        
        switch(range) {
            case 'today':
                startDate = today;
                endDate = today;
                break;
            case 'yesterday':
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                break;
            case 'last7':
                startDate.setDate(today.getDate() - 7);
                endDate = today;
                break;
            case 'last30':
                startDate.setDate(today.getDate() - 30);
                endDate = today;
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = today;
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'all':
                startDate = new Date('2020-01-01');
                endDate = today;
                break;
        }
        
        this.dateRange = {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
        
        // 검색 실행
        this.search();
    },




    
    render() {
        const container = document.getElementById('om-panel-cs');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .cs-container {
                    padding: 20px;
                    background: #fafafa;
                    min-height: calc(100vh - 200px);
                }
                
                /* 검색 섹션 */
                .cs-search-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }
                
                .search-header {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                    margin-bottom: 16px;
                }
                
                .search-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .search-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .search-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }
                
                .search-input {
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.2s;
                    color: #212529;
                    background: #ffffff;
                    font-weight: 300;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                /* date input 특별 처리 */
                input[type="date"].search-input {
                    color: #212529 !important;
                }
                
                input[type="date"].search-input::-webkit-calendar-picker-indicator {
                    filter: invert(0);
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                .search-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn-search {
                    padding: 10px 24px;
                    background: #2563eb;
                    color: #ffffff;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .btn-search:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
                }
                
                .btn-search:active {
                    transform: translateY(0);
                }
                
                .btn-reset {
                    padding: 10px 24px;
                    background: #ffffff;
                    color: #495057;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-reset:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .btn-reset:active {
                    transform: translateY(0);
                }
                /* 통계 카드 */
                .cs-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .stat-card {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: #212529;
                    margin-bottom: 4px;
                }
                
                .stat-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }
                
                /* 결과 테이블 */
                .cs-result-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    overflow: hidden;
                }
                
                .result-header {
                    padding: 16px 24px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .result-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }
                
                .result-count {
                    font-size: 14px;
                    color: #6c757d;
                }
                
                .table-wrapper {
                    overflow-x: auto;
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .cs-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .cs-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }
                
                .cs-table th {
                    padding: 12px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }
                
                .cs-table td {
                    padding: 10px 12px;
                    font-size: 13px;
                    color: #212529;
                    border-bottom: 1px solid #f1f3f5;
                }
                
                .cs-table tbody tr:hover {
                    background: #f8f9fa;
                }
                
                .cs-type-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .type-교환 { background: #dbeafe; color: #1d4ed8; }
                .type-반품 { background: #fee2e2; color: #dc2626; }
                .type-재발송 { background: #fef3c7; color: #d97706; }
                .type-기타 { background: #e5e7eb; color: #4b5563; }
                
                /* 페이지네이션 */
                .pagination {
                    padding: 16px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    border-top: 1px solid #dee2e6;
                }
                
                .page-btn {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    background: #ffffff;
                    color: #495057;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .page-btn:hover:not(:disabled) {
                    background: #f8f9fa;
                    border-color: #2563eb;
                    color: #2563eb;
                }
                
                .page-btn.active {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }
                
                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.3;
                }
                
                .detail-modal {
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
                
                .detail-modal.show {
                    display: flex;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    width: 600px;
                    max-width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
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
                }
                
                .detail-row {
                    display: flex;
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f3f5;
                }
                
                .detail-label {
                    width: 120px;
                    font-size: 13px;
                    color: #6c757d;
                }
                
                .detail-value {
                    flex: 1;
                    font-size: 13px;
                    color: #212529;
                }
            </style>
            
            <div class="cs-container">
                <!-- 검색 섹션 -->
                <!-- 검색 섹션 -->
                <div class="cs-search-section" style="padding: 16px 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <!-- 처리일자 -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 13px; color: #6c757d; white-space: nowrap; font-weight: 400;">처리일자</label>
                            <select id="searchDateRange" onchange="OrderCsHandler.onDateRangeChange()" 
                                    style="width: 110px; height: 36px; padding: 0 8px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px;">
                                <option value="today">오늘</option>
                                <option value="yesterday">어제</option>
                                <option value="last7" selected>최근 7일</option>
                                <option value="last30">최근 30일</option>
                                <option value="thisMonth">이번 달</option>
                                <option value="lastMonth">지난 달</option>
                                <option value="all">전체</option>
                            </select>
                        </div>
                        
                        <!-- 구분선 -->
                        <div style="width: 1px; height: 20px; background: #dee2e6;"></div>
                        
                        <!-- 해결방법 -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 13px; color: #6c757d; white-space: nowrap; font-weight: 400;">해결방법</label>
                            <select id="searchCsType" 
                                    style="width: 110px; height: 36px; padding: 0 8px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px;">
                                <option value="">전체</option>
                                <option value="사이트환불">사이트환불</option>
                                <option value="부분환불">부분환불</option>
                                <option value="재발송">재발송</option>
                                <option value="부분재발송">부분재발송</option>
                                <option value="반품">반품</option>
                            </select>
                        </div>
                        
                        <!-- 주문번호 -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 13px; color: #6c757d; white-space: nowrap; font-weight: 400;">주문번호</label>
                            <input type="text" id="searchOrderNo" placeholder="주문번호" 
                                   style="width: 140px; height: 36px; padding: 0 10px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px;">
                        </div>
                        
                        <!-- 이름검색 -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 13px; color: #6c757d; white-space: nowrap; font-weight: 400;">이름검색</label>
                            <input type="text" id="searchName" placeholder="주문자/수령인" 
                                   style="width: 120px; height: 36px; padding: 0 10px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px;">
                        </div>
                        
                        <!-- 처리상태 -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 13px; color: #6c757d; white-space: nowrap; font-weight: 400;">처리상태</label>
                            <select id="searchStatus" 
                                    style="width: 80px; height: 36px; padding: 0 8px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px;">
                                <option value="">전체</option>
                                <option value="접수">접수</option>
                                <option value="완료">완료</option>
                            </select>
                        </div>
                        
                        <!-- 빈 공간 채우기 -->
                        <div style="flex: 1;"></div>
                        
                        <!-- 버튼들 -->
                        <button class="btn-reset" onclick="OrderCsHandler.resetSearch()" 
                                style="height: 36px; padding: 0 18px; background: #ffffff; color: #495057; 
                                       border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; 
                                       font-weight: 400; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            초기화
                        </button>
                        <button class="btn-search" onclick="OrderCsHandler.search()" 
                                style="height: 36px; padding: 0 20px; background: #2563eb; color: white; 
                                       border: none; border-radius: 6px; font-size: 13px; font-weight: 400; 
                                       cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            검색
                        </button>
                    </div>
                </div>
                
                <!-- 통계 카드 -->
                <div class="cs-stats" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
                    <div class="stat-card" style="border-color: #dbeafe;">
                        <div class="stat-value" id="statSiteRefund" style="color: #2563eb;">0</div>
                        <div class="stat-label">사이트환불</div>
                    </div>
                    <div class="stat-card" style="border-color: #e0e7ff;">
                        <div class="stat-value" id="statPartialRefund" style="color: #6366f1;">0</div>
                        <div class="stat-label">부분환불</div>
                    </div>
                    <div class="stat-card" style="border-color: #fef3c7;">
                        <div class="stat-value" id="statResend" style="color: #f59e0b;">0</div>
                        <div class="stat-label">재발송</div>
                    </div>
                    <div class="stat-card" style="border-color: #fed7aa;">
                        <div class="stat-value" id="statPartialResend" style="color: #ea580c;">0</div>
                        <div class="stat-label">부분재발송</div>
                    </div>
                    <div class="stat-card" style="border-color: #fee2e2;">
                        <div class="stat-value" id="statReturn" style="color: #dc2626;">0</div>
                        <div class="stat-label">반품</div>
                    </div>
                </div>
                
                <!-- 결과 테이블 -->
                <div class="cs-result-section">
                    <div class="result-header">
                        <h3 class="result-title">CS 처리 내역</h3>
                        <span class="result-count">검색결과: <strong id="resultCount">0</strong>건</span>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="cs-table">
                            <thead>
                                <tr>
                                    <th>접수일</th>
                                    <th>해결방법</th>
                                    <th>주문번호</th>
                                    <th>마켓명</th>
                                    <th>주문자</th>
                                    <th>수령인</th>
                                    <th>옵션명</th>
                                    <th>CS 내용</th>
                                    <th>처리상태</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody id="csTableBody">
                                <!-- 동적 생성 -->
                            </tbody>
                        </table>
                        
                        <div id="emptyState" class="empty-state" style="display: none;">
                            <div class="empty-icon">📋</div>
                            <div>검색 결과가 없습니다</div>
                        </div>
                    </div>
                    
                    <div class="pagination" id="pagination">
                        <!-- 동적 생성 -->
                    </div>
                </div>
            </div>
            
            <!-- 상세 모달 -->
            <div id="csDetailModal" class="detail-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="margin: 0; font-size: 18px;">CS 상세 정보</h3>
                        <button onclick="OrderCsHandler.closeDetail()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- 동적 생성 -->
                    </div>
                </div>
            </div>
        `;
    },
    
    async loadCsRecords() {
    try {
        const tbody = document.getElementById('csTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">데이터를 불러오는 중...</td></tr>';
        }
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getCsRecords'
            })
        });
        
        const result = await response.json();
        console.log('=== CS 기록 디버깅 ===');
        console.log('API 응답:', result);
        console.log('데이터 개수:', result.data?.length);
        if (result.data && result.data.length > 0) {
            console.log('첫 번째 레코드:', result.data[0]);
            console.log('필드명들:', Object.keys(result.data[0]));
        }
        
        if (result.success && result.data) {
            this.csRecords = result.data;
            this.filteredRecords = [...this.csRecords];
            
            // 초기 통계 표시
            this.updateStats();
            this.displayRecords();
            this.updateResultCount();
            
            // 날짜 필터 적용
            setTimeout(() => {
                this.onDateRangeChange();
            }, 100);
        } else {
            this.csRecords = [];
            this.filteredRecords = [];
            this.displayRecords();
        }
    } catch (error) {
        console.error('CS 기록 로드 실패:', error);
    }
},
    
search() {
        console.log('검색 시작');
        console.log('전체 레코드:', this.csRecords);
        
        // dateRange가 없으면 초기화
        if (!this.dateRange) {
            this.onDateRangeChange();
            return;
        }
        
        const csType = document.getElementById('searchCsType').value;
        const orderNo = document.getElementById('searchOrderNo').value.toLowerCase();
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const status = document.getElementById('searchStatus').value;
        
        this.filteredRecords = this.csRecords.filter(record => {
            // 날짜 필터 - 접수일 필드 확인
            if (record.접수일 && this.dateRange) {
                // 날짜 문자열을 Date 객체로 변환
                let recordDate;
                if (record.접수일.includes('/')) {
                    // "2025/1/23" 형식
                    const parts = record.접수일.split('/');
                    recordDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (record.접수일.includes('-')) {
                    // "2025-01-23" 형식
                    recordDate = new Date(record.접수일);
                } else {
                    // "20250123" 형식
                    const year = record.접수일.substring(0, 4);
                    const month = record.접수일.substring(4, 6);
                    const day = record.접수일.substring(6, 8);
                    recordDate = new Date(year, month - 1, day);
                }
                
                // dateRange를 Date 객체로 변환하여 비교
                const startDate = new Date(this.dateRange.start);
                const endDate = new Date(this.dateRange.end);
                endDate.setHours(23, 59, 59, 999); // 종료일의 끝 시간으로 설정
                
                if (recordDate < startDate || recordDate > endDate) {
                    return false;
                }
            }
            
            // 해결방법 필터
            if (csType && record.해결방법 !== csType) {
                return false;
            }
            
            // 주문번호 필터
            if (orderNo) {
                const recordOrderNo = String(record.주문번호 || '').toLowerCase();
                if (!recordOrderNo.includes(orderNo)) {
                    return false;
                }
            }
            
            // 이름 필터 (주문자 또는 수령인)
            if (searchName) {
                const orderer = String(record.주문자 || '').toLowerCase();
                const receiver = String(record.수령인 || '').toLowerCase();
                if (!orderer.includes(searchName) && !receiver.includes(searchName)) {
                    return false;
                }
            }
            
            // 상태 필터 - '상태' 필드 사용
            if (status && record.상태 !== status) {
                return false;
            }
            
            return true;
        });
        
        console.log('필터링 결과:', this.filteredRecords.length + '건');
        console.log('필터된 레코드:', this.filteredRecords);
        
        this.currentPage = 1;
        this.displayRecords();
        this.updateResultCount();
        this.updateFilteredStats(); // 필터링된 통계 업데이트
    },
    

    updateFilteredStats() {
        // 필터링된 레코드 기준으로 통계 업데이트
        const stats = {
            siteRefund: this.filteredRecords.filter(r => r.해결방법 === '사이트환불').length,
            partialRefund: this.filteredRecords.filter(r => r.해결방법 === '부분환불').length,
            resend: this.filteredRecords.filter(r => r.해결방법 === '재발송').length,
            partialResend: this.filteredRecords.filter(r => r.해결방법 === '부분재발송').length,
            return: this.filteredRecords.filter(r => r.해결방법 === '반품').length
        };
        
        document.getElementById('statSiteRefund').textContent = stats.siteRefund;
        document.getElementById('statPartialRefund').textContent = stats.partialRefund;
        document.getElementById('statResend').textContent = stats.resend;
        document.getElementById('statPartialResend').textContent = stats.partialResend;
        document.getElementById('statReturn').textContent = stats.return;
    },




    resetSearch() {
        document.getElementById('searchDateRange').value = 'last7';
        document.getElementById('searchCsType').value = '';
        document.getElementById('searchOrderNo').value = '';
        document.getElementById('searchName').value = '';
        document.getElementById('searchStatus').value = '';
        
        this.onDateRangeChange(); // 날짜 범위 재설정
    },
    
    displayRecords() {
        const tbody = document.getElementById('csTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredRecords.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            this.renderPagination();
            return;
        }
        
        emptyState.style.display = 'none';
        
        const start = (this.currentPage - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;
        const pageRecords = this.filteredRecords.slice(start, end);
        
        tbody.innerHTML = pageRecords.map((record, index) => {
            const globalIndex = this.csRecords.indexOf(record);
            const isCompleted = record.처리상태 === '완료';
            
            return `
            <tr style="cursor: pointer;">
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.접수일 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.해결방법 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.주문번호 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.마켓명 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.주문자 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.수령인 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.옵션명 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record['CS 내용'] || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.상태 || '접수'}</td>
                <td>
                    <button 
                        onclick="OrderCsHandler.completeCs(${globalIndex}, event)" 
                        style="padding: 4px 12px; background: ${isCompleted ? '#6c757d' : '#10b981'}; 
                               color: white; border: none; border-radius: 4px; font-size: 12px; 
                               cursor: ${isCompleted ? 'not-allowed' : 'pointer'}; opacity: ${isCompleted ? '0.5' : '1'};"
                        ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? '완료됨' : '완료'}
                    </button>
                </td>
            </tr>
        `}).join('');
        
        this.renderPagination();
        this.updateResultCount();
    },
    
    renderPagination() {
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 이전 버튼
        html += `<button class="page-btn" onclick="OrderCsHandler.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>이전</button>`;
        
        // 페이지 번호
        for (let i = 1; i <= Math.min(totalPages, 10); i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="OrderCsHandler.goToPage(${i})">${i}</button>`;
        }
        
        // 다음 버튼
        html += `<button class="page-btn" onclick="OrderCsHandler.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>다음</button>`;
        
        pagination.innerHTML = html;
    },
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayRecords();
    },
    
    updateStats() {
        const stats = {
            siteRefund: this.csRecords.filter(r => r.해결방법 === '사이트환불').length,
            partialRefund: this.csRecords.filter(r => r.해결방법 === '부분환불').length,
            resend: this.csRecords.filter(r => r.해결방법 === '재발송').length,
            partialResend: this.csRecords.filter(r => r.해결방법 === '부분재발송').length,
            return: this.csRecords.filter(r => r.해결방법 === '반품').length
        };
        
        document.getElementById('statSiteRefund').textContent = stats.siteRefund;
        document.getElementById('statPartialRefund').textContent = stats.partialRefund;
        document.getElementById('statResend').textContent = stats.resend;
        document.getElementById('statPartialResend').textContent = stats.partialResend;
        document.getElementById('statReturn').textContent = stats.return;
    },
    
    updateResultCount() {
        document.getElementById('resultCount').textContent = this.filteredRecords.length;
    },
    
    showDetail(index) {
        const record = this.csRecords[index];
        if (!record) return;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">처리일시</div>
                <div class="detail-value">${record.처리일시 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">CS구분</div>
                <div class="detail-value"><span class="cs-type-badge type-${record.CS구분}">${record.CS구분}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">주문번호</div>
                <div class="detail-value">${record.주문번호 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">마켓명</div>
                <div class="detail-value">${record.마켓명 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">수령인</div>
                <div class="detail-value">${record.수령인 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">전화번호</div>
                <div class="detail-value">${record.전화번호 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">주소</div>
                <div class="detail-value">${record.주소 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">옵션명</div>
                <div class="detail-value">${record.옵션명 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">수량</div>
                <div class="detail-value">${record.수량 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">CS사유</div>
                <div class="detail-value">${record.CS사유 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">처리내용</div>
                <div class="detail-value">${record.처리내용 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">처리상태</div>
                <div class="detail-value">${record.처리상태 || '접수'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">담당자</div>
                <div class="detail-value">${record.담당자 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">메모</div>
                <div class="detail-value">${record.메모 || '-'}</div>
            </div>
        `;
        
        document.getElementById('csDetailModal').classList.add('show');
    },


    async completeCs(index, event) {
        // 이벤트 버블링 방지
        event.stopPropagation();
        
        const record = this.csRecords[index];
        if (!record || record.처리상태 === '완료') return;

        const confirmed = await modal.confirm('이 CS 건을 완료 처리하시겠습니까?', 'CS 완료 처리');
        if (!confirmed) return;

        try {
            // CS기록 시트 업데이트
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateCsStatus',
                    orderNumber: record.주문번호,
                    status: '완료'
                })
            });

            const result = await response.json();
            if (result.success) {
                // 로컬 데이터 업데이트
                record.처리상태 = '완료';
                this.displayRecords();
                await modal.alert('완료 처리되었습니다.');
            } else {
                await modal.alert('처리 중 오류가 발생했습니다.', '오류');
            }
        } catch (error) {
            console.error('CS 완료 처리 실패:', error);
            await modal.alert('처리 중 오류가 발생했습니다.', '오류');
        }
    },


    
    closeDetail() {
        document.getElementById('csDetailModal').classList.remove('show');
    },
    
    fullReset() {
        this.csRecords = [];
        this.filteredRecords = [];
        this.currentPage = 1;
        
        const container = document.getElementById('om-panel-cs');
        if (container) {
            container.innerHTML = '';
            this.render();
            this.loadCsRecords();
        }
        
        console.log('OrderCsHandler 완전 초기화 완료');
    }
};