import { Metadata } from 'next'
import TemplatesTab from './components/TemplatesTab'

export const metadata: Metadata = {
  title: '이메일 템플릿 관리 | 달래마켓 관리자',
  description: '이메일 템플릿 관리',
}

export default function EmailTemplatesPage() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          이메일 템플릿 관리
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          이메일 템플릿을 생성, 수정, 삭제하고 미리보기를 확인할 수 있습니다.
        </p>
      </div>

      <TemplatesTab />
    </div>
  )
}
