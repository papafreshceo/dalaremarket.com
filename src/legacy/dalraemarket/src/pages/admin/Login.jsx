import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import './Login.css'

function Login({ setAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 임시 로그인 (나중에 Supabase 연동)
    setTimeout(() => {
      if (email === 'admin@dalrae.com' && password === '1234') {
        localStorage.setItem('auth_token', 'temp_token_123')
        setAuth(true)
        navigate('/dashboard')
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">달래마켓</h1>
            <p className="login-subtitle">관리자 로그인</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@dalrae.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>로그인 중...</>
              ) : (
                <>
                  <LogIn size={20} />
                  로그인
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="test-account">
              테스트 계정: admin@dalrae.com / 1234
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
