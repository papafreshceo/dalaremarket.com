// ================================
// 다래마켓 B2B 챗봇 - 스마트 라우팅 시스템
// ================================

// 전역 변수
let products = null; // 상품 데이터
let apiUsage = {
    today: 0,
    date: new Date().toDateString(),
    cacheHits: 0,
    keywordMatches: 0
}; // API 사용량 추적
let messageCache = new Map(); // 응답 캐싱

// 로컬 스토리지에서 대화 내역 및 사용량 불러오기
function loadFromStorage() {
    try {
        // 대화 내역 불러오기
        const savedMessages = localStorage.getItem('chatHistory');
        if (savedMessages) {
            const messages = JSON.parse(savedMessages);
            messages.forEach(msg => {
                addMessage(msg.text, msg.isUser, false); // 저장하지 않음
            });
        }

        // 사용량 불러오기
        const savedUsage = localStorage.getItem('apiUsage');
        if (savedUsage) {
            const usage = JSON.parse(savedUsage);
            // 날짜가 다르면 리셋
            if (usage.date === new Date().toDateString()) {
                apiUsage = usage;
            } else {
                // 자정 지났으면 초기화
                apiUsage = {
                    today: 0,
                    date: new Date().toDateString(),
                    cacheHits: 0,
                    keywordMatches: 0
                };
                localStorage.setItem('apiUsage', JSON.stringify(apiUsage));
            }
        }

        updateUsageStats();
    } catch (error) {
        console.error('스토리지 로드 오류:', error);
    }
}

// 사용량 업데이트
function updateUsageStats() {
    document.getElementById('aiUsage').textContent = apiUsage.today;
    document.getElementById('cacheHits').textContent = apiUsage.cacheHits;
    document.getElementById('keywordMatches').textContent = apiUsage.keywordMatches;

    // 로컬 스토리지에 저장
    localStorage.setItem('apiUsage', JSON.stringify(apiUsage));
}

// 상품 데이터 로드
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        console.log('✅ 상품 데이터 로드 완료:', products.products.length, '개 상품');
    } catch (error) {
        console.error('❌ 상품 데이터 로드 실패:', error);
    }
}

// ================================
// 스마트 라우팅 시스템 (70% 키워드, 20% DB, 10% AI)
// ================================

// 1단계: 키워드 매칭 (70% 처리)
function handleKeywordMatch(message) {
    const msg = message.toLowerCase();

    // FAQ 키워드 매칭
    if (products && products.faq) {
        for (const faq of products.faq) {
            if (faq.keywords.some(keyword => msg.includes(keyword))) {
                console.log('🎯 키워드 매칭 성공:', faq.question);
                apiUsage.keywordMatches++;
                updateUsageStats();
                return faq.answer;
            }
        }
    }

    // 회사 정보
    if (msg.includes('회사') || msg.includes('다래마켓') || msg.includes('소개')) {
        apiUsage.keywordMatches++;
        updateUsageStats();
        return `다래마켓 B2B는 신선한 농산물을 도매가로 공급하는 B2B 플랫폼입니다.\n\n📞 문의: ${products.company.phone}\n⏰ 영업시간: ${products.company.businessHours}`;
    }

    // 인사말
    if (msg.match(/^(안녕|하이|hi|hello|헬로)/)) {
        apiUsage.keywordMatches++;
        updateUsageStats();
        return '안녕하세요! 다래마켓 B2B입니다. 😊\n상품 가격, 재고, 배송 등 무엇이든 물어보세요!';
    }

    return null; // 매칭 실패
}

