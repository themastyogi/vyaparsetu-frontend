import { useState, useMemo } from 'react';
import { BarChart3, BookOpen, List, Scale, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAccounting, type JournalEntry } from '../hooks/useAccounting';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = 'trial-balance' | 'general-ledger' | 'journal-entries';

export default function Reports() {
  const { getTrialBalance, getGeneralLedger, getAccountLedger, journalEntries } = useAccounting();

  const [tab, setTab]             = useState<Tab>('trial-balance');
  const [glDrillAccount, setGLDrillAccount]   = useState<string | null>(null);
  const [expandedJE, setExpandedJE]           = useState<string | null>(null);
  const [jeTypeFilter, setJETypeFilter]       = useState('All');

  const tb  = useMemo(() => getTrialBalance(),    [getTrialBalance, journalEntries]);
  const gl  = useMemo(() => getGeneralLedger(),   [getGeneralLedger, journalEntries]);

  const drillRows = useMemo(() =>
    glDrillAccount ? getAccountLedger(glDrillAccount) : [],
    [glDrillAccount, getAccountLedger, journalEntries]
  );

  const jeTypes = ['All', ...Array.from(new Set(journalEntries.map(j => j.entryType)))];
  const filteredJEs = journalEntries.filter(j => jeTypeFilter === 'All' || j.entryType === jeTypeFilter);

  // Group journal entries by ID (each JE has multiple lines)
  const jeGroups = useMemo(() => {
    const groups = new Map<string, JournalEntry>();
    for (const je of filteredJEs) {
      if (!groups.has(je.id)) groups.set(je.id, je);
    }
    return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredJEs]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'trial-balance',  label: 'Trial Balance',  icon: <Scale size={15}/> },
    { id: 'general-ledger', label: 'General Ledger', icon: <BookOpen size={15}/> },
    { id: 'journal-entries',label: 'Journal Entries',icon: <List size={15}/> },
  ];

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: 'var(--brand-primary)' }} /> Financial Reports
          </h1>
          <p className="page-sub">Trial Balance · General Ledger · Journal Entries — all live, no hardcoding</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border-primary)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setGLDrillAccount(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: 'none', color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ──────────────── TRIAL BALANCE ──────────────── */}
      {tab === 'trial-balance' && (
        <div className="page-card">
          {/* Balanced indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 16, borderRadius: 10, background: tb.balanced ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${tb.balanced ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {tb.balanced
              ? <><CheckCircle2 size={18} style={{ color: '#22c55e' }} /><span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>Trial Balance is BALANCED — Total Debits = Total Credits</span></>
              : <><AlertCircle size={18} style={{ color: '#ef4444' }} /><span style={{ fontSize: 14, color: '#ef4444', fontWeight: 600 }}>IMBALANCED — Difference: ₹{f2(Math.abs(tb.totalDebit - tb.totalCredit))}</span></>
            }
          </div>

          {tb.rows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No transactions posted yet. Create Sales / Purchase invoices to see the trial balance.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.rows.map(row => (
                    <tr key={row.account}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{row.accountCode}</td>
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 600, fontSize: 13, textAlign: 'left', padding: 0 }}
                          onClick={() => { setTab('general-ledger'); setGLDrillAccount(row.account); }}
                          title="Click to see GL drilldown"
                        >
                          {row.account} ↗
                        </button>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: 'var(--surface-secondary)', color: 'var(--text-muted)' }}>
                          {row.accountType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: row.debit > 0 ? 700 : 400, color: row.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.debit > 0 ? f2(row.debit) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: row.credit > 0 ? 700 : 400, color: row.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.credit > 0 ? f2(row.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ borderTop: '2px solid var(--border-primary)', fontWeight: 800, background: 'var(--surface-secondary)' }}>
                    <td colSpan={3} style={{ padding: '10px 16px', textAlign: 'right' }}>TOTAL</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 16px' }}>{f2(tb.totalDebit)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 16px' }}>{f2(tb.totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── GENERAL LEDGER ──────────────── */}
      {tab === 'general-ledger' && (
        <div>
          {/* Account Selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <select value={glDrillAccount ?? ''} onChange={e => setGLDrillAccount(e.target.value || null)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, minWidth: 280 }}>
              <option value="">— Select Account —</option>
              {gl.map(a => (
                <option key={a.account} value={a.account}>{a.accountCode} · {a.account}</option>
              ))}
            </select>
            {glDrillAccount && (
              <button onClick={() => setGLDrillAccount(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            )}
          </div>

          {/* GL Summary Cards */}
          {gl.length > 0 && !glDrillAccount && (
            <div className="page-card" style={{ marginBottom: 16 }}>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th><th>Account</th><th>Type</th>
                      <th style={{ textAlign: 'right' }}>Total Dr (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total Cr (₹)</th>
                      <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gl.map(a => (
                      <tr key={a.account} style={{ cursor: 'pointer' }} onClick={() => setGLDrillAccount(a.account)}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{a.accountCode}</td>
                        <td style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{a.account} ↗</td>
                        <td style={{ fontSize: 11 }}>{a.accountType}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.totalDebit > 0 ? f2(a.totalDebit) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.totalCredit > 0 ? f2(a.totalCredit) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: a.balance > 0 ? '#16a34a' : a.balance < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                          {a.balance !== 0 ? (a.balance < 0 ? `(${f2(Math.abs(a.balance))})` : f2(a.balance)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drilldown */}
          {glDrillAccount && (
            <div className="page-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Ledger: {glDrillAccount}</h3>
                {(() => {
                  const acct = gl.find(a => a.account === glDrillAccount);
                  return acct ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Total Dr: <b>₹{f2(acct.totalDebit)}</b> · Total Cr: <b>₹{f2(acct.totalCredit)}</b> · Balance: <b style={{ color: acct.balance >= 0 ? '#16a34a' : '#ef4444' }}>₹{f2(acct.balance)}</b>
                    </div>
                  ) : null;
                })()}
              </div>
              {drillRows.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No transactions for this account yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Voucher Type</th><th>Ref No.</th><th>Party</th>
                        <th style={{ textAlign: 'right' }}>Dr (₹)</th>
                        <th style={{ textAlign: 'right' }}>Cr (₹)</th>
                        <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillRows.map((row, i) => (
                        <tr key={`${row.id}-${i}`}>
                          <td style={{ fontSize: 12 }}>{row.date}</td>
                          <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--surface-secondary)', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.entryType}</span></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-primary)' }}>{row.relatedNo}</td>
                          <td style={{ fontSize: 12 }}>{row.party}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: row.line.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{row.line.debit > 0 ? f2(row.line.debit) : '—'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: row.line.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{row.line.credit > 0 ? f2(row.line.credit) : '—'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: row.runningBalance >= 0 ? '#16a34a' : '#ef4444' }}>{f2(row.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {gl.length === 0 && !glDrillAccount && (
            <div className="page-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No transactions posted yet.
            </div>
          )}
        </div>
      )}

      {/* ──────────────── JOURNAL ENTRIES ──────────────── */}
      {tab === 'journal-entries' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {jeTypes.map(t => (
              <button key={t} onClick={() => setJETypeFilter(t)}
                className={`filter-tab ${jeTypeFilter === t ? 'filter-tab-active' : ''}`}>
                {t}
              </button>
            ))}
          </div>

          {jeGroups.length === 0 ? (
            <div className="page-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No journal entries yet. Post a Sales or Purchase invoice to see entries here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jeGroups.map(je => {
                const isExpanded = expandedJE === je.id;
                const totalDr = je.lines.reduce((s, l) => s + l.debit, 0);
                const totalCr = je.lines.reduce((s, l) => s + l.credit, 0);
                const balanced = Math.abs(totalDr - totalCr) < 0.01;
                return (
                  <div key={je.id} className="page-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* JE Header */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: isExpanded ? 'var(--surface-secondary)' : 'var(--surface-primary)' }}
                      onClick={() => setExpandedJE(isExpanded ? null : je.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: 'var(--surface-secondary)', color: 'var(--brand-primary)', border: '1px solid var(--border-primary)' }}>
                          {je.entryType}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{je.relatedNo}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{je.date}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{je.party}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>₹{f2(totalDr)}</span>
                        <span style={{ fontSize: 11, color: balanced ? '#16a34a' : '#ef4444' }}>{balanced ? '✓ Balanced' : '⚠ Check'}</span>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>

                    {/* JE Lines */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border-primary)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                              <th style={{ padding: '7px 16px', textAlign: 'left', width: '55%' }}>Account</th>
                              <th style={{ padding: '7px 16px', textAlign: 'right', width: '22%' }}>Debit (₹)</th>
                              <th style={{ padding: '7px 16px', textAlign: 'right', width: '23%' }}>Credit (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {je.lines.map((line, i) => (
                              <tr key={i} style={{ borderBottom: '1px dashed var(--border-primary)' }}>
                                <td style={{ padding: '6px 16px', paddingLeft: line.credit > 0 ? 36 : 16, fontWeight: line.debit > 0 ? 600 : 400 }}>{line.credit > 0 ? 'To  ' : ''}{line.account}</td>
                                <td style={{ padding: '6px 16px', textAlign: 'right', fontFamily: 'monospace', color: line.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{line.debit > 0 ? f2(line.debit) : '—'}</td>
                                <td style={{ padding: '6px 16px', textAlign: 'right', fontFamily: 'monospace', color: line.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{line.credit > 0 ? f2(line.credit) : '—'}</td>
                              </tr>
                            ))}
                            <tr style={{ background: 'var(--surface-secondary)', fontWeight: 700, borderTop: '1px solid var(--border-primary)' }}>
                              <td style={{ padding: '7px 16px' }}>Total</td>
                              <td style={{ padding: '7px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(totalDr)}</td>
                              <td style={{ padding: '7px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(totalCr)}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}>
                          <i>Posted: {new Date(je.createdAt).toLocaleString('en-IN')}</i>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
