"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Header } from "./header"
import { Upload, Loader2 } from "lucide-react"
import "./styles/pages.css"
import "./styles/upload-page.css"

export const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [message, setMessage] = useState("") // Add message state
  const [analyzingId, setAnalyzingId] = useState(null)
  const [analysisPreview, setAnalysisPreview] = useState(null)
  // Fetch uploaded files from the backend
  const fetchUploadedFiles = async () => {
    try {                                                 
      setLoadingFiles(true)
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/manager/upload", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUploadedFiles(response.data)
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error)
      alert(error.response?.data?.error || "Failed to load files")
    } finally {
      setLoadingFiles(false)
    }
  }

  const formatFrenchMonth = (dateStr) => {
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
      const d = new Date(dateStr)
      if (isNaN(d)) return ''
      return `${months[d.getMonth()]} ${d.getFullYear()}`
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    fetchUploadedFiles()
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setMessage("") // Clear previous messages

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const token = localStorage.getItem("token")

      await axios.post("http://localhost:5000/manager/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      // Refresh the file list after successful upload
      await fetchUploadedFiles()
      setSelectedFile(null)
      setMessage("File uploaded successfully!") // Show success message
    } catch (error) {
      console.error("Upload failed:", error)
      // Show error message in UI instead of alert
      setMessage(error.response?.data?.error || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return

    try {
      // Try several common storage keys for access tokens so we don't fail when the app uses a different key
      const tokenKeys = ["token", "access_token", "jwt", "authToken", "accessToken"]
      let token = null
      for (const k of tokenKeys) {
        const v = localStorage.getItem(k)
        if (v) {
          token = v
          break
        }
      }
      if (!token) {
        console.warn('No auth token found in localStorage under keys:', tokenKeys)
        alert("You must be logged in to delete files. Please log in and try again.")
        return
      }

      await axios.delete(`http://localhost:5000/manager/upload/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Refresh the file list after successful deletion
      await fetchUploadedFiles()
      alert("File deleted successfully!")
    } catch (error) {
      console.error("Delete failed:", error, error.response)
      const status = error.response?.status
      if (status === 401) {
        alert('Unauthorized: please log in again.')
      } else if (status === 422) {
        alert('Invalid authentication token. Please log out and log in again.')
      } else if (status === 404) {
        alert('File not found. It may already have been deleted.')
      } else {
        alert(error.response?.data?.error || "Failed to delete the file.")
      }
    }
  }

  const handleAnalyze = async (id) => {
    setAnalyzingId(id)
    setMessage("")
    setAnalysisPreview(null)
    try {
      const token = localStorage.getItem("token")
      // trigger analysis and persistence on backend
      await axios.post(
        "http://localhost:5000/manager/analyze-excel",
        { file_id: id },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Verify saved analysis and show a small preview
      try {
        const res = await axios.get(`http://localhost:5000/manager/analysis-result/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAnalysisPreview(res.data)
        setMessage("Analysis saved. Preview available below.")
      } catch (err) {
        // If verification fails, still refresh files but show error
        console.warn('Failed to fetch saved analysis:', err)
        setMessage('Analysis started but failed to fetch saved preview.')
      }

      // Refresh file list
      await fetchUploadedFiles()
    } catch (error) {
      console.error("Analysis request failed:", error)
      const serverMsg = error.response?.data?.error || error.message || "Failed to analyze the file."
      // If the server returned a traceback include a short hint
      const tb = error.response?.data?.traceback
      if (tb) {
        setMessage(serverMsg + ' (server traceback available in logs)')
        console.error('Server traceback:', tb)
      } else {
        setMessage(serverMsg)
      }
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleView = (id) => {
    const file = uploadedFiles.find((f) => f.id === id)
    if (file) {
      window.open(`http://localhost:5000/${file.filepath}`, "_blank")
    }
  }

  const handleDownload = (id) => {
    const file = uploadedFiles.find((f) => f.id === id)
    if (file) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a")
      link.href = `http://localhost:5000/${file.filepath}`
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="page-container">
      <Header title="Upload" />

      <div className="page-header">
        <h1 className="page-title">Upload Documents</h1>
      </div>

      <div className="upload-form">
        <div className="form-group">
          <label className="form-label" htmlFor="file">
            Select File (PDF, DOCX, XLSX, CSV)
          </label>
          <input
            type="file"
            id="file"
            className="form-input"
            onChange={handleFileChange}
            accept=".pdf,.docx,.xlsx,.csv"
          />
          {selectedFile && (
            <div className="file-info">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>

        <button className="button button-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload File
            </>
          )}
        </button>
        {/* Display message below the upload button */}
        {message && (
          <div
            style={{
              marginTop: "1rem",
              color: message.includes("successfully") ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}
      </div>

      <div className="page-header">
        <h2 className="page-title">Uploaded Files</h2>
      </div>

      <div className="table-container">
        {loadingFiles ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No files uploaded yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((file) => (
                <tr key={file.id}>
                  <td>{file.filename}</td>
                  <td>{file.file_type}</td>
                  <td>{`${Math.round(file.size / 1024)} KB`}</td>
                  <td>{file.upload_date ? formatFrenchMonth(file.upload_date) : new Date(file.upload_date).toLocaleDateString()}</td>
                  <td>
                    <div className="page-actions">
                      <button className="button button-outline" onClick={() => handleView(file.id)}>
                        View
                      </button>
                      <button className="button button-outline" onClick={() => handleDownload(file.id)}>
                        Download
                      </button>
                      <button className="button button-outline text-red-500" onClick={() => handleDelete(file.id)}>
                        Delete
                      </button>
                      {file && (file.file_type?.toLowerCase?.().includes('xls') || (file.filename && (file.filename.endsWith('.xlsx') || file.filename.endsWith('.xls')))) && (
                        <button className="button button-primary" onClick={() => handleAnalyze(file.id)} disabled={analyzingId !== null}>
                          {analyzingId === file.id ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              &nbsp;Analyzing...
                            </>
                          ) : (
                            "Analyze"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Analysis preview panel */}
      {analysisPreview && (
        <div style={{ marginTop: 20, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Analysis preview for {analysisPreview.file?.filename || ''}</h3>
          <div style={{ fontSize: 14, color: '#333' }}>
            {analysisPreview.analyses && analysisPreview.analyses.length > 0 ? (
              <>
                <div><strong>First analysis type:</strong> {analysisPreview.analyses[0].analysisType}</div>
                <div><strong>Sheet:</strong> {analysisPreview.analyses[0].sheetName || 'N/A'}</div>
                <div><strong>Rows (preview):</strong> {Array.isArray(analysisPreview.analyses[0].rows) ? analysisPreview.analyses[0].rows.length : 0}</div>
              </>
            ) : (
              <div>No analyses returned</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
