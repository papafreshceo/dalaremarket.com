import { Metadata } from 'next'
import EmailLogsTab from './components/EmailLogsTab'

export const metadata: Metadata = {
  title: '이메일 발송 기록 | 달래마켓 관리자',
  description: '이메일 발송 기록 및 통계',
}

export default function EmailLogsPage() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          이메일 발송 기록
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          모든 이메일 발송 기록과 통계를 확인할 수 있습니다.
        </p>
      </div>

      <EmailLogsTab />
    </div>
  )
}
