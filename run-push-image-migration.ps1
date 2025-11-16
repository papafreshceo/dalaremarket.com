$ErrorActionPreference = 'Stop'

# .env.local 파일에서 환경 변수 읽기
$envContent = Get-Content .env.local
$supabaseUrl = ($envContent | Select-String 'NEXT_PUBLIC_SUPABASE_URL=' | ForEach-Object { $_ -replace 'NEXT_PUBLIC_SUPABASE_URL=', '' }).Trim()
$serviceKey = ($envContent | Select-String 'SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace 'SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '푸시 알림 이미지 URL 기능 마이그레이션' -ForegroundColor Cyan
Write-Host '==================================================' -ForegroundColor Cyan
Write-Host ''

# SQL 파일 읽기
$sqlContent = Get-Content 'database\migrations\add_image_url_to_notification_broadcasts.sql' -Raw

Write-Host '📝 실행할 SQL:' -ForegroundColor Yellow
Write-Host ''
Write-Host $sqlContent -ForegroundColor Gray
Write-Host ''

# psql 사용 가능 여부 확인
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlAvailable) {
    # psql로 직접 실행
    $env:PGPASSWORD = $serviceKey
    $dbUrl = $supabaseUrl -replace 'https://', ''
    $dbUrl = $dbUrl -replace '\.supabase\.co.*', '.supabase.co'

    Write-Host '📡 psql로 마이그레이션 실행 중...' -ForegroundColor Yellow

    $sqlContent | psql -h "db.$dbUrl" -U postgres -d postgres

    Write-Host ''
    Write-Host '✅ 마이그레이션 완료!' -ForegroundColor Green
} else {
    Write-Host '⚠️  psql을 찾을 수 없습니다.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '📋 아래 단계를 따라 수동으로 실행해주세요:' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '1. Supabase SQL Editor로 이동:' -ForegroundColor White
    Write-Host "   $supabaseUrl" -ForegroundColor Blue
    Write-Host ''
    Write-Host '2. 아래 SQL을 복사하여 SQL Editor에 붙여넣기:' -ForegroundColor White
    Write-Host ''
    Write-Host $sqlContent -ForegroundColor Cyan
    Write-Host ''
    Write-Host '3. Run 버튼 클릭하여 실행' -ForegroundColor White
    Write-Host ''
}
