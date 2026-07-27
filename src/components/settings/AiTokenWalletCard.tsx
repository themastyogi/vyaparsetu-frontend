import React, { useState } from 'react';
import { Cpu, PlusCircle, CreditCard, History, ShieldCheck, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { useAccounting } from '../../hooks/useAccounting';

export default function AiTokenWalletCard() {
  const { companySettings, updateCompanySettings } = useAccounting();

  const totalCredits = companySettings.aiCreditsTotal ?? 300;
  const usedCredits = companySettings.aiCreditsUsed ?? 55;
  const availableCredits = Math.max(0, totalCredits - usedCredits);
  const usedPercent = Math.min(100, Math.round((usedCredits / totalCredits) * 100));

  const history = companySettings.aiCreditHistory || [
    { id: 'cred-1', date: '2026-07-01', amount: 100, description: 'Monthly SaaS Included AI Credits', type: 'grant' },
    { id: 'cred-2', date: '2026-07-15', amount: 200, description: 'Super Admin SaaS Allocation', type: 'grant' },
    { id: 'cred-3', date: '2026-07-26', amount: 55, description: '55 PDF Invoice Document Scans', type: 'usage' },
  ];

  // Modals state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showAdminAssignModal, setShowAdminAssignModal] = useState(false);
  
  // Admin Assign State
  const [adminAmount, setAdminAmount] = useState('500');
  const [adminNote, setAdminNote] = useState('Admin Bonus Allocation');
  const [toast, setToast] = useState<string | null>(null);

  const handleBuyPack = (packName: string, creditAmount: number, price: number) => {
    const newTotal = totalCredits + creditAmount;
    const newHistory = [
      {
        id: 'purch_' + Date.now().toString(36),
        date: new Date().toISOString().split('T')[0],
        amount: creditAmount,
        description: `Purchased ${packName} (${creditAmount} AI Credits for ₹${price})`,
        type: 'purchase' as const,
      },
      ...history,
    ];

    updateCompanySettings({
      aiCreditsTotal: newTotal,
      aiCreditHistory: newHistory,
    });

    setShowBuyModal(false);
    setToast(`Successfully purchased ${creditAmount} AI Scans! Balance updated to ${newTotal - usedCredits} Credits.`);
    setTimeout(() => setToast(null), 4500);
  };

  const handleAdminAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(adminAmount, 10) || 0;
    if (count <= 0) return;

    const newTotal = totalCredits + count;
    const newHistory = [
      {
        id: 'grant_' + Date.now().toString(36),
        date: new Date().toISOString().split('T')[0],
        amount: count,
        description: `SaaS Owner Grant: ${adminNote}`,
        type: 'grant' as const,
      },
      ...history,
    ];

    updateCompanySettings({
      aiCreditsTotal: newTotal,
      aiCreditHistory: newHistory,
    });

    setShowAdminAssignModal(false);
    setToast(`Super Admin assigned ${count} AI Token Credits to this Tenant!`);
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', marginBottom: 24 }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={22} style={{ color: 'var(--brand-primary)' }}/>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              SaaS AI Token Wallet &amp; Metering System <Sparkles size={16} style={{ color: '#F59E0B' }}/>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Metered usage balance for multi-tenant SaaS AI PDF invoice parsing.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowAdminAssignModal(true)}
            className="btn-action"
            style={{ background: 'rgba(108,71,255,0.12)', color: 'var(--brand-primary)', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={15}/> SaaS Admin Assign Tokens
          </button>
          <button
            type="button"
            onClick={() => setShowBuyModal(true)}
            className="btn-action btn-action-primary"
            style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PlusCircle size={15}/> Buy AI Tokens
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', color: '#10B981', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={16}/> {toast}
        </div>
      )}

      {/* Metering Gauge */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available AI Tokens</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: availableCredits > 20 ? 'var(--brand-primary)' : '#EF4444', fontFamily: 'monospace' }}>
              {availableCredits.toLocaleString('en-IN')} <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>/ {totalCredits.toLocaleString('en-IN')} Credits</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)' }}>
              {usedCredits} Scans Utilized ({usedPercent}%)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 10, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${usedPercent}%`, height: '100%', background: usedPercent > 85 ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'linear-gradient(90deg, #3B82F6, #6C47FF)', transition: 'width 0.4s ease' }}/>
        </div>
      </div>

      {/* Credit History Log */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={15}/> Token Metering &amp; Allocation History
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Date</th>
                <th style={{ padding: '10px 14px' }}>Description</th>
                <th style={{ padding: '10px 14px' }}>Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id || i} style={{ borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>{h.date}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{h.description}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800,
                      background: h.type === 'grant' ? 'rgba(59,130,246,0.12)' : h.type === 'purchase' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: h.type === 'grant' ? '#2563EB' : h.type === 'purchase' ? '#10B981' : '#D97706'
                    }}>
                      {h.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: h.type === 'usage' ? '#EF4444' : '#10B981' }}>
                    {h.type === 'usage' ? `-${h.amount}` : `+${h.amount}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy AI Token Packs Modal */}
      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={20} style={{ color: 'var(--brand-primary)' }}/> Purchase AI Token Credits
              </h3>
              <button onClick={() => setShowBuyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              AI Token Credits allow 99.9% automated PDF invoice parsing across all vendors. Credits never expire.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Starter Pack</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>100 AI Invoice Scans (₹1.99 / scan)</div>
                </div>
                <button onClick={() => handleBuyPack('Starter Pack', 100, 199)} className="btn-action btn-action-primary" style={{ padding: '8px 16px', fontWeight: 800 }}>
                  ₹199 · Buy Now
                </button>
              </div>

              <div style={{ border: '2px solid var(--brand-primary)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(108,71,255,0.06)' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--brand-primary)', color: '#FFF', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', marginBottom: 4, display: 'inline-block' }}>Most Popular</span>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Pro Business Pack</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>500 AI Invoice Scans (₹1.59 / scan)</div>
                </div>
                <button onClick={() => handleBuyPack('Pro Business Pack', 500, 799)} className="btn-action btn-action-primary" style={{ padding: '8px 16px', fontWeight: 800 }}>
                  ₹799 · Buy Now
                </button>
              </div>

              <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Enterprise Volume Pack</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>2,000 AI Invoice Scans (₹1.24 / scan)</div>
                </div>
                <button onClick={() => handleBuyPack('Enterprise Volume Pack', 2000, 2499)} className="btn-action btn-action-primary" style={{ padding: '8px 16px', fontWeight: 800 }}>
                  ₹2,499 · Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Assign Modal */}
      {showAdminAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/> SaaS Super Admin Token Grant
              </h3>
              <button onClick={() => setShowAdminAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleAdminAssign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label" style={{ fontWeight: 800 }}>Credits to Assign *</label>
                <input
                  type="number"
                  required
                  value={adminAmount}
                  onChange={e => setAdminAmount(e.target.value)}
                  className="field-input"
                  style={{ fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="field-label">Grant Description / Reason</label>
                <input
                  type="text"
                  required
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Annual Subscription Bonus"
                  className="field-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAdminAssignModal(false)} className="btn-action btn-action-secondary">Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Assign Tokens to Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
