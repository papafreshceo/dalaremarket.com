# 셀러 랭킹 시스템 설정 가이드

## Phase 1 완료 ✅

셀러 랭킹 시스템의 기본 인프라가 구축되었습니다!

### 생성된 파일 목록

#### 📁 데이터베이스 마이그레이션
- `database/migrations/create_seller_performance_daily.sql` - 일일 성과 테이블
- `database/migrations/create_seller_rankings.sql` - 랭킹 테이블
- `database/migrations/create_seller_badges.sql` - 배지 테이블
- `database/migrations/all_seller_ranking_tables.sql` - **통합 SQL 파일** ⭐

#### 📁 라이브러리 함수
- `src/lib/seller-performance.ts` - 실시간 성과 추적 함수
- `src/lib/seller-ranking-calculator.ts` - 점수 계산 로직

#### 📁 스크립트
- `scripts/calculate-daily-rankings.ts` - 일일 배치 작업
- `scripts/run-seller-ranking-migrations.js` - 마이그레이션 실행 (참고용)

#### 📁 API
- `src/app/api/seller-rankings/migrate/route.ts` - 마이그레이션 API (참고용)

---

## 🚀 설치 방법

### 1단계: 데이터베이스 마이그레이션 실행

**Supabase Dashboard에서 직접 SQL 실행:**

1. Supabase Dashboard 접속:
   ```
   https://supabase.com/dashboard/project/qxhpgjftkkcxdttgjkzj/sql/new
   ```

2. 다음 파일의 내용을 복사하여 SQL Editor에 붙여넣기:
   ```
   database/migrations/all_seller_ranking_tables.sql
   ```

3. **Run** 버튼 클릭

4. 성공 메시지 확인:
   - `seller_performance_daily` 테이블 생성됨
   - `seller_rankings` 테이블 생성됨
   - `seller_badges` 테이블 생성됨
   - `badge_definitions` 테이블 생성됨

### 2단계: 테이블 확인

Supabase Dashboard의 Table Editor에서 다음 테이블들이 생성되었는지 확인:

- ✅ `seller_performance_daily`
- ✅ `seller_rankings`
- ✅ `seller_badges`
- ✅ `badge_definitions`

---

## 📊 시스템 구조

### 테이블 관계도

```
users (셀러)
  ↓
seller_performance_daily (일일 성과)
  ↓
seller_rankings (기간별 랭킹)
  ↓
seller_badges (배지 획득)
```

### 데이터 흐름

```
1. 주문 등록 → trackOrderRegistered()
   └─ seller_performance_daily.order_count++

2. 발주확정 → trackOrderConfirmed()
   └─ seller_performance_daily.total_sales++
   └─ seller_performance_daily.avg_confirm_hours 업데이트

3. 취소요청 → trackOrderCancelled()
   └─ seller_performance_daily.cancel_count++

4. 엑셀 업로드 → trackExcelUpload()
   └─ seller_performance_daily.error_count 업데이트

5. 매일 자정 → calculate-daily-rankings.ts 실행
   └─ 점수 계산
   └─ seller_rankings 생성 (일/주/월)
   └─ seller_badges 부여
```

---

## 🔧 사용 방법

### A. 실시간 성과 추적

주문 관련 이벤트가 발생할 때 다음 함수들을 호출하세요:

#### 1. 주문 등록 시
```typescript
import { trackOrderRegistered } from '@/lib/seller-performance';

// 주문 등록 API에서
await trackOrderRegistered(sellerId);
```

#### 2. 발주확정 시
```typescript
import { trackOrderConfirmed } from '@/lib/seller-performance';

// 발주확정 API에서
await trackOrderConfirmed(
  sellerId,
  orderAmount,        // 주문 금액
  registeredAt,       // 주문 등록 시각
  confirmedAt         // 발주확정 시각
);
```

#### 3. 취소요청 시
```typescript
import { trackOrderCancelled } from '@/lib/seller-performance';

// 취소요청 API에서
await trackOrderCancelled(sellerId);
```

#### 4. 엑셀 업로드 시
```typescript
import { trackExcelUpload } from '@/lib/seller-performance';

// 엑셀 업로드 API에서
await trackExcelUpload(sellerId, errorCount);
```

### B. 일일 배치 작업 실행

**수동 실행 (테스트):**
```bash
npx ts-node scripts/calculate-daily-rankings.ts
```

**자동 실행 (Cron):**

배포 환경에 따라 다음 방법 중 하나를 선택:

