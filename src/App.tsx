import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Items from './pages/Items';
import Employees from './pages/Employees';
import DepartmentMasterHub from './pages/DepartmentMasterHub';
import BudgetMasterHub from './pages/BudgetMasterHub';
import UserManagement from './pages/UserManagement';
import Purchases from './pages/Purchases';
import ProcurementHub from './pages/ProcurementHub';
import Reports from './pages/Reports';
import SalesInvoices from './pages/SalesInvoices';
import ChartOfAccounts from './pages/ChartOfAccounts';
import DebitNotes from './pages/DebitNotes';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import SaasAdminPortal from './pages/SaasAdminPortal';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index                    element={<Dashboard />} />
          <Route path="master-departments" element={<DepartmentMasterHub />} />
          <Route path="employees"          element={<Employees />} />
          <Route path="parties"            element={<Parties />} />
          <Route path="items"              element={<Items />} />
          <Route path="master-budgets"     element={<BudgetMasterHub />} />
          <Route path="procurement"        element={<ProcurementHub />} />
          <Route path="sales"              element={<SalesInvoices />} />
          <Route path="purchases"          element={<Purchases />} />
          <Route path="debit-notes"        element={<DebitNotes />} />
          <Route path="payments"           element={<Payments />} />
          <Route path="chart-of-accounts"  element={<ChartOfAccounts />} />
          <Route path="reports"            element={<Reports />} />
          <Route path="user-management"    element={<UserManagement />} />
          <Route path="settings"           element={<Settings />} />
          <Route path="saas-admin"         element={<SaasAdminPortal />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
