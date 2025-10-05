import { useState, useEffect } from 'react'
import { Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  })

  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 더미 데이터 (나중에 Supabase 연동)
    setTimeout(() => {
      setStats({
        totalProducts: 128,
        totalOrders: 1234,
        totalRevenue: 45678900,
        totalCustomers: 567
      })
      
      setRecentOrders([
        { id: 1, customer: '김철수', product: '유기농 토마토', amount: 35000, status: '배송중' },
        { id: 2, customer: '이영희', product: '친환경 상추', amount: 28000, status: '준비중' },
        { id: 3, customer: '박민수', product: '무농약 딸기', amount: 45000, status: '완료' },
        { id: 4, customer: '정수진', product: '유기농 감자', amount: 32000, status: '배송중' },
        { id: 5, customer: '홍길동', product: '친환경 오이', amount: 25000, status: '준비중' },
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>데이터 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <p className="text-muted">실시간 운영 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProducts.toLocaleString()}</div>
            <div className="stat-label">전체 상품</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
            <div className="stat-label">총 주문</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">₩{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
            <div className="stat-label">총 매출</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCustomers.toLocaleString()}</div>
            <div className="stat-label">고객 수</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-section">
        <div className="section-header">
          <h2>최근 주문</h2>
          <button className="btn btn-primary">전체보기</button>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>고객명</th>
                <th>상품</th>
                <th>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.toString().padStart(4, '0')}</td>
                  <td>{order.customer}</td>
                  <td>{order.product}</td>
                  <td>₩{order.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status status-${
                      order.status === '완료' ? 'success' : 
                      order.status === '배송중' ? 'info' : 
                      'warning'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