#### Vercel Cron Jobs
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/calculate-rankings",
    "schedule": "0 0 * * *"  // 매일 자정
  }]
}
```

#### GitHub Actions
```yaml
# .github/workflows/daily-ranking.yml
name: Daily Ranking Calculation
on:
  schedule:
    - cron: '0 15 * * *'  # 매일 자정 (UTC+9)
jobs:
  calculate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npx ts-node scripts/calculate-daily-rankings.ts
```

---

## 📈 점수 계산 기준

### 종합 점수 = 100점 만점

| 지표 | 가중치 | 만점 기준 |
|------|--------|----------|
| **매출액** | 30% | 최고 매출액 대비 100% |
| **주문건수** | 20% | 최고 주문건수 대비 100% |
| **발주속도** | 20% | 평균 1시간 이내 |
| **취소율** | 20% | 1% 이하 |
| **데이터품질** | 10% | 오류율 0% |

### 등급 기준

| 등급 | 점수 | 아이콘 | 비율 목표 |
|------|------|--------|-----------|
| 🏆 다이아몬드 | 90점 이상 | 🏆 | 상위 5% |
| 💎 플래티넘 | 80-89점 | 💎 | 상위 15% |
| 🥇 골드 | 70-79점 | 🥇 | 상위 30% |
| 🥈 실버 | 60-69점 | 🥈 | 상위 60% |
| 🥉 브론즈 | 60점 미만 | 🥉 | 나머지 |

### 배지 획득 조건

| 배지 | 조건 | 아이콘 |
|------|------|--------|
| **빠른 발주** | 평균 발주확정 시간 1시간 이내 | ⚡ |
| **무결점** | 월간 취소율 1% 미만 | ✨ |
| **볼륨왕** | 월간 주문 1,000건 이상 | 👑 |
| **완벽 데이터** | 데이터 오류율 0% | 💯 |
| **꾸준함** | 3개월 연속 발주확정 | 🔥 |
| **얼리버드** | 오전 9시 이전 발주확정 80% 이상 | 🌅 |

---

## 🧪 테스트 방법

### 1. 성과 추적 테스트

```typescript
// 테스트 데이터 생성
import { trackOrderRegistered, trackOrderConfirmed } from '@/lib/seller-performance';

const sellerId = 'test-seller-id';

// 주문 등록
await trackOrderRegistered(sellerId);

// 발주확정 (2시간 후)
const registeredAt = new Date().toISOString();
const confirmedAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
await trackOrderConfirmed(sellerId, 50000, registeredAt, confirmedAt);
```

### 2. 점수 계산 테스트

```typescript
import { calculateSellerScore } from '@/lib/seller-ranking-calculator';

const performance = {
  seller_id: 'test',
  total_sales: 1000000,
  order_count: 100,
  avg_confirm_hours: 2,
  cancel_rate: 0.5,
  error_rate: 0
};

const score = calculateSellerScore(performance, 2000000, 200);
console.log('점수:', score);
```

### 3. 배치 작업 테스트

```bash
# 스크립트 실행
npx ts-node scripts/calculate-daily-rankings.ts

# 결과 확인
# - seller_performance_daily의 total_score 업데이트 확인
# - seller_rankings 테이블에 데이터 생성 확인
# - seller_badges 테이블에 배지 생성 확인
```

---

## 🐛 문제 해결

### Q1. 마이그레이션이 실패합니다
**A:** Supabase Dashboard에서 직접 SQL을 실행하세요. `database/migrations/all_seller_ranking_tables.sql` 파일의 내용을 복사하여 붙여넣기 하면 됩니다.

### Q2. 점수가 계산되지 않습니다
**A:**
1. `seller_performance_daily` 테이블에 데이터가 있는지 확인
2. 배치 스크립트를 수동으로 실행: `npx ts-node scripts/calculate-daily-rankings.ts`

### Q3. 배지가 부여되지 않습니다
**A:**
1. `badge_definitions` 테이블에 배지 정의가 있는지 확인
2. 배치 스크립트 실행 후 `seller_badges` 테이블 확인

---

## 📝 다음 단계 (Phase 2)

Phase 1이 완료되면 다음 기능을 구현할 예정입니다:

- [ ] 관리자 랭킹 대시보드 UI
- [ ] 셀러 대시보드에 "내 순위" 위젯
- [ ] 등급별 혜택 자동 적용
- [ ] 알림 기능
- [ ] 상세 통계 그래프

---

## 📞 문의

문제가 발생하거나 추가 기능이 필요하면 알려주세요!
