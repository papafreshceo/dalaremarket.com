// ===========================
// 제품 매칭 모듈
// ===========================
const ProductMatching = (function() {
    // 프라이빗 변수
    let productData = {};
    let priceData = {};
    let unmatchedOptions = new Set();
    let modifiedCells = new Map(); // 수정된 셀 추적
    
    // ===========================
    // 제품 데이터 로드
    // ===========================
async function loadProductData() {
    try {
        console.log('제품 데이터 로드 시작...');
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getProductData'
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('제품 데이터 로드 실패:', result.error);
            return false;
        }
        
        productData = result.productData || {};
priceData = result.priceData || {};

console.log('프라이빗 productData 설정:', Object.keys(productData).length);

// window.productData에도 저장
window.productData = productData;
window.priceData = priceData;

console.log('window.productData 설정 후:', !!window.productData, Object.keys(window.productData || {}).length);
        return true;
    } catch (error) {
        console.error('제품 데이터 로드 오류:', error);
        return false;
    }
}
    
    // ===========================
    // 옵션명 매칭 처리
    // ===========================
    function matchOption(optionName) {
        if (!optionName || typeof optionName !== 'string') {
            return null;
        }
        
        const trimmedOption = optionName.trim();
        
        // 직접 매칭
        if (productData[trimmedOption]) {
            return productData[trimmedOption];
        }
        
        // 대소문자 무시 매칭
        const lowerOption = trimmedOption.toLowerCase();
        for (const [key, value] of Object.entries(productData)) {
            if (key.toLowerCase() === lowerOption) {
                return value;
            }
        }
        
        return null;
    }
    
    // ===========================
    // 주문 데이터에 제품 정보 적용
    // ===========================
    async function applyProductInfo(orderData) {
        if (!orderData || !Array.isArray(orderData)) {
            return orderData;
        }
        
        // 제품 데이터가 없으면 로드
        if (Object.keys(productData).length === 0) {
            await loadProductData();
        }
        
        unmatchedOptions.clear();
        
        orderData.forEach((row, index) => {
            const optionName = row['옵션명'];
            
            if (!optionName) {
                unmatchedOptions.add(`row-${index}`);
                return;
            }
            
            const matchedProduct = matchOption(optionName);
            
            if (matchedProduct) {
                // 매칭 성공 - 필드 채우기
                console.log('매칭된 제품 정보:', matchedProduct);  // 디버깅용
                
                // 필드가 비어있을 때만 채우기 (기존 값 보존)
                if (!row['출고처']) row['출고처'] = matchedProduct.출고처 || '';
                if (!row['송장주체']) row['송장주체'] = matchedProduct.송장주체 || '';
                if (!row['벤더사']) row['벤더사'] = matchedProduct.벤더사 || '';
                if (!row['발송지명']) row['발송지명'] = matchedProduct.발송지명 || '';
                if (!row['발송지주소']) row['발송지주소'] = matchedProduct.발송지주소 || '';
                if (!row['발송지연락처']) row['발송지연락처'] = matchedProduct.발송지연락처 || '';
                if (!row['출고비용']) row['출고비용'] = matchedProduct.출고비용 || 0;
                
                // 셀러공급가 설정 - 천단위 콤마 제거 후 계산
if (row['셀러'] && matchedProduct['셀러공급가']) {
    const quantity = parseInt(row['수량']) || 1;
    // 천단위 콤마 제거 후 숫자 변환
    const priceString = String(matchedProduct['셀러공급가']).replace(/,/g, '');
    const unitPrice = parseFloat(priceString) || 0;
    row['셀러공급가'] = unitPrice * quantity;
}
                
                row['_matchStatus'] = 'matched';
                
                console.log('업데이트된 행:', row);  // 디버깅용
            } else {
                // 매칭 실패
                unmatchedOptions.add(optionName);
                row['_matchStatus'] = 'unmatched';
            }
        });
        
        console.log('매칭 결과:', {
            total: orderData.length,
            unmatched: unmatchedOptions.size
        });
        
        return orderData;
    }
    
    // ===========================
    // 테이블 셀 편집 가능 설정
    // ===========================
    function enableCellEditing(td, rowIndex, fieldName) {
        const originalValue = td.textContent;
        td.contentEditable = true;
        td.classList.add('editable-cell');
        
        // 포커스 시 전체 선택
        td.addEventListener('focus', function() {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(td);
            selection.removeAllRanges();
            selection.addRange(range);
        });
        
        // 수정 완료 처리
        td.addEventListener('blur', function() {
            handleCellEdit(td, rowIndex, fieldName, originalValue);
        });
        
        // Enter 키 처리 - 줄바꿈 방지 및 편집 종료
        td.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();  // 줄바꿈 방지
                
                // 현재 행 찾기
                const currentRow = td.closest('tr');
                if (currentRow) {
                    // 모든 행의 선택 상태 제거
                    const tbody = document.getElementById('resultTableBody');
                    tbody.querySelectorAll('tr.selected-row').forEach(row => {
                        row.classList.remove('selected-row');
                    });
                    
                    // 현재 행 선택 상태로 설정
                    currentRow.classList.add('selected-row');
                }
                
                td.blur();  // 포커스 제거하여 편집 종료
            }
        });
    }
    
    // ===========================
    // 셀 수정 처리
    // ===========================
    function handleCellEdit(td, rowIndex, fieldName, originalValue) {
        const newValue = td.textContent.trim();
        
        if (newValue !== originalValue) {
            // processedData 업데이트
            if (processedData && processedData.data[rowIndex]) {
                processedData.data[rowIndex][fieldName] = newValue;
                
                // 수정된 셀 추적
                const cellKey = `${rowIndex}-${fieldName}`;
                modifiedCells.set(cellKey, {
                    original: originalValue,
                    modified: newValue
                });
                
                // 즉시 재매칭 시도
                if (fieldName === '옵션명') {
                    const matchedProduct = matchOption(newValue);
                    const row = processedData.data[rowIndex];
                    
                    // 기존 클래스 모두 제거
                    td.classList.remove('unmatched-cell', 'modified-cell', 'modified-matched-cell');
                    
                    if (matchedProduct) {
                        // 매칭 성공
                        td.classList.add('modified-matched-cell');
                        row['_matchStatus'] = 'modified-matched';
                        
                        // 제품 정보 업데이트
                        row['출고처'] = matchedProduct.출고처 || '';
                        row['송장주체'] = matchedProduct.송장주체 || '';
                        row['벤더사'] = matchedProduct.벤더사 || '';
                        row['발송지명'] = matchedProduct.발송지명 || '';
                        row['발송지주소'] = matchedProduct.발송지주소 || '';
                        row['발송지연락처'] = matchedProduct.발송지연락처 || '';
                        row['출고비용'] = matchedProduct.출고비용 || 0;
                        
                        // 셀러공급가 업데이트
                        if (row['셀러'] && matchedProduct['셀러공급가']) {
                            const quantity = parseInt(row['수량']) || 1;
                            const unitPrice = parseFloat(matchedProduct['셀러공급가']) || 0;
                            row['셀러공급가'] = unitPrice * quantity;
                        }
                        
                        console.log(`매칭 성공: ${newValue}`);
                    } else {
                        // 매칭 실패
                        td.classList.add('modified-cell');
                        row['_matchStatus'] = 'modified';
                        console.log(`매칭 실패: ${newValue}`);
                    }
                } else {
                    // 옵션명이 아닌 경우
                    td.classList.remove('unmatched-cell');
                    td.classList.add('modified-cell');
                }
                
                console.log(`셀 수정: [${rowIndex}][${fieldName}] ${originalValue} → ${newValue}`);
            }
        }
    }
    
    // ===========================
    // 옵션명 검증
    // ===========================
    async function verifyOptions() {
        const button = document.getElementById('verifyOptions');
        button.disabled = true;
        button.textContent = '검증 중...';
        
        try {
            console.log('검증 시작 - processedData 확인:', window.processedData);
            
            // 제품 데이터 다시 로드
            const loadResult = await loadProductData();
            console.log('제품 데이터 로드 결과:', loadResult);
            
            // OrderExcelHandler에서 전달받은 데이터 사용
let dataToVerify = window.processedData || 
                   window.OrderExcelHandler?.processedData || 
                   parent.window?.processedData ||
                   (window.OrderExcelHandler?.getProcessedData ? window.OrderExcelHandler.getProcessedData() : null);

console.log('데이터 소스 확인:', {
    windowData: !!window.processedData,
    handlerData: !!window.OrderExcelHandler?.processedData,
    parentData: !!parent.window?.processedData
});

if (!dataToVerify || !dataToVerify.data) {
    console.error('처리된 데이터를 찾을 수 없습니다');
    throw new Error('처리된 데이터가 없습니다.');
}

// processedData를 dataToVerify로 사용
const processedData = dataToVerify;
            
            let matchedCount = 0;
            let unmatchedCount = 0;
            let modifiedMatchedCount = 0;
            
            // 모든 행 재검증
            processedData.data.forEach((row, index) => {
                const optionName = row['옵션명'];
                const cellKey = `${index}-옵션명`;
                const wasModified = modifiedCells.has(cellKey);
                
                if (!optionName) {
                    unmatchedCount++;
                    row['_matchStatus'] = 'unmatched';
                    return;
                }
                
                const matchedProduct = matchOption(optionName);
                
                if (matchedProduct) {
                    // 매칭 성공
                    if (wasModified) {
                        modifiedMatchedCount++;
                        row['_matchStatus'] = 'modified-matched';
                    } else {
                        matchedCount++;
                        row['_matchStatus'] = 'matched';
                    }
                    
                    // 필드 업데이트
                    row['출고처'] = matchedProduct.출고처 || row['출고처'] || '';
                    row['송장주체'] = matchedProduct.송장주체 || row['송장주체'] || '';
                    row['벤더사'] = matchedProduct.벤더사 || row['벤더사'] || '';
                    row['발송지명'] = matchedProduct.발송지명 || row['발송지명'] || '';
                    row['발송지주소'] = matchedProduct.발송지주소 || row['발송지주소'] || '';
                    row['발송지연락처'] = matchedProduct.발송지연락처 || row['발송지연락처'] || '';
                    row['출고비용'] = matchedProduct.출고비용 || 0;
                    
                    // 셀러공급가 업데이트
                    if (row['셀러'] && matchedProduct['셀러공급가']) {
                        const quantity = parseInt(row['수량']) || 1;
                        const unitPrice = parseFloat(matchedProduct['셀러공급가']) || 0;
                        row['셀러공급가'] = unitPrice * quantity;
                    }
                } else {
                    unmatchedCount++;
                    row['_matchStatus'] = 'unmatched';
                }
            });
            
            // 테이블 다시 그리기
            updateTableStyles();
            
            // 결과 메시지 구성
            const message = `옵션명 검증 완료\n\n` +
                           `✓ 정상 매칭: ${matchedCount}개\n` +
                           `✓ 수정 후 매칭: ${modifiedMatchedCount}개\n` +
                           `✗ 매칭 실패: ${unmatchedCount}개`;
            
            // 모달 창 생성
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
            
            const headerColor = unmatchedCount > 0 ? '#dc3545' : '#10b981';
            
            modalContent.innerHTML = `
                <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 500; color: ${headerColor};">
                    옵션명 검증 결과
                </h3>
                <div style="line-height: 1.8; font-size: 15px; white-space: pre-line;">
                    ${message}
                </div>
                ${unmatchedCount > 0 ? `
                    <div style="margin-top: 20px; padding: 15px; background: #fee2e2; border-radius: 8px; border: 1px solid #fecaca;">
                        <p style="margin: 0; color: #dc3545; font-size: 14px;">
                            <strong>매칭 실패한 옵션명이 ${unmatchedCount}개 있습니다.</strong><br>
                            노란색으로 표시된 셀을 클릭하여 수정하거나,<br>
                            '옵션명 일괄수정' 버튼을 사용하세요.
                        </p>
                    </div>
                ` : ''}
            `;
            
            // 닫기 버튼
            const closeButton = document.createElement('button');
            closeButton.textContent = '닫기';
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
                font-weight: 400;
                transition: all 0.2s;
            `;
            
            closeButton.onmouseover = () => {
                closeButton.style.background = '#1d4ed8';
            };
            closeButton.onmouseout = () => {
                closeButton.style.background = '#2563eb';
            };
            
            closeButton.onclick = () => {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escHandler);
            };
            
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // ESC 키로 닫기
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
        } catch (error) {
            console.error('검증 오류:', error);
            showCenterMessage('옵션명 검증 중 오류가 발생했습니다.', 'error');
        } finally {
            button.disabled = false;
            button.textContent = '옵션명 검증';
        }
    }
    
    // ===========================
    // 테이블 스타일 업데이트
    // ===========================
    function updateTableStyles() {
        const tbody = document.getElementById('resultTableBody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        const headers = processedData.standardFields || [];
        const optionNameIndex = headers.indexOf('옵션명');
        
        if (optionNameIndex === -1) return;
        
        rows.forEach((tr, rowIndex) => {
            const td = tr.children[optionNameIndex];
            if (!td) return;
            
            const row = processedData.data[rowIndex];
            if (!row) return;
            
            // 기존 클래스 제거
            td.classList.remove('unmatched-cell', 'modified-cell', 'modified-matched-cell');
            
            // 상태에 따른 클래스 추가
            switch(row['_matchStatus']) {
                case 'unmatched':
                    td.classList.add('unmatched-cell');
                    enableCellEditing(td, rowIndex, '옵션명');
                    break;
                case 'modified':
                    td.classList.add('modified-cell');
                    enableCellEditing(td, rowIndex, '옵션명');
                    break;
                case 'modified-matched':
                    td.classList.add('modified-matched-cell');
                    break;
                case 'matched':
                default:
                    // 정상 매칭 - 스타일 없음
                    break;
            }
        });
    }
    
    // ===========================
    // 퍼블릭 API
    // ===========================
    return {
        loadProductData: loadProductData,
        applyProductInfo: applyProductInfo,
        verifyOptions: verifyOptions,
        updateTableStyles: updateTableStyles,
        enableCellEditing: enableCellEditing,
        getUnmatchedOptions: () => unmatchedOptions,
        getModifiedCells: () => modifiedCells,
        getProductData: () => productData,
        getPriceData: () => priceData
    };
})();

// 전역 함수로 노출 (HTML onclick에서 호출 가능)
window.ProductMatching = ProductMatching;