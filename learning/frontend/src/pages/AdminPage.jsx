"use client"

import { useState, useEffect, useCallback } from "react"
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import {
  Home,
  Users,
  LogOut,
  Settings,
  Search,
  Bell,
  BarChart3,
  TrendingUp,
  Activity,
  AlertCircle,
  Filter,
} from "lucide-react"
import ProtectedRoute from "../components/ProtectedRoute"
import api from "../services/api" // Your real API
import "../css/AdminPage.css"

// Admin Sidebar Component
const AdminSidebar = ({ collapsed, onToggle }) => {
  const location = useLocation()

  // Use require instead of import for the logo
  const DXCLogo = require("../assets/dxc.png")
  const menuItems = [
    {
      title: "Overview",
      path: "/admin",
      icon: <Home className="sidebar-icon" />,
    },
    {
      title: "Gérer Manager",
      path: "/admin/managers",
      icon: <Users className="sidebar-icon" />,
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_role")
    window.location.href = "/login"
  }

  return (
    <div className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img
              src={DXCLogo.default || DXCLogo}
              alt="DXC Logo"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "contain",
              }}
            />
          </div>
          {!collapsed && <span className="logo-text-corporate">Analyst</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <Link to={item.path} className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}>
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/admin/settings"
          className={`sidebar-footer-link ${location.pathname === "/admin/settings" ? "active" : ""}`}
        >
          <Settings className="sidebar-icon" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button onClick={handleLogout} className="sidebar-footer-link">
          <LogOut className="sidebar-icon" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  )
}

// Admin Header Component
const AdminHeader = ({ title, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="admin-header">
      <h1 className="header-title">{title}</h1>

      <div className="header-actions">
        <div className="search-container">
          <Search className="search-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>

        <div className="notification-container">
          <button className="notification-button">
            <Bell className="notification-icon" />
            <span className="notification-badge"></span>
          </button>
        </div>

        <div className="user-dropdown">
          <button className="user-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar">A</div>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">Admin Account</div>
              <button className="dropdown-item">Profile</button>
              <button className="dropdown-item">Settings</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={onLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Overview Page Component
const OverviewPage = () => {
  const [stats, setStats] = useState({
    pendingManagers: 0,
    totalUsers: 0,
    systemStatus: "Loading...",
    growth: "0%",
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        // Fetch pending managers count
        const managersResponse = await api.get("/admin/pending-managers")
        const pendingCount = managersResponse.data?.data?.length || 0

        // You can add more API calls here for other stats
        setStats({
          pendingManagers: pendingCount,
          totalUsers: 1234, // Replace with actual API call
          systemStatus: "Active",
          growth: "+12%", // Replace with actual calculation
        })

        // Fetch recent activity
        setRecentActivity([
          {
            id: 1,
            action: "New manager registration",
            time: "2 hours ago",
            type: "registration",
          },
          {
            id: 2,
            action: "Manager approved",
            time: "5 hours ago",
            type: "approval",
          },
          {
            id: 3,
            action: "System maintenance completed",
            time: "1 day ago",
            type: "maintenance",
          },
        ])
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        setStats({
          pendingManagers: 0,
          totalUsers: 0,
          systemStatus: "Error",
          growth: "0%",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overview-page">
      <div className="overview-header">
        <h2>Admin Dashboard Overview</h2>
        <p>Welcome to your admin dashboard. Monitor and manage your system from here.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <Users className="icon" />
          </div>
          <div className="stat-content">
            <h3>Pending Managers</h3>
            <p className="stat-number">{stats.pendingManagers}</p>
            <p className="stat-description">Awaiting approval</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Activity className="icon" />
          </div>
          <div className="stat-content">
            <h3>System Status</h3>
            <p className="stat-number">{stats.systemStatus}</p>
            <p className="stat-description">All systems operational</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">
            <BarChart3 className="icon" />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">25</p>
            <p className="stat-description">Registered users</p>
          </div>
        </div>

        
      </div>

      <div className="content-grid">
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-dot ${activity.type}`}></div>
                <div className="activity-content">
                  <p>
                    <strong>{activity.action}</strong>
                  </p>
                  <p className="activity-time">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  )
}

// Manager Management Page Component - Using your original dynamic logic
const ManagerManagementPage = () => {
  const [pendingManagers, setPendingManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_role")
    window.location.href = "/login"
  }, [])

  // Your original fetchPendingManagers function
  const fetchPendingManagers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/admin/pending-managers")
      setPendingManagers(response.data?.data || [])
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err.response?.data?.message || "Failed to load managers")
      if (err.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }, [handleLogout])

  // Your original handleApprove function
  const handleApprove = async (managerId) => {
    try {
      await api.put(`/admin/approve-manager/${managerId}`)
      setPendingManagers((prev) => prev.filter((m) => m.id !== managerId))
    } catch (err) {
      console.error("Approve error:", err)
      setError(err.response?.data?.message || "Failed to approve manager")
    }
  }

  // Your original handleReject function
  const handleReject = async (managerId) => {
    try {
      await api.put(`/admin/reject-manager/${managerId}`)
      setPendingManagers((prev) => prev.filter((m) => m.id !== managerId))
    } catch (err) {
      console.error("Reject error:", err)
      setError(err.response?.data?.message || "Failed to reject manager")
    }
  }

  const filteredManagers = pendingManagers.filter((manager) => {
    const matchesSearch = `${manager.first_name} ${manager.last_name} ${manager.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    fetchPendingManagers()
  }, [fetchPendingManagers])

  return (
    <div className="manager-management-page">
      <div className="page-header">
        <div className="header-content">
          <h2>Gérer Manager</h2>
          <p>Review and approve or reject manager registration requests.</p>
        </div>
        <button onClick={fetchPendingManagers} className="refresh-btn" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

     

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading managers...</p>
          </div>
        </div>
      ) : filteredManagers.length === 0 ? (
        <div className="no-managers">
          <Users className="no-managers-icon" />
          <h3>No managers found</h3>
          <p>{searchTerm ? "No managers match your search criteria." : "No pending manager requests at this time."}</p>
        </div>
      ) : (
        <div className="managers-container">
          <div className="managers-count">
            <span>
              {filteredManagers.length} manager{filteredManagers.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="managers-table-container">
            <table className="managers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredManagers.map((manager) => (
                  <tr key={manager.id}>
                    <td>
                      <div className="manager-info">
                        <div className="manager-avatar">
                          {manager.first_name.charAt(0)}
                          {manager.last_name.charAt(0)}
                        </div>
                        <div className="manager-details">
                          <span className="manager-name">
                            {manager.first_name} {manager.last_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{manager.email}</td>
                    <td>{new Date(manager.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge pending">Pending</span>
                    </td>
                    <td className="actions">
                      <button onClick={() => handleApprove(manager.id)} className="approve-btn" disabled={loading}>
                        Approve
                      </button>
                      <button onClick={() => handleReject(manager.id)} className="reject-btn" disabled={loading}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Admin Layout Component
const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/":
        return "Dashboard Overview"
      case "/admin/managers":
        return "Gérer Manager"
      default:
        return "Admin Dashboard"
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_role")
    window.location.href = "/login"
  }

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`admin-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <AdminHeader title={getPageTitle()} onLogout={handleLogout} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

// Main Admin Page Component
const AdminPage = () => {
  return (
    <ProtectedRoute role="admin">
      <AdminLayout>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/managers" element={<ManagerManagementPage />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default AdminPage
