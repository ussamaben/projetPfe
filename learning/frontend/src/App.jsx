import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import AdminPage from "./pages/AdminPage"
import ManagerPage from "./pages/ManagerPage"
import TestManagerRoute from "./components/TestManagerRoute"
import "./index.css"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/manager/*" element={<ManagerPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/test" element={<TestManagerRoute />} />
      </Routes>
    </Router>
  )
}

export default App
