import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import AddMilk from "../pages/AddMilk";
import Ledger from "../pages/Ledger";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Payments from "../pages/Payments";
import Advances from "../pages/Advances";
import Inventory from "../pages/Inventory";
import Login from "../pages/Login";
import PlatformLogin from "../pages/PlatformLogin";
import PlatformConsole from "../pages/PlatformConsole";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route path="/platform/console" element={<PlatformConsole />} />
        <Route path="/tenant" element={<Navigate to="/" replace />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/add-milk" element={<ProtectedRoute><AddMilk /></ProtectedRoute>} />
        <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/advances" element={<ProtectedRoute><Advances /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
}