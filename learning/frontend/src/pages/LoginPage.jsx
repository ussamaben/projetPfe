"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import "../css/login.css"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Animation effect when component mounts
  useEffect(() => {
    document.querySelector(".login-container").classList.add("fade-in")
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await api.post("/auth/login", { email, password })

      // Store tokens
      localStorage.setItem("token", response.data.access_token)
      localStorage.setItem("user_role", response.data.role)

      // Force token injection
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access_token}`

      // Show success animation before redirect
      document.querySelector(".login-form").classList.add("success")

      // Redirect after animation
      setTimeout(() => {
        navigate(response.data.role === "admin" ? "/admin" : "/manager")
      }, 800)
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid email or password. Please try again.")
      document.querySelector(".login-form").classList.add("error-shake")
      setTimeout(() => {
        document.querySelector(".login-form").classList.remove("error-shake")
      }, 500)
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand-logo">
            <h2>
              DXC <span>technology</span>
            </h2>
          </div>
          <div className="welcome-text">
            <h1>Welcome Back</h1>
            <p>Sign in to access your enterprise dashboard</p>
          </div>
          <div className="login-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <h2>Hello Again!</h2>
            <p className="subtitle">Welcome back, please enter your details</p>

            {error && <div className="error-message">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className={email ? "has-value" : ""}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={password ? "has-value" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="/forgot-password" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className={`login-button ${loading ? "loading" : ""}`} disabled={loading}>
                {loading ? <span className="loader"></span> : "Login"}
              </button>
            </form>

            <div className="register-link">
              Don't have an account? <a href="/register">Register as Manager</a>
            </div>

            <div className="security-note">
              <span>Secure Enterprise Login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
