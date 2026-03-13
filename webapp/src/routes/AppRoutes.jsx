import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import AddMilk from "../pages/AddMilk";
import Ledger from "../pages/Ledger";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Settlements from "../pages/Settlements";
import Payments from "../pages/Payments";
import Advances from "../pages/Advances";
import Consumers from "../pages/Consumers";
import ConsumerSales from "../pages/ConsumerSales";
import ConsumerPayments from "../pages/ConsumerPayments";
import Inventory from "../pages/Inventory";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/add-milk" element={<AddMilk />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settlements" element={<Settlements />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/advances" element={<Advances />} />
        <Route path="/consumers" element={<Consumers />} />
        <Route path="/consumer-sales" element={<ConsumerSales />} />
        <Route path="/consumer-payments" element={<ConsumerPayments />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </BrowserRouter>
  );
}