# 주문통합 프로그램

모든 오픈마켓 주문을 통합하고 관리하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- 📁 **다중 파일 업로드**: 엑셀/CSV 파일 드래그 앤 드롭 지원
- 🔍 **자동 마켓 감지**: 파일명과 헤더로 마켓 자동 인식
- 📊 **데이터 통합**: 여러 마켓의 주문을 표준 형식으로 통합
- 📈 **통계 분석**: 마켓별, 옵션별 상세 통계
- 🔄 **피벗테이블**: 다차원 데이터 분석
- 💾 **Google Sheets 연동**: 실시간 데이터 저장 및 관리
- 📥 **엑셀 내보내기**: 통합 데이터 다운로드

## 📋 필수 준비사항

### 1. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Sheets API 활성화
   - "API 및 서비스" → "라이브러리"
   - "Google Sheets API" 검색 및 활성화

### 2. 서비스 계정 생성

1. "API 및 서비스" → "사용자 인증 정보"
2. "사용자 인증 정보 만들기" → "서비스 계정"
3. 서비스 계정 생성:
   - 이름: `order-integration-service`
   - 역할: 편집자(Editor)
4. JSON 키 생성 및 다운로드

### 3. Google Sheets 권한 설정

1. Google Sheets에서 기존 스프레드시트 열기
2. "공유" 버튼 클릭
3. 서비스 계정 이메일 추가 (편집자 권한)
   - 예: `order-integration@project-id.iam.gserviceaccount.com`

### 4. 스프레드시트 구조

필수 시트:
- **매핑**: 마켓별 필드 매핑 정보
- **판매정보**: 옵션별 판매 가격 정보
- **옵션상품통합관리**: 옵션별 출고 정보
- **가격계산**: 셀러 공급가 정보
- **대시보드**: 대시보드 표시 데이터

## 🛠️ 설치 방법

### 로컬 개발

1. **저장소 클론**
```bash
git clone https://github.com/your-username/order-integration.git
cd order-integration