import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Package, ShoppingCart, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    navigate('/login')
    window.location.reload()
  }

  const menuItems = [
    { path: '/dashboard', name: '대시보드', icon: Home },
    { path: '/products', name: '상품관리', icon: Package },
    { path: '/orders', name: '주문관리', icon: ShoppingCart },
  ]

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">달래마켓</h1>
          <button 
            className="sidebar-toggle desktop-hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="layout-content">
        {/* Header */}
        <header className="header">
          <button 
            className="sidebar-toggle mobile-only"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="header-title">
            <h2>농산물 직거래 플랫폼</h2>
          </div>
          <div className="header-user">
            <span className="user-name">관리자</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="overlay mobile-only" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
