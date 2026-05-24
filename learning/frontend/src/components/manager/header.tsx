"use client"
import {Bell } from "lucide-react"
import { useState } from "react"
import { Search } from "lucide-react"
import "./styles/header.css"

interface HeaderProps {
  title: string
}

export const Header = ({ title }: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="manager-header">
      <h1 className="header-title"> </h1>

      <div className="header-actions">
        <div className="search-container">
          <Search className="search-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>

        <div className="notification-container">
                  <button className="notification-button">
                    <Bell className="notification-icon" />
                    <span className="notification-badge">3</span>
                  </button>
                </div>
        
        <div className="user-dropdown">
          <button className="user-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar">O</div>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">My Account</div>
              <button className="dropdown-item">Profile</button>
              <button className="dropdown-item">Settings</button>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item"
                onClick={() => {
                  localStorage.removeItem("token")
                  window.location.href = "/login"
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
