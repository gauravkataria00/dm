import { Navigate } from "react-router-dom";

export default function TenantProtectedRoute({ children }) {
  const tenantToken = localStorage.getItem("tenantToken");

  if (!tenantToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
