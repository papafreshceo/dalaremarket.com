# Cloudinary Webhook 설정 가이드

Cloudinary에서 이미지를 삭제하면 자동으로 사이트 DB에서도 삭제되도록 Webhook을 설정합니다.

## 1. Webhook URL 확인

개발 환경과 프로덕션 환경에 따라 URL이 다릅니다:

- **개발 환경**: `http://localhost:3001/api/cloudinary/webhook`
- **프로덕션 환경**: `https://your-domain.com/api/cloudinary/webhook`

## 2. Cloudinary 대시보드 설정

### 단계 1: Cloudinary 대시보드 접속
1. https://cloudinary.com/console 접속
2. 로그인

### 단계 2: Settings 메뉴로 이동
1. 우측 상단 톱니바퀴 아이콘 클릭
2. **Settings** 클릭
3. 좌측 메뉴에서 **Webhooks** 클릭

### 단계 3: Webhook 추가
1. **Add notification** 또는 **Create notification** 버튼 클릭
2. 다음 정보 입력:

   **Notification URL**:
   ```
   https://your-domain.com/api/cloudinary/webhook
   ```
   (개발 중에는 ngrok 등의 터널링 서비스 필요)

   **Notification type**:
   - ✅ **Delete** 선택 (이미지 삭제 시 알림)

   **Optional settings**:
   - Signature: ✅ 활성화 (보안을 위해 권장)

3. **Save** 클릭

## 3. 개발 환경에서 테스트하기 (ngrok 사용)

로컬 개발 환경에서는 Cloudinary가 접근할 수 없으므로 ngrok을 사용합니다:

### ngrok 설치 및 실행
```bash
# ngrok 다운로드: https://ngrok.com/download

# 포트 3001로 터널 생성
ngrok http 3001
```

ngrok이 제공하는 HTTPS URL을 복사합니다 (예: `https://abc123.ngrok.io`)

### Cloudinary Webhook URL에 등록
```
https://abc123.ngrok.io/api/cloudinary/webhook
```

## 4. 테스트

### 테스트 방법:
1. 사이트에서 이미지 업로드
2. Cloudinary 대시보드에서 해당 이미지 삭제
3. 사이트 DB에서도 자동으로 삭제되었는지 확인

### 로그 확인:
- 서버 콘솔에서 다음과 같은 로그 확인:
  ```
  Cloudinary Webhook 수신: { notification_type: 'delete', public_id: '...' }
  ✅ DB에서 이미지 삭제 완료: filename.jpg (dalraemarket/...)
  ```

## 5. 프로덕션 배포 시

프로덕션 환경에 배포한 후:

1. Cloudinary Webhook URL을 실제 도메인으로 변경:
   ```
   https://your-production-domain.com/api/cloudinary/webhook
   ```

2. 환경 변수 확인:
   - `CLOUDINARY_API_SECRET`이 설정되어 있어야 서명 검증이 작동합니다

## 6. 보안

- **서명 검증**: API Secret을 사용하여 Cloudinary에서 보낸 요청인지 검증
- **HTTPS 필수**: Webhook은 HTTPS URL만 지원
- **로그 모니터링**: 의심스러운 요청은 로그에서 확인 가능

## 7. 트러블슈팅

### Webhook이 작동하지 않는 경우:

1. **URL 확인**: Webhook URL이 정확한지 확인
2. **HTTPS 확인**: HTTP는 작동하지 않음 (ngrok은 HTTPS 제공)
3. **서버 로그 확인**: 요청이 도착하는지 확인
4. **Cloudinary 로그 확인**: Settings > Webhooks > Notification logs

### 로컬 개발 시:
- ngrok이 실행 중인지 확인
- ngrok URL이 변경되지 않았는지 확인 (재시작 시 URL 변경됨)
- 무료 ngrok은 세션 제한이 있음

## 완료!

이제 Cloudinary에서 이미지를 삭제하면 자동으로 사이트 DB에서도 삭제됩니다.
