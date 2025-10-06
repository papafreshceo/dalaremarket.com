'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShippingVendor {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

interface InvoiceEntity {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export default function ShippingInvoiceSettingsPage() {
  const [shippingVendors, setShippingVendors] = useState<ShippingVendor[]>([])
  const [invoiceEntities, setInvoiceEntities] = useState<InvoiceEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [newEntityName, setNewEntityName] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [vendorsResult, entitiesResult] = await Promise.all([
      supabase.from('shipping_vendors').select('*').order('display_order'),
      supabase.from('invoice_entities').select('*').order('display_order')
    ])

    if (vendorsResult.data) setShippingVendors(vendorsResult.data)
    if (entitiesResult.data) setInvoiceEntities(entitiesResult.data)

    setLoading(false)
  }

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return

    const maxOrder = Math.max(...shippingVendors.map(v => v.display_order), 0)
    const { error } = await supabase
      .from('shipping_vendors')
      .insert({
        name: newVendorName.trim(),
        display_order: maxOrder + 1,
        is_active: true
      })

    if (!error) {
      setNewVendorName('')
      fetchData()
    }
  }

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) return

    const maxOrder = Math.max(...invoiceEntities.map(e => e.display_order), 0)
    const { error } = await supabase
      .from('invoice_entities')
      .insert({
        name: newEntityName.trim(),
        display_order: maxOrder + 1,
        is_active: true
      })

    if (!error) {
      setNewEntityName('')
      fetchData()
    }
  }

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('이 출고처를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('shipping_vendors')
      .delete()
      .eq('id', id)

    if (!error) fetchData()
  }

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('이 송장주체를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('invoice_entities')
      .delete()
      .eq('id', id)

    if (!error) fetchData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">출고처/송장주체 관리</h1>
        <p className="text-sm text-gray-500 mt-1">출고처 및 송장주체 항목을 추가하거나 삭제할 수 있습니다</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 출고처 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">출고처</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddVendor()}
              placeholder="새 출고처 입력"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddVendor}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              추가
            </button>
          </div>

          <div className="space-y-2">
            {shippingVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-900">{vendor.name}</span>
                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 송장주체 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">송장주체</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEntity()}
              placeholder="새 송장주체 입력"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddEntity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              추가
            </button>
          </div>

          <div className="space-y-2">
            {invoiceEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-900">{entity.name}</span>
                <button
                  onClick={() => handleDeleteEntity(entity.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
