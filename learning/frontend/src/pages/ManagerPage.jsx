import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "../components/ProtectedRoute"
import { ManagerLayout } from "../components/manager/layout"
import { UploadPage } from "../components/manager/upload-page"
import { AnalysisPage } from "../components/manager/analysis-page"
import ManagerDashboard from "./manager-dashboard"
import ReportsPage from "../components/manager/reports-page"
import PredictionPage from "../components/manager/prediction-page"
import SettingsPage from "../components/manager/settings-page"
import "./manager-dashboard.css"

const ManagerPage = () => {
  return (
    <ProtectedRoute role="manager">
      <ManagerLayout>
        <Routes>
          <Route path="/" element={<ManagerDashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analytics" element={<AnalysisPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/prediction" element={<PredictionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/manager" />} />
        </Routes>
      </ManagerLayout>
    </ProtectedRoute>
  )
}

export default ManagerPage
