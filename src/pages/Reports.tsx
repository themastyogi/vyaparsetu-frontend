import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import './Dashboard.css';

interface TrialBalanceEntry {
  accountId: string;
  accountName: string;
  accountType: string;
  totalDebit: string | number;
  totalCredit: string | number;
  balance: string | number;
}

export default function Reports() {
  const [data, setData] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocalhost) {
      // Mock data for Vercel live demo
      setTimeout(() => {
        setData([
          { accountId: 'inventory_asset_ac', accountName: 'Inventory (Asset)', accountType: 'asset', totalDebit: 50000, totalCredit: 0, balance: 50000 },
          { accountId: 'input_gst_ac', accountName: 'Input GST Receivable', accountType: 'asset', totalDebit: 9000, totalCredit: 0, balance: 9000 },
          { accountId: 'vendor_payable_ac', accountName: 'Vendor Payable', accountType: 'liability', totalDebit: 0, totalCredit: 59000, balance: -59000 }
        ]);
        setLoading(false);
      }, 800);
      return;
    }

    // In a real app, use the configured Axios instance
    fetch('http://localhost:3000/finance/trial-balance', {
      headers: {
        'tenantId': 'default-tenant' // Usually from auth context
      }
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch trial balance', err);
        setLoading(false);
        // Fallback to empty if backend is not running yet
        setData([]);
      });
  }, []);

  const totalDebit = data.reduce((sum, item) => sum + Number(item.totalDebit), 0);
  const totalCredit = data.reduce((sum, item) => sum + Number(item.totalCredit), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Reports</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View your live trial balance and ledgers</p>
      </header>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="var(--brand-primary)" />
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Trial Balance</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledgers...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No accounting entries found yet. Post a purchase to see the impact.</div>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Account Name</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.accountName}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{row.accountType}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: Number(row.totalDebit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {Number(row.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: Number(row.totalCredit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {Number(row.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr style={{ background: 'var(--bg-elevated)', fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: '16px 20px', textAlign: 'right' }}>TOTAL</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }}>
                    {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }}>
                    {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
