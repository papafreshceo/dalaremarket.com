# 달래마켓 B2B 통합 비즈니스 플랫폼

B2B 통합 비즈니스 플랫폼 - 내부 관리 시스템과 고객용 발주/분석 도구를 통합한 올인원 솔루션

## 🚀 기술 스택

- **프레임워크**: Next.js 15.5.4 (App Router)
- **언어**: TypeScript
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **스타일링**: Tailwind CSS + shadcn/ui
- **배포**: Vercel

## 📋 주요 기능

### 관리자 시스템
- 📦 주문통합관리
- 📊 상품/재고 관리
- 👥 고객/거래처 관리
- 💰 지출/인건비 관리
- 📈 대시보드 및 분석

### 사용자 플랫폼
- 🛒 발주 시스템
- 📱 상품 카탈로그
- 🔧 업무 도구
- 🤖 AI 어시스턴트

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/yourusername/dalraemarket.com.git
cd dalraemarket.com
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.example` 파일을 `.env.local`로 복사하고 실제 값으로 채우기:
```bash
cp .env.example .env.local
```

### 4. Supabase 데이터베이스 설정
1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `database/schema.sql` 파일 실행
3. `.env.local`에 Supabase URL과 키 입력

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
dalraemarket.com/
├── app/
│   ├── (admin)/          # 관리자 페이지
│   ├── (platform)/       # 사용자 페이지
│   ├── (auth)/          # 인증 페이지
│   └── api/             # API Routes
├── components/
│   ├── ui/              # 공통 UI 컴포넌트
│   ├── admin/           # 관리자 컴포넌트
│   └── platform/        # 사용자 컴포넌트
├── lib/
│   ├── supabase/        # Supabase 클라이언트
│   └── utils/           # 유틸리티 함수
├── types/               # TypeScript 타입 정의
└── public/             # 정적 파일
```

## 🔐 사용자 역할

- **super_admin**: 시스템 전체 관리
- **admin**: 일반 관리자
- **employee**: 직원
- **customer**: 일반 고객
- **vip_customer**: VIP 고객
- **partner**: 파트너사

## 📝 테스트 계정

### 관리자
- Email: admin@dalraemarket.com
- Password: admin123456

### 고객
- Email: customer@test.com
- Password: customer123456

## 🚀 배포

### Vercel 배포
```bash
npm run build
vercel --prod
```

### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수 설정:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📄 라이선스

MIT License

## 👥 팀

- 개발: [Your Name]
- 디자인: [Designer Name]

## 📞 문의

- Email: contact@dalraemarket.com
- Website: https://dalraemarket.com