# YouTube API 설정 가이드

YouTube Data API v3를 사용하여 채널의 영상 정보를 가져오는 방법입니다.

## 1. Google Cloud Console에서 API 키 발급

### 1-1. Google Cloud Console 접속
1. https://console.cloud.google.com/ 접속
2. Google 계정으로 로그인

### 1-2. 프로젝트 생성
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "달래마켓")
4. "만들기" 클릭

### 1-3. YouTube Data API v3 활성화
1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. 검색창에 "YouTube Data API v3" 검색
3. "YouTube Data API v3" 클릭
4. "사용" 버튼 클릭

### 1-4. API 키 생성
1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. 상단의 "+ 사용자 인증 정보 만들기" 클릭
3. "API 키" 선택
4. API 키가 생성됨 (복사해두기)

### 1-5. API 키 제한 설정 (권장)
1. 생성된 API 키 옆의 편집 아이콘 클릭
2. "애플리케이션 제한사항"에서 "HTTP 리퍼러" 선택
3. 웹사이트 제한사항 추가:
   - `https://www.dalraemarket.com/*`
   - `http://localhost:3000/*` (개발용)
4. "API 제한사항"에서 "키 제한" 선택
5. "YouTube Data API v3" 체크
6. "저장" 클릭

## 2. 환경 변수 설정

`.env.local` 파일에 API 키 추가:

```bash
YOUTUBE_API_KEY=your_api_key_here
```

**주의**: 프로덕션 환경(.env.production)에도 동일하게 설정해야 합니다.

## 3. 데이터베이스 마이그레이션 실행

```bash
npx supabase db push
```

또는 Supabase Dashboard에서 직접 실행:
```bash
supabase/migrations/20251018000004_create_youtube_videos_table.sql
```

## 4. 채널 ID 찾기

### 방법 1: YouTube Studio에서
1. https://studio.youtube.com/ 접속
2. 우측 상단 프로필 아이콘 클릭 > "설정" 클릭
3. "채널" > "고급 설정" 선택
4. "채널 ID" 확인 (UC로 시작하는 24자리 문자열)

### 방법 2: 채널 URL에서
- 채널 URL이 `youtube.com/channel/UCxxxxxx` 형식이면 뒤의 UCxxxxxx가 채널 ID
- 채널 URL이 `youtube.com/@username` 형식이면:
  1. 채널 페이지 접속
  2. 아무 영상 클릭
  3. 영상 설명란에서 채널 링크 우클릭 > "링크 주소 복사"
  4. 복사된 URL에서 채널 ID 확인

### 방법 3: API로 찾기
사용자 이름으로 채널 ID 조회:
```
https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=USERNAME&key=YOUR_API_KEY
```

## 5. 사용 방법

### 5-1. 관리자 페이지 접속
```
http://localhost:3000/admin/youtube
```

### 5-2. 채널 동기화
1. 채널 ID 입력 (예: UCxxxxxxxxxxxxxx)
2. "동기화" 버튼 클릭
3. 최대 50개의 최신 영상이 자동으로 가져와집니다

### 5-3. 영상 관리
- **보기**: YouTube에서 영상 보기
- **활성화/비활성화**: HTML 빌더에서 사용 여부 제어
- **삭제**: 데이터베이스에서 영상 정보 삭제 (YouTube 영상은 삭제되지 않음)

## 6. API 할당량

YouTube Data API v3는 일일 할당량이 있습니다:
- 기본 할당량: **10,000 units/day**
- 채널 동기화 1회: 약 **103 units** 사용
  - channels.list: 1 unit
  - playlistItems.list: 1 unit
  - videos.list: 1 unit (50개 영상)
- 하루에 약 **97번** 동기화 가능

### 할당량 확인
1. Google Cloud Console 접속
2. "API 및 서비스" > "할당량" 선택
3. "YouTube Data API v3" 검색하여 사용량 확인

### 할당량 초과 시
- 24시간 후 자동 리셋
- 또는 Google Cloud Console에서 할당량 증가 요청 가능

## 7. 문제 해결

### "YouTube API 키가 설정되지 않았습니다" 오류
- `.env.local` 파일에 `YOUTUBE_API_KEY` 추가 확인
- 개발 서버 재시작

### "채널을 찾을 수 없습니다" 오류
- 채널 ID가 정확한지 확인
- API 키가 유효한지 확인

### "할당량 초과" 오류
- 24시간 후 재시도
- Google Cloud Console에서 할당량 확인

## 8. 보안 주의사항

⚠️ **절대로 API 키를 공개 저장소에 커밋하지 마세요!**

- `.env.local`은 `.gitignore`에 포함되어 있는지 확인
- API 키가 유출되면 즉시 Google Cloud Console에서 삭제하고 새로 발급
- 프로덕션 환경에서는 반드시 HTTP 리퍼러 제한 설정
