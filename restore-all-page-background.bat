@echo off
echo ========================================
echo 전체 상품 페이지 배경 되돌리기
echo ========================================
echo.

if not exist "src\app\platform\products\all\page.tsx.backup" (
    echo 오류: 백업 파일이 없습니다!
    echo 백업 파일 경로: src\app\platform\products\all\page.tsx.backup
    pause
    exit /b 1
)

echo 백업 파일을 원본으로 복원 중...
copy /Y "src\app\platform\products\all\page.tsx.backup" "src\app\platform\products\all\page.tsx"

if errorlevel 1 (
    echo 오류: 파일 복원에 실패했습니다!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 복원 완료!
echo ========================================
echo 이전 배경(bg-gray-50)으로 되돌렸습니다.
echo.
pause
