import { useState, useEffect } from 'react'
import { Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'


function Orders() {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 더미 데이터 (나중에 Supabase 연동)
    setTimeout(() => {
      setOrders([
        { 
          id: 1001, 
          customer: '김철수', 
          email: 'kim@example.com',
          product: '유기농 토마토 외 2건', 
          amount: 45000, 
          status: 'pending',
          date: '2024-01-15 10:30'
        },
        { 
          id: 1002, 
          customer: '이영희', 
          email: 'lee@example.com',
          product: '친환경 상추', 
          amount: 28000, 
          status: 'processing',
          date: '2024-01-15 11:45'
        },
        { 
          id: 1003, 
          customer: '박민수', 
          email: 'park@example.com',
          product: '무농약 딸기 외 1건', 
          amount: 67000, 
          status: 'completed',
          date: '2024-01-15 13:20'
        },
        { 
          id: 1004, 
          customer: '정수진', 
          email: 'jung@example.com',
          product: '유기농 감자', 
          amount: 32000, 
          status: 'processing',
          date: '2024-01-15 14:00'
        },
        { 
          id: 1005, 
          customer: '홍길동', 
          email: 'hong@example.com',
          product: '친환경 오이 외 3건', 
          amount: 89000, 
          status: 'cancelled',
          date: '2024-01-15 15:30'
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.id.toString().includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle size={16} />
      case 'cancelled':
        return <XCircle size={16} />
      case 'processing':
        return <Clock size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'pending':
        return '대기중'
      case 'processing':
        return '처리중'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소됨'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>주문 목록 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="orders">
      <div className="orders-header">
        <h1>주문 관리</h1>
        <div className="orders-stats">
          <div className="stat-badge">
            <span className="stat-label">오늘 주문</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">처리 대기</span>
            <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
          </div>
        </div>
      </div>

      <div className="orders-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="주문번호, 고객명, 상품명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            전체
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            대기중
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
            onClick={() => setFilterStatus('processing')}
          >
            처리중
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            완료
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>고객정보</th>
              <th>상품</th>
              <th>금액</th>
              <th>상태</th>
              <th>주문일시</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td className="order-id">#{order.id}</td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{order.customer}</div>
                    <div className="customer-email">{order.email}</div>
                  </div>
                </td>
                <td>{order.product}</td>
                <td className="order-amount">₩{order.amount.toLocaleString()}</td>
                <td>
                  <span className={`status status-${order.status}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="order-date">{order.date}</td>
                <td>
                  <button className="btn-icon" title="상세보기">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Orders
