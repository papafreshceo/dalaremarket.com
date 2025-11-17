# Realtime 채팅 안정화 가이드

## 문제점
채팅이 간헐적으로만 작동하는 이유:
1. **브라우저 캐싱** - 코드 업데이트 후 브라우저가 이전 버전 사용
2. **Realtime Publication 미설정** - Supabase에서 messages 테이블에 대한 Realtime이 활성화되지 않음

## 해결 방법

### 1단계: Realtime Publication 설정 (필수)

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **Database** → **Replication** 메뉴 클릭
4. **supabase_realtime** publication 찾기
5. 다음 테이블들이 체크되어 있는지 확인:
   - ✅ `messages`
   - ✅ `message_threads`
   - ✅ `notifications`

만약 체크되어 있지 않다면:
- 테이블 옆 체크박스 클릭하여 추가
- 또는 SQL Editor에서 실행:

```sql
-- messages 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2단계: 브라우저 캐시 완전 삭제

**모든 사용자가 다음을 실행해야 함:**

#### Chrome/Edge:
1. `Ctrl + Shift + Delete` 눌러서 검색 기록 삭제 창 열기
2. **시간 범위**: "전체 기간"
3. 다음 항목만 체크:
   - ✅ 캐시된 이미지 및 파일
   - ✅ 쿠키 및 기타 사이트 데이터
4. "데이터 삭제" 클릭
5. 브라우저 **완전히 종료** (모든 창과 탭)
6. 브라우저 다시 열기
7. 사이트 접속 후 `Ctrl + Shift + R` (하드 리프레시)

#### Firefox:
1. `Ctrl + Shift + Delete`
2. 시간 범위: "전체"
3. "캐시" 체크
4. "지금 삭제"
5. 브라우저 완전히 종료 후 재시작

### 3단계: 테스트

1. **사용자 A**: 브라우저 캐시 삭제 후 로그인
2. **사용자 B**: 브라우저 캐시 삭제 후 로그인
3. 채팅창 열기 (F12로 콘솔 열어두기)
4. 사용자 A가 메시지 전송
5. 콘솔에서 다음 로그 확인:
   - `📡 [AgriChatbot] Realtime 구독 상태: SUBSCRIBED`
   - `✅ [AgriChatbot] Realtime 새 메시지 수신: [message-id]`
6. 사용자 B도 동일하게 확인

### 4단계: 문제가 계속되면

콘솔 로그를 캡처해서 보내주세요:
- F12 → Console 탭
- 메시지 주고받기
- 스크린샷 또는 로그 복사

## 체크리스트

런칭 전 확인사항:

- [ ] Supabase Realtime Publication에 messages, message_threads, notifications 테이블 추가됨
- [ ] RLS 정책이 Realtime을 차단하지 않음 (현재 정책 확인 완료)
- [ ] 모든 테스터가 브라우저 캐시 완전 삭제
- [ ] 양방향 메시지 전송 테스트 성공
- [ ] 새 대화 시작 → 첫 메시지 전송 → 답장 받기 테스트 성공
- [ ] 여러 사용자 동시 채팅 테스트 성공

## 기술적 세부사항

### Realtime 구독 로직

1. **기존 대화방 선택 시** (`selectThread` 함수, line 291-350):
   - 기존 채널 구독 해제
   - 새 채널 구독 시작
   - `chatbot-messages:${threadId}` 채널 사용

2. **새 대화방 생성 시** (`sendChatMessage` 함수, line 397-450):
   - 첫 메시지 전송 후 실제 thread_id 받음
   - 즉시 Realtime 구독 시작
   - 상대방 답장을 실시간으로 받을 수 있음

3. **컴포넌트 언마운트 시** (line 248-255):
   - 자동으로 구독 해제
   - 메모리 누수 방지

### 로그 의미

- `📡 Realtime 구독 상태: SUBSCRIBED` → 정상 연결됨
- `✅ Realtime 새 메시지 수신` → 메시지 정상 수신
- `⚠️ 메시지 중복, 무시` → 중복 방지 작동 중 (정상)
- `🔔 새 대화방 Realtime 구독 시작` → 새 대화방 구독 시작

### 주의사항

- 개발 중 코드 변경 시 **양쪽 사용자 모두** 하드 리프레시 필요
- Fast Refresh는 Realtime 구독 상태를 유지하지 않을 수 있음
- 프로덕션 배포 후에는 사용자들에게 "페이지 새로고침" 안내 필요
