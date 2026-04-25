import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Items from './pages/Items';
import Purchases from './pages/Purchases';
import './index.css';

// Generic coming soon
const ComingSoon = ({ title }: { title: string }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    height:'60vh', gap:'12px', color:'var(--text-muted)', fontFamily:'Inter,sans-serif' }}>
    <div style={{ fontSize:'48px' }}>🚧</div>
    <h2 style={{ fontSize:'20px', fontWeight:700, color:'var(--text-secondary)' }}>{title}</h2>
    <p style={{ fontSize:'13px' }}>This module is coming soon</p>
  </div>
);

// Branded Sales Invoice Coming Soon
const SalesComingSoon = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '70vh', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px'
  }}>
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(108,71,255,0.15), rgba(108,71,255,0.05))',
      border: '2px solid rgba(108,71,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
    }}>🧾</div>
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Sales Invoice — Coming Soon
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
        We are building a powerful GST-compliant sales invoicing module. Stay tuned — it will support e-invoicing, UPI payments, and auto-reconciliation.
      </p>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {['GST e-Invoice', 'UPI Payments', 'Auto Reconciliation', 'Multi-currency'].map(tag => (
        <span key={tag} style={{
          padding: '5px 14px', borderRadius: 20,
          background: 'rgba(108,71,255,0.08)', color: 'var(--brand-secondary)',
          fontSize: 12, fontWeight: 600, border: '1px solid rgba(108,71,255,0.15)'
        }}>{tag}</span>
      ))}
    </div>
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
          <Route path="sales"     element={<SalesComingSoon />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="reports"   element={<ComingSoon title="Reports & Trial Balance" />} />
          <Route path="settings"  element={<ComingSoon title="Settings" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