// 2단계: 데이터 조회 (20% 처리)
function handleDataQuery(message) {
    if (!products || !products.products) return null;

    const msg = message.toLowerCase();

    // 가격 문의
    if (msg.includes('가격') || msg.includes('얼마') || msg.includes('단가')) {
        // 특정 상품명이 포함되어 있는지 확인
        for (const product of products.products) {
            if (msg.includes(product.name.toLowerCase())) {
                const statusMsg = product.status === '출하중'
                    ? '✅ 현재 출하중입니다!'
                    : '⚠️ 현재 시즌이 종료되었습니다.';

                return `${product.name} 도매가 정보:\n\n💰 가격: ${product.price.toLocaleString()}원/${product.unit}\n📦 재고: ${product.stock > 0 ? product.stock + 'kg' : '품절'}\n🌸 시즌: ${product.season}\n${statusMsg}\n\n주문 문의: ${products.company.phone}`;
            }
        }

        // 상품명이 없으면 가격표 제공
        const availableProducts = products.products.filter(p => p.stock > 0);
        if (availableProducts.length > 0) {
            let priceList = '현재 출하중인 상품 가격표:\n\n';
            availableProducts.forEach(p => {
                priceList += `${p.name}: ${p.price.toLocaleString()}원/${p.unit}\n`;
            });
            return priceList + `\n📞 자세한 문의: ${products.company.phone}`;
        } else {
            return '죄송합니다. 현재 출하중인 상품이 없습니다.\n상품별 시즌은 다음과 같습니다:\n\n' +
                   '🌸 봄: 두릅, 블루베리, 가죽나무순\n' +
                   '☀️ 여름: 복숭아, 자두, 냉이, 달래\n' +
                   '🍂 가을: 감, 배, 대추';
        }
    }

    // 재고 문의
    if (msg.includes('재고') || msg.includes('있나') || msg.includes('있어')) {
        for (const product of products.products) {
            if (msg.includes(product.name.toLowerCase())) {
                const stockMsg = product.stock > 0
                    ? `✅ ${product.stock}kg 재고 있습니다!`
                    : '❌ 현재 품절 상태입니다.';

                return `${product.name} 재고 현황:\n\n${stockMsg}\n상태: ${product.status}\n\n주문 문의: ${products.company.phone}`;
            }
        }

        // 전체 재고 현황
        const inStock = products.products.filter(p => p.stock > 0);
        if (inStock.length > 0) {
            let stockList = '현재 재고 있는 상품:\n\n';
            inStock.forEach(p => {
                stockList += `${p.name}: ${p.stock}kg\n`;
            });
            return stockList;
        } else {
            return '죄송합니다. 현재 재고가 있는 상품이 없습니다.\n시즌별 상품은 해당 시기에 다시 입고됩니다.';
        }
    }

    // 카테고리 문의
    if (msg.includes('과일') || msg.includes('채소') || msg.includes('품목')) {
        const fruits = products.products.filter(p => p.mainCategory === '과일');
        const vegetables = products.products.filter(p => p.mainCategory === '채소');

        return `다래마켓 취급 품목:\n\n🍑 과일 (${fruits.length}종):\n` +
               `${[...new Set(fruits.map(p => p.category))].join(', ')}\n\n` +
               `🥬 채소 (${vegetables.length}종):\n` +
               `${[...new Set(vegetables.map(p => p.category))].join(', ')}\n\n` +
               `자세한 가격은 "가격 알려주세요"라고 물어보세요!`;
    }

    return null; // 데이터 조회 실패
}

// 3단계: AI API 호출 (10% 처리)
async function handleAIQuery(message) {
    // 일일 한도 체크
    if (apiUsage.today >= 1500) {
        console.warn('⚠️ AI API 일일 한도 초과');
        return '죄송합니다. 오늘 AI 상담 한도를 초과했습니다.\n기본 문의는 010-2688-1388로 전화주세요.';
    }

    try {
        // Gemini Flash API 호출
        const response = await callGeminiAPI(message);

        if (response) {
            apiUsage.today++;
            updateUsageStats();
            return response;
        }

        // 실패시 Cloudflare AI로 폴백
        console.log('🔄 Cloudflare AI로 폴백 시도...');
        const fallbackResponse = await callCloudflareAI(message);

        if (fallbackResponse) {
            apiUsage.today++;
            updateUsageStats();
            return fallbackResponse;
        }

        throw new Error('모든 AI API 호출 실패');
    } catch (error) {
        console.error('❌ AI API 호출 오류:', error);
        return '죄송합니다. 일시적인 오류가 발생했습니다.\n기본 문의는 010-2688-1388로 전화주세요.';
    }
}

// ================================
// AI API 연동
// ================================

// Gemini Flash API 호출
async function callGeminiAPI(message) {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.warn('⚠️ Gemini API 키가 설정되지 않았습니다.');
        return null;
    }

    try {
        // 컨텍스트 생성
        const context = `당신은 다래마켓 B2B의 상담 챗봇입니다.
회사 정보:
- 회사명: ${products.company.name}
- 전화: ${products.company.phone}
- 영업시간: ${products.company.businessHours}
- 배송: ${products.company.delivery}
- 최소주문: ${products.company.minOrder}

취급 품목: 과일(감, 대추, 복숭아, 배 등), 채소(두릅, 미나리, 달래 등)

친절하고 전문적으로 답변해주세요. 가격이나 재고는 "010-2688-1388로 문의해주세요"라고 안내하세요.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: context },
                                { text: `고객 질문: ${message}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API 오류: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Gemini API 응답 성공');

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('❌ Gemini API 오류:', error);
        return null;
    }
}

