import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import './Products.css'

function Products() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 더미 데이터 (나중에 Supabase 연동)
    setTimeout(() => {
      setProducts([
        { id: 1, name: '유기농 토마토', category: '채소', price: 5000, stock: 150, status: '판매중' },
        { id: 2, name: '친환경 상추', category: '채소', price: 3000, stock: 200, status: '판매중' },
        { id: 3, name: '무농약 딸기', category: '과일', price: 15000, stock: 50, status: '판매중' },
        { id: 4, name: '유기농 감자', category: '채소', price: 4000, stock: 0, status: '품절' },
        { id: 5, name: '친환경 오이', category: '채소', price: 3500, stock: 100, status: '판매중' },
        { id: 6, name: '무농약 사과', category: '과일', price: 8000, stock: 80, status: '판매중' },
        { id: 7, name: '유기농 배추', category: '채소', price: 4500, stock: 60, status: '판매중' },
        { id: 8, name: '친환경 포도', category: '과일', price: 12000, stock: 30, status: '판매중' },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="products-loading">
        <div className="spinner"></div>
        <p>상품 목록 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="products">
      <div className="products-header">
        <h1>상품 관리</h1>
        <button className="btn btn-primary">
          <Plus size={20} />
          상품 추가
        </button>
      </div>

      <div className="products-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="상품명 또는 카테고리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="products-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>재고</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>#{product.id}</td>
                <td className="product-name">{product.name}</td>
                <td>{product.category}</td>
                <td>₩{product.price.toLocaleString()}</td>
                <td>
                  <span className={product.stock === 0 ? 'stock-out' : ''}>
                    {product.stock}개
                  </span>
                </td>
                <td>
                  <span className={`status ${product.status === '판매중' ? 'status-success' : 'status-danger'}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="수정">
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon btn-icon-danger" title="삭제">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Products
