'use client'

import UserHeader from '@/components/layout/UserHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <UserHeader />
      {children}
      <MobileBottomNav />
    </>
  )
}
