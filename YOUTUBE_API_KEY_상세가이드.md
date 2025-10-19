# YouTube API 키 발급 상세 가이드

## 📋 목차
1. [Google Cloud Console 접속](#1-google-cloud-console-접속)
2. [프로젝트 생성](#2-프로젝트-생성)
3. [YouTube Data API v3 활성화](#3-youtube-data-api-v3-활성화)
4. [API 키 생성](#4-api-키-생성)
5. [API 키 보안 설정](#5-api-키-보안-설정)
6. [환경 변수 설정](#6-환경-변수-설정)
7. [테스트](#7-테스트)

---

## 1. Google Cloud Console 접속

### 1-1. 웹사이트 방문
```
https://console.cloud.google.com/
```

### 1-2. 로그인
- Google 계정으로 로그인
- YouTube 채널을 관리하는 계정으로 로그인하는 것을 권장

### 1-3. 최초 접속 시
- "약관 동의" 체크 후 "동의 및 계속" 클릭
- 국가 선택: "대한민국"
- 이용약관 동의 체크 후 진행

---

## 2. 프로젝트 생성

### 2-1. 프로젝트 선택 메뉴 열기
![프로젝트 선택](https://via.placeholder.com/800x200?text=프로젝트+선택)

1. 화면 상단 좌측의 **"프로젝트 선택"** 드롭다운 클릭
2. 또는 상단 네비게이션 바에서 프로젝트 이름 클릭

### 2-2. 새 프로젝트 만들기
![새 프로젝트](https://via.placeholder.com/800x400?text=새+프로젝트+만들기)

1. 팝업 창 우측 상단의 **"새 프로젝트"** 버튼 클릭

2. 프로젝트 정보 입력:
   - **프로젝트 이름**: `달래마켓 YouTube` (원하는 이름 입력)
   - **조직**: 선택 안 함 (개인 사용)
   - **위치**: 조직 없음

3. **"만들기"** 버튼 클릭

4. 생성 완료까지 10~30초 대기

5. 알림 벨 아이콘에서 "프로젝트 생성 완료" 확인

6. **"프로젝트 선택"** 클릭하여 새로 만든 프로젝트로 전환

---

## 3. YouTube Data API v3 활성화

### 3-1. API 라이브러리 열기
![API 라이브러리](https://via.placeholder.com/800x400?text=API+라이브러리)

**방법 1: 메뉴에서**
1. 좌측 상단 ☰ (햄버거 메뉴) 클릭
2. **"API 및 서비스"** 선택
3. **"라이브러리"** 클릭

**방법 2: 검색에서**
1. 상단 검색창에 "API 라이브러리" 입력
2. 결과에서 "API 라이브러리" 클릭

### 3-2. YouTube API 검색
![YouTube API 검색](https://via.placeholder.com/800x300?text=YouTube+API+검색)

1. 라이브러리 화면 상단 검색창에 입력:
   ```
   YouTube Data API v3
   ```

2. 자동완성 목록에서 **"YouTube Data API v3"** 클릭

### 3-3. API 활성화
![API 활성화](https://via.placeholder.com/800x400?text=API+활성화)

1. YouTube Data API v3 상세 페이지에서 **"사용"** 버튼 클릭

2. 활성화 완료까지 몇 초 대기

3. "API가 사용 설정됨" 메시지 확인

---

## 4. API 키 생성

### 4-1. 사용자 인증 정보 페이지 이동
![사용자 인증 정보](https://via.placeholder.com/800x300?text=사용자+인증+정보)

**방법 1: 활성화 후 자동 안내**
- API 활성화 후 "사용자 인증 정보 만들기" 버튼이 표시되면 클릭

**방법 2: 메뉴에서**
1. 좌측 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"** 클릭

### 4-2. API 키 생성
![API 키 생성](https://via.placeholder.com/800x500?text=API+키+생성)

1. 상단의 **"+ 사용자 인증 정보 만들기"** 버튼 클릭

2. 드롭다운 메뉴에서 **"API 키"** 선택

3. 팝업창이 나타나며 API 키가 자동 생성됨

4. **중요**: 생성된 API 키를 복사하여 안전한 곳에 저장
   ```
   예시: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. "키 제한" 버튼 클릭하여 보안 설정으로 이동

---

## 5. API 키 보안 설정

### 5-1. 애플리케이션 제한사항 설정
![애플리케이션 제한](https://via.placeholder.com/800x400?text=애플리케이션+제한)

1. **"애플리케이션 제한사항"** 섹션에서 **"HTTP 리퍼러(웹사이트)"** 선택

2. **"웹사이트 제한사항"** 섹션에서 **"항목 추가"** 클릭

3. 다음 도메인들을 하나씩 추가:

   **개발 환경:**
   ```
   http://localhost:3000/*
   ```

   **프로덕션 환경:**
   ```
   https://www.dalraemarket.com/*
   https://dalraemarket.com/*
   ```

4. 각 도메인 입력 후 Enter 키를 눌러 추가

### 5-2. API 제한사항 설정
![API 제한](https://via.placeholder.com/800x400?text=API+제한)

1. **"API 제한사항"** 섹션에서 **"키 제한"** 선택

2. 드롭다운 목록에서 **"YouTube Data API v3"** 체크

3. 다른 API는 모두 체크 해제

### 5-3. 저장
1. 화면 하단의 **"저장"** 버튼 클릭

2. "API 키가 업데이트되었습니다" 메시지 확인

3. 변경사항 적용까지 최대 5분 소요될 수 있음

---

## 6. 환경 변수 설정

### 6-1. 프로젝트 루트의 .env.local 파일 수정

```bash
# 기존 내용 유지하고 아래 내용 추가

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**주의사항:**
- `AIzaSyB...`를 실제 발급받은 API 키로 교체
- 앞뒤 공백 없이 입력
- 따옴표 없이 입력

### 6-2. .env.local.example 파일 업데이트 (선택사항)

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 6-3. .gitignore 확인

`.gitignore` 파일에 다음이 포함되어 있는지 확인:
```
.env.local
.env*.local
```

---

## 7. 테스트

### 7-1. 데이터베이스 마이그레이션 실행

```bash
npx supabase db push
```

**또는** Supabase Dashboard에서 직접 실행:
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. `supabase/migrations/20251018000004_create_youtube_videos_table.sql` 파일 내용 복사
5. 붙여넣기 후 "Run" 클릭

### 7-2. 개발 서버 재시작

```bash
# 기존 서버 중지 (Ctrl + C)

# 서버 재시작
npm run dev
```

### 7-3. YouTube 관리 페이지 접속

```
http://localhost:3000/admin/youtube
```

### 7-4. 채널 ID 가져오기

**방법 1: YouTube Studio에서**
1. https://studio.youtube.com/ 접속
2. 우측 상단 프로필 클릭 > "설정"
3. 좌측 메뉴에서 "채널" > "고급 설정"
4. "채널 ID" 복사 (UC로 시작하는 24자 문자열)

**방법 2: 채널 페이지에서**
1. YouTube에서 자신의 채널 접속
2. URL 확인:
   - `youtube.com/channel/UCxxxxxxxxxxxxxx` → 뒤의 UCxxxxxxxxxxxxxx가 채널 ID
   - `youtube.com/@username` → 페이지 소스 보기(Ctrl+U)에서 "channelId" 검색

**방법 3: 아무 영상에서**
1. 자신의 YouTube 채널에서 아무 영상 클릭
2. 영상 설명란에서 채널 이름 우클릭
3. "링크 주소 복사"
4. 복사된 URL에서 채널 ID 확인

### 7-5. 동기화 테스트

1. 채널 ID 입력란에 복사한 채널 ID 붙여넣기
   ```
   예시: UCxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **"동기화"** 버튼 클릭

3. 성공 시 알림:
   ```
   동기화 완료!

   채널: 채널 이름
   영상: N개
   ```

4. 영상 목록이 화면에 표시됨

---

## 🔍 문제 해결

### 오류 1: "YouTube API 키가 설정되지 않았습니다"

**원인:**
- 환경 변수가 설정되지 않음
- 개발 서버가 재시작되지 않음

**해결:**
1. `.env.local` 파일에 `YOUTUBE_API_KEY` 확인
2. 개발 서버 재시작 (npm run dev)
3. 브라우저 새로고침

### 오류 2: "403 Forbidden" 또는 "API key not valid"

**원인:**
- API 키가 잘못됨
- YouTube Data API v3가 활성화되지 않음
- HTTP 리퍼러 제한으로 인한 차단

**해결:**
1. Google Cloud Console에서 API 키 확인
2. YouTube Data API v3가 "사용 설정됨" 상태인지 확인
3. API 키 제한사항에서 `http://localhost:3000/*` 추가 확인
4. 브라우저 캐시 삭제 후 재시도

### 오류 3: "채널을 찾을 수 없습니다"

**원인:**
- 채널 ID가 잘못됨
- 공개되지 않은 채널

**해결:**
1. 채널 ID가 UC로 시작하는 24자 문자열인지 확인
2. YouTube에서 채널이 공개 상태인지 확인
3. 다른 방법으로 채널 ID 재확인

### 오류 4: "할당량 초과"

**원인:**
- 하루 할당량(10,000 units) 초과

**해결:**
1. 24시간 후 자동 리셋 대기
2. Google Cloud Console > "IAM 및 관리자" > "할당량"에서 사용량 확인
3. 필요 시 할당량 증가 요청

---

## 📊 API 할당량 관리

### 할당량 확인 방법

1. Google Cloud Console 접속
2. 좌측 메뉴: **"IAM 및 관리자"** > **"할당량"**
3. 검색: `YouTube Data API v3`
4. "Queries per day" 확인

### 할당량 사용량 (참고)

| 작업 | 사용량 |
|------|--------|
| 채널 정보 조회 | 1 unit |
| 플레이리스트 조회 | 1 unit |
| 영상 50개 정보 조회 | 1 unit |
| **1회 전체 동기화** | **약 3 units** |

**하루 최대 동기화 횟수:** 약 3,300회

### 할당량 증가 요청

1. 할당량 페이지에서 "Queries per day" 클릭
2. 우측의 "수정" 아이콘 클릭
3. 새로운 한도 입력
4. 요청 이유 작성
5. "제출" 클릭
6. Google 검토 후 승인 (보통 2-3일 소요)

---

## 🔐 보안 체크리스트

- [ ] API 키를 `.env.local`에만 저장
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] HTTP 리퍼러 제한 설정 완료
- [ ] API 제한사항에서 YouTube Data API v3만 선택
- [ ] 공개 저장소에 API 키 커밋하지 않음
- [ ] 프로덕션 환경 변수 별도 설정
- [ ] API 키 정기적 갱신 (6개월마다 권장)

---

## 📝 추가 참고 자료

- [YouTube Data API v3 공식 문서](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 할당량 및 비용](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube API 샘플 코드](https://github.com/youtube/api-samples)

---

## 💡 유용한 팁

### 1. 여러 환경에서 다른 API 키 사용

**개발 환경** (`.env.local`):
```bash
YOUTUBE_API_KEY=development_key_here
```

**프로덕션 환경** (`.env.production` 또는 Vercel/환경 변수):
```bash
YOUTUBE_API_KEY=production_key_here
```

### 2. API 키 교체 시

1. 새 API 키 생성
2. `.env.local`에서 키 교체
3. 개발 서버 재시작
4. 테스트 후 기존 키 삭제

### 3. 디버깅 모드

API 응답 확인을 위해 콘솔 로그 활성화:

`src/app/api/youtube/sync/route.ts`에서:
```typescript
console.log('API Response:', channelData);
console.log('Videos:', videosData);
```

브라우저 개발자 도구(F12) > Console 탭에서 확인

---

이 가이드를 따라하시면 YouTube API 키를 성공적으로 발급받고 사용할 수 있습니다! 🎉
