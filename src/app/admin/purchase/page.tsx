'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PurchasePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/purchase/saiup')
  }, [router])

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">로딩 중...</p>
    </div>
  )
}
