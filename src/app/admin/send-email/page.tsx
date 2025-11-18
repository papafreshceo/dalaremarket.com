import { Metadata } from 'next'
import SendEmailTab from './components/SendEmailTab'

export const metadata: Metadata = {
  title: '개별 이메일 발송 | 달래마켓 관리자',
  description: '특정 사용자에게 이메일 발송',
}

export default function SendEmailPage() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          개별 이메일 발송
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          특정 사용자를 선택하여 이메일을 발송할 수 있습니다.
        </p>
      </div>

      <SendEmailTab />
    </div>
  )
}
