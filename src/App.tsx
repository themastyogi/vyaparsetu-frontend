import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Items from './pages/Items';
import './index.css';

// Placeholder screens for nav items not yet built
const ComingSoon = ({ title }: { title: string }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    height:'60vh', gap:'12px', color:'var(--text-muted)', fontFamily:'Inter,sans-serif' }}>
    <div style={{ fontSize:'48px' }}>🚧</div>
    <h2 style={{ fontSize:'20px', fontWeight:700, color:'var(--text-secondary)' }}>{title}</h2>
    <p style={{ fontSize:'13px' }}>This module is coming soon</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="parties"   element={<Parties />} />
          <Route path="items"     element={<Items />} />
          <Route path="sales"     element={<ComingSoon title="Sales Invoices" />} />
          <Route path="purchases" element={<ComingSoon title="Purchase Bills" />} />
          <Route path="reports"   element={<ComingSoon title="Reports & Trial Balance" />} />
          <Route path="settings"  element={<ComingSoon title="Settings" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
