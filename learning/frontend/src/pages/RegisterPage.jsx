"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import "../css/register.css"

const RegisterPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Animation effect when component mounts
  useEffect(() => {
    document.querySelector(".register-container").classList.add("fade-in")
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/auth/register", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })

      // Show success animation before showing success message
      document.querySelector(".register-form").classList.add("success")

      setTimeout(() => {
        setSuccess(true)
        setLoading(false)
      }, 800)
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Please try again.")
      document.querySelector(".register-form").classList.add("error-shake")
      setTimeout(() => {
        document.querySelector(".register-form").classList.remove("error-shake")
      }, 500)
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (success) {
    return (
      <div className="register-page">
        <div className="register-container success-container fade-in">
          <div className="register-left">
            <div className="brand-logo">
              <h2>
                Enterprise<span>Suite</span>
              </h2>
            </div>
            <div className="welcome-text">
              <h1>Join Our Platform</h1>
              <p>Create your account to access all features</p>
            </div>
            <div className="login-circles">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
            </div>
          </div>

          <div className="register-right">
            <div className="success-message-container">
              <div className="success-icon">✓</div>
              <h2>Registration Successful</h2>
              <p>Your account is pending approval from an admin.</p>
              <button className="login-redirect-button" onClick={() => navigate("/login")}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="brand-logo">
            <h2>
              DXC <span>technology</span>
            </h2>
          </div>
          <div className="welcome-text">
            <h1>Join Our Platform</h1>
            <p>Create your account to access all features</p>
          </div>
          <div className="login-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
          </div>
        </div>

        <div className="register-right">
          <div className="register-form-container">
            <h2>Create Account</h2>
            <p className="subtitle">Please fill in your information to register</p>

            {error && <div className="error-message">{error}</div>}

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="name-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="input-container">
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                      className={firstName ? "has-value" : ""}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="input-container">
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      required
                      className={lastName ? "has-value" : ""}
                    />
                  </div>
                </div>
              </div>

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
                    placeholder="Create a password"
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

              <div className="terms-privacy">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className={`register-button ${loading ? "loading" : ""}`} disabled={loading}>
                {loading ? <span className="loader"></span> : "Register"}
              </button>
            </form>

            <div className="login-link">
              Already have an account? <a href="/login">Login</a>
            </div>

            <div className="security-note">
              <span>Secure Enterprise Registration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
