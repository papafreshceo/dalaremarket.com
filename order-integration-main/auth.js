// ========== 인증 관련 함수 ==========

// 로그인 화면 표시
function showLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
}

// 회원가입 화면 표시
function showSignUp() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
}

// 에러 메시지 표시
function showError(message, type = 'login') {
    const errorEl = type === 'signup' ? document.getElementById('signupErrorMsg') : document.getElementById('errorMsg');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

// 로딩 표시
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 로딩 숨기기
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 엔터키 처리
function handleEnter(event) {
    if (event.key === 'Enter') {
        signInWithEmail();
    }
}

// ========== 사용자 승인 관리 시스템 ==========

// 회원가입 함수
async function signUp() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;

    if (!email || !password || !name) {
        showError('모든 필드를 입력해주세요', 'signup');
        return;
    }

    showLoading();
    
    try {
        // Firebase Auth로 계정 생성
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 프로필 업데이트
        await user.updateProfile({
            displayName: name
        });
        
        // Firestore에 사용자 정보 저장 (미승인 상태)
        await db.collection('users').doc(user.uid).set({
            email: email,
            name: name,
            approved: false, // 기본값은 미승인
            role: 'user', // 기본 역할
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
        });
        
        // 자동 로그아웃
        await auth.signOut();
        
        hideLoading();
        alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.');
        showLogin();
    } catch (error) {
        hideLoading();
        handleAuthError(error, 'signup');
    }
}

// 이메일 로그인 함수
async function signInWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력해주세요');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Firestore에서 사용자 승인 상태 확인
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // 사용자 문서가 없는 경우 (기존 사용자)
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                name: user.displayName || email.split('@')[0],
                approved: email === ADMIN_EMAIL, // 관리자는 자동 승인
                role: email === ADMIN_EMAIL ? 'admin' : 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 관리자가 아닌 경우 승인 대기
            if (email !== ADMIN_EMAIL) {
                await auth.signOut();
                hideLoading();
                alert('계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.');
                return;
            }
        } else {
            const userData = userDoc.data();
            
            // 승인 확인
            if (!userData.approved && email !== ADMIN_EMAIL) {
                await auth.signOut();
                hideLoading();
                alert('계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.');
                return;
            }
            
            // 마지막 로그인 시간 업데이트
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Google 로그인 함수
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    showLoading();
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Firestore에서 사용자 정보 확인
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // 신규 사용자
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                name: user.displayName,
                approved: user.email === ADMIN_EMAIL, // 관리자는 자동 승인
                role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (user.email !== ADMIN_EMAIL) {
                await auth.signOut();
                hideLoading();
                alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.');
                return;
            }
        } else {
            const userData = userDoc.data();
            
            // 승인 확인
            if (!userData.approved && user.email !== ADMIN_EMAIL) {
                await auth.signOut();
                hideLoading();
                alert('계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.');
                return;
            }
            
            // 마지막 로그인 시간 업데이트
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// 로그아웃
function signOut() {
    auth.signOut().then(() => {
        console.log('로그아웃 성공');
        location.reload();
    }).catch((error) => {
        console.error('로그아웃 오류:', error);
    });
}

// Auth 에러 처리
function handleAuthError(error, type = 'login') {
    console.error('Auth error:', error);
    let message = '오류가 발생했습니다.';
    
    switch (error.code) {
        case 'auth/invalid-email':
            message = '잘못된 이메일 형식입니다.';
            break;
        case 'auth/user-disabled':
            message = '비활성화된 계정입니다.';
            break;
        case 'auth/user-not-found':
            message = '존재하지 않는 계정입니다.';
            break;
        case 'auth/wrong-password':
            message = '잘못된 비밀번호입니다.';
            break;
        case 'auth/email-already-in-use':
            message = '이미 사용 중인 이메일입니다.';
            break;
        case 'auth/weak-password':
            message = '비밀번호는 6자 이상이어야 합니다.';
            break;
        case 'auth/popup-closed-by-user':
            message = '로그인이 취소되었습니다.';
            break;
    }
    
    showError(message, type);
}

// 실시간 승인 상태 감시 (로그인한 사용자가 승인 취소되면 자동 로그아웃)
function watchApprovalStatus(user) {
    if (!user) return;
    
    const unsubscribe = db.collection('users').doc(user.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (!userData.approved && user.email !== ADMIN_EMAIL) {
                    // 승인이 취소된 경우
                    auth.signOut().then(() => {
                        alert('관리자에 의해 접근 권한이 취소되었습니다.');
                        location.reload();
                    });
                }
            }
        });
    
    return unsubscribe;
}

