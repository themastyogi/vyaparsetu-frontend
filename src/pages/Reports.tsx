/**
 * Reports.tsx
 * Tabs: Trial Balance · General Ledger · Journal Entries · Party Ledger · Ageing · Margin
 */
import { useState, useMemo } from 'react';
import {
  BarChart3, BookOpen, List, Scale, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Users, Clock, TrendingUp, Search,
  Printer, IndianRupee, Link2,
} from 'lucide-react';
import { useAccounting, type JournalEntry } from '../hooks/useAccounting';

const f2  = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = 'trial-balance' | 'general-ledger' | 'journal-entries' | 'party-ledger' | 'ageing' | 'margin';

// ── shared label style ─────────────────────────────────────────
const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};
const INP: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 7, border: '1.5px solid #cbd5e1',
  background: '#fff', color: '#0f172a', fontSize: 13, outline: 'none',
};

// ── Margin badge ───────────────────────────────────────────────
function MarginBadge({ pct: p }: { pct: number }) {
  const color = p >= 20 ? '#16a34a' : p >= 10 ? '#d97706' : '#dc2626';
  const bg    = p >= 20 ? '#f0fdf4' : p >= 10 ? '#fffbeb' : '#fef2f2';
  return (
    <span style={{ background: bg, color, fontWeight: 800, fontSize: 12, padding: '3px 9px', borderRadius: 20, fontFamily: 'monospace', display: 'inline-block' }}>
      {p >= 0 ? '+' : ''}{p.toFixed(1)}%
    </span>
  );
}

