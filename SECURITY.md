# Security Guidelines

이 문서는 dalreamarket.com 프로젝트의 보안 가이드라인을 설명합니다.

## 환경변수 관리

### 필수 규칙

1. **절대 Git에 커밋하지 마세요:**
   - `.env.local` - 로컬 개발 환경변수
   - `*.env` - 모든 환경변수 파일
   - API 키, 비밀키가 포함된 파일

2. **환경변수 파일 구조:**
   ```
   .env.example    # Git에 커밋 (템플릿, 실제 값 없음)
   .env.local      # Git 무시 (실제 개발 환경 값)
   ```

3. **새 환경변수 추가 시:**
   - `.env.local`에 실제 값 추가
   - `.env.example`에 템플릿 추가 (예시 값)
   - 팀원에게 새 환경변수 공유

### 환경변수 설정 방법

```bash
# .env.example을 복사하여 .env.local 생성
cp .env.example .env.local

# .env.local을 편집하여 실제 값 입력
# 주의: 이 파일은 Git에 커밋되지 않습니다!
```

## 마이그레이션 스크립트 작성

### 안전한 마이그레이션 스크립트 작성법

1. **템플릿 사용:**
   ```bash
   # 템플릿 복사
   cp scripts/migration-template.js scripts/your-migration.js

   # 마이그레이션 로직 작성
   # 주의: 이 파일은 Git에 커밋하지 마세요!
   ```

2. **환경변수 사용:**
   ```javascript
   // ❌ 나쁜 예 - 하드코딩
   const supabaseUrl = 'https://xxx.supabase.co';
   const supabaseKey = 'eyJhbGc...';

   // ✅ 좋은 예 - 환경변수 사용
   require('dotenv').config({ path: '.env.local' });
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
   ```

3. **Git 무시 패턴:**
   `.gitignore`에 다음 패턴이 추가되어 있습니다:
   ```
   apply-*.js
   check-*.js
   insert-*.js
   update-*.js
   create-*.js
   test-*.js
   find-*.js
   set-*.js
   database/migrations/*.js
   ```

## Supabase 키 관리

### 키 종류

1. **Anon Key** (공개 가능)
   - 프론트엔드에서 사용
   - RLS 정책에 의해 보호됨
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Service Role Key** (비밀)
   - 서버 사이드에서만 사용
   - RLS를 우회할 수 있음
   - **절대 Git에 커밋하지 마세요!**
   - `SUPABASE_SERVICE_ROLE_KEY`

### 키가 노출된 경우

1. **즉시 조치:**
   - Supabase Dashboard → Settings → API → Reset Key
   - 모든 환경변수 파일 업데이트
   - 배포 환경 (Vercel 등) 업데이트

2. **Git 히스토리 정리:**
   ```bash
   # 방법 1: BFG Repo-Cleaner (권장)
   java -jar bfg.jar --delete-files "apply-*.js"
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force

   # 방법 2: 새 저장소 생성 (가장 안전)
   # 1. 새 private 저장소 생성
   # 2. 현재 코드만 푸시 (히스토리 없이)
   ```

## RLS (Row Level Security)

### RLS 정책 작성 원칙

1. **기본 정책:**
   ```sql
   -- 테이블에 RLS 활성화
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

   -- 인증된 사용자만 자신의 데이터 조회
   CREATE POLICY "Users can view their own data"
   ON your_table FOR SELECT
   TO authenticated
   USING (auth.uid() = user_id);
   ```

2. **관리자 정책:**
   ```sql
   -- 관리자는 모든 데이터 접근
   CREATE POLICY "Admins can view all data"
   ON your_table FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role IN ('admin', 'super_admin')
     )
   );
   ```

3. **공개 데이터:**
   ```sql
   -- 모든 사용자가 공개된 데이터 조회
   CREATE POLICY "Anyone can view published data"
   ON your_table FOR SELECT
   TO authenticated
   USING (published = true);
   ```

## API 라우트 보안

### 인증 확인

```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createServerClient();

  // 인증 확인
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 관리자 권한 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(userData?.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 로직 수행...
}
```

## 코드 리뷰 체크리스트

PR 생성 시 다음 사항을 확인하세요:

- [ ] API 키나 비밀키가 하드코딩되지 않았는가?
- [ ] `.env.local` 파일이 커밋되지 않았는가?
- [ ] 새로운 환경변수가 `.env.example`에 추가되었는가?
- [ ] 마이그레이션 스크립트가 커밋되지 않았는가?
- [ ] 민감한 정보가 로그에 출력되지 않는가?
- [ ] RLS 정책이 올바르게 설정되었는가?
- [ ] API 라우트에 적절한 인증/권한 확인이 있는가?

## 보안 사고 대응

### 민감한 정보가 커밋된 경우

1. **즉시 키 무효화**
2. **커밋 되돌리기 또는 히스토리 정리**
3. **새 키 발급 및 배포**
4. **팀원에게 공지**
5. **보안 로그 확인**

### 문의

보안 관련 문의사항이나 발견한 취약점은 비공개로 보고해 주세요.

## 참고 자료

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
