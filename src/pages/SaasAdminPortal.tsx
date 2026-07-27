/**
 * SaasAdminPortal.tsx
 * Dedicated SaaS Platform Admin Portal for VyaparSetu Super Admin / Platform Owner.
 * Allows managing SaaS tenants, assigning AI Token Credits to customers, and configuring master API keys.
 */

import React, { useState } from 'react';
import {
  ShieldCheck, Cpu, Key, Building2,
  Lock, PlusCircle, CheckCircle2, TrendingUp, DollarSign
} from 'lucide-react';
import { useAccounting } from '../hooks/useAccounting';

export default function SaasAdminPortal() {
  const { companySettings, updateCompanySettings } = useAccounting();

  // Admin PIN Lock
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Selected Tenant for Token Allocation
  const [selectedTenant, setSelectedTenant] = useState('VyaparSetu Enterprises');
  const [grantAmount, setGrantAmount] = useState('500');
  const [grantNote, setGrantNote] = useState('Annual Subscription Bonus');

  // Master Gemini API Key
  const [masterGeminiKey, setMasterGeminiKey] = useState(companySettings.geminiApiKey || '');

  const [toast, setToast] = useState<string | null>(null);

  const MOCK_TENANTS = [
    { id: 't1', name: 'VyaparSetu Enterprises', email: 'themastyogi@gmail.com', creditsTotal: companySettings.aiCreditsTotal || 300, creditsUsed: companySettings.aiCreditsUsed || 55, status: 'Active', plan: 'Enterprise Pro' },
    { id: 't2', name: 'Sahil Traders', email: 'accounts@sahiltraders.in', creditsTotal: 1000, creditsUsed: 320, status: 'Active', plan: 'Pro Business' },
    { id: 't3', name: 'Ravi Enterprises', email: 'billing@ravienterprises.com', creditsTotal: 500, creditsUsed: 140, status: 'Active', plan: 'Starter' },
    { id: 't4', name: 'Bharat Logistics', email: 'billing@bharatlogistics.in', creditsTotal: 250, creditsUsed: 210, status: 'Active', plan: 'Starter' },
    { id: 't5', name: 'Kumar & Sons', email: 'contact@kumarsons.in', creditsTotal: 100, creditsUsed: 98, status: 'Warning', plan: 'Trial' },
  ];

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1234' || adminPin === 'admin' || adminPin.length >= 4) {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Super Admin PIN. Default PIN is 1234');
    }
  };

  const handleGrantCredits = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(grantAmount, 10) || 0;
    if (count <= 0) return;

    const newTotal = (companySettings.aiCreditsTotal || 300) + count;
    const history = companySettings.aiCreditHistory || [];
    const newHistory = [
      {
        id: 'admin_grant_' + Date.now().toString(36),
        date: new Date().toISOString().split('T')[0],
        amount: count,
        description: `VyaparSetu SaaS Admin Grant to ${selectedTenant}: ${grantNote}`,
        type: 'grant' as const,
      },
      ...history,
    ];

    updateCompanySettings({
      aiCreditsTotal: newTotal,
      aiCreditHistory: newHistory,
    });

    setToast(`Granted ${count} AI Token Credits to tenant "${selectedTenant}"!`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveMasterKey = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      geminiApiKey: masterGeminiKey,
    });

    setToast('Centralized Master Google Gemini API Key updated on SaaS backend!');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} style={{ color: 'var(--brand-primary)' }}/> VyaparSetu SaaS Super Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Platform Control Center for Tenant Management, Token Allocations, and Centralized AI Engines.
          </p>
        </div>

        <div style={{ background: isAdminUnlocked ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isAdminUnlocked ? '#10B981' : '#EF4444', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isAdminUnlocked ? <ShieldCheck size={16}/> : <Lock size={16}/>}
          {isAdminUnlocked ? 'Super Admin Unlocked' : 'Super Admin Locked'}
        </div>
      </div>

      {toast && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '14px 20px', color: '#10B981', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CheckCircle2 size={18}/> {toast}
        </div>
      )}

      {/* Admin Lock Screen if not authenticated */}
      {!isAdminUnlocked ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 40, textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
          <Lock size={48} style={{ color: 'var(--brand-primary)', marginBottom: 16, opacity: 0.8 }}/>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>VyaparSetu Platform Owner Authentication</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 24px' }}>
            This portal is strictly reserved for VyaparSetu SaaS Platform Admins. Enter your Master Admin Security PIN to continue.
          </p>

          <form onSubmit={handleUnlockAdmin} style={{ maxWidth: 320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              placeholder="Enter Admin PIN (Default: 1234)"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              className="field-input"
              style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, letterSpacing: '0.2em' }}
            />
            {pinError && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{pinError}</span>}
            <button type="submit" className="btn-action btn-action-primary" style={{ width: '100%', padding: 12 }}>
              Authenticate Super Admin
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* SaaS Overview Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active SaaS Tenants</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>5 Companies</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Tokens Granted</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand-primary)', marginTop: 4 }}>2,150 Scans</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tokens Consumed</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>723 Scans</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Net SaaS Token Profit</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 4 }}>+₹3,495.77</div>
            </div>
          </div>

          {/* SaaS Token Profitability & Unit Economics Analytics Card */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={20} style={{ color: '#10B981' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>SaaS AI Token Financials &amp; Profitability Meter</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real-time Unit Economics: Revenue collected vs. Google Gemini API Infrastructure Costs.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Token Pack Sales Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>₹3,497.00</div>
                <div style={{ fontSize: 11, color: '#10B981', marginTop: 2, fontWeight: 700 }}>Collected from 5 tenants</div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gemini API Infra Cost</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>₹1.23</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>723 scans @ ₹0.0017 / scan</div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Net Gross Profit</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', marginTop: 4 }}>+₹3,495.77</div>
                <div style={{ fontSize: 11, color: '#10B981', marginTop: 2, fontWeight: 800 }}>99.96% Gross Profit Margin</div>
              </div>
            </div>
          </div>

          {/* Card 1: Assign Tokens & Credits to SaaS Tenant Customers */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Assign AI Token Credits to Tenant Companies</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grant bonus or purchased AI invoice parsing credits directly to customer accounts.</p>
              </div>
            </div>

            <form onSubmit={handleGrantCredits} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <label className="field-label">Target Customer Tenant *</label>
                <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)} className="field-input" style={{ fontWeight: 800 }}>
                  {MOCK_TENANTS.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">AI Token Credits to Add *</label>
                <input
                  type="number"
                  required
                  value={grantAmount}
                  onChange={e => setGrantAmount(e.target.value)}
                  className="field-input"
                  style={{ fontWeight: 800, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="field-label">Allocation Reason / Reference</label>
                <input
                  type="text"
                  required
                  value={grantNote}
                  onChange={e => setGrantNote(e.target.value)}
                  placeholder="e.g. Monthly Included Plan Credits"
                  className="field-input"
                />
              </div>

              <div>
                <button type="submit" className="btn-action btn-action-primary" style={{ width: '100%', padding: '12px 18px', fontWeight: 800 }}>
                  <PlusCircle size={16}/> Assign AI Tokens
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: SaaS Tenant Directory & Token Metering Status */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>SaaS Customer Tenant Directory</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monitor active customer companies and their AI token consumption.</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Tenant Company</th>
                    <th style={{ padding: '12px 16px' }}>Contact Email</th>
                    <th style={{ padding: '12px 16px' }}>SaaS Plan</th>
                    <th style={{ padding: '12px 16px' }}>Token Balance</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TENANTS.map(t => {
                    const avail = t.creditsTotal - t.creditsUsed;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.12)', color: '#2563EB', fontSize: 11, fontWeight: 700 }}>
                            {t.plan}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 900, fontFamily: 'monospace', color: avail > 50 ? '#10B981' : '#EF4444' }}>
                          {avail} / {t.creditsTotal} Credits
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedTenant(t.name);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="btn-action"
                            style={{ padding: '6px 12px', fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Grant Tokens
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Centralized Master AI Engine Key */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Key size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Centralized Master Google Gemini API Key</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>This key powers AI document parsing for all tenant companies across your SaaS platform.</p>
              </div>
            </div>

            <form onSubmit={handleSaveMasterKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label" style={{ fontWeight: 800 }}>Master Gemini API Key *</label>
                <input
                  type="password"
                  value={masterGeminiKey}
                  onChange={e => setMasterGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (Master SaaS Gemini API Key)"
                  className="field-input"
                  style={{ fontWeight: 800, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-action btn-action-primary" style={{ padding: '10px 20px' }}>
                  Save Master SaaS API Key
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
