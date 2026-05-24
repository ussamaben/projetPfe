"use client"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { BarChart3, FileUp, Home, LineChart, LogOut, Settings, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import "./styles/sidebar.css"

export const Sidebar = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Use require instead of import
  const DXCLogo = require("../../assets/dxc.png")

  const menuItems = [
    {
      title: "Overview",
      path: "/manager",
      icon: <Home className="sidebar-icon" />,
    },
    {
      title: "Upload",
      path: "/manager/upload",
      icon: <FileUp className="sidebar-icon" />,
    },
    {
      title: "Analytics",
      path: "/manager/analytics",
      icon: <BarChart3 className="sidebar-icon" />,
    },
    {
      title: "Reports",
      path: "/manager/reports",
      icon: <LineChart className="sidebar-icon" />,
    },
    {
      title: "Prediction",
      path: "/manager/prediction",
      icon: <TrendingUp className="sidebar-icon" />,
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img 
              src={DXCLogo.default || DXCLogo} 
              alt="DXC Logo" 
              style={{ 
                width: '60px', 
                height: '60px', 
                objectFit: 'contain' 
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
        <button onClick={handleLogout} className="sidebar-footer-link">
          <LogOut className="sidebar-icon" />
          {!collapsed && <span>Log out</span>}
        </button>

        <Link
          to="/manager/settings"
          className={`sidebar-footer-link ${location.pathname === "/manager/settings" ? "active" : ""}`}
        >
          <Settings className="sidebar-icon" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}