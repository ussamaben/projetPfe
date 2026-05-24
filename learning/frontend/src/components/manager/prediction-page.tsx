"use client"

import React from "react"
import { Header } from "./header"
import { Play, RefreshCw } from "lucide-react"
import "./styles/pages.css"
import "./styles/prediction-page.css"

const PredictionPage = () => {
  const [activeTab, setActiveTab] = React.useState("document")

  return (
    <div className="page-container">
      <Header title="Prediction" />

      <div className="page-header">
        <h1 className="page-title">Predictive Analytics</h1>
        <button className="button button-primary">
          <RefreshCw size={16} className="button-icon" />
          Refresh Data
        </button>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === "document" ? "active" : ""}`} onClick={() => setActiveTab("document")}>
          Document Prediction
        </div>
        <div className={`tab ${activeTab === "user" ? "active" : ""}`} onClick={() => setActiveTab("user")}>
          User Activity Prediction
        </div>
        <div className={`tab ${activeTab === "system" ? "active" : ""}`} onClick={() => setActiveTab("system")}>
          System Performance Prediction
        </div>
      </div>

      {activeTab === "document" && (
        <>
          <div className="card-grid">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Predicted Documents (Next Month)</div>
              </div>
              <div className="card-content">
                <div className="card-value">142</div>
                <div className="card-trend trend-up">+12% from current month</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Processing Time Trend</div>
              </div>
              <div className="card-content">
                <div className="card-value">Decreasing</div>
                <div className="card-trend trend-up">Expected to improve by 5%</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Error Rate Prediction</div>
              </div>
              <div className="card-content">
                <div className="card-value">1.2%</div>
                <div className="card-trend trend-up">-0.3% from current rate</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Confidence Score</div>
              </div>
              <div className="card-content">
                <div className="card-value">92%</div>
                <div className="card-trend">Based on historical data</div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <div className="card-header">
              <div className="card-title">Document Volume Prediction</div>
              <div className="card-description">Predicted document volume for the next 6 months</div>
            </div>
            <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Chart would go here - using placeholder */}
              <div>Chart Placeholder - Document Volume Prediction</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Run Custom Prediction</div>
              <div className="card-description">Configure parameters for a custom prediction model</div>
            </div>
            <div className="card-content">
              <div className="form-group">
                <div className="grid-2">
                  <div>
                    <label className="form-label">Prediction Timeframe</label>
                    <select className="form-input">
                      <option value="1month">1 Month</option>
                      <option value="3months">3 Months</option>
                      <option value="6months" selected>
                        6 Months
                      </option>
                      <option value="1year">1 Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Prediction Model</label>
                    <select className="form-input">
                      <option value="regression" selected>
                        Linear Regression
                      </option>
                      <option value="timeseries">Time Series Analysis</option>
                      <option value="ml">Machine Learning</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Confidence Level (%)</label>
                    <input type="number" className="form-input" defaultValue="95" />
                  </div>

                  <div>
                    <label className="form-label">Include Variables</label>
                    <select className="form-input">
                      <option value="all" selected>
                        All Variables
                      </option>
                      <option value="volume">Volume Only</option>
                      <option value="time">Processing Time Only</option>
                      <option value="custom">Custom Selection</option>
                    </select>
                  </div>
                </div>

                <button className="button button-primary" style={{ marginTop: "1rem", width: "100%" }}>
                  <Play size={16} className="button-icon" />
                  Run Prediction
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "user" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">User Activity Prediction</div>
            <div className="card-description">Predicted user activity and engagement metrics</div>
          </div>
          <div className="card-content">
            <p>User activity prediction content will be displayed here.</p>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">System Performance Prediction</div>
            <div className="card-description">Predicted system performance metrics and statistics</div>
          </div>
          <div className="card-content">
            <p>System performance prediction content will be displayed here.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PredictionPage
