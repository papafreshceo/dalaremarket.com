# MCP (Model Context Protocol) 설정 완료 ✅

## 설정된 MCP 서버

### 1. PostgreSQL/Supabase 서버
- **용도**: 데이터베이스 직접 쿼리
- **서버**: `@modelcontextprotocol/server-postgres`
- **연결**: Supabase PostgreSQL

### 2. Fetch 서버
- **용도**: HTTP API 호출
- **서버**: `@modelcontextprotocol/server-fetch`
- **기능**: REST API 테스트

## 설정 파일

**위치**: `.claude/settings.local.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.ketdnqhxwqcgyltinjih:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    }
  }
}
```

## ⚠️ 중요: 다음 단계

### MCP를 사용하려면 **Claude Code를 재시작**해야 합니다!

1. **VS Code 완전 종료** (또는 Claude Code 확장 프로그램 재시작)
2. **VS Code 재실행**
3. MCP 서버가 자동으로 연결됩니다

### 재시작 후 확인 방법

Claude Code 창 하단에 다음과 같은 표시가 나타나야 합니다:
- `🔌 postgres` (연결됨)
- `🔌 fetch` (연결됨)

또는 제게 이렇게 물어보세요:
**"MCP 서버 연결 상태 확인해줘"**

## 이제 가능한 작업들

### 1. 데이터베이스 직접 쿼리
```sql
SELECT * FROM option_products LIMIT 5;
SELECT * FROM integrated_orders WHERE option_name LIKE '%테스트%';
INSERT INTO option_products (option_name, seller_supply_price) VALUES ('테스트', 10000);
```

### 2. API 직접 호출
```http
POST http://localhost:3002/api/platform-orders
GET http://localhost:3002/api/integrated-orders
```

### 3. 통합 테스트 시나리오
```javascript
// 1. 테스트 데이터 INSERT
// 2. API 호출
// 3. 결과 SELECT
// 4. 검증
// 5. 문제 발견 시 자동 수정
// 6. 재테스트
```

## 사용 예시

### 옵션 매핑 기능 자동 테스트

**Claude에게 이렇게 요청하세요:**

```
"다음을 실행해줘:
1. option_products에 테스트 데이터 3개 INSERT
2. /api/platform-orders API에 POST 요청 (테스트 주문)
3. integrated_orders 테이블에서 저장된 데이터 SELECT
4. 옵션 정보가 제대로 매핑됐는지 검증
5. 문제가 있으면 코드 수정하고 다시 테스트"
```

또는

```
"지금 구현한 옵션 매핑 기능 전체를 자동으로 테스트하고
문제가 있으면 수정해줘"
```

## 주의사항

### 보안
- ⚠️ `.claude/settings.local.json`에는 DB 비밀번호가 포함되어 있습니다
- ✅ 이 파일은 `.gitignore`에 추가되어야 합니다
- ✅ 절대 Git에 커밋하지 마세요

### 성능
- MCP 서버는 첫 실행 시 `npx`로 패키지를 다운로드합니다
- 첫 연결은 조금 느릴 수 있습니다
- 이후에는 캐시되어 빠릅니다

## 트러블슈팅

### MCP 서버가 연결되지 않는 경우

1. **VS Code 완전 재시작** 확인
2. **Node.js 설치** 확인 (`node --version`)
3. **npx 작동** 확인 (`npx --version`)
4. Claude Code 출력 창에서 에러 메시지 확인

### 데이터베이스 연결 실패

1. Supabase 프로젝트가 활성 상태인지 확인
2. 연결 문자열(connection string)이 올바른지 확인
3. 방화벽이 PostgreSQL 포트(6543)를 차단하지 않는지 확인

## 다음 단계

**Claude Code를 재시작한 후** 이렇게 요청하세요:

**"MCP가 제대로 연결됐는지 확인하고, 옵션 매핑 기능을 자동으로 테스트해줘"**

---

**설정 완료일**: 2025-01-15
**상태**: ✅ 설정 완료 (재시작 필요)
