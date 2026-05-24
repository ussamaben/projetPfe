"use client"

import React, { useState, useEffect } from 'react'
import axios from "axios"
import { Header } from "./header"
import { Download, Filter, FileText, Loader2 } from "lucide-react"
import "./styles/pages.css"
import "./styles/reports-page.css"

const API_URL = 'http://localhost:5000'

interface Report {
  id: number
  name: string
  report_type: string
  file_id: number
  filename: string
  created_at: string
  pdf_path: string
  status?: string
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      console.log("Fetching reports...")
      const response = await axios.get(`${API_URL}/manager/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      console.log("Reports response:", response.data)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      setError(
        axios.isAxiosError(error) ? error.response?.data?.error || "Failed to load reports" : "Failed to load reports",
      )
    } finally {
      setLoading(false)
    }
  }

  const generateNewReport = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      // First get the list of uploaded files
      console.log("Getting uploaded files...")
      const filesResponse = await axios.get(`${API_URL}/manager/upload`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const files = filesResponse.data || []
      console.log("Available files:", files)
      if (files.length === 0) {
        setError("No files available for report generation. Please upload a file first.")
        return
      }

      // Use the most recent file
      const latestFile = files[0]
      console.log("Generating report for file:", latestFile)
      const response = await axios.post(
        `${API_URL}/manager/generate-full-report`,
        {
          file_id: latestFile.id,
          filename: latestFile.filename
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log("Report generation response:", response.data)
      if (response.data?.success) {
        setSuccess("Report generated successfully")
        // Immediately fetch reports after generation
        await fetchReports()
      } else {
        setError(response.data?.error || "Failed to generate report")
      }
    } catch (err) {
      console.error("Report generation failed:", err)
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "Report generation failed" : "Report generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = async (reportId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${API_URL}/manager/download-report/${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf, application/json'
        }
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.error || 'Failed to download report'
        } catch (e) {
          errorMessage = 'Failed to download report'
        }
        throw new Error(errorMessage)
      }

      // Check if the response is a PDF
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `report_${reportId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        setSuccess('Report downloaded successfully')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Download failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = filterType === "all" 
    ? reports 
    : reports.filter(report => report.report_type === filterType)

  return (
    <div className="page-container">
      <Header title="Reports" />

      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div className="page-actions">
          <button className="button button-outline">
            <Filter size={16} className="button-icon" />
            Filter
          </button>
          <button 
            className="button button-primary"
            onClick={generateNewReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <FileText size={16} />
            )}
            <span className="button-text">Generate New Report</span>
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Total Reports</div>
          </div>
          <div className="card-content">
            <div className="card-value">{reports.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Generated This Month</div>
          </div>
          <div className="card-content">
            <div className="card-value">
              {reports.filter(report => {
                const reportDate = new Date(report.created_at)
                const now = new Date()
                return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Scheduled Reports</div>
          </div>
          <div className="card-content">
            <div className="card-value">0</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Report List</h2>
          <div className="filter-container">
            <select 
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="alert">Alert</option>
              <option value="full">Full Report</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-reports">
            <Loader2 className="animate-spin" size={24} />
            <p>Loading reports...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>{report.name}</td>
                  <td>{report.report_type}</td>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      report.status === "Completed" ? "badge-success" : "badge-warning"
                    }`}>
                      {report.status || "Completed"}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="button button-outline" 
                      onClick={() => downloadReport(report.id)}
                    >
                      <Download size={16} className="button-icon" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ReportsPage