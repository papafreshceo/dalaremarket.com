# 🚨 긴급 보안 조치 필요

## 문제 요약
GitGuardian이 dalraemarket.com 레포지토리에서 **Supabase 서비스 키가 노출**된 것을 감지했습니다.

노출된 커밋:
- `53f4fe3d` - 3개의 스크립트 파일에 하드코딩된 서비스 키 포함

노출된 키:
1. 구 프로젝트 (ufuahbppuftwkluodvkf)
2. 현재 프로젝트 (xjojtwawqpkgcufhirvk) - **매우 위험!**

## ✅ 이미 완료된 조치

1. ✅ 노출된 파일 Git에서 제거
2. ✅ 환경 변수 기반 시스템 구축
3. ✅ .gitignore 개선
4. ✅ 안전한 스크립트로 교체
5. ✅ 문서화 완료

## 🔴 즉시 해야 할 일 (가장 중요!)

### 1. Supabase 서비스 키 재생성 (5분 이내!)

```
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Settings → API
4. Service Role Key 섹션에서 "Reset" 클릭
5. 새로운 키를 안전하게 복사
```

**⚠️ 경고**: 노출된 키로 누군가 다음을 할 수 있습니다:
- 모든 데이터베이스 데이터 읽기/쓰기/삭제
- RLS 정책 우회
- 사용자 인증 정보 탈취
- 관리자 권한으로 모든 작업 수행

### 2. .env.local 파일 생성

```bash
# 루트 디렉토리에서 실행
cp .env.local.example .env.local
```

그 다음 `.env.local` 파일을 열고 **새로 생성한** 키 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xjojtwawqpkgcufhirvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=여기에_새로운_서비스_키_입력
```

### 3. Vercel 환경 변수 업데이트

```
1. Vercel 대시보드 접속
2. 프로젝트 → Settings → Environment Variables
3. SUPABASE_SERVICE_ROLE_KEY 찾아서 Edit
4. 새로운 키로 교체
5. Production, Preview, Development 모두 체크
6. Save
7. Redeploy 필요 (Deployments → 최신 배포 → Redeploy)
```

### 4. dotenv 패키지 설치

```bash
npm install dotenv
```

### 5. 스크립트 테스트

```bash
# 환경 변수가 제대로 로드되는지 확인
node scripts/fix-user-organization.js test@example.com
```

오류가 나면 정상입니다 (테스트 이메일이므로).
중요한 건 "환경 변수가 설정되지 않았습니다" 에러가 **나지 않아야** 합니다.

## 📋 선택적 조치 (권장)

### Git 히스토리에서 완전 제거

노출된 키가 Git 히스토리에 남아있으므로, 완전히 제거하려면:

#### 방법 1: BFG Repo-Cleaner (권장)

```bash
# BFG 설치
# Windows: choco install bfg
# Mac: brew install bfg

# 민감 정보 제거
git clone --mirror https://github.com/your-username/dalreamarket.com.git
cd dalreamarket.com.git
bfg --delete-files 'run-*.js'
bfg --delete-files 'fix-test2-*.js'
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### 방법 2: git filter-branch

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch \
    run-admin-org-rls.js \
    run-user-delete-trigger.js \
    scripts/fix-test2-create-personal-org.js" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

**주의**: 강제 푸시는 팀원들에게 영향을 줄 수 있으므로 조율 필요

### GitGuardian 알림 처리

1. GitGuardian 대시보드 접속
2. 해당 알림 찾기
3. "Mark as resolved" 클릭
4. 이유: "Key has been rotated" 선택

## 🛡️ 앞으로의 예방 조치

### 1. Pre-commit Hook 설정

```bash
# .git/hooks/pre-commit 파일 생성
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
if git diff --cached | grep -E "eyJ[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*"; then
    echo "❌ JWT 토큰이 감지되었습니다! 커밋을 중단합니다."
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

### 2. git-secrets 설치

```bash
# Mac
brew install git-secrets

# Windows
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
./install.sh

# 프로젝트에 설정
cd /path/to/dalreamarket.com
git secrets --install
git secrets --register-aws
git secrets --add 'eyJ[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*'
```

### 3. 커밋 전 체크리스트

커밋하기 전에 항상 확인:
- [ ] `git diff`로 변경사항 검토
- [ ] .env 파일이 포함되지 않았는지 확인
- [ ] 하드코딩된 키/토큰이 없는지 확인
- [ ] 테스트용 임시 스크립트는 .gitignore에 추가

### 4. 환경 변수 규칙

**절대 하지 말 것:**
```javascript
const key = 'eyJhbGc...' // ❌
const url = 'https://project.supabase.co' // ⚠️ URL은 괜찮지만 키는 안됨
```

**올바른 방법:**
```javascript
const key = process.env.SUPABASE_SERVICE_ROLE_KEY // ✅
const url = process.env.NEXT_PUBLIC_SUPABASE_URL // ✅
```

## 📞 도움이 필요하면

1. Supabase 서포트: https://supabase.com/support
2. GitGuardian 문서: https://docs.gitguardian.com/
3. 이 파일의 작성자에게 문의

## ✅ 완료 체크리스트

작업을 완료한 후 체크:

- [x] Supabase 서비스 키 재생성 완료 (새 키: sb_secret_MQ4Dx-m8WlNc-vI-IavhCw_70nyqgCL)
- [x] .env.local 파일 생성 및 새 키 입력
- [ ] **Vercel 환경 변수 업데이트** ⚠️ 아직 안함! 배포 시 필수!
- [x] dotenv 패키지 설치 (v17.2.3)
- [x] 스크립트 테스트 완료 (환경 변수 24개 로드 확인)
- [ ] GitGuardian 알림 해결
- [ ] (선택) Git 히스토리 정리
- [ ] (선택) Pre-commit hook 설정

### 🔴 남은 작업

1. **Vercel 환경 변수 업데이트** - 배포하기 전에 반드시 필요!
2. GitGuardian 알림 해결

위 2개만 완료하면 모든 보안 조치가 완료됩니다.
모든 체크가 완료되면 이 파일을 삭제해도 됩니다.

---

**생성 일시**: 2025-01-14
**긴급도**: 🔴 최고 (5분 이내 조치 필요)
