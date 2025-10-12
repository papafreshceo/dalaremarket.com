// ===========================
// 전역 변수
// ===========================
let mappingData = null;

// API 기본 URL
const API_BASE = '';

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadMappingData();
    setupEventListeners();
    switchTab('ordermanage');
}

// ===========================
// API 호출 함수들
// ===========================
async function loadMappingData() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/mapping`);
        const data = await response.json();
        
        if (data.error) {
            showError('매핑 데이터 로드 실패: ' + data.error);
            hideLoading();
            return;
        }
        
        mappingData = data;
        window.mappingData = data;  // 전역 변수로 설정
        console.log('매핑 데이터 로드 완료:', mappingData);
    } catch (error) {
        showError('매핑 데이터 로드 실패: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===========================
// 이벤트 리스너 설정
// ===========================
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // 헤더 타이틀 클릭시 대시보드로 이동
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        headerTitle.addEventListener('click', function() {
            switchTab('dashboard');
        });
    }
}

function switchTab(tabName) {
    // 탭 버튼 활성화 상태 변경
    document.querySelectorAll('.tab-button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabName);
    });
    
    // 탭 컨텐츠 활성화 상태 변경
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // 설정 탭일 때 설정 모듈 로드
    if (tabName === 'settings') {
        loadSettingsTab();
    }
}

// 설정 탭 로드
async function loadSettingsTab() {
    const settingsTab = document.getElementById('settings-tab');
    if (!settingsTab) {
        console.error('settings-tab을 찾을 수 없습니다');
        return;
    }
    
    // iframe이 이미 있는지 확인
    if (settingsTab.querySelector('iframe')) {
        console.log('설정 iframe이 이미 로드되어 있습니다');
        return;
    }
    
    // iframe 생성
    const iframe = document.createElement('iframe');
    iframe.src = 'tab/settings/settings-module.html';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // iframe 로드 완료 후 관리자 권한 확인
    iframe.onload = function() {
        console.log('설정 iframe 로드 완료');
        
        // iframe 내부의 checkAdminAccess 함수 실행
        setTimeout(() => {
            if (iframe.contentWindow && iframe.contentWindow.checkAdminAccess) {
                iframe.contentWindow.checkAdminAccess();
            }
        }, 500);
    };
    
    settingsTab.innerHTML = '';
    settingsTab.appendChild(iframe);
}

// ===========================
// 날짜 및 숫자 포맷팅
// ===========================
function formatDate(value) {
    try {
        if (!value) return '';
        
        const strValue = String(value);
        
        // 이미 올바른 형식인 경우
        if (strValue.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
            return strValue;
        }
        
        // MM/DD/YY HH:MM:SS 형식 처리
        if (strValue.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
            const parts = strValue.split(' ');
            const datePart = parts[0];
            const timePart = parts[1] || '00:00:00';
            
            const dateParts = datePart.split('/');
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            let year = dateParts[2];
            
            if (year.length === 2) {
                year = '20' + year;
            }
            
            return `${year}-${month}-${day} ${timePart}`;
        }
        
        // Date 객체인 경우
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            const hours = String(value.getHours()).padStart(2, '0');
            const minutes = String(value.getMinutes()).padStart(2, '0');
            const seconds = String(value.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        
        // 엑셀 시리얼 번호인 경우
        if (typeof value === 'number' && value > 25569 && value < 50000) {
            const date = new Date((value - 25569) * 86400 * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day} 00:00:00`;
        }
        
        // YYYY-MM-DD 형식
        if (strValue.match(/\d{4}-\d{2}-\d{2}/)) {
            return strValue.split(' ')[0] + ' 00:00:00';
        }
        
        return strValue;
        
    } catch (error) {
        console.error('날짜 변환 오류:', error);
        return String(value);
    }
}

function parseNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    if (typeof value === 'number') {
        return value;
    }
    
    let strValue = String(value).trim();
    strValue = strValue.replace(/,/g, '');
    strValue = strValue.replace(/[₩￦]/g, '');
    strValue = strValue.replace(/[$¥£€]/g, '');
    strValue = strValue.replace(/\s/g, '');
    
    if (strValue.startsWith('(') && strValue.endsWith(')')) {
        strValue = '-' + strValue.substring(1, strValue.length - 1);
    }
    
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num;
}

function numberFormat(num) {
    return new Intl.NumberFormat('ko-KR').format(num);
}

function formatDateForDisplay(value) {
    if (!value) return '';
    
    let strValue = String(value || '');
    
    // MM/DD/YY 형식 변환
    if (strValue.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        const parts = strValue.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        const dateParts = datePart.split('/');
        const month = dateParts[0].padStart(2, '0');
        const day = dateParts[1].padStart(2, '0');
        let year = dateParts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day} ${timePart}`;
    }
    
    // 엑셀 시리얼 번호 변환
    if (/^\d{4,6}$/.test(strValue)) {
        const excelDate = parseInt(strValue);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} 00:00:00`;
    }
    
    return strValue;
}

// ===========================
// UI 헬퍼 함수들
// ===========================
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function showError(message) {
    showCenterMessage(message, 'error');
}

function showSuccess(message) {
    showCenterMessage(message, 'success');
}

// 중앙 메시지 표시 함수
function showCenterMessage(message, type = 'success', duration = 3000) {
    const msgEl = document.getElementById('centerMessage');
    if (!msgEl) return;
    
    msgEl.innerHTML = message;
    msgEl.className = `center-message ${type}`;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
        msgEl.style.display = 'none';
    }, duration);
}