// Auth 상태 변경 감지
auth.onAuthStateChanged((user) => {
    const initialLoading = document.getElementById('initialLoading');
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    if (user) {
        // 로그인된 상태
        console.log('로그인됨:', user.email);
        
        // 실시간 승인 상태 감시 시작
        watchApprovalStatus(user);
        
        // UI 업데이트
        initialLoading.style.display = 'none';
        loginScreen.style.display = 'none';
        mainSystem.style.display = 'block';
        
        // 사용자 정보 표시
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }
        
        // 자동 로그아웃 초기화
        initIdleLogout();
        
        // 권한별 UI 조정
        checkUserRole(user);
    } else {
        // 로그아웃된 상태
        console.log('로그아웃됨');
        initialLoading.style.display = 'none';
        loginScreen.style.display = 'flex';
        mainSystem.style.display = 'none';
        
        // 자동 로그아웃 중지
        stopIdleLogout();
    }
});

// 사용자 권한 확인 및 UI 조정
async function checkUserRole(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            window.currentUserRole = userData.role; // 전역 변수로 저장
            
            // 관리자 배지 표시
            const roleElement = document.getElementById('userRole');
            if (roleElement) {
                if (userData.role === 'admin') {
                    roleElement.style.display = 'inline-block';
                    roleElement.textContent = 'ADMIN';
                } else {
                    roleElement.style.display = 'none';
                }
            }
            
            // 관리자 전용 탭에 아이콘 추가
            const adminOnlyTabs = ['dashboard', 'products', 'inventory', 'documents', 'settings'];
            
            if (userData.role === 'admin') {
                // 관리자인 경우 - 자물쇠 아이콘 추가
                adminOnlyTabs.forEach(tabName => {
                    const tab = document.querySelector(`[data-tab="${tabName}"]`);
                    if (tab && !tab.querySelector('.admin-lock')) {
                        const lockIcon = document.createElement('span');
                        lockIcon.className = 'admin-lock';
                        lockIcon.innerHTML = '🔓';
                        lockIcon.style.cssText = 'margin-left: 4px; font-size: 12px; opacity: 0.6;';
                        tab.appendChild(lockIcon);
                    }
                });
            }
            
            // 관리자가 아닌 경우 일부 기능 숨기기
            if (userData.role !== 'admin') {
                // 직원이 접근 못하는 탭 숨기기
                const hiddenTabs = ['dashboard', 'products', 'inventory', 'documents', 'settings'];
                
                hiddenTabs.forEach(tabName => {
                    const tab = document.querySelector(`[data-tab="${tabName}"]`);
                    if (tab) tab.style.display = 'none';
                });
                
                // 첫 번째 보이는 탭을 활성화
                const visibleTabs = document.querySelectorAll('.tab-button:not([style*="display: none"])');
                if (visibleTabs.length > 0) {
                    // 기존 active 제거
                    document.querySelectorAll('.tab-button.active').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-content.active').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // 첫 번째 보이는 탭 활성화 (주문통합관리)
                    visibleTabs[0].classList.add('active');
                    const firstTabName = visibleTabs[0].getAttribute('data-tab');
                    const firstTabContent = document.getElementById(`${firstTabName}-tab`);
                    if (firstTabContent) firstTabContent.classList.add('active');
                }
            }
            
            console.log('사용자 권한:', userData.role);
        }
    } catch (error) {
        console.error('권한 확인 오류:', error);
    }
}

// ========== 미사용 시간 기반 자동 로그아웃 ==========
let lastActivityTime = Date.now();
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1시간
const WARNING_TIME = 5 * 60 * 1000; // 5분 전 경고
let idleTimer = null;
let warningTimer = null;
let warningShown = false;
let countdownInterval = null;

// 활동 감지 이벤트
const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'input',
    'focus'
];

// 활동 감지 및 타이머 리셋
function resetIdleTimer() {
    lastActivityTime = Date.now();
    warningShown = false;
    
    // 경고 메시지 제거
    const warningEl = document.getElementById('idleWarning');
    if (warningEl) {
        warningEl.remove();
    }
    
    // 카운트다운 인터벌 정리
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // 기존 타이머 정리
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // 경고 타이머 설정 (55분 후)
    warningTimer = setTimeout(() => {
        showIdleWarning();
    }, IDLE_TIMEOUT - WARNING_TIME);
    
    // 로그아웃 타이머 설정 (60분 후)
    idleTimer = setTimeout(() => {
        performIdleLogout();
    }, IDLE_TIMEOUT);
}