export default function Reports() {
  const {
    getTrialBalance, getGeneralLedger, getAccountLedger,
    journalEntries, getPartyLedger, getAgeing, getMarginReport,
    salesInvoices, purchaseInvoices,
  } = useAccounting();

  const [tab, setTab]                   = useState<Tab>('trial-balance');
  const [glDrillAccount, setGLDrill]    = useState<string | null>(null);
  const [expandedJE, setExpandedJE]     = useState<string | null>(null);
  const [jeTypeFilter, setJETypeFilter] = useState('All');

  // Party Ledger state
  const [plParty,    setPlParty]    = useState('');
  const [plFrom,     setPlFrom]     = useState('');
  const [plTo,       setPlTo]       = useState('');
  const [plSearch,   setPlSearch]   = useState('');
  const [plOpen,     setPlOpen]     = useState(false);

  // Ageing state
  const [ageType,   setAgeType]   = useState<'customer'|'vendor'>('customer');
  const [ageAsOf,   setAgeAsOf]   = useState(new Date().toISOString().split('T')[0]);

  // Margin state
  const [marginSearch, setMarginSearch] = useState('');

  const tb  = useMemo(() => getTrialBalance(),   [getTrialBalance,  journalEntries]);
  const gl  = useMemo(() => getGeneralLedger(),  [getGeneralLedger, journalEntries]);

  const drillRows = useMemo(() =>
    glDrillAccount ? getAccountLedger(glDrillAccount) : [],
    [glDrillAccount, getAccountLedger, journalEntries]
  );

  const jeTypes     = ['All', ...Array.from(new Set(journalEntries.map(j => j.entryType)))];
  const filteredJEs = journalEntries.filter(j => jeTypeFilter === 'All' || j.entryType === jeTypeFilter);
  const jeGroups    = useMemo(() => {
    const groups = new Map<string, JournalEntry>();
    for (const je of filteredJEs) if (!groups.has(je.id)) groups.set(je.id, je);
    return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredJEs]);

  // Party Ledger computed
  const allParties = useMemo(() => {
    const names = new Set<string>();
    journalEntries.forEach(je => names.add(je.party));
    return Array.from(names).sort();
  }, [journalEntries]);

  const filteredPartyOptions = allParties.filter(p => p.toLowerCase().includes(plSearch.toLowerCase())).slice(0, 12);

  const plRows = useMemo(() =>
    plParty ? getPartyLedger(plParty, plFrom || undefined, plTo || undefined) : [],
    [plParty, plFrom, plTo, getPartyLedger, journalEntries]
  );

  const plOpening = 0; // could add opening balance concept later
  const plClosing = plRows.length > 0 ? plRows[plRows.length - 1].runningBalance : 0;

  // Ageing computed
  const ageRows = useMemo(() => getAgeing(ageType, ageAsOf), [ageType, ageAsOf, getAgeing, salesInvoices, purchaseInvoices]);
  const ageTotals = useMemo(() => ({
    current: ageRows.reduce((s, r) => s + r.current, 0),
    days31:  ageRows.reduce((s, r) => s + r.days31, 0),
    days61:  ageRows.reduce((s, r) => s + r.days61, 0),
    days90:  ageRows.reduce((s, r) => s + r.days90, 0),
    total:   ageRows.reduce((s, r) => s + r.total, 0),
  }), [ageRows]);

  // Margin computed
  const marginRows = useMemo(() => getMarginReport(), [getMarginReport, salesInvoices, purchaseInvoices, journalEntries]);
  const filteredMargin = marginRows.filter(r =>
    r.invoiceNo.toLowerCase().includes(marginSearch.toLowerCase()) ||
    r.customer.toLowerCase().includes(marginSearch.toLowerCase())
  );
  const marginTotals = useMemo(() => ({
    revenue:  filteredMargin.reduce((s, r) => s + r.netRevenue, 0),
    cost:     filteredMargin.reduce((s, r) => s + r.netCost, 0),
    margin:   filteredMargin.reduce((s, r) => s + r.grossMargin, 0),
    avgPct:   filteredMargin.length > 0
      ? filteredMargin.reduce((s, r) => s + r.marginPct, 0) / filteredMargin.length
      : 0,
  }), [filteredMargin]);

  // ── Tab definitions ────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'trial-balance',   label: 'Trial Balance',  icon: <Scale size={14}/> },
    { id: 'general-ledger',  label: 'General Ledger', icon: <BookOpen size={14}/> },
    { id: 'journal-entries', label: 'Journals',        icon: <List size={14}/> },
    { id: 'party-ledger',    label: 'Party Ledger',   icon: <Users size={14}/> },
    { id: 'ageing',          label: 'Ageing',          icon: <Clock size={14}/> },
    { id: 'margin',          label: 'Margin',          icon: <TrendingUp size={14}/> },
  ];

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: 'var(--brand-primary)' }}/> Financial Reports
          </h1>
          <p className="page-sub">Trial Balance · General Ledger · Party Ledger · Ageing · Margin — all live from posted transactions</p>
        </div>
        <button onClick={() => window.print()} className="btn-action btn-action-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Printer size={14}/> Print
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '2px solid var(--border-primary)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setGLDrill(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
              marginBottom: -2,
              color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)',
              background: tab === t.id ? 'rgba(37,99,235,0.06)' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.15s',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: TRIAL BALANCE
          ════════════════════════════════════════════════════════ */}
      {tab === 'trial-balance' && (
        <div className="page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Trial Balance</h2>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: tb.balanced ? '#d1fae5' : '#fef2f2', color: tb.balanced ? '#065f46' : '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}>
              {tb.balanced ? <><CheckCircle2 size={13}/> Balanced</> : <><AlertCircle size={13}/> Out of Balance</>}
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Code</th><th>Account</th><th>Type</th><th style={{ textAlign: 'right' }}>Debit (₹)</th><th style={{ textAlign: 'right' }}>Credit (₹)</th></tr></thead>
              <tbody>
                {tb.rows.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">No transactions posted yet</td></tr>
                ) : tb.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.accountCode}</td>
                    <td style={{ fontWeight: 600 }}>{r.account}</td>
                    <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: r.accountType === 'Asset' ? '#eff6ff' : r.accountType === 'Income' ? '#f0fdf4' : r.accountType === 'Expense' ? '#fff7ed' : '#fdf4ff', color: r.accountType === 'Asset' ? '#1d4ed8' : r.accountType === 'Income' ? '#15803d' : r.accountType === 'Expense' ? '#c2410c' : '#7e22ce' }}>{r.accountType}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.debit > 0 ? 700 : 400, color: r.debit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{r.debit > 0 ? f2(r.debit) : '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.credit > 0 ? 700 : 400, color: r.credit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{r.credit > 0 ? f2(r.credit) : '—'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 900, background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={3} style={{ fontSize: 13, fontWeight: 800 }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 14 }}>₹{f2(tb.totalDebit)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 14 }}>₹{f2(tb.totalCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: GENERAL LEDGER
          ════════════════════════════════════════════════════════ */}
      {tab === 'general-ledger' && (
        <div className="page-card">
          {glDrillAccount ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setGLDrill(null)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>← Back</button>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Ledger: {glDrillAccount}</h2>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Entry Type</th><th>Reference</th><th>Party</th><th style={{ textAlign: 'right' }}>Debit (₹)</th><th style={{ textAlign: 'right' }}>Credit (₹)</th><th style={{ textAlign: 'right' }}>Balance (₹)</th></tr></thead>
                  <tbody>
                    {drillRows.length === 0
                      ? <tr><td colSpan={7} className="empty-cell">No entries for this account</td></tr>
                      : drillRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.date}</td>
                          <td style={{ fontSize: 12 }}>{r.entryType}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-primary)' }}>{r.relatedNo}</td>
                          <td style={{ fontSize: 12 }}>{r.party}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.line.debit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{r.line.debit > 0 ? f2(r.line.debit) : '—'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.line.credit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{r.line.credit > 0 ? f2(r.line.credit) : '—'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.runningBalance >= 0 ? '#16a34a' : '#dc2626' }}>{f2(Math.abs(r.runningBalance))}{r.runningBalance < 0 ? ' Cr' : ' Dr'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>General Ledger — click an account to drill down</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Code</th><th>Account</th><th>Type</th><th style={{ textAlign: 'right' }}>Total Debit</th><th style={{ textAlign: 'right' }}>Total Credit</th><th style={{ textAlign: 'right' }}>Balance</th></tr></thead>
                  <tbody>
                    {gl.length === 0
                      ? <tr><td colSpan={6} className="empty-cell">No transactions yet</td></tr>
                      : gl.map((a, i) => (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setGLDrill(a.account)}
                          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{a.accountCode}</td>
                          <td style={{ fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'underline', textDecorationColor: '#bfdbfe' }}>{a.account}</td>
                          <td><span style={{ fontSize: 11 }}>{a.accountType}</span></td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(a.totalDebit)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(a.totalCredit)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: a.balance >= 0 ? '#16a34a' : '#dc2626' }}>{f2(Math.abs(a.balance))}{a.balance < 0 ? ' Cr' : ' Dr'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: JOURNAL ENTRIES
          ════════════════════════════════════════════════════════ */}
      {tab === 'journal-entries' && (
        <div className="page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Journal Entries ({jeGroups.length})</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {jeTypes.map(t => (
                <button key={t} onClick={() => setJETypeFilter(t)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: jeTypeFilter === t ? 'var(--brand-primary)' : '#e2e8f0', background: jeTypeFilter === t ? 'var(--brand-primary)' : '#fff', color: jeTypeFilter === t ? '#fff' : '#475569' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jeGroups.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No journal entries yet</div>
              : jeGroups.map(je => (
                <div key={je.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedJE(expandedJE === je.id ? null : je.id)}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{je.date}</span>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{je.relatedNo}</span>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 5, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>{je.entryType}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{je.party}</span>
                    </div>
                    {expandedJE === je.id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                  </div>
                  {expandedJE === je.id && (
                    <div style={{ padding: '10px 14px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Account</th><th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Debit (₹)</th><th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Credit (₹)</th></tr></thead>
                        <tbody>
                          {je.lines.map((line, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{line.account}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: line.debit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{line.debit > 0 ? f2(line.debit) : '—'}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: line.credit > 0 ? '#0f172a' : 'var(--text-muted)' }}>{line.credit > 0 ? f2(line.credit) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: PARTY LEDGER
          ════════════════════════════════════════════════════════ */}
      {tab === 'party-ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters */}
          <div className="page-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
              <div>
                <label style={LBL}>Party Name *</label>
                <div style={{ position: 'relative' }}>
                  <input value={plParty}
                    onChange={e => { setPlParty(e.target.value); setPlSearch(e.target.value); setPlOpen(true); }}
                    onFocus={() => setPlOpen(true)}
                    onBlur={() => setTimeout(() => setPlOpen(false), 160)}
                    placeholder="Search party name…"
                    style={{ ...INP, width: '100%', boxSizing: 'border-box', fontWeight: 600 }}/>
                  {plOpen && filteredPartyOptions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
                      {filteredPartyOptions.map(p => (
                        <div key={p} onMouseDown={() => { setPlParty(p); setPlSearch(p); setPlOpen(false); }}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                          onMouseEnter={e => (e.currentTarget.style.background='#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={LBL}>From Date</label>
                <input type="date" value={plFrom} onChange={e => setPlFrom(e.target.value)} style={{ ...INP, width: '100%', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={LBL}>To Date</label>
                <input type="date" value={plTo} onChange={e => setPlTo(e.target.value)} style={{ ...INP, width: '100%', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <button onClick={() => { setPlParty(''); setPlFrom(''); setPlTo(''); }} style={{ ...INP, cursor: 'pointer', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}>Clear</button>
              </div>
            </div>
          </div>

          {/* Ledger table */}
          {plParty ? (
            <div className="page-card">
              {/* Party summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{plParty}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{plRows.length} transactions{plFrom || plTo ? ` · ${plFrom || '…'} to ${plTo || '…'}` : ' · All dates'}</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'right', padding: '8px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Closing Balance</div>
                    <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace', color: plClosing >= 0 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <IndianRupee size={13}/>{f2(Math.abs(plClosing))} {plClosing < 0 ? 'Cr' : 'Dr'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Entry Type</th><th>Reference</th>
                      <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                      <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                      <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening */}
                    <tr style={{ background: '#f8fafc', fontStyle: 'italic' }}>
                      <td colSpan={5} style={{ fontSize: 12, color: 'var(--text-muted)' }}>Opening Balance</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>₹{f2(plOpening)} Dr</td>
                    </tr>
                    {plRows.length === 0
                      ? <tr><td colSpan={6} className="empty-cell">No transactions for this party</td></tr>
                      : plRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.date}</td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{r.entryType}</span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}>{r.refNo}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.debit > 0 ? '#0f172a' : 'var(--text-muted)', fontWeight: r.debit > 0 ? 700 : 400 }}>
                            {r.debit > 0 ? f2(r.debit) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.credit > 0 ? '#0f172a' : 'var(--text-muted)', fontWeight: r.credit > 0 ? 700 : 400 }}>
                            {r.credit > 0 ? f2(r.credit) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: r.runningBalance >= 0 ? '#16a34a' : '#dc2626' }}>
                            ₹{f2(Math.abs(r.runningBalance))} {r.runningBalance < 0 ? 'Cr' : 'Dr'}
                          </td>
                        </tr>
                      ))
                    }
                    {/* Closing */}
                    {plRows.length > 0 && (
                      <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #e2e8f0' }}>
                        <td colSpan={3} style={{ fontSize: 13 }}>Closing Balance</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{f2(plRows.reduce((s, r) => s + r.debit, 0))}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{f2(plRows.reduce((s, r) => s + r.credit, 0))}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 14, color: plClosing >= 0 ? '#16a34a' : '#dc2626' }}>
                          ₹{f2(Math.abs(plClosing))} {plClosing < 0 ? 'Cr' : 'Dr'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="page-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }}/>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a party to view their ledger</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>All customers and vendors with posted transactions are available</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: AGEING REPORT
          ════════════════════════════════════════════════════════ */}
      {tab === 'ageing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls */}
          <div className="page-card" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={LBL}>Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['customer', 'vendor'] as const).map(t => (
                    <button key={t} onClick={() => setAgeType(t)}
                      style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderColor: ageType === t ? 'var(--brand-primary)' : '#e2e8f0', background: ageType === t ? 'var(--brand-primary)' : '#fff', color: ageType === t ? '#fff' : '#475569' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}s
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={LBL}>As of Date</label>
                <input type="date" value={ageAsOf} onChange={e => setAgeAsOf(e.target.value)} style={{ ...INP }}/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', paddingBottom: 4 }}>
                Based on invoice date · Debit notes reduce outstanding
              </div>
            </div>
          </div>

          {/* Summary buckets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { label: '0–30 Days', val: ageTotals.current, color: '#16a34a', bg: '#f0fdf4' },
              { label: '31–60 Days', val: ageTotals.days31, color: '#d97706', bg: '#fffbeb' },
              { label: '61–90 Days', val: ageTotals.days61, color: '#ea580c', bg: '#fff7ed' },
              { label: '>90 Days', val: ageTotals.days90,  color: '#dc2626', bg: '#fef2f2' },
              { label: 'Total Outstanding', val: ageTotals.total, color: '#1e3a5f', bg: '#eff6ff' },
            ].map(b => (
              <div key={b.label} style={{ background: b.bg, border: `1.5px solid ${b.color}33`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{b.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: b.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IndianRupee size={14}/>{f2(b.val)}
                </div>
              </div>
            ))}
          </div>

          {/* Ageing table */}
          <div className="page-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{ageType === 'customer' ? 'Customer' : 'Vendor'}</th>
                    <th style={{ textAlign: 'right' }}>0–30 Days</th>
                    <th style={{ textAlign: 'right' }}>31–60 Days</th>
                    <th style={{ textAlign: 'right' }}>61–90 Days</th>
                    <th style={{ textAlign: 'right' }}>&gt;90 Days</th>
                    <th style={{ textAlign: 'right' }}>Total Outstanding</th>
                    <th>Oldest Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {ageRows.length === 0 ? (
                    <tr><td colSpan={7} className="empty-cell">No outstanding {ageType === 'customer' ? 'receivables' : 'payables'}</td></tr>
                  ) : ageRows.map((r, i) => {
                    const isRed    = r.days90 > 0;
                    const isAmber  = !isRed && r.days61 > 0;
                    const rowBg    = isRed ? '#fff8f8' : isAmber ? '#fffcf5' : 'transparent';
                    return (
                      <tr key={i} style={{ background: rowBg }}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.party}</div>
                          {isRed && <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>⚠ Severely Overdue</div>}
                          {isAmber && !isRed && <div style={{ fontSize: 10, color: '#d97706', fontWeight: 700, marginTop: 2 }}>⏳ Overdue</div>}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.current > 0 ? '#16a34a' : 'var(--text-muted)' }}>{r.current > 0 ? f2(r.current) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days31 > 0 ? '#d97706' : 'var(--text-muted)' }}>{r.days31 > 0 ? f2(r.days31) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days61 > 0 ? '#ea580c' : 'var(--text-muted)' }}>{r.days61 > 0 ? f2(r.days61) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days90 > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: r.days90 > 0 ? 800 : 400 }}>{r.days90 > 0 ? f2(r.days90) : '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>₹{f2(r.total)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.oldestDate}</td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  {ageRows.length > 0 && (
                    <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #e2e8f0' }}>
                      <td style={{ fontSize: 13 }}>TOTAL</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{f2(ageTotals.current)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{f2(ageTotals.days31)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{f2(ageTotals.days61)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>₹{f2(ageTotals.days90)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 14 }}>₹{f2(ageTotals.total)}</td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: MARGIN REPORT
          ════════════════════════════════════════════════════════ */}
      {tab === 'margin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Net Revenue', val: marginTotals.revenue, color: '#2563eb', bg: '#eff6ff' },
              { label: 'Net Cost', val: marginTotals.cost, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Gross Margin ₹', val: marginTotals.margin, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Avg Margin %', val: null, pctVal: marginTotals.avgPct, color: marginTotals.avgPct >= 20 ? '#16a34a' : marginTotals.avgPct >= 10 ? '#d97706' : '#dc2626', bg: '#f8fafc' },
            ].map((b, i) => (
              <div key={i} style={{ background: b.bg, border: `1.5px solid ${b.color}33`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{b.label}</div>
                {b.val !== null
                  ? <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: b.color, display: 'flex', alignItems: 'center', gap: 2 }}><IndianRupee size={14}/>{f2(b.val)}</div>
                  : <div style={{ fontSize: 22, fontWeight: 900, color: b.color }}>{b.pctVal !== undefined ? `${b.pctVal.toFixed(1)}%` : '—'}</div>
                }
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, fontSize: 12, flexWrap: 'wrap' }}>
            {[['#16a34a','#d1fae5','≥ 20% — Good margin'],['#d97706','#fef3c7','10–19% — Watch'],['#dc2626','#fecaca','< 10% — Poor margin']].map(([c, bg, t]) => (
              <span key={t} style={{ background: bg, color: c, padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{t}</span>
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Link a Purchase Invoice in Purchases page to see cost data</span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input value={marginSearch} onChange={e => setMarginSearch(e.target.value)}
              placeholder="Search invoice or customer…"
              style={{ ...INP, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}/>
          </div>

          {/* Margin table */}
          <div className="page-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Sale Value</th>
                    <th style={{ textAlign: 'right' }}>Sales DN</th>
                    <th style={{ textAlign: 'right' }}>Net Revenue</th>
                    <th style={{ textAlign: 'right' }}>Purchase Cost</th>
                    <th style={{ textAlign: 'right' }}>Purch DN</th>
                    <th style={{ textAlign: 'right' }}>Net Cost</th>
                    <th style={{ textAlign: 'right' }}>Margin ₹</th>
                    <th style={{ textAlign: 'center' }}>Margin %</th>
                    <th>Linked PI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMargin.length === 0 ? (
                    <tr><td colSpan={12} className="empty-cell">No sales invoices yet</td></tr>
                  ) : filteredMargin.map(r => {
                    const isWarn  = r.marginPct >= 10 && r.marginPct < 20;
                    const isBad   = r.marginPct < 10;
                    const rowBg   = isBad && r.purchaseCost > 0 ? '#fff8f8' : isWarn && r.purchaseCost > 0 ? '#fffcf5' : 'transparent';
                    return (
                      <tr key={r.salesInvoiceId} style={{ background: rowBg }}>
                        <td style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: 12 }}>{r.invoiceNo}</td>
                        <td style={{ fontWeight: 600 }}>{r.customer}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(r.saleSubtotal)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.saleDnDeducted > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                          {r.saleDnDeducted > 0 ? `−${f2(r.saleDnDeducted)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{f2(r.netRevenue)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.purchaseCost > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                          {r.purchaseCost > 0 ? f2(r.purchaseCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.purchaseDnRecovered > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                          {r.purchaseDnRecovered > 0 ? `+${f2(r.purchaseDnRecovered)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.netCost > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                          {r.netCost > 0 ? f2(r.netCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: r.grossMargin >= 0 ? '#16a34a' : '#dc2626' }}>
                          {f2(r.grossMargin)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {r.purchaseCost > 0
                            ? <MarginBadge pct={r.marginPct}/>
                            : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Link PI</span>
                          }
                        </td>
                        <td>
                          {r.linkedPurchaseInvoiceNo
                            ? <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={10}/>{r.linkedPurchaseInvoiceNo}</span>
                            : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals */}
                  {filteredMargin.length > 0 && (
                    <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan={3} style={{ fontSize: 13 }}>TOTAL ({filteredMargin.length} invoices)</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(filteredMargin.reduce((s,r)=>s+r.saleSubtotal,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>−{f2(filteredMargin.reduce((s,r)=>s+r.saleDnDeducted,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(marginTotals.revenue)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>{f2(filteredMargin.reduce((s,r)=>s+r.purchaseCost,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a' }}>{f2(filteredMargin.reduce((s,r)=>s+r.purchaseDnRecovered,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>{f2(marginTotals.cost)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontSize: 14 }}>{f2(marginTotals.margin)}</td>
                      <td style={{ textAlign: 'center' }}><MarginBadge pct={marginTotals.avgPct}/></td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
