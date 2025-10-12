# 🌾 다래마켓 B2B 농산물 챗봇

신선한 농산물 도매 상담을 위한 AI 챗봇입니다.

## ✨ 주요 기능

- 🤖 **스마트 라우팅**: 70% 키워드 매칭, 20% DB 조회, 10% AI 사용으로 비용 최적화
- 💰 **무료 AI API**: Gemini Flash (일 1,500 요청) + Cloudflare AI (폴백)
- 📦 **실시간 상품 조회**: 가격, 재고, 카테고리 확인
- 💾 **대화 내역 저장**: 로컬 스토리지에 자동 저장
- 📊 **사용량 관리**: 일일 API 사용량 추적 및 자정 자동 리셋
- 🎨 **녹색 테마**: 농산물 컨셉의 깔끔한 UI
- 📱 **모바일 반응형**: 모든 기기에서 최적화된 경험

## 🚀 빠른 시작

### 1. 파일 구조

```
agri-bot/
├── index.html          # 메인 페이지 + 챗봇 UI
├── chatbot.js          # 챗봇 로직 (스마트 라우팅, AI API)
├── products.json       # 상품 데이터
├── .env.example        # 환경 변수 예시
└── README.md           # 이 파일
```

### 2. 설치 방법

#### 방법 1: 정적 호스팅 (가장 간단)

1. **파일 다운로드**
   ```bash
   # 파일을 다운로드하거나 클론
   git clone [repository-url]
   cd agri-bot
   ```

2. **환경 변수 설정**
   ```bash
   # .env.example을 복사하여 .env 생성
   cp .env.example .env

   # .env 파일을 열어서 API 키 입력
   ```

3. **API 키 설정**

   **Gemini API 키 발급:**
   - https://makersuite.google.com/app/apikey 접속
   - Google 계정으로 로그인
   - "Create API Key" 클릭
   - API 키를 복사하여 `chatbot.js` 297번째 줄에 입력:
     ```javascript
     const GEMINI_API_KEY = 'your_api_key_here';
     ```

   **Cloudflare AI 설정 (선택사항):**
   - https://dash.cloudflare.com 접속
   - Workers & Pages > AI 메뉴
   - Account ID 확인
   - API Token 생성
   - `chatbot.js` 359-360번째 줄에 입력:
     ```javascript
     const CF_ACCOUNT_ID = 'your_account_id';
     const CF_API_TOKEN = 'your_api_token';
     ```

4. **실행**
   ```bash
   # 간단한 웹 서버 실행 (방법 선택)

   # Python 3
   python -m http.server 8000

   # Node.js (http-server 사용)
   npx http-server -p 8000

   # VS Code의 Live Server 확장 사용
   # 또는 index.html을 브라우저에서 직접 열기 (CORS 오류 발생 가능)
   ```

5. **브라우저에서 확인**
   ```
   http://localhost:8000
   ```

#### 방법 2: Vercel 배포 (무료 호스팅)

1. **Vercel 계정 생성**
   - https://vercel.com 가입

2. **배포**
   ```bash
   # Vercel CLI 설치
   npm i -g vercel

   # 로그인
   vercel login

   # 배포
   vercel
   ```

3. **환경 변수 설정**
   - Vercel 대시보드에서 프로젝트 설정
   - Environment Variables 메뉴
   - `GEMINI_API_KEY`, `CF_ACCOUNT_ID`, `CF_API_TOKEN` 추가

#### 방법 3: Netlify 배포 (무료 호스팅)

1. **Netlify 계정 생성**
   - https://netlify.com 가입

2. **배포**
   - "Sites" > "Add new site" > "Deploy manually"
   - `agri-bot` 폴더를 드래그 앤 드롭

3. **환경 변수 설정**
   - Site settings > Environment variables
   - API 키 추가

## 📖 사용 방법

### 기본 사용

1. **챗봇 열기**: 우측 하단 녹색 버튼 클릭
2. **질문하기**: 입력창에 질문 입력 또는 빠른 버튼 클릭
3. **응답 확인**: AI가 자동으로 답변

### 질문 예시

```
✅ "반시 가격 얼마에요?"
✅ "복숭아 재고 있어요?"
✅ "배송은 어떻게 되나요?"
✅ "최소 주문 수량은?"
✅ "과일 뭐 있어요?"
✅ "영업시간 알려주세요"
```

### 관리자 기능

**사용량 통계 보기:**
- `Alt + S` 키를 누르면 우측 상단에 통계 표시
- AI 사용량, 캐시 히트, 키워드 매칭 횟수 확인

## 🔧 커스터마이징

### 1. 상품 데이터 수정

`products.json` 파일을 편집하여 상품 정보를 업데이트:

```json
{
  "products": [
    {
      "id": "p001",
      "name": "반시",
      "category": "감",
      "mainCategory": "과일",
      "unit": "kg",
      "price": 4500,
      "stock": 150,
      "season": "가을",
      "status": "출하중",
      "description": "30내 크기의 반시 감"
    }
  ]
}
```