// 경고 메시지 표시
function showIdleWarning() {
    if (warningShown || !auth.currentUser) return;
    warningShown = true;
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'idleWarning';
    warningDiv.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
    `;
    
    warningDiv.innerHTML = `
        <style>
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
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; margin-top: 2px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #856404; margin-bottom: 8px; font-size: 15px;">
                    자동 로그아웃 경고
                </div>
                <div style="font-size: 14px; color: #856404; margin-bottom: 12px; line-height: 1.4;">
                    장시간 미사용으로 5분 후 자동 로그아웃됩니다.<br>
                    계속 작업하시려면 아래 버튼을 클릭하세요.
                </div>
                <div id="countdown" style="font-size: 12px; color: #856404; margin-bottom: 12px;">
                    남은 시간: <span id="countdownTimer">5:00</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="resetIdleTimer()" style="
                        padding: 6px 16px;
                        background: #2563eb;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 400;
                    ">계속 작업</button>
                    <button onclick="performIdleLogout()" style="
                        padding: 6px 16px;
                        background: white;
                        color: #495057;
                        border: 1px solid #dee2e6;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 300;
                    ">지금 로그아웃</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    // 카운트다운 표시
    let remainingSeconds = 300; // 5분
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timerEl = document.getElementById('countdownTimer');
        if (timerEl) {
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

// 자동 로그아웃 수행
function performIdleLogout() {
    // 타이머 정리
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    
    // 이벤트 리스너 제거
    removeActivityListeners();
    
    // 로그아웃 수행
    auth.signOut().then(() => {
        alert('장시간 미사용으로 자동 로그아웃되었습니다. 다시 로그인해주세요.');
        location.reload();
    }).catch((error) => {
        console.error('자동 로그아웃 오류:', error);
        location.reload();
    });
}

// iframe 내부 활동도 감지
function attachIframeListeners() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            // iframe이 로드된 후 리스너 추가
            if (iframe.contentWindow && iframe.contentWindow.document) {
                activityEvents.forEach(event => {
                    iframe.contentWindow.document.addEventListener(event, resetIdleTimer, true);
                });
            }
            
            // iframe 로드 이벤트에도 리스너 추가
            iframe.addEventListener('load', function() {
                try {
                    activityEvents.forEach(event => {
                        iframe.contentWindow.document.addEventListener(event, resetIdleTimer, true);
                    });
                } catch(e) {
                    console.log('Cross-origin iframe detected, skipping activity listeners');
                }
            });
        } catch(e) {
            console.log('Cross-origin iframe detected, skipping activity listeners');
        }
    });
}

// 활동 리스너 추가
function addActivityListeners() {
    activityEvents.forEach(event => {
        document.addEventListener(event, resetIdleTimer, true);
    });
    
    // iframe 리스너도 추가
    setTimeout(attachIframeListeners, 1000);
    
    // 새로운 iframe이 추가될 때마다 리스너 재설정
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'IFRAME') {
                        setTimeout(attachIframeListeners, 500);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// 활동 리스너 제거
function removeActivityListeners() {
    activityEvents.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
    });
    
    // iframe 리스너도 제거
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            activityEvents.forEach(event => {
                iframe.contentWindow.document.removeEventListener(event, resetIdleTimer);
            });
        } catch(e) {
            // 크로스 오리진 iframe은 무시
        }
    });
}

// 탭 가시성 변경 감지
function handleVisibilityChange() {
    if (!document.hidden) {
        // 탭이 활성화됨
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed >= IDLE_TIMEOUT) {
            // 시간이 초과되었으면 즉시 로그아웃
            performIdleLogout();
        } else if (elapsed >= IDLE_TIMEOUT - WARNING_TIME && !warningShown) {
            // 경고 시간대에 있으면 경고 표시
            showIdleWarning();
        } else {
            // 아직 시간이 남았으면 타이머 리셋
            resetIdleTimer();
        }
    }
}

// 자동 로그아웃 초기화
function initIdleLogout() {
    // 이전 리스너 정리
    removeActivityListeners();
    
    // 활동 리스너 추가
    addActivityListeners();
    
    // 탭 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 타이머 초기화
    resetIdleTimer();
    
    console.log('미사용 시간 기반 자동 로그아웃 활성화 (1시간)');
}

// 자동 로그아웃 중지 (로그아웃 시)
function stopIdleLogout() {
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    removeActivityListeners();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// 디버깅용 전역 객체
window.idleDebug = {
    getLastActivity: () => {
        const date = new Date(lastActivityTime);
        return date.toLocaleTimeString('ko-KR');
    },
    getRemainingTime: () => {
        const elapsed = Date.now() - lastActivityTime;
        const remaining = IDLE_TIMEOUT - elapsed;
        if (remaining <= 0) return '시간 초과';
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}분 ${seconds}초`;
    },
    forceWarning: showIdleWarning,
    forceLogout: performIdleLogout,
    reset: resetIdleTimer,
    isActive: () => !!idleTimer
};