// Cloudflare AI API 호출 (폴백)
async function callCloudflareAI(message) {
    const CF_ACCOUNT_ID = ''; // TODO: Cloudflare Account ID
    const CF_API_TOKEN = ''; // TODO: Cloudflare API Token

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
        console.warn('⚠️ Cloudflare AI 설정이 없습니다.');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-2-7b-chat-int8`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: '당신은 다래마켓 B2B의 농산물 상담 챗봇입니다. 친절하게 답변하세요.'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudflare AI 오류: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Cloudflare AI 응답 성공');

        return data.result.response;
    } catch (error) {
        console.error('❌ Cloudflare AI 오류:', error);
        return null;
    }
}

// ================================
// 메인 메시지 처리
// ================================

async function processMessage(message) {
    console.log('📨 메시지 처리 시작:', message);

    // 캐시 확인
    if (messageCache.has(message)) {
        console.log('💾 캐시 히트!');
        apiUsage.cacheHits++;
        updateUsageStats();
        return messageCache.get(message);
    }

    // 1단계: 키워드 매칭 (70%)
    let response = handleKeywordMatch(message);
    if (response) {
        messageCache.set(message, response);
        return response;
    }

    // 2단계: 데이터 조회 (20%)
    response = handleDataQuery(message);
    if (response) {
        messageCache.set(message, response);
        return response;
    }

    // 3단계: AI API (10%)
    response = await handleAIQuery(message);
    messageCache.set(message, response);
    return response;
}

// ================================
// UI 처리
// ================================

// 메시지 추가
function addMessage(text, isUser = false, save = true) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    const now = new Date();
    timeDiv.textContent = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);

    // 스크롤 최하단으로
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 로컬 스토리지에 저장
    if (save) {
        try {
            const savedMessages = localStorage.getItem('chatHistory');
            const messages = savedMessages ? JSON.parse(savedMessages) : [];
            messages.push({ text, isUser, time: now.toISOString() });

            // 최대 50개까지만 저장
            if (messages.length > 50) {
                messages.shift();
            }

            localStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (error) {
            console.error('메시지 저장 오류:', error);
        }
    }
}

// 타이핑 효과
function showTypingIndicator() {
    document.getElementById('typingIndicator').classList.add('active');
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.remove('active');
}

// 메시지 전송
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // 사용자 메시지 표시
    addMessage(message, true);
    input.value = '';

    // 전송 버튼 비활성화
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;

    // 타이핑 인디케이터 표시
    showTypingIndicator();

    try {
        // 메시지 처리
        const response = await processMessage(message);

        // 응답 표시 (타이핑 효과)
        hideTypingIndicator();

        // 타이핑 효과를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));

        addMessage(response, false);
    } catch (error) {
        console.error('메시지 처리 오류:', error);
        hideTypingIndicator();
        addMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.', false);
    } finally {
        sendButton.disabled = false;
    }
}

// ================================
// 이벤트 리스너
// ================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 챗봇 초기화 시작...');

    // 상품 데이터 로드
    await loadProducts();

    // 스토리지에서 데이터 불러오기
    loadFromStorage();

    // 환영 메시지 시간 설정
    const welcomeTime = document.getElementById('welcomeTime');
    if (welcomeTime) {
        const now = new Date();
        welcomeTime.textContent = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 챗봇 토글
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeChatbot = document.getElementById('closeChatbot');

    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.add('active');
    });

    closeChatbot.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    // 메시지 전송
    const sendButton = document.getElementById('sendButton');
    const chatInput = document.getElementById('chatInput');

    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 빠른 버튼
    const quickButtons = document.querySelectorAll('.quick-button');
    quickButtons.forEach(button => {
        button.addEventListener('click', () => {
            const message = button.dataset.message;
            chatInput.value = message;
            sendMessage();
        });
    });

    // 사용량 통계 토글 (Alt + S)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 's') {
            const usageStats = document.getElementById('usageStats');
            usageStats.classList.toggle('show');
        }
    });

    console.log('✅ 챗봇 초기화 완료!');
});