### 2. FAQ 수정

`products.json`의 `faq` 섹션 편집:

```json
{
  "faq": [
    {
      "question": "최소 주문 수량",
      "keywords": ["최소", "주문", "수량"],
      "answer": "품목별 1개 이상 주문 가능합니다."
    }
  ]
}
```

### 3. 디자인 변경

`index.html`의 CSS 섹션에서 색상 변경:

```css
/* 메인 색상 변경 */
background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);

/* 녹색(#16a34a)을 원하는 색상으로 변경 */
```

### 4. 회사 정보 수정

`products.json`의 `company` 섹션 편집:

```json
{
  "company": {
    "name": "다래마켓 B2B",
    "phone": "010-2688-1388",
    "businessHours": "09:00-18:00",
    "orderDeadline": "오전 9시"
  }
}
```

## 💡 비용 최적화 전략

### 스마트 라우팅 시스템

1. **70% - 키워드 매칭** (무료)
   - "배송", "가격", "재고" 등 키워드 자동 감지
   - FAQ 데이터베이스에서 즉시 응답
   - **비용: 0원**

2. **20% - 데이터 조회** (무료)
   - 상품 정보, 재고 확인 등
   - `products.json`에서 조회
   - **비용: 0원**

3. **10% - AI API** (무료 티어)
   - 복잡한 질문만 AI 사용
   - Gemini Flash: 일 1,500 요청 무료
   - Cloudflare AI: 폴백용, 일 10,000 요청 무료
   - **비용: 0원**

### 추가 최적화

- **캐싱**: 동일 질문 재사용 (메모리 캐시)
- **일일 한도**: 1,500 요청 초과 시 자동 차단
- **자정 리셋**: 매일 자정에 사용량 자동 초기화
- **폴백 처리**: Gemini 실패 시 Cloudflare AI 사용

## 📊 성능 모니터링

### 사용량 확인

브라우저 개발자 도구 > 콘솔에서 로그 확인:

```javascript
✅ 상품 데이터 로드 완료: 20개 상품
🎯 키워드 매칭 성공: 배송 안내
💾 캐시 히트!
✅ Gemini API 응답 성공
```

### 로컬 스토리지 확인

브라우저 개발자 도구 > Application > Local Storage:

- `chatHistory`: 대화 내역 (최대 50개)
- `apiUsage`: API 사용량 통계

## 🔐 보안 주의사항

### API 키 보호

⚠️ **중요**: API 키를 공개 저장소에 커밋하지 마세요!

**안전한 방법:**

1. **프론트엔드 전용 (현재 방식)**
   - API 키가 브라우저에 노출됨
   - 개인 프로젝트나 내부 사용에만 적합
   - 일일 한도가 낮아 악용 위험 적음

2. **백엔드 사용 (권장)**
   ```
   프론트엔드 → 백엔드 API → AI API
   ```
   - Node.js Express 또는 Serverless Functions 사용
   - 환경 변수로 API 키 관리
   - 사용량 제한 및 인증 추가 가능

### .gitignore 설정

프로젝트에 `.gitignore` 파일 생성:

```
.env
.env.local
*.log
node_modules/
```

## 🛠️ 고급 기능 추가

### 1. 다크모드

`index.html`에 다크모드 토글 추가:

```javascript
// 다크모드 토글
document.body.classList.toggle('dark-mode');
```

### 2. 음성 인식

Web Speech API 사용:

```javascript
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  sendMessage(transcript);
};
```

### 3. 알림 기능

신상품 입고 시 알림:

```javascript
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification('신상품 입고!', {
        body: '반시가 입고되었습니다.'
      });
    }
  });
}
```

## 🐛 문제 해결

### CORS 오류

**문제**: `products.json` 로드 실패

**해결**:
```bash
# 로컬 웹 서버 사용 (파일:// 프로토콜 대신)
python -m http.server 8000
```

### API 키 오류

**문제**: "Gemini API 키가 설정되지 않았습니다"

**해결**:
1. `chatbot.js` 297번째 줄 확인
2. API 키를 따옴표 안에 입력
3. API 키 유효성 확인 (https://makersuite.google.com)

### 일일 한도 초과

**문제**: "오늘 AI 상담 한도를 초과했습니다"

**해결**:
1. 다음 날까지 대기 (자정에 자동 리셋)
2. Cloudflare AI 추가 설정
3. 키워드 매칭 강화로 AI 사용 줄이기

## 📚 API 문서

### Gemini Flash API

- 문서: https://ai.google.dev/docs
- 무료 티어: 일 1,500 요청
- 모델: `gemini-1.5-flash`

### Cloudflare AI

- 문서: https://developers.cloudflare.com/workers-ai/
- 무료 티어: 일 10,000 요청
- 모델: `@cf/meta/llama-2-7b-chat-int8`

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요!

## 📄 라이선스

MIT License

## 📞 문의

- 다래마켓 B2B: 010-2688-1388
- 영업시간: 09:00-18:00

---

**Made with ❤️ for 다래마켓 B2B**
