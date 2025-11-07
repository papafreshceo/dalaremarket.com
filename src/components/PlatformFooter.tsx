'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface SiteSettings {
  site_name: string
  site_logo_url: string
  contact_email: string
  contact_phone: string
  business_hours: string
  footer_text: string
  company_name: string
  ceo_name: string
  business_number: string
  e_commerce_license_number: string
  address: string
  privacy_officer_name: string
  privacy_officer_email: string
}

export default function PlatformFooter() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showCashPolicyModal, setShowCashPolicyModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single()

      if (data) {
        setSettings(data)
      } else {
        // DB에 데이터가 없으면 기본값 사용
        setSettings({
          site_name: '달래마켓',
          site_logo_url: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png',
          contact_email: 'contact@dalreamarket.com',
          contact_phone: '1588-0000',
          business_hours: '평일 09:00 - 18:00',
          footer_text: '© 2025 달래마켓. All rights reserved.',
          company_name: '(주)달래마켓',
          ceo_name: '홍길동',
          business_number: '123-45-67890',
          e_commerce_license_number: '2024-서울강남-12345',
          address: '서울특별시 강남구 테헤란로 123',
          privacy_officer_name: '김개인',
          privacy_officer_email: 'privacy@dalreamarket.com'
        })
      }
    }

    fetchSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings) return null

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1행 - 사업자 정보 */}
        <div className="pb-6 border-b border-gray-200 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src={settings.site_logo_url}
              alt={settings.site_name}
              className="grayscale opacity-60"
              style={{ height: '18px', maxHeight: '18px', objectFit: 'contain' }}
            />
            <span className="text-sm text-gray-600">
              신선한 농산물을 직접 공급하는 B2B 전문 플랫폼
            </span>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">{settings.company_name}</span>
              {' '}&middot;{' '}
              <span>대표: {settings.ceo_name}</span>
              {' '}&middot;{' '}
              <span>사업자등록번호: {settings.business_number}</span>
              {' '}&middot;{' '}
              <span>통신판매업신고번호: {settings.e_commerce_license_number}</span>
            </p>
            <p>
              주소: {settings.address}
            </p>
            <p>
              고객센터: {settings.contact_phone}
              {' '}&middot;{' '}
              이메일: <a href={`mailto:${settings.contact_email}`} className="hover:text-primary transition-colors">{settings.contact_email}</a>
            </p>
          </div>
        </div>

        {/* 2행 - 바로가기 및 저작권 */}
        <div className="pt-6 text-center space-y-2">
          <div className="flex justify-center gap-6 text-xs">
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-gray-900 font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              개인정보처리방침
            </button>
            <button
              onClick={() => setShowCashPolicyModal(true)}
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
            >
              캐시 등 운영정책
            </button>
          </div>

          <p className="text-xs text-gray-500">
            {settings.footer_text}
          </p>
        </div>
      </div>

      {/* 이용약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">이용약관</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 65px)' }}>
              <div className="text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
{`달래마켓 이용약관

제1조 (목적)
본 약관은 달래마켓(이하 "회사")이 운영하는 농산물 B2B 온라인 플랫폼 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "사이트"라 함은 회사가 운영하는 온라인 플랫폼을 의미합니다.
2. "회원"이라 함은 사이트에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
3. "서비스"라 함은 회사가 제공하는 농산물 정보, 시세, 거래 및 기타 부가 서비스를 의미합니다.
4. "캐시 등"이라 함은 회사가 회원에게 제공하는 캐시, 크레딧, 포인트 등의 가상 적립금 및 혜택을 통칭합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.
3. 회사는 약관을 변경할 경우, 변경된 약관의 내용과 시행일을 명시하여 시행일 7일 전부터 공지합니다.

제4조 (회원가입)
1. 회원가입은 이용자가 약관 내용에 동의하고 회원가입 신청을 하며, 회사가 이를 승낙함으로써 체결됩니다.
2. 회사는 다음 각 호에 해당하는 경우 회원가입을 거절할 수 있습니다.
   ① 실명이 아니거나 타인의 명의를 이용한 경우
   ② 허위 정보 기재 또는 필수항목 누락
   ③ 기술상 현저한 지장이 있다고 판단되는 경우

제5조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 서비스를 제공합니다.
   ① 농산물 정보 제공
   ② 농산물 위탁 발송 및 중개
   ③ 캐시 등 부가혜택 운영 서비스
   ④ 기타 회사가 정하는 서비스
2. 회사는 서비스 내용을 변경할 수 있으며, 변경 시 사전 공지합니다.

제6조 (서비스의 중단)
1. 회사는 시스템 점검, 교체, 고장, 통신두절 등의 사유가 발생한 경우 서비스 제공을 일시 중단할 수 있습니다.
2. 천재지변 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 중단할 수 있습니다.

제7조 (회원의 의무)
회원은 다음 행위를 하여서는 안 됩니다.
① 허위 내용 등록
② 타인의 정보 도용
③ 회사 게시물의 임의 수정
④ 회사가 금지한 정보 게시
⑤ 회사 또는 제3자의 권리 침해
⑥ 명예 훼손, 업무방해 행위
⑦ 음란·폭력적 게시물 등록 등 공서양속 위반 행위

제8조 (개인정보보호)
회사는 회원의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 이를 준수합니다.

제9조 (회사의 의무)
1. 회사는 법령과 본 약관을 준수하며, 안정적 서비스 제공을 위해 노력합니다.
2. 회사는 개인정보보호를 위해 보안시스템을 구축합니다.

제10조 (캐시 등 부가혜택 제도)
1. 회사는 회원의 서비스 이용 촉진 또는 마케팅 등을 위하여 캐시, 크레딧, 포인트 등(이하 "캐시 등")을 부여할 수 있습니다.
2. "캐시 등"의 적립, 사용, 소멸 등에 관한 구체적인 내용은 별도의 「캐시 등 운영정책」에 따릅니다.
3. "캐시 등"은 회사의 재량으로 지급, 변경 또는 소멸될 수 있으며, 회원은 이에 대하여 법적 권리를 주장할 수 없습니다.
4. "캐시 등"은 현금으로 환불되지 않으며, 플랫폼 내 지정된 용도로만 사용할 수 있습니다.

제11조 (콘텐츠의 저작권 및 이용제한)
1. 달래마켓이 제공하거나 게시한 모든 콘텐츠(사진, 영상, 상품설명, 시세정보, 디자인, 데이터베이스, 문서, 프로그램 등)에 대한 저작권 및 기타 지식재산권은 달래마켓 또는 해당 권리자에게 있습니다.
2. 회원은 달래마켓과의 거래(발주, 상품 위탁, 협력 판매 등)와 직접적으로 관련된 경우에 한하여, 달래마켓이 제공한 콘텐츠를 이용해 자사몰, 온라인 마켓, SNS 등에서 농산물을 홍보·판매할 수 있습니다.
3. 단, 회원이 달래마켓을 통한 거래를 중단하거나, 타 B2B 플랫폼을 이용하면서 달래마켓의 콘텐츠(사진, 영상, 설명문 등)를 계속 사용하거나, 콘텐츠 다운로드만을 목적으로 사이트에 접속하는 행위는 금지됩니다.
4. 달래마켓은 회원이 제3항을 위반한 경우, 콘텐츠 이용 중지, 계정 제한, 손해배상 청구, 법적 조치 등 필요한 조치를 즉시 취할 수 있습니다.
5. 회원은 달래마켓으로부터 제공받은 콘텐츠를 이용하여 제작한 2차 콘텐츠(예: 상세페이지, 광고 이미지 등)를 달래마켓의 요청이 있을 경우 즉시 사용을 중단하고 삭제·폐기해야 합니다.
6. 회원이 본 조를 위반하여 제3자 또는 외부 플랫폼으로부터 저작권 침해 등 분쟁이 발생한 경우, 그에 따른 모든 민·형사상 책임은 회원에게 있으며, 달래마켓은 이에 대해 어떠한 책임도 지지 않습니다.

제12조 (분쟁해결)
1. 회사와 회원 간 발생한 분쟁은 상호 협의하여 해결합니다.
2. 협의가 되지 않을 경우, 관할 법원은 회사의 본사 소재지 관할 법원으로 합니다.

부칙
본 약관은 2025년 12월 1일부터 시행합니다.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">개인정보처리방침</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 65px)' }}>
              <div className="text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
{`달래마켓(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.

1. 수집하는 개인정보 항목
회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
- 필수항목: 이름, 연락처, 이메일, 비밀번호
- 선택항목: 마케팅 수신 동의 여부(이메일, SMS)
- 판매자 추가항목: 사업자명, 사업자등록번호, 사업장 주소, 대표자명, 정산계좌정보
- 소셜 로그인(네이버, 카카오, 구글) 시: 이름, 이메일, 전화번호
- 서비스 이용 과정에서 자동 수집: IP주소, 쿠키, 방문일시, 서비스 이용기록

2. 개인정보의 수집 및 이용목적
- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
- 회원 관리 및 본인 확인
- 소셜 로그인을 통한 간편 회원가입 및 로그인
- 마케팅 및 광고에 활용 (동의한 회원에 한함)
- 농산물 거래 중개 및 배송 처리
- 서비스 이용기록 분석 및 통계

3. 개인정보의 보유 및 이용기간
원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
- 계약 또는 청약철회 기록: 5년 (전자상거래법)
- 대금결제 및 재화 공급 기록: 5년 (전자상거래법)
- 소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)

4. 개인정보의 파기절차 및 방법
회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다.
- 파기절차: 회원 탈퇴 시 즉시 파기 (법령에 따른 보관 필요 정보 제외)
- 파기방법: 전자적 파일은 복구 불가능한 방법으로 삭제

5. 개인정보 제공
회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다:
- 소셜 로그인(네이버, 카카오, 구글) 이용 시 해당 서비스 제공자로부터 최소한의 정보를 제공받습니다.
- 이용자가 사전에 동의한 경우
- 배송업체(택배사): 구매자명, 연락처, 수령인명, 연락처, 배송주소
- 결제대행사(PG사): 판매자명, 연락처, 이메일 (거래종료 후 5년 보관)
- 법령의 규정에 의하거나 수사기관의 요구가 있는 경우

6. 소셜 로그인 서비스
회사는 편리한 회원가입 및 로그인을 위해 네이버, 카카오, 구글의 소셜 로그인 서비스를 제공합니다. 소셜 로그인 이용 시 해당 서비스의 이용약관 및 개인정보처리방침이 함께 적용됩니다.

7. 이용자의 권리와 행사방법
이용자는 언제든지 본인의 개인정보를 조회하거나 수정, 삭제, 처리정지를 요구할 수 있습니다.
- 개인정보 조회/수정: 마이페이지에서 직접 열람 및 수정
- 회원탈퇴: 고객센터 문의 또는 이메일 요청
- 마케팅 수신거부: 마이페이지 또는 수신 메일/SMS 내 수신거부 링크

8. 개인정보의 안전성 확보조치
- 비밀번호 암호화 저장
- SSL 인증서를 통한 데이터 전송 암호화
- 개인정보 접근권한 제한 및 관리

9. 쿠키의 사용
회사는 로그인 유지, 이용 분석 등을 위해 쿠키를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.

10. 만 14세 미만 아동의 개인정보
회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.

11. 개인정보보호책임자
성명: 김동수
연락처: 010-2688-1388
이메일: dalraemarket@gmail.com

12. 개인정보처리방침 변경
이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.

본 방침은 2025년 12월 1일부터 시행됩니다.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캐시 등 운영정책 모달 */}
      {showCashPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setShowCashPolicyModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">캐시 등 운영정책</h2>
              <button
                onClick={() => setShowCashPolicyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 65px)' }}>
              <div className="text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
{`달래마켓 캐시 등 운영정책

제1조 (목적)
본 정책은 달래마켓(이하 "회사")이 회원에게 제공하는 캐시, 크레딧, 포인트 등(이하 "캐시 등")의 적립, 사용, 소멸 및 관리에 관한 사항을 명확히 규정함을 목적으로 합니다.

제2조 (정의)
1. "캐시"란 회원이 달래마켓을 통해 농산물 발주 시 현금 결제액을 대체하여 사용할 수 있는 가상 적립금입니다.
2. "크레딧"이란 회사가 운영하는 다양한 업무도구 및 앱(예: 발주관리, 정산도구, 자동화 기능 등)을 이용에 사용할 수 있는 적립금입니다.
3. "포인트"란 로그인, 출석, 후기 작성, 특정 프로모션 참여 등의 활동에 따라 지급되는 일반 적립 혜택입니다.
4. "캐시 등"이라 함은 위 각 항의 모든 혜택을 포함한 통칭을 의미합니다.

제3조 (적립 및 사용 기준)
1. 적립률, 지급 시점, 최대 적립 한도 및 사용기준은 회사의 정책에 따라 변경될 수 있으며, 사이트 내 각 공지사항 등에서 확인가능합니다.
2. 사용은 회사가 지정하는 이벤트, 교환 서비스 등 내부 운영 범위 내에서만 가능합니다.

제4조 (소멸 및 회수)
1. 캐시 등은 적립일로부터  3개월이 경과하면 자동 소멸됩니다.
2. 회원이 탈퇴하거나 자격이 정지된 경우, 미사용 캐시 등은 자동 소멸되며 환급되지 않습니다.
3. 회사는 다음 각 호에 해당하는 경우 사전 통보 없이 캐시 등을 회수할 수 있습니다.
   ① 부정한 방법(허위 주문, 중복 계정 등)으로 적립된 경우
   ② 시스템 오류 등으로 잘못 적립된 경우
   ③ 서비스 종료 또는 정책 변경에 따라 회수가 필요한 경우

제5조 (정책 변경 및 제도 종료)
1. 회사는 경영, 시스템, 마케팅 운영상의 필요에 따라 본 정책을 변경하거나 제도를 종료할 수 있습니다.
2. 정책 변경 또는 제도 종료 시 회사는 최소 7일 전에 공지합니다.
3. 미사용 캐시 등은 공지일 기준으로 자동 소멸될 수 있으며, 회사는 이에 대해 별도의 보상이나 환급 의무를 부담하지 않습니다.
4. 캐시 등은 회사가 자율적으로 제공하는 서비스 혜택으로서, **회원의 계약상 권리나 재산적 권리가 아닙니다.**
5. **회원은 캐시 등에 대해 소유권, 환불, 상환, 법적 보상 등의 권리를 주장할 수 없으며**, 회사는 이에 대한 어떠한 법적 책임도 부담하지 않습니다.

제6조 (부정 이용 및 제재)
1. 회원이 다음 각 호에 해당하는 경우, 회사는 캐시 등의 회수, 계정 정지, 서비스 이용 제한 등의 조치를 취할 수 있습니다.
   ① 부정 적립, 부정 사용, 중복 계정 생성 등 부당한 방법으로 혜택을 취득한 경우
   ② 타 회원의 계정 또는 시스템을 이용해 캐시 등을 조작한 경우
   ③ 캐시 등을 제3자에게 매매 또는 양도한 경우
2. 부정 이용으로 인한 모든 법적 책임은 해당 회원에게 있으며, 회사는 손해배상을 청구할 수 있습니다.

제7조 (면책 조항)
회원은 캐시 등 제도의 운영이 회사의 재량임을 인지하며, 회사는 정책 변경, 시스템 오류, 제도 종료 등으로 인한 손해에 대해 책임지지 않습니다.

부칙
본 정책은 2025년 12월 1일부터 시행합니다.`}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
