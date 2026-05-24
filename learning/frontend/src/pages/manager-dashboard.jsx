"use client"

import { useState, useEffect } from "react"
import { Header } from "../components/manager/header"
import { FileUp, BarChart3, LineChart, RefreshCw, Trash2, FileText, Upload, Calendar } from "lucide-react"
import api from "../services/api"
import "./manager-dashboard.css"

// Daily Login Status Chart Component with Week Navigation
const DailyLoginChart = () => {
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.

  // Function to get login data for specific week (replace with real API call)
  const getWeekLoginData = (offset) => {
    // Sample data for different weeks - replace with real API call
    const weekData = {
      0: [false, false, false, false, false, true, false], // Current week
      "-1": [false, true, true, false, true, true, false], // Last week
      "-2": [true, true, false, true, false, false, true], // 2 weeks ago
      "-3": [false, false, true, true, true, false, true], // 3 weeks ago
    }
    return weekData[offset.toString()] || [false, false, false, false, false, false, false]
  }

  // Function to get week date range
  const getWeekDateRange = (offset) => {
    const today = new Date()
    const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    const weekStart = new Date(currentWeekStart.setDate(currentWeekStart.getDate() + offset * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
  }

  const loginStatus = getWeekLoginData(weekOffset)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const activeDays = loginStatus.filter((status) => status).length

  return (
    <div className="daily-login-chart">
      <div className="chart-header">
        <div className="week-navigation">
          <button className="week-nav-btn" onClick={() => setWeekOffset(weekOffset - 1)} title="Previous week">
            ←
          </button>
          <span className="week-range">{getWeekDateRange(weekOffset)}</span>
          <button
            className="week-nav-btn"
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            title="Next week"
          >
            →
          </button>
        </div>
        <div className="week-summary"></div>
      </div>
      <div className="login-dots">
        {loginStatus.map((hasLogin, index) => (
          <div key={index} className="login-day">
            <div className={`login-dot ${hasLogin ? "entered" : "not-entered"}`}></div>
            <span className="day-label">{days[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ManagerDashboard = () => {
  const [managerData, setManagerData] = useState(null)
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState({
    dashboard: true,
    logs: true,
  })
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    totalItems: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardResponse = await api.get("/manager/dashboard", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        })
        setManagerData(dashboardResponse.data)

        await fetchActivityLogs(1)
      } catch (err) {
        console.error("Detailed error:", err.response ? err.response.data : err.message)
        setError("Failed to load data. Please check console for details.")
      } finally {
        setLoading((prev) => ({ ...prev, dashboard: false }))
      }
    }

    fetchData()
  }, [])

  const fetchActivityLogs = async (page) => {
    setLoading((prev) => ({ ...prev, logs: true }))
    try {
      const response = await api.get("/manager/activity-logs", {
        params: {
          page,
          per_page: pagination.perPage,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
      })

      setActivityLogs(response.data.logs || [])
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        perPage: response.data.per_page || 10,
        totalItems: response.data.total,
      })
    } catch (err) {
      console.error("Error fetching logs:", err)
    } finally {
      setLoading((prev) => ({ ...prev, logs: false }))
    }
  }

  const refreshLogs = async () => {
    await fetchActivityLogs(pagination.currentPage)
  }

  const deleteLog = async (logId) => {
    if (!window.confirm("Are you sure you want to delete this activity log?")) return

    try {
      await api.delete(`/manager/activity-logs/${logId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
      })

      // Refresh logs after deletion
      await fetchActivityLogs(pagination.currentPage)
    } catch (err) {
      console.error("Error deleting log:", err)
      alert("Failed to delete log. Please check console for details.")
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchActivityLogs(newPage)
    }
  }

  if (loading.dashboard) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>

  const formatActivityType = (type) => {
    const types = {
      dashboard_access: "Login",
      file_list_view: "View",
      file_upload: "Upload",
      file_delete: "Delete",
      analysis_view: "Analysis",
      report_generate: "Report",
    }
    return types[type] || type
  }

  return (
    <div className="page-container">
      <Header title="Overview" />

      {/* KPI Section with two separate divs */}
      <div className="kpi-section">
        {/* First div: Reports and Files cards in same line */}
        <div className="main-kpi-cards">
          <div className="kpi-card reports">
            <div className="kpi-icon">
              <FileText size={40} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Reports Generated</div>
              <div className="kpi-value">0</div>
            </div>
          </div>

          <div className="kpi-card uploads">
            <div className="kpi-icon">
              <Upload size={40} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Files Uploaded</div>
              <div className="kpi-value">0</div>
            </div>
          </div>
        </div>

        {/* Second div: Daily Usage card */}
        <div className="daily-usage-cards">
          <div className="kpi-card daily-usage">
            <div className="kpi-icon">
              <Calendar size={40} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Daily Login Status</div>
              <div className="kpi-value">This Week</div>
              <div className="kpi-chart">
                <DailyLoginChart />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <p className="welcome-description"></p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Quick Upload</h2>
          <p className="dashboard-card-description">Upload new documents for processing</p>
          <div className="dashboard-card-action">
            <button onClick={() => (window.location.href = "/manager/upload")} className="button button-primary">
              <FileUp size={20} className="button-icon" />
              Go to Upload
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-card-title">View Analysis</h2>
          <p className="dashboard-card-description">Check the latest analysis reports</p>
          <div className="dashboard-card-action">
            <button onClick={() => (window.location.href = "/manager/analytics")} className="button button-primary">
              <BarChart3 size={20} className="button-icon" />
              Go to Analysis
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Generate Reports</h2>
          <p className="dashboard-card-description">Here are your stats:</p>
          <div className="dashboard-card-action">
            <button onClick={() => (window.location.href = "/manager/reports")} className="button button-primary">
              <LineChart size={20} className="button-icon" />
              Go to Reports
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Activity History</h2>
          <div className="table-header-actions">
            <p className="table-description">Track all your recent activities and system interactions</p>
            <button onClick={refreshLogs} className="button button-outline" disabled={loading.logs}>
              {loading.logs ? (
                "Loading..."
              ) : (
                <>
                  <RefreshCw size={20} className="button-icon" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Date & Time</th>
              <th>Action Type</th>
              <th>Description</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.length > 0 ? (
              activityLogs.map((log, index) => (
                <tr key={log.id}>
                  <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`activity-type ${log.activity_type.toLowerCase().replace("_", "-")}`}>
                      {formatActivityType(log.activity_type)}
                    </span>
                  </td>
                  <td>{log.details || "No description available"}</td>
                  <td>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="button button-danger button-small"
                      title="Delete this log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  {loading.logs ? "Loading activity logs..." : "No activity logs found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {activityLogs.length > 0 && (
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading.logs}
              className="button button-outline"
            >
              Previous
            </button>

            <span className="pagination-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || loading.logs}
              className="button button-outline"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerDashboard
