'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// 타입 정의
interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  company_name?: string
  role: string
  approved: boolean
}

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  supplier_price: number
  selling_price: number
  stock_quantity: number
  unit: string
  is_active: boolean
}

interface Order {
  id: string
  order_number: string
  customer_id: string
  status: string
  total_amount: number
  shipping_fee: number
  invoice_number: string | null
  tracking_number: string | null
  notes: string | null
  created_at: string
  customer?: {
    name: string
    email: string
    company_name: string
  }
  order_items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product?: {
    name: string
    sku: string
  }
}

interface OrderForm {
  customer_id: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
  }[]
  shipping_fee: number
  notes: string
}

interface StatusConfig {
  label: string
  color: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // 새 주문 폼 데이터
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer_id: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    shipping_fee: 0,
    notes: ''
  })

  const supabase = createClient()

  // 주문 목록 조회 - useCallback으로 메모이제이션
  const fetchOrders = useCallback(async () => {
    try {
      setError(null)
      
      // 먼저 간단한 쿼리로 테스트
      const { data: basicData, error: basicError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (basicError) {
        console.error('Basic query error:', basicError)
        setError(`주문 데이터를 불러올 수 없습니다: ${basicError.message}`)
        setOrders([])
        return
      }

      // 기본 쿼리가 성공하면 관계 데이터 포함해서 다시 조회
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(
            name,
            email,
            company_name
          ),
          order_items(
            *,
            product:products(
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Full query error:', error)
        setOrders(basicData || [])
        console.warn('관계 데이터를 불러올 수 없습니다. 기본 데이터만 표시합니다.')
      } else {
        setOrders(data || [])
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('주문 목록을 불러오는 중 오류가 발생했습니다.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // 상품 목록 조회 - useCallback으로 메모이제이션
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        console.error('Error fetching products:', error)
        return
      }
      
      setProducts(data || [])
    } catch (error) {
      console.error('Error in fetchProducts:', error)
    }
  }, [supabase])

  // 고객 목록 조회 - useCallback으로 메모이제이션
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['customer', 'vip_customer', 'partner'])
        .eq('approved', true)
      
      if (error) {
        console.error('Error fetching customers:', error)
        return
      }
      
      setCustomers(data || [])
    } catch (error) {
      console.error('Error in fetchCustomers:', error)
    }
  }, [supabase])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchCustomers()
      ])
    }
    loadData()
  }, [fetchOrders, fetchProducts, fetchCustomers])

  // 주문 생성
  const handleCreateOrder = async () => {
    try {
      // 주문 번호 생성 (예: ORD-20240103-001)
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const orderNumber = `ORD-${today}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      
      // 총액 계산
      const totalAmount = orderForm.items.reduce((sum, item) => {
        return sum + (item.unit_price * item.quantity)
      }, 0) + orderForm.shipping_fee

      // 주문 생성
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: orderForm.customer_id,
          status: 'pending',
          total_amount: totalAmount,
          shipping_fee: orderForm.shipping_fee,
          notes: orderForm.notes
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 주문 상품 생성
      const orderItems = orderForm.items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      alert('주문이 생성되었습니다.')
      setShowCreateModal(false)
      fetchOrders()
      
      // 폼 초기화
      setOrderForm({
        customer_id: '',
        items: [{ product_id: '', quantity: 1, unit_price: 0 }],
        shipping_fee: 0,
        notes: ''
      })
    } catch (error) {
      console.error('Error creating order:', error)
      alert('주문 생성 중 오류가 발생했습니다.')
    }
  }

  // 주문 상태 변경
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: Record<string, string | Date> = { status: newStatus }
      
      // 상태별 추가 정보 업데이트
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      } else if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error
      
      alert('주문 상태가 변경되었습니다.')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 송장 번호 업데이트
  const updateTrackingNumber = async (orderId: string) => {
    const trackingNumber = prompt('송장 번호를 입력하세요:')
    if (!trackingNumber) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          status: 'shipped',
          shipped_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      
      alert('송장 번호가 등록되었습니다.')
      fetchOrders()
    } catch (error) {
      console.error('Error updating tracking number:', error)
      alert('송장 번호 등록 중 오류가 발생했습니다.')
    }
  }

  // 주문 항목 추가
  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product_id: '', quantity: 1, unit_price: 0 }]
    })
  }

  // 주문 항목 제거
  const removeOrderItem = (index: number) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index)
    })
  }

  // 상품 선택 시 가격 자동 설정
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    const newItems = [...orderForm.items]
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      unit_price: product?.selling_price || 0
    }
    setOrderForm({ ...orderForm, items: newItems })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, StatusConfig> = {
      pending: { label: '대기중', color: 'bg-gray-100 text-gray-800' },
      confirmed: { label: '확인됨', color: 'bg-blue-100 text-blue-800' },
      processing: { label: '처리중', color: 'bg-yellow-100 text-yellow-800' },
      shipped: { label: '배송중', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: '배송완료', color: 'bg-green-100 text-green-800' },
      cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            {orders.length > 0 ? `총 ${orders.length}개의 주문이 있습니다.` : '주문이 없습니다.'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 주문 생성
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 주문 목록 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">송장번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문일시</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  주문이 없습니다. 새 주문을 생성해주세요.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customer?.company_name || order.customer?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total_amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.tracking_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowDetailModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      상세보기
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        확인
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateTrackingNumber(order.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        송장등록
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 주문 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">새 주문 생성</h3>
            
            <div className="space-y-4">
              {/* 고객 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">고객</label>
                <select
                  value={orderForm.customer_id}
                  onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">선택하세요</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* 상품 목록 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상품</label>
                {orderForm.items.map((item, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="">상품 선택</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.selling_price.toLocaleString()}원
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...orderForm.items]
                        newItems[index].quantity = parseInt(e.target.value) || 1
                        setOrderForm({ ...orderForm, items: newItems })
                      }}
                      className="w-24 rounded-md border-gray-300 shadow-sm"
                      placeholder="수량"
                      min="1"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => {
                        const newItems = [...orderForm.items]
                        newItems[index].unit_price = parseFloat(e.target.value) || 0
                        setOrderForm({ ...orderForm, items: newItems })
                      }}
                      className="w-32 rounded-md border-gray-300 shadow-sm"
                      placeholder="단가"
                    />
                    {orderForm.items.length > 1 && (
                      <button
                        onClick={() => removeOrderItem(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOrderItem}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  + 상품 추가
                </button>
              </div>

              {/* 배송비 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">배송비</label>
                <input
                  type="number"
                  value={orderForm.shipping_fee}
                  onChange={(e) => setOrderForm({ ...orderForm, shipping_fee: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">메모</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                주문 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">주문 상세 정보</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">주문번호</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">상태</p>
                  <p className="mt-1">{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">고객</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.customer?.company_name || selectedOrder.customer?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">연락처</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">총 금액</p>
                  <p className="mt-1 text-sm text-gray-900 font-bold">
                    {selectedOrder.total_amount.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">배송비</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.shipping_fee.toLocaleString()}원
                  </p>
                </div>
              </div>

              {/* 주문 상품 목록 */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">주문 상품</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.order_items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.product?.name || '-'}</td>
                          <td className="px-4 py-2 text-sm">{item.product?.sku || '-'}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">{item.unit_price.toLocaleString()}원</td>
                          <td className="px-4 py-2 text-sm font-medium">{item.total_price.toLocaleString()}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 메모 */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">메모</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedOrder(null)
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}