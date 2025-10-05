import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ResponsiveProvider } from './contexts/ResponsiveProvider';
import './styles/global.css';

// Admin 페이지들
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/orders";
import Login from "./pages/admin/Login";

// User 페이지
import Home from "./pages/user/Home";
import UserProducts from './pages/user/Products';
import Market from './pages/user/Market';
import Delivery from './pages/user/Delivery';
import UserOrders from './pages/user/Orders';
import Tools from './pages/user/Tools';
import Pricing from './pages/user/Pricing';
import WinWin from './pages/user/WinWin';
import Notice from './pages/user/Notice';
import SellerFeed from './pages/user/SellerFeed';  // 추가

function App() {
  return (
    <ResponsiveProvider>
      <Router>
        <Routes>
          {/* 사용자 페이지 */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<UserProducts />} />
          <Route path="/market" element={<Market />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/orders" element={<UserOrders />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/winwin" element={<WinWin />} />
          <Route path="/notice" element={<Notice />} />
          <Route path="/seller-feed" element={<SellerFeed />} />  {/* 추가 */}
          
          {/* 로그인 */}
          <Route path="/login" element={<Login />} />
          
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </Router>
    </ResponsiveProvider>
  );
}

export default App;