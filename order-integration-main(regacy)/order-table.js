// ===========================
// 주문 테이블 모듈
// ===========================
const OrderTable = (function() {
    
    // ===========================
    // 테이블 생성
    // ===========================
    function render(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`컨테이너 '${containerId}'를 찾을 수 없습니다.`);
            return;
        }
        
        // 데이터가 없을 때
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-list">데이터가 없습니다</div>';
            return;
        }
        
        // 매핑 데이터 확인
        if (!window.mappingData || !window.mappingData.standardFields) {
            console.error('매핑 데이터가 없습니다.');
            container.innerHTML = '<div class="error-message">매핑 데이터를 로드 중입니다...</div>';
            return;
        }
        
        // 표준필드 가져오기
        const headers = window.mappingData.standardFields;
        
        // 필드 설정
        const fieldConfig = getFieldConfig();
        
        // HTML 생성
        const html = createTableHTML(headers, data, options, fieldConfig);
        container.innerHTML = html;
        
        // 이벤트 핸들러 등록
        if (options.afterRender) {
            options.afterRender();
        }
    }
    
    // ===========================
    // 필드 설정
    // ===========================
    function getFieldConfig() {
        return {
            widths: {
                '연번': 50,
                '마켓명': 100,
                '마켓': 60,
                '결제일': 150,
                '주문번호': 140,
                '상품주문번호': 140,
                '주문자': 70,
                '수령인': 70,
                '수취인': 70,
                '주문자전화번호': 120,
                '수취인전화번호': 120,
                '수령인전화번호': 120,
                '주소': 300,
                '수취인주소': 300,
                '수령인주소': 300,
                '배송메세지': 200,
                '배송메시지': 200,
                '옵션명': 160,
                '수량': 60,
                '단가': 80,
                '택배비': 80,
                '기타비용': 80,
                '정산예정금액': 90,
                '정산대상금액': 90,
                '상품금액': 80,
                '최종결제금액': 90,
                '셀러': 80,
                '셀러공급가': 90,
                '출고처': 80,
                '송장주체': 60,
                '벤더사': 100,
                '발송지명': 100,
                '발송지주소': 300,
                '발송지연락처': 120,
                '출고비용': 90,
                '택배사': 80,
                '송장번호': 140,
                '우편번호': 80
            },
            alignments: {
                center: ['마켓명', '연번', '결제일', '주문번호', '상품주문번호', '주문자', '수령인', '수취인', '옵션명', '수량', '마켓', '택배사', '우편번호'],
                right: ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '최종결제금액', '할인금액', '수수료1', '수수료2', '택배비', '단가', '기타비용'],
                left: ['주소', '수취인주소', '수령인주소', '배송메시지', '배송메세지', '발송지주소']
            },
            formats: {
                number: ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '최종결제금액', '할인금액', '수수료1', '수수료2', '택배비', '단가', '기타비용'],
                date: ['결제일', '발송일', '주문일']
            }
        };
    }
    
    // ===========================
    // 정렬 판단
    // ===========================
    function getAlignment(fieldName, config) {
        if (config.alignments.right.some(f => fieldName.includes(f))) return 'right';
        if (config.alignments.center.some(f => fieldName.includes(f))) return 'center';
        if (config.alignments.left.some(f => fieldName.includes(f))) return 'left';
        return 'center';
    }
    
    // ===========================
    // 값 포맷팅
    // ===========================
    function formatValue(value, fieldName, config) {
        if (!value && value !== 0) return '';
        
        // 숫자 포맷
        if (config.formats.number.some(f => fieldName.includes(f))) {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
            if (!isNaN(numValue)) {
                return numValue.toLocaleString('ko-KR');
            }
        }
        
        // 날짜 포맷
        if (config.formats.date.some(f => fieldName.includes(f))) {
            return formatDate(value);
        }
        
        return String(value);
    }
    
    // ===========================
    // 날짜 포맷
    // ===========================
    function formatDate(value) {
        if (!value) return '';
        
        const strValue = String(value);
        
        // 이미 올바른 형식인 경우
        if (strValue.match(/\d{4}-\d{2}-\d{2}/)) {
            return strValue.split(' ')[0];
        }
        
        return strValue;
    }
    
    // ===========================
    // 마켓 색상 가져오기
    // ===========================
    function getMarketStyle(marketName) {
        if (!window.mappingData || !window.mappingData.markets) {
            return { background: 'rgb(200,200,200)', color: '#000' };
        }
        
        const market = window.mappingData.markets[marketName];
        if (!market || !market.color) {
            return { background: 'rgb(200,200,200)', color: '#000' };
        }
        
        const rgb = market.color.split(',').map(Number);
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        
        return {
            background: `rgb(${market.color})`,
            color: brightness > 128 ? '#000' : '#fff'
        };
    }
    
    // ===========================
    // 테이블 HTML 생성
    // ===========================
    function createTableHTML(headers, data, options, config) {
        const showDelete = options.showDelete || false;
        const showCheckbox = options.showCheckbox || false;
        const showEdit = options.showEdit || false;
        const editable = options.editable || [];
        const maxHeight = options.maxHeight || '600px';
        const stickyHeader = options.stickyHeader !== false;
        
        let html = `<div style="overflow-x: auto; max-height: ${maxHeight}; position: relative;">`;
        html += '<table class="order-table" style="width: 100%; border-collapse: collapse;">';
        
        // colgroup 생성
        html += '<colgroup>';
        if (showCheckbox) {
            html += '<col style="width: 40px;">';
        }
        headers.forEach(header => {
            html += `<col style="width: ${config.widths[header] || 100}px;">`;
        });
        if (showDelete) {
            html += '<col style="width: 60px;">';
        }
        if (showEdit) {
            html += '<col style="width: 60px;">';
        }
        html += '</colgroup>';
        
        // 헤더 생성
        html += `<thead${stickyHeader ? ' style="position: sticky; top: 0; z-index: 30; background: white;"' : ''}>`;
        html += '<tr>';
        
        if (showCheckbox) {
            html += '<th style="text-align: center; background: #f8f9fa; border: 1px solid #dee2e6;">';
            html += '<input type="checkbox" id="checkAll" onchange="OrderTable.toggleAll(this)">';
            html += '</th>';
        }
        
        headers.forEach(header => {
            const width = config.widths[header] || 100;
            html += `<th style="width: ${width}px; text-align: center; background: #f8f9fa; padding: 8px; border: 1px solid #dee2e6; font-weight: 400;">${header}</th>`;
        });
        
        if (showDelete) {
            html += '<th style="text-align: center; background: #f8f9fa; border: 1px solid #dee2e6;">삭제</th>';
        }
        if (showEdit) {
            html += '<th style="text-align: center; background: #f8f9fa; border: 1px solid #dee2e6;">수정</th>';
        }
        
        html += '</tr>';
        html += '</thead>';
        
        // 바디 생성
        html += '<tbody>';
        
        data.forEach((row, index) => {
            html += `<tr data-index="${index}">`;
            
            if (showCheckbox) {
                html += '<td style="text-align: center; border: 1px solid #f1f3f5;">';
                html += `<input type="checkbox" class="row-checkbox" data-index="${index}">`;
                html += '</td>';
            }
            
            headers.forEach(header => {
                const value = row[header] || '';
                const alignment = getAlignment(header, config);
                const formattedValue = formatValue(value, header, config);
                const isEditable = editable.includes(header);
                
                // 마켓명 특별 처리
                if (header === '마켓명' && value) {
                    const style = getMarketStyle(value);
                    html += `<td style="background: ${style.background}; color: ${style.color}; font-weight: bold; text-align: center; border: 1px solid #f1f3f5; padding: 8px;">${formattedValue}</td>`;
                } else if (isEditable) {
                    html += `<td contenteditable="true" data-field="${header}" data-index="${index}" style="text-align: ${alignment}; border: 1px solid #f1f3f5; padding: 8px; cursor: text;">${formattedValue}</td>`;
                } else {
                    html += `<td style="text-align: ${alignment}; border: 1px solid #f1f3f5; padding: 8px;">${formattedValue}</td>`;
                }
            });
            
            if (showDelete) {
                html += '<td style="text-align: center; border: 1px solid #f1f3f5; padding: 4px;">';
                html += `<button onclick="${options.onDelete}(${index})" class="btn-remove">삭제</button>`;
                html += '</td>';
            }
            
            if (showEdit) {
                html += '<td style="text-align: center; border: 1px solid #f1f3f5; padding: 4px;">';
                html += `<button onclick="${options.onEdit}(${index})" class="btn-edit">수정</button>`;
                html += '</td>';
            }
            
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        
        // 요약 정보
        if (options.showSummary) {
            const totalAmount = data.reduce((sum, row) => {
                const amount = parseFloat(row['정산예정금액']) || 0;
                return sum + amount;
            }, 0);
            
            html += '<div class="order-table-summary" style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">';
            html += '<div style="font-size: 16px; font-weight: 400;">';
            html += `총 ${data.length}건 / `;
            html += `합계: ${totalAmount.toLocaleString('ko-KR')}원`;
            html += '</div>';
            
            // 저장 버튼 추가
            if (options.showSaveButton) {
                html += '<button onclick="' + options.onSave + '()" class="btn-save-sheets" style="padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 400;">구글 시트 저장</button>';
            }
            
            html += '</div>';
        }
        
        return html;
    }
    
    // ===========================
    // 체크박스 전체 선택
    // ===========================
    function toggleAll(checkbox) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    }
    
    // ===========================
    // 선택된 행 가져오기
    // ===========================
    function getSelectedRows() {
        const checkboxes = document.querySelectorAll('.row-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    }
    
    // ===========================
    // 퍼블릭 API
    // ===========================
    return {
        render: render,
        toggleAll: toggleAll,
        getSelectedRows: getSelectedRows,
        getFieldConfig: getFieldConfig,
        formatValue: formatValue,
        getMarketStyle: getMarketStyle
    };
})();

// 전역 노출
window.OrderTable = OrderTable;