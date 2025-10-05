'use client'

import UserHeader from '@/components/layout/UserHeader'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <UserHeader />
      {children}
    </>
  )
}
