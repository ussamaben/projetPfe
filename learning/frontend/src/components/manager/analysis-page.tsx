"use client"

import React, { useState, useEffect } from "react" // Import React for Fragment
import axios from "axios"
import { Header } from "./header"
import "./styles/analytics-page.css"
import { Loader2, Download, FileText } from "lucide-react"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// ... (Keep your interfaces exactly the same)
interface UploadedFile {
  id: string
  filename?: string
  file_type?: string
  size?: number
  upload_date?: string
}

interface AnalysisData {
  success: boolean
  file_id: string
  filename?: string
  analyses?: {
    analysisType: string
    sheetName?: string
    headerRow?: number
    headers?: string[]
    rows?: Record<string, any>[]
    summary?: {
      totalRows?: number
      columns?: { name: string }[]
    }
    chartData?: {
      severityBarChart?: {
        labels: string[]
        data: number[]
        title: string
      }
      alertPieChart?: {
        labels: string[]
        data: number[]
        title: string
      }
      vulnerabilityBarChart?: {
        labels: string[]
        data: number[]
        title: string
        selectionOptions: string[]
        selectedOption: string
      }
      geoMapData?: {
        countries: string[]
        counts: number[]
        title: string
      }
    }
  }[]
}


export const AnalysisPage = () => {
  // ... (Keep all your state and functions exactly the same)
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState<boolean>(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchUploadedFiles = async () => {
    try {
      setLoadingFiles(true)
      const token = localStorage.getItem("token")
      // Fetch only files that have saved analysis results
      const response = await axios.get("http://localhost:5000/manager/analyzed-files", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUploadedFiles(response.data || [])
    } catch (error) {
      console.error("Failed to fetch files:", error)
      setError(
        axios.isAxiosError(error) ? error.response?.data?.error || "Failed to load files" : "Failed to load files",
      )
    } finally {
      setLoadingFiles(false)
    }
  }

  const formatFrenchMonth = (dateStr: string | undefined): string => {
    try {
      const months = [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre',
      ]
  const d = new Date(dateStr || '')
  if (isNaN(d.getTime())) return ''
      return `${months[d.getMonth()]} ${d.getFullYear()}`
    } catch (e) {
      return ''
    }
  }

  // Fetch analysis automatically when a file is selected
  useEffect(() => {
    const fetchSavedAnalysis = async () => {
      if (!selectedFile) {
        setAnalysisData(null)
        return
      }
      setIsAnalyzing(true)
      setError(null)
      setAnalysisData(null)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://localhost:5000/manager/analysis-result/${selectedFile}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Response shape: { file: {...}, analyses: [result_json, ...] }
        if (response.data) {
          const file = response.data.file
          const analysesRaw = response.data.analyses || []
          // Normalize: if stored result has an 'analyses' array inside, flatten it
          const collected: any[] = []
          analysesRaw.forEach((r: any) => {
            if (r && Array.isArray(r.analyses)) {
              collected.push(...r.analyses)
            } else if (r) {
              collected.push(r)
            }
          })

          const normalized = {
            success: true,
            file_id: String(file.id),
            filename: file.filename,
            analyses: collected,
          }
          setAnalysisData(normalized)
        } else {
          setError("No analysis found for this file")
        }
      } catch (err) {
        console.error("Fetching saved analysis failed:", err)
        setError(axios.isAxiosError(err) ? err.response?.data?.error || "Failed to load analysis" : "Failed to load analysis")
      } finally {
        setIsAnalyzing(false)
      }
    }
    fetchSavedAnalysis()
  }, [selectedFile])

  const generateFullReport = async () => {
    if (!selectedFile) {
      setError("Please select  a file first")
      return
    }

    if (!analysisData) {                             
      setError("Please analyze the file first before generating a report")
      return
    }

    setIsGeneratingFullReport(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please log in to generate reports")
        return
      }

      const response = await axios.post(
        "http://localhost:5000/manager/generate-full-report",
        {
          file_id: selectedFile,
          filename: analysisData.filename || "full_analysis_report"
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      )

      if (response.data?.success) {
        setSuccessMessage("Full report generated successfully! You can find it in the Reports page.")
        // Analysis will be refreshed automatically by useEffect on selectedFile
      } else {
        setError(response.data?.error || "Failed to generate full report")
      }
    } catch (err) {
      console.error("Full report generation failed:", err)
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || "Full report generation failed" 
        : "Full report generation failed"
      setError(errorMessage)
    } finally {
      setIsGeneratingFullReport(false)
    }
  }

  const isExcelFile = (file: UploadedFile) => {
    const fileType = file.file_type?.toLowerCase?.() || ""
    const fileName = file.filename?.toLowerCase?.() || ""
    return fileType.includes("xls") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")
  }

  const handleVulnerabilityChange = (option: string, analysisIndex: number) => {
    if (!analysisData || !analysisData.analyses) return;

    const analysisToUpdate = analysisData.analyses[analysisIndex];
    if (!analysisToUpdate?.chartData?.vulnerabilityBarChart) return;

    const selectedRow = analysisToUpdate.rows?.find((row) => {
      const firstCol = analysisToUpdate.headers?.[0];
      return firstCol && row[firstCol] === option;
    });

    if (selectedRow && analysisToUpdate.headers) {
      const newChartData = {
        ...analysisToUpdate.chartData.vulnerabilityBarChart,
        data: [
          selectedRow[analysisToUpdate.headers[1]] || 0,
          selectedRow[analysisToUpdate.headers[2]] || 0,
          selectedRow[analysisToUpdate.headers[3]] || 0,
          selectedRow[analysisToUpdate.headers[4]] || 0,
        ],
        title: `Vulnerability Analysis: ${option}`,
        selectedOption: option,
      };

      const updatedAnalyses = analysisData.analyses.map((analysis, index) => {
        if (index === analysisIndex && analysis.analysisType === "vulnerability") {
          return {
            ...analysis,
            chartData: {
              ...analysis.chartData!,
              vulnerabilityBarChart: newChartData,
            },
          };
        }
        return analysis;
      });

      setAnalysisData({
        ...analysisData,
        analyses: updatedAnalyses,
      });
    }
  };

  useEffect(() => {
    fetchUploadedFiles()
  }, [])


  return (
    <div className="page-container">
      <Header title="Excel Analysis" />

      <div className="page-header">
        <h1 className="page-title">Excel Analysis</h1>
      </div>

      {/* ... (Your controls and messages are correct, keep them here) ... */}
      <div className="analysis-controls">
        <div className="file-selector">
          <label>Select Excel File:</label>
          {loadingFiles ? (
            <div className="loading-files">
              <Loader2 className="animate-spin" size={16} />
              Loading files...
            </div>
          ) : (
            <select 
              value={selectedFile} 
              onChange={(e) => setSelectedFile(e.target.value)} 
              disabled={isAnalyzing}
            >
              <option value="">-- Select Excel File --</option>
              {uploadedFiles.filter(isExcelFile).map((file) => (
                <option key={file.id} value={file.id}>
                  {file.upload_date ? `${formatFrenchMonth(file.upload_date)} — ${file.filename || 'Fichier'}` : (file.filename || 'Fichier')}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="analysis-buttons">
          {analysisData && (
            <button 
              onClick={generateFullReport} 
              disabled={isGeneratingFullReport} 
              className="analyze-button"
            >
              {isGeneratingFullReport ? (
                <><Loader2 className="animate-spin" size={16} /> Generating...</>
              ) : (
                <><FileText size={16} /> Generate Full Report</>
              )}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {isAnalyzing && !analysisData && (
        <div className="loading-analysis">
          <Loader2 className="animate-spin" size={24} />
          <p>Processing Excel file...</p>
        </div>
      )}

      {/* ======================= THE FIX IS HERE ======================= */}
      {analysisData && analysisData.analyses && (
        <div className="analysis-results">
          <h2>Analysis Results: {analysisData.filename || "Unknown File"}</h2>

          {/* 1. Create ONE single grid container OUTSIDE the loop */}
          <div className="charts-container">
            {/* 2. Loop INSIDE the container to render each chart wrapper */}
            {analysisData.analyses.map((analysis, index) => {
              const geoMapData = analysis.chartData?.geoMapData;
              
              // 3. Use a React Fragment to handle the conditional rendering cleanly
              return (
                <React.Fragment key={index}>
                  {analysis.chartData?.severityBarChart && (
                    <div className="chart-wrapper">
                      <h3>{analysis.chartData.severityBarChart.title}</h3>
                      <div className="chart-container">
                        <Bar
                          data={{
                            labels: analysis.chartData.severityBarChart.labels,
                            datasets: [
                              {
                                label: "Total Count",
                                data: analysis.chartData.severityBarChart.data,
                                backgroundColor: ["rgba(255, 99, 132, 0.7)", "rgba(54, 162, 235, 0.7)", "rgba(255, 206, 86, 0.7)", "rgba(75, 192, 192, 0.7)", "rgba(153, 102, 255, 0.7)"],
                              },
                            ],
                          }}
                          options={{ responsive: true, maintainAspectRatio: false }}
                        />
                      </div>
                    </div>
                  )}

                  {analysis.chartData?.alertPieChart && (
                    <div className="chart-wrapper">
                      <h3>{analysis.chartData.alertPieChart.title}</h3>
                      <div className="chart-container">
                        <Pie
                          data={{
                            labels: analysis.chartData.alertPieChart.labels,
                            datasets: [
                              {
                                label: "Total Count",
                                data: analysis.chartData.alertPieChart.data,
                                backgroundColor: ["rgba(255, 99, 132, 0.7)", "rgba(54, 162, 235, 0.7)", "rgba(255, 206, 86, 0.7)", "rgba(75, 192, 192, 0.7)", "rgba(153, 102, 255, 0.7)", "rgba(255, 159, 64, 0.7)"],
                              },
                            ],
                          }}
                          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } }}
                        />
                      </div>
                    </div>
                  )}

                  {analysis.chartData?.vulnerabilityBarChart && (
                    <div className="chart-wrapper">
                      <h3>{analysis.chartData.vulnerabilityBarChart.title}</h3>
                      <select
                        value={analysis.chartData.vulnerabilityBarChart.selectedOption}
                        onChange={(e) => handleVulnerabilityChange(e.target.value, index)}
                        className="vulnerability-selector"
                      >
                        {analysis.chartData.vulnerabilityBarChart.selectionOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="chart-container">
                        <Bar
                          data={{
                            labels: analysis.chartData.vulnerabilityBarChart.labels,
                            datasets: [
                              {
                                label: "Count",
                                data: analysis.chartData.vulnerabilityBarChart.data,
                                backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(255, 99, 132, 0.7)", "rgba(255, 206, 86, 0.7)", "rgba(75, 192, 192, 0.7)"],
                              },
                            ],
                          }}
                          options={{ responsive: true, maintainAspectRatio: false }}
                        />
                      </div>
                    </div>
                  )}

                  {geoMapData && (
                    <div className="chart-wrapper">
                      <h3>{geoMapData.title}</h3>
                      <div className="geo-layout-container">
                        <div className="geo-chart-container">
                          <Bar
                            data={{
                              labels: geoMapData.countries,
                              datasets: [{
                                label: 'Attack Count',
                                data: geoMapData.counts,
                                backgroundColor: geoMapData.countries.map((_, i) => `hsl(${(i * 360) / geoMapData.countries.length}, 70%, 50%)`),
                                borderWidth: 1
                              }]
                            }}
                            options={{
                              indexAxis: 'y',
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw} attacks` } } },
                              scales: { x: { title: { display: true, text: 'Number of Attacks' }, beginAtZero: true }, y: { title: { display: false } } }
                            }}
                          />
                        </div>
                        <div className="geo-table">
                          <table>
                            <thead>
                              <tr><th>Country</th><th>Count</th><th>%</th></tr>
                            </thead>
                            <tbody>
                              {geoMapData.countries.map((country, i) => {
                                const total = geoMapData.counts.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((geoMapData.counts[i] / total) * 100).toFixed(1) : "0";
                                return (
                                  <tr key={country}>
                                    <td>{country}</td>
                                    <td>{geoMapData.counts[i].toLocaleString()}</td>
                                    <td>{percentage}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};