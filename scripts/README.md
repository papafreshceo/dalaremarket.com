# Database Scripts

데이터베이스 구조를 분석하고 관리하는 스크립트 모음

## 🔐 보안 주의사항

**절대로 Supabase 서비스 키를 스크립트 파일에 직접 작성하지 마세요!**

모든 관리 스크립트는 환경 변수를 사용하도록 설계되었습니다.

### 사용 전 준비

1. 루트 디렉토리에 `.env.local` 파일 생성:
   ```bash
   cp .env.local.example .env.local
   ```

2. `.env.local` 파일에 실제 값 입력:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. `dotenv` 패키지 설치 (아직 설치하지 않았다면):
   ```bash
   npm install dotenv
   ```

### 관리 스크립트

#### supabase-config.js
모든 스크립트에서 사용하는 공통 Supabase 설정 파일입니다.

#### fix-user-organization.js
사용자에게 개인 셀러계정을 생성합니다.
```bash
node scripts/fix-user-organization.js <email>
```

#### update-organization-rls.js
관리자가 모든 조직을 볼 수 있도록 RLS 정책을 업데이트합니다.
```bash
node scripts/update-organization-rls.js
```

#### setup-user-delete-trigger.js
사용자 삭제 시 관련 데이터를 자동으로 삭제하는 트리거를 설정합니다.
```bash
node scripts/setup-user-delete-trigger.js
```

## 📊 DB Schema Analyzer

데이터베이스 스키마를 쉽게 탐색할 수 있는 CLI 도구

### 사용법

```bash
# 모든 테이블 목록 보기
node scripts/analyze-db.js

# 특정 테이블 상세 정보 보기
node scripts/analyze-db.js option_products

# 컬럼 이름으로 검색
node scripts/analyze-db.js -s margin
node scripts/analyze-db.js -s price

# 도움말
node scripts/analyze-db.js --help
```

### 예시 출력

#### 1. 테이블 목록
```
📊 Database Tables

Generated at: 2025-10-06T00:06:29.828Z

================================================================================

📁 material_price_history                   (14 columns)
📁 option_product_materials                 (8 columns)
📁 option_products                          (64 columns)
📁 partners                                 (18 columns)
📁 raw_materials                            (27 columns)
📁 supply_status_settings                   (9 columns)

================================================================================

Total: 6 tables
```

#### 2. 테이블 상세 정보
```bash
node scripts/analyze-db.js option_products
```

모든 컬럼의 이름, 타입, 샘플 값을 테이블 형식으로 출력합니다.

#### 3. 컬럼 검색
```bash
node scripts/analyze-db.js -s price
```

'price'를 포함하는 모든 컬럼을 테이블별로 그룹화하여 보여줍니다.

### 주요 테이블

#### option_products (옵션상품)
- 64개 컬럼
- 주요 필드:
  - 가격 정책: `seller_supply_price_mode`, `naver_price_mode`, `coupang_price_mode`
  - 마진: `seller_margin_rate`, `target_margin_rate`
  - 원가: `raw_material_cost`, `total_cost`
  - 자재비: `packaging_box_price`, `labor_cost`, `shipping_fee` 등

#### raw_materials (원물)
- 27개 컬럼
- 원물 정보 및 최신 시세 관리

#### material_price_history (시세 기록)
- 14개 컬럼
- 원물 가격 변동 이력

#### option_product_materials (옵션상품-원물 관계)
- 8개 컬럼
- 옵션상품과 원물의 다대다 관계 관리

#### partners (거래처)
- 18개 컬럼
- 공급자, 벤더사 등 거래처 정보

#### supply_status_settings (공급 상태 설정)
- 9개 컬럼
- 공급 상태 코드 및 색상 관리

## 스키마 업데이트

스키마 JSON 파일은 다음 위치에 있습니다:
```
database/current_schema.json
```

이 파일은 실제 Supabase 데이터베이스에서 샘플 데이터와 함께 추출한 것입니다.

## 기여하기

새로운 분석 기능이나 스크립트를 추가하려면 `scripts/` 디렉토리에 파일을 만들고 이 README에 문서화하세요.
