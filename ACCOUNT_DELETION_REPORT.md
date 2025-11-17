# 회원 탈퇴 시스템 전체 검토 보고서

## 📋 요약

회원 탈퇴 시 **소유자**와 **일반 멤버**를 구분하여 처리하며, 모든 데이터는 **Soft Delete** 방식으로 삭제됩니다.

---

## 🎯 삭제 정책

### 1. 소유자 탈퇴 시
- ✅ 소유한 모든 조직 삭제
- ✅ 조직의 모든 서브계정 삭제
- ✅ 조직의 모든 멤버십 삭제 (멤버 계정은 유지)
- ✅ 사용자 계정 삭제
- ❌ **조직 양도 없음**

### 2. 일반 멤버 탈퇴 시
- ✅ 소속 조직 멤버십만 삭제
- ✅ 조직은 유지
- ✅ 사용자 계정 삭제

---

## 💰 캐시/크레딧/포인트 처리

### 현황
조직이 삭제되면 다음 데이터들도 **함께 삭제**됩니다:

| 항목 | 테이블 | 처리 방법 | 비고 |
|------|--------|-----------|------|
| 캐시 잔액 | `organization_cash` | **Soft Delete** | 캐시는 소멸 |
| 크레딧 잔액 | `organization_credits` | **Soft Delete** | 크레딧은 소멸 |
| 기여 포인트 | `organizations.accumulated_points` | **Soft Delete** | 포인트는 소멸 |
| 캐시 거래내역 | `organization_cash_transactions` | **보존 필요** | 회계 감사용 |
| 크레딧 거래내역 | `organization_credit_transactions` | **보존 필요** | 회계 감사용 |
| 캐시 지급내역 | `organization_cash_history` | **보존 필요** | 회계 감사용 |
| 크레딧 지급내역 | `organization_credits_history` | **보존 필요** | 회계 감사용 |

### ⚠️  중요 결정 사항

**질문: 캐시/크레딧을 어떻게 처리할까요?**

#### 옵션 A: 그대로 소멸 (현재 설계)
- 조직 삭제 시 캐시/크레딧도 함께 삭제
- 잔액은 복구 불가
- **장점**: 간단, 명확
- **단점**: 사용자가 잔액을 잃을 수 있음

#### 옵션 B: 환불/정산 후 삭제
- 탈퇴 전 캐시를 환불 계좌로 송금
- 크레딧은 환불 불가 (약관)
- **장점**: 사용자 친화적
- **단점**: 구현 복잡도 증가

#### 옵션 C: 탈퇴 시 잔액 확인 & 차단
- 잔액이 남아있으면 탈퇴 불가
- 모두 소진 후 탈퇴 허용
- **장점**: 분쟁 방지
- **단점**: 사용자 경험 저하

**👉 현재 구현: 옵션 A (그대로 소멸)**

---

## 📊 영향받는 테이블

### Soft Delete 필요 테이블

| 테이블 | deleted_at | is_deleted | 상태 |
|--------|-----------|-----------|------|
| `users` | ✅ | ✅ | Migration 075 완료 |
| `organizations` | ✅ | ✅ | Migration 076 필요 |
| `organization_members` | ✅ | ✅ | Migration 076 필요 |
| `sub_accounts` | ✅ | ✅ | Migration 076 필요 |
| `organization_cash` | ❌ | ❌ | **추가 필요** |
| `organization_credits` | ❌ | ❌ | **추가 필요** |
| `organization_cash_transactions` | ❌ | ❌ | 보존 (soft delete 불필요) |
| `organization_credit_transactions` | ❌ | ❌ | 보존 (soft delete 불필요) |
| `organization_cash_history` | ❌ | ❌ | 보존 (soft delete 불필요) |
| `organization_credits_history` | ❌ | ❌ | 보존 (soft delete 불필요) |

### 거래내역 테이블 처리

**결정: 거래내역은 Soft Delete 하지 않음**

이유:
1. 회계 감사 필요
2. 법적 보관 의무 (전자상거래법)
3. 정산 분쟁 대응용

대신:
- 조직이 삭제되어도 거래내역은 유지
- `organization_id`를 통해 삭제된 조직과 연결 추적 가능
- 필요 시 `organizations.is_deleted = true`로 필터링

---

## 🔧 필요한 작업

### Migration 076 업데이트
```sql
-- organization_cash 테이블에 soft delete 추가
ALTER TABLE organization_cash
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;

-- organization_credits 테이블에 soft delete 추가
ALTER TABLE organization_credits
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
```

### API 업데이트
`/api/user/delete-account` DELETE 메서드에 추가:

```typescript
// 조직 캐시/크레딧 삭제
await adminClient
  .from('organization_cash')
  .update({ deleted_at: now, is_deleted: true })
  .in('organization_id', orgIds);

await adminClient
  .from('organization_credits')
  .update({ deleted_at: now, is_deleted: true })
  .in('organization_id', orgIds);
```

---

## ✅ 최종 체크리스트

- [x] users 테이블 soft delete (Migration 075)
- [ ] organizations 테이블 soft delete (Migration 076)
- [ ] organization_members 테이블 soft delete (Migration 076)
- [ ] sub_accounts 테이블 soft delete (Migration 076)
- [ ] organization_cash 테이블 soft delete (Migration 076 업데이트 필요)
- [ ] organization_credits 테이블 soft delete (Migration 076 업데이트 필요)
- [ ] API: 서브계정 삭제 로직 (완료)
- [ ] API: 조직 멤버 삭제 로직 (완료)
- [ ] API: 조직 삭제 로직 (완료)
- [ ] API: 캐시/크레딧 삭제 로직 (추가 필요)
- [ ] API: 사용자 삭제 로직 (완료)

---

## 🚀 다음 단계

1. Migration 076에 캐시/크레딧 테이블 추가
2. API에 캐시/크레딧 삭제 로직 추가
3. Supabase Dashboard에서 마이그레이션 실행
4. 테스트 사용자로 전체 플로우 테스트
5. 프로덕션 배포

---

생성일: 2025-01-17
작성자: Claude Code
