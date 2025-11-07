import { redirect } from 'next/navigation'

export default function PlatformPage() {
  // 플랫폼 루트는 랜딩페이지(/)로 리다이렉트
  redirect('/')
}
