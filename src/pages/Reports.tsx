import React, { useState, useEffect } from 'react';
import { FileText, Printer, ArrowLeft, Eye } from 'lucide-react';
import './Dashboard.css';

interface TrialBalanceEntry {
  accountId: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  totalDebit: string | number;
  totalCredit: string | number;
  balance: string | number;
}

export default function Reports() {
  const [data, setData] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // General Ledger State
  const [viewMode, setViewMode] = useState<'trial_balance' | 'general_ledger'>('trial_balance');
  const [selectedAccount, setSelectedAccount] = useState<TrialBalanceEntry | null>(null);
  const [glEntries, setGlEntries] = useState<any[]>([]);
  const [glLoading, setGlLoading] = useState(false);

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocalhost) {
      // Mock data for Vercel live demo
      setTimeout(() => {
        setData([
          { accountId: 'inventory_asset_ac', accountName: 'Inventory (Asset)', accountType: 'asset', totalDebit: 50000, totalCredit: 0, balance: 50000 },
          { accountId: 'input_gst_ac', accountName: 'Input GST Receivable', accountType: 'asset', totalDebit: 9000, totalCredit: 0, balance: 9000 },
          { accountId: 'freight_charges_ac', accountName: 'Freight & Charges', accountType: 'expense', totalDebit: 1500, totalCredit: 0, balance: 1500 },
          { accountId: 'discount_received_ac', accountName: 'Discount Received', accountType: 'revenue', totalDebit: 0, totalCredit: 500, balance: -500 },
          { accountId: 'vendor_payable_ac', accountName: 'Vendor Payable', accountType: 'liability', totalDebit: 0, totalCredit: 60000, balance: -60000 }
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

  const fetchGeneralLedger = (account: TrialBalanceEntry) => {
    setSelectedAccount(account);
    setViewMode('general_ledger');
    setGlLoading(true);

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      // Mock GL for Vercel
      setTimeout(() => {
        setGlEntries([
          { voucherNo: 'PUR-001', date: new Date().toISOString(), debit: account.totalDebit, credit: account.totalCredit, voucherType: 'PURCHASE' }
        ]);
        setGlLoading(false);
      }, 500);
      return;
    }

    fetch(`http://localhost:3000/finance/general-ledger?accountId=${account.accountId}`, {
      headers: { 'tenantId': 'default-tenant' }
    })
      .then(res => res.json())
      .then(json => {
        setGlEntries(json);
        setGlLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch GL', err);
        setGlLoading(false);
        setGlEntries([]);
      });
  };

  const totalDebit = data.reduce((sum, item) => sum + Number(item.totalDebit), 0);
  const totalCredit = data.reduce((sum, item) => sum + Number(item.totalCredit), 0);

  // Group data by type
  const groupedData: Record<string, TrialBalanceEntry[]> = {
    asset: data.filter(d => d.accountType === 'asset'),
    liability: data.filter(d => d.accountType === 'liability'),
    equity: data.filter(d => d.accountType === 'equity'),
    revenue: data.filter(d => d.accountType === 'revenue'),
    expense: data.filter(d => d.accountType === 'expense'),
  };

  const groupLabels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expenses'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Reports</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {viewMode === 'trial_balance' ? 'View your live trial balance and ledgers' : `General Ledger: ${selectedAccount?.accountName}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {viewMode === 'general_ledger' && (
              <button className="btn-action btn-action-secondary" onClick={() => setViewMode('trial_balance')}>
                <ArrowLeft size={16} /> Back to Trial Balance
              </button>
            )}
            <button className="btn-action btn-action-secondary" onClick={() => window.print()}>
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'trial_balance' ? (
        <div className="print-area" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Trial Balance</h2>
          </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledgers...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No accounting entries found yet. Post a purchase to see the impact.</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Account Name</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                  const group = groupedData[type];
                  if (group.length === 0) return null;
                  
                  const groupDebit = group.reduce((sum, item) => sum + Number(item.totalDebit), 0);
                  const groupCredit = group.reduce((sum, item) => sum + Number(item.totalCredit), 0);

                  return (
                    <React.Fragment key={type}>
                      {/* Group Header */}
                      <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <td colSpan={3} style={{ padding: '10px 20px', fontWeight: 700, color: 'var(--brand-secondary)', textTransform: 'uppercase', fontSize: '12px' }}>
                          {groupLabels[type]}
                        </td>
                      </tr>
                      {/* Group Items */}
                      {group.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => fetchGeneralLedger(row)} className="tr-hover">
                          <td style={{ padding: '10px 20px', fontWeight: 500, color: 'var(--brand-primary)', paddingLeft: '32px', textDecoration: 'underline' }}>{row.accountName}</td>
                          <td style={{ padding: '10px 20px', textAlign: 'right', color: Number(row.totalDebit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {Number(row.totalDebit) > 0 ? Number(row.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td style={{ padding: '10px 20px', textAlign: 'right', color: Number(row.totalCredit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {Number(row.totalCredit) > 0 ? Number(row.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                      {/* Group Total (Optional, but good for Trial Balance) */}
                      <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 20px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>Total {groupLabels[type]}</td>
                        <td style={{ padding: '8px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{groupDebit > 0 ? groupDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                        <td style={{ padding: '8px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{groupCredit > 0 ? groupCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                
                {/* Grand Totals Row */}
                <tr style={{ background: 'var(--bg-elevated)', fontWeight: 800, fontSize: '15px' }}>
                  <td style={{ padding: '20px 20px', textAlign: 'right' }}>GRAND TOTAL</td>
                  <td style={{ padding: '20px 20px', textAlign: 'right', color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }}>
                    {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '20px 20px', textAlign: 'right', color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }}>
                    {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
        <div className="print-area" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>General Ledger: {selectedAccount?.accountName}</h2>
          </div>

          {glLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading entries...</div>
          ) : glEntries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No journal entries found for this ledger.</div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Voucher No</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Voucher Type</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Debit (₹)</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Credit (₹)</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {glEntries.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="tr-hover">
                      <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{new Date(row.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 500 }}>{row.voucherNo}</td>
                      <td style={{ padding: '12px 20px' }}>{row.voucherType}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: Number(row.debit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {Number(row.debit) > 0 ? Number(row.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: Number(row.credit) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {Number(row.credit) > 0 ? Number(row.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <button className="row-action-btn" aria-label="View Voucher">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
