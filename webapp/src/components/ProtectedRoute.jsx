import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const token = localStorage.getItem("adminToken");
  if (!token) {
    return null;
  }

  return children;
}