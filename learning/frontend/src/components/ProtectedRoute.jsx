// components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // ✅ Correct way
//this help the route for doign the role also manipule with page

const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.role !== role) {
      console.warn("Unauthorized role:", decoded.role);
      return <Navigate to="/unauthorized" />;
    }
    return children;
  } catch (err) {
    console.error("Invalid token");
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;
