/**
 * Reports.tsx  v3
 * Uses only CSS variables → works in both light and dark theme.
 * Tabs: Trial Balance · General Ledger · Journals · Party Ledger · Ageing · Margin
 */
import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, BookOpen, List, Scale, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Users, Clock, TrendingUp, Search,
  IndianRupee, Link2,
} from 'lucide-react';
import { useAccounting, type JournalEntry } from '../hooks/useAccounting';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = 'trial-balance' | 'general-ledger' | 'journal-entries' | 'party-ledger' | 'ageing' | 'margin';

// ── Shared inline-style helpers using CSS variables ───────────────
const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '20px 22px',
};
const inp: React.CSSProperties = {
  padding: '8px 11px',
  borderRadius: 8,
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const th: React.CSSProperties = {
  padding: '9px 12px', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', background: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
  textAlign: 'left',
};
const td: React.CSSProperties = {
  padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)', fontSize: 13,
};

// ── Margin badge ──────────────────────────────────────────────────
function MarginBadge({ pct }: { pct: number }) {
  const color = pct >= 20 ? '#10B981' : pct >= 10 ? '#FBBF24' : '#F87171';
  const bg    = pct >= 20 ? 'rgba(16,185,129,0.14)' : pct >= 10 ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.14)';
  return (
    <span style={{ background: bg, color, fontWeight: 800, fontSize: 12, padding: '3px 9px', borderRadius: 20, fontFamily: 'monospace' }}>
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ── Type-badge for entry types ────────────────────────────────────
function EntryBadge({ type }: { type: string }) {
  const colors: Record<string, [string, string]> = {
    'Sales Invoice':      ['rgba(59,130,246,0.15)','#60A5FA'],
    'Sales Debit Note':   ['rgba(239,68,68,0.15)','#F87171'],
    'Purchase Invoice':   ['rgba(168,85,247,0.15)','#C084FC'],
    'Purchase Debit Note':['rgba(16,185,129,0.15)','#34D399'],
  };
  const [bg, fg] = colors[type] ?? ['rgba(100,116,139,0.15)','#94A3B8'];
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: bg, color: fg, fontWeight: 700, whiteSpace: 'nowrap' }}>{type}</span>;
}

// ── Account type badge ────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const m: Record<string, [string,string]> = {
    Asset:   ['rgba(59,130,246,0.14)','#60A5FA'],
    Income:  ['rgba(16,185,129,0.14)','#34D399'],
    Expense: ['rgba(251,146,60,0.14)','#FB923C'],
    Liability:['rgba(168,85,247,0.14)','#C084FC'],
  };
  const [bg, fg] = m[type] ?? ['rgba(100,116,139,0.14)','#94A3B8'];
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: bg, color: fg, fontWeight: 700 }}>{type}</span>;
}

// ── Running balance cell ──────────────────────────────────────────
function BalCell({ v }: { v: number }) {
  const color = v >= 0 ? '#10B981' : '#F87171';
  return (
    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color }}>
      {f2(Math.abs(v))}<span style={{ fontSize: 10, marginLeft: 3 }}>{v < 0 ? 'Cr' : 'Dr'}</span>
    </td>
  );
}

// ── Mono amount cell ──────────────────────────────────────────────
function AmtCell({ v, highlight }: { v: number; highlight?: string }) {
  return (
    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: v > 0 ? (highlight ?? 'var(--text-primary)') : 'var(--text-muted)' }}>
      {v > 0 ? f2(v) : '—'}
    </td>
  );
}

export default function Reports() {
  const {
    getTrialBalance, getGeneralLedger, getAccountLedger,
    journalEntries, getPartyLedger, getAgeing, getMarginReport,
    salesInvoices, purchaseInvoices, debitNotes,
  } = useAccounting();

  const [tab, setTab]               = useState<Tab>('trial-balance');
  const [glDrill, setGLDrill]       = useState<string | null>(null);
  const [expandedJE, setExpandedJE] = useState<string | null>(null);
  const [jeFilter, setJEFilter]     = useState('All');

  // Party Ledger
  const [plParty, setPlParty]   = useState('');
  const [plInput, setPlInput]   = useState('');
  const [plFrom,  setPlFrom]    = useState('');
  const [plTo,    setPlTo]      = useState('');
  const [plOpen,  setPlOpen]    = useState(false);

  // Ageing
  const [ageType,  setAgeType]  = useState<'customer'|'vendor'>('customer');
  const [ageAsOf,  setAgeAsOf]  = useState(new Date().toISOString().split('T')[0]);

  // Margin
  const [mSearch, setMSearch]   = useState('');

  // ── Computed ─────────────────────────────────────────────────
  const tb  = useMemo(() => getTrialBalance(),  [getTrialBalance,  journalEntries]);
  const gl  = useMemo(() => getGeneralLedger(), [getGeneralLedger, journalEntries]);

  const drillRows = useMemo(() =>
    glDrill ? getAccountLedger(glDrill) : [],
    [glDrill, getAccountLedger, journalEntries]
  );

  const jeTypes     = useMemo(() => ['All', ...Array.from(new Set(journalEntries.map(j => j.entryType)))], [journalEntries]);
  const filteredJEs = journalEntries.filter(j => jeFilter === 'All' || j.entryType === jeFilter);
  const jeGroups    = useMemo(() => {
    const m = new Map<string, JournalEntry>();
    for (const je of filteredJEs) if (!m.has(je.id)) m.set(je.id, je);
    return Array.from(m.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredJEs]);

  // All unique party names across all documents
  const allParties = useMemo(() => {
    const s = new Set<string>();
    salesInvoices.forEach(si => s.add(si.customer));
    purchaseInvoices.forEach(pi => s.add(pi.vendorName));
    debitNotes.forEach(dn => s.add(dn.party));
    return Array.from(s).sort();
  }, [salesInvoices, purchaseInvoices, debitNotes]);

  const filteredParties = allParties.filter(p => p.toLowerCase().includes(plInput.toLowerCase())).slice(0, 12);

  const plRows = useMemo(() =>
    plParty ? getPartyLedger(plParty, plFrom || undefined, plTo || undefined) : [],
    [plParty, plFrom, plTo, getPartyLedger, salesInvoices, purchaseInvoices, debitNotes]
  );
  const plClosing = plRows.length > 0 ? plRows[plRows.length - 1].runningBalance : 0;

  const ageRows = useMemo(() => getAgeing(ageType, ageAsOf),
    [ageType, ageAsOf, getAgeing, salesInvoices, purchaseInvoices, debitNotes]
  );
  const ageTotal = useMemo(() => ({
    current: ageRows.reduce((s, r) => s + r.current, 0),
    days31:  ageRows.reduce((s, r) => s + r.days31,  0),
    days61:  ageRows.reduce((s, r) => s + r.days61,  0),
    days90:  ageRows.reduce((s, r) => s + r.days90,  0),
    total:   ageRows.reduce((s, r) => s + r.total,   0),
  }), [ageRows]);

  const marginRows = useMemo(() => getMarginReport(),
    [getMarginReport, salesInvoices, purchaseInvoices, debitNotes]
  );
  const filtMargin = marginRows.filter(r =>
    r.invoiceNo.toLowerCase().includes(mSearch.toLowerCase()) ||
    r.customer.toLowerCase().includes(mSearch.toLowerCase())
  );
  const mTotals = useMemo(() => ({
    revenue: filtMargin.reduce((s, r) => s + r.netRevenue, 0),
    cost:    filtMargin.reduce((s, r) => s + r.netCost,    0),
    margin:  filtMargin.reduce((s, r) => s + r.grossMargin,0),
    avgPct:  filtMargin.length ? filtMargin.reduce((s, r) => s + r.marginPct, 0) / filtMargin.length : 0,
  }), [filtMargin]);

  // ── Tab definitions ───────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'trial-balance',   label: 'Trial Balance',  icon: <Scale size={13}/> },
    { id: 'general-ledger',  label: 'General Ledger', icon: <BookOpen size={13}/> },
    { id: 'journal-entries', label: 'Journals',        icon: <List size={13}/> },
    { id: 'party-ledger',    label: 'Party Ledger',   icon: <Users size={13}/> },
    { id: 'ageing',          label: 'Ageing',          icon: <Clock size={13}/> },
    { id: 'margin',          label: 'Margin',          icon: <TrendingUp size={13}/> },
  ];

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={20} style={{ color: 'var(--brand-primary)' }}/> Financial Reports
          </h1>
          <p className="page-sub">Trial Balance · GL · Party Ledger · Ageing · Margin — live from transactions</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setGLDrill(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500, whiteSpace: 'nowrap',
              borderBottom: `2px solid ${tab === t.id ? 'var(--brand-primary)' : 'transparent'}`,
              marginBottom: -1,
              color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)',
              background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.15s',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TRIAL BALANCE
          ══════════════════════════════════════════════════ */}
      {tab === 'trial-balance' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Trial Balance</h2>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: tb.balanced ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
              color: tb.balanced ? '#10B981' : '#F87171',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {tb.balanced ? <><CheckCircle2 size={12}/> Balanced</> : <><AlertCircle size={12}/> Out of Balance</>}
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Code</th><th>Account</th><th>Type</th>
                  <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {tb.rows.length === 0
                  ? <tr><td colSpan={5} className="empty-cell">No transactions posted yet</td></tr>
                  : tb.rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.accountCode}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.account}</td>
                      <td><TypeBadge type={r.accountType}/></td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.debit > 0 ? 700 : 400, color: r.debit > 0 ? '#60A5FA' : 'var(--text-muted)' }}>
                        {r.debit > 0 ? f2(r.debit) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.credit > 0 ? 700 : 400, color: r.credit > 0 ? '#34D399' : 'var(--text-muted)' }}>
                        {r.credit > 0 ? f2(r.credit) : '—'}
                      </td>
                    </tr>
                  ))
                }
                {tb.rows.length > 0 && (
                  <tr style={{ background: 'var(--bg-elevated)', borderTop: '2px solid var(--border-default)' }}>
                    <td colSpan={3} style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', padding: '10px 12px' }}>TOTAL</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#60A5FA', padding: '10px 12px' }}>₹{f2(tb.totalDebit)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#34D399', padding: '10px 12px' }}>₹{f2(tb.totalCredit)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          GENERAL LEDGER
          ══════════════════════════════════════════════════ */}
      {tab === 'general-ledger' && (
        <div style={card}>
          {glDrill ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setGLDrill(null)}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ← Back
                </button>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{glDrill}</h2>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Entry Type</th><th>Reference</th><th>Party</th><th style={{ textAlign:'right' }}>Debit</th><th style={{ textAlign:'right' }}>Credit</th><th style={{ textAlign:'right' }}>Balance</th></tr></thead>
                  <tbody>
                    {drillRows.length === 0
                      ? <tr><td colSpan={7} className="empty-cell">No entries</td></tr>
                      : drillRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                          <td><EntryBadge type={r.entryType}/></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}>{r.relatedNo}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.party}</td>
                          <AmtCell v={r.line.debit} highlight="#60A5FA"/>
                          <AmtCell v={r.line.credit} highlight="#34D399"/>
                          <BalCell v={r.runningBalance}/>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>General Ledger — click an account to drill down</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Code</th><th>Account</th><th>Type</th><th style={{ textAlign:'right' }}>Total Debit</th><th style={{ textAlign:'right' }}>Total Credit</th><th style={{ textAlign:'right' }}>Balance</th></tr></thead>
                  <tbody>
                    {gl.length === 0
                      ? <tr><td colSpan={6} className="empty-cell">No transactions yet</td></tr>
                      : gl.map((a, i) => (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setGLDrill(a.account)}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{a.accountCode}</td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{a.account}</td>
                          <td><TypeBadge type={a.accountType}/></td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#60A5FA' }}>{f2(a.totalDebit)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#34D399' }}>{f2(a.totalCredit)}</td>
                          <BalCell v={a.balance}/>
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

      {/* ══════════════════════════════════════════════════
          JOURNAL ENTRIES
          ══════════════════════════════════════════════════ */}
      {tab === 'journal-entries' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Journal Entries ({jeGroups.length})</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {jeTypes.map(t => (
                <button key={t} onClick={() => setJEFilter(t)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: jeFilter === t ? 'var(--brand-primary)' : 'var(--border-default)', background: jeFilter === t ? 'var(--brand-primary)' : 'var(--bg-elevated)', color: jeFilter === t ? '#fff' : 'var(--text-secondary)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jeGroups.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No journal entries yet</div>
              : jeGroups.map(je => (
                <div key={je.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }}
                    onClick={() => setExpandedJE(expandedJE === je.id ? null : je.id)}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{je.date}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{je.relatedNo}</span>
                      <EntryBadge type={je.entryType}/>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{je.party}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      {expandedJE === je.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </span>
                  </div>
                  {expandedJE === je.id && (
                    <div style={{ padding: '10px 14px', background: 'var(--bg-card)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Account</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Debit (₹)</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Credit (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {je.lines.map((line, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{line.account}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: line.debit > 0 ? '#60A5FA' : 'var(--text-muted)' }}>
                                {line.debit > 0 ? f2(line.debit) : '—'}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: line.credit > 0 ? '#34D399' : 'var(--text-muted)' }}>
                                {line.credit > 0 ? f2(line.credit) : '—'}
                              </td>
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

      {/* ══════════════════════════════════════════════════
          PARTY LEDGER
          ══════════════════════════════════════════════════ */}
      {tab === 'party-ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter bar */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
              <div>
                <label style={lbl}>Party Name *</label>
                <div style={{ position: 'relative' }}>
                  <input value={plInput}
                    onChange={e => { setPlInput(e.target.value); setPlOpen(true); }}
                    onFocus={() => setPlOpen(true)}
                    onBlur={() => setTimeout(() => setPlOpen(false), 170)}
                    placeholder="Search customer or vendor…"
                    style={{ ...inp, width: '100%', boxSizing: 'border-box', fontWeight: 600 }}/>
                  {plOpen && filteredParties.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 9, boxShadow: '0 10px 32px rgba(0,0,0,0.35)', maxHeight: 220, overflowY: 'auto' }}>
                      {filteredParties.map(p => (
                        <div key={p} onMouseDown={() => { setPlParty(p); setPlInput(p); setPlOpen(false); }}
                          style={{ padding: '9px 13px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-primary)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={lbl}>From Date</label>
                <input type="date" value={plFrom} onChange={e => setPlFrom(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={lbl}>To Date</label>
                <input type="date" value={plTo} onChange={e => setPlTo(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <button onClick={() => { setPlParty(''); setPlInput(''); setPlFrom(''); setPlTo(''); }}
                  style={{ ...inp, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {plParty ? (
            <div style={card}>
              {/* Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{plParty}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {plRows.length} transactions{plFrom || plTo ? ` · ${plFrom || '…'} → ${plTo || '…'}` : ' · All dates'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 16px', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Closing Balance</div>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: plClosing >= 0 ? '#10B981' : '#F87171', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <IndianRupee size={14}/>{f2(Math.abs(plClosing))} <span style={{ fontSize: 12 }}>{plClosing < 0 ? 'Cr' : 'Dr'}</span>
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
                    <tr style={{ background: 'var(--bg-elevated)', fontStyle: 'italic' }}>
                      <td colSpan={5} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px' }}>Opening Balance</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '8px 12px' }}>₹0.00 Dr</td>
                    </tr>
                    {plRows.length === 0
                      ? <tr><td colSpan={6} className="empty-cell">No transactions found for this party</td></tr>
                      : plRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                          <td><EntryBadge type={r.entryType}/></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-primary)', fontWeight: 700 }}>{r.refNo}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.debit > 0 ? 700 : 400, color: r.debit > 0 ? '#60A5FA' : 'var(--text-muted)' }}>
                            {r.debit > 0 ? f2(r.debit) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.credit > 0 ? 700 : 400, color: r.credit > 0 ? '#34D399' : 'var(--text-muted)' }}>
                            {r.credit > 0 ? f2(r.credit) : '—'}
                          </td>
                          <BalCell v={r.runningBalance}/>
                        </tr>
                      ))
                    }
                    {/* Closing row */}
                    {plRows.length > 0 && (
                      <tr style={{ background: 'var(--bg-elevated)', borderTop: '2px solid var(--border-default)' }}>
                        <td colSpan={3} style={{ fontSize: 13, fontWeight: 800, padding: '10px 12px', color: 'var(--text-primary)' }}>Closing Balance</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#60A5FA', padding: '10px 12px' }}>
                          ₹{f2(plRows.reduce((s, r) => s + r.debit, 0))}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#34D399', padding: '10px 12px' }}>
                          ₹{f2(plRows.reduce((s, r) => s + r.credit, 0))}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, padding: '10px 12px', color: plClosing >= 0 ? '#10B981' : '#F87171' }}>
                          ₹{f2(Math.abs(plClosing))} {plClosing < 0 ? 'Cr' : 'Dr'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ ...card, textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: 14 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Select a party to view their ledger</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>All customers and vendors with transactions are available</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          AGEING REPORT
          ══════════════════════════════════════════════════ */}
      {tab === 'ageing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={lbl}>Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['customer', 'vendor'] as const).map(t => (
                    <button key={t} onClick={() => setAgeType(t)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderColor: ageType === t ? 'var(--brand-primary)' : 'var(--border-default)', background: ageType === t ? 'var(--brand-primary)' : 'var(--bg-elevated)', color: ageType === t ? '#fff' : 'var(--text-secondary)' }}>
                      {t === 'customer' ? 'Customers' : 'Vendors'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>As of Date</label>
                <input type="date" value={ageAsOf} onChange={e => setAgeAsOf(e.target.value)} style={inp}/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', paddingBottom: 2 }}>
                Outstanding = Invoice − Debit Notes raised
              </div>
            </div>
          </div>

          {/* Bucket cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {([
              { label: '0–30 Days',       val: ageTotal.current, color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
              { label: '31–60 Days',      val: ageTotal.days31,  color: '#FBBF24', bg: 'rgba(245,158,11,0.12)'  },
              { label: '61–90 Days',      val: ageTotal.days61,  color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
              { label: '>90 Days',        val: ageTotal.days90,  color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
              { label: 'Total Outstanding',val: ageTotal.total,  color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
            ] as { label: string; val: number; color: string; bg: string }[]).map(b => (
              <div key={b.label} style={{ background: b.bg, border: `1.5px solid ${b.color}44`, borderRadius: 12, padding: '13px 15px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{b.label}</div>
                <div style={{ fontSize: 17, fontWeight: 900, fontFamily: 'monospace', color: b.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IndianRupee size={13}/>{f2(b.val)}
                </div>
              </div>
            ))}
          </div>

          {/* Ageing table */}
          <div style={card}>
            {ageRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No outstanding {ageType === 'customer' ? 'receivables' : 'payables'}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{ageType === 'customer' ? 'Customer' : 'Vendor'}</th>
                      <th style={{ textAlign: 'right' }}>0–30 Days</th>
                      <th style={{ textAlign: 'right' }}>31–60 Days</th>
                      <th style={{ textAlign: 'right' }}>61–90 Days</th>
                      <th style={{ textAlign: 'right' }}>&gt;90 Days</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Oldest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageRows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.party}</div>
                          {r.days90 > 0 && <div style={{ fontSize: 10, color: '#F87171', fontWeight: 700, marginTop: 2 }}>⚠ Severely Overdue</div>}
                          {r.days61 > 0 && r.days90 === 0 && <div style={{ fontSize: 10, color: '#FB923C', fontWeight: 700, marginTop: 2 }}>⏳ Overdue</div>}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.current > 0 ? '#10B981' : 'var(--text-muted)', fontWeight: r.current > 0 ? 700 : 400 }}>
                          {r.current > 0 ? f2(r.current) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days31 > 0 ? '#FBBF24' : 'var(--text-muted)', fontWeight: r.days31 > 0 ? 700 : 400 }}>
                          {r.days31 > 0 ? f2(r.days31) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days61 > 0 ? '#FB923C' : 'var(--text-muted)', fontWeight: r.days61 > 0 ? 700 : 400 }}>
                          {r.days61 > 0 ? f2(r.days61) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.days90 > 0 ? '#F87171' : 'var(--text-muted)', fontWeight: r.days90 > 0 ? 800 : 400 }}>
                          {r.days90 > 0 ? f2(r.days90) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)' }}>₹{f2(r.total)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.oldestDate}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr style={{ background: 'var(--bg-elevated)', borderTop: '2px solid var(--border-default)' }}>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)', padding: '10px 12px' }}>TOTAL</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#10B981', padding: '10px 12px' }}>₹{f2(ageTotal.current)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#FBBF24', padding: '10px 12px' }}>₹{f2(ageTotal.days31)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#FB923C', padding: '10px 12px' }}>₹{f2(ageTotal.days61)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#F87171', padding: '10px 12px' }}>₹{f2(ageTotal.days90)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#60A5FA', padding: '10px 12px' }}>₹{f2(ageTotal.total)}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MARGIN REPORT
          ══════════════════════════════════════════════════ */}
      {tab === 'margin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {([
              { label: 'Net Revenue', val: mTotals.revenue, color: '#60A5FA', bg: 'rgba(59,130,246,0.12)'  },
              { label: 'Net Cost',    val: mTotals.cost,    color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
              { label: 'Gross Margin',val: mTotals.margin,  color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
            ] as { label: string; val: number; color: string; bg: string }[]).map(b => (
              <div key={b.label} style={{ background: b.bg, border: `1.5px solid ${b.color}44`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{b.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: b.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IndianRupee size={13}/>{f2(b.val)}
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Avg Margin %</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: mTotals.avgPct >= 20 ? '#10B981' : mTotals.avgPct >= 10 ? '#FBBF24' : '#F87171' }}>
                {mTotals.avgPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
            {([
              ['rgba(16,185,129,0.14)','#10B981','≥ 20% — Good'],
              ['rgba(245,158,11,0.14)','#FBBF24','10–19% — Watch'],
              ['rgba(239,68,68,0.14)','#F87171','< 10% — Poor'],
            ] as [string,string,string][]).map(([bg, c, t]) => (
              <span key={t} style={{ background: bg, color: c, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{t}</span>
            ))}
            <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>Link a Purchase Invoice from the Purchases page to see cost & margin</span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
            <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder="Search invoice or customer…"
              style={{ ...inp, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}/>
          </div>

          {/* Margin table */}
          <div style={card}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th><th>Customer</th><th>Date</th>
                    <th style={{ textAlign: 'right' }}>Sale ₹</th>
                    <th style={{ textAlign: 'right' }}>Sales DN</th>
                    <th style={{ textAlign: 'right' }}>Net Rev</th>
                    <th style={{ textAlign: 'right' }}>Purch Cost</th>
                    <th style={{ textAlign: 'right' }}>Purch DN</th>
                    <th style={{ textAlign: 'right' }}>Net Cost</th>
                    <th style={{ textAlign: 'right' }}>Margin ₹</th>
                    <th style={{ textAlign: 'center' }}>Margin %</th>
                    <th>Linked PI</th>
                  </tr>
                </thead>
                <tbody>
                  {filtMargin.length === 0
                    ? <tr><td colSpan={12} className="empty-cell">No sales invoices yet</td></tr>
                    : filtMargin.map(r => (
                      <tr key={r.salesInvoiceId}>
                        <td style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: 12 }}>{r.invoiceNo}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.customer}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{f2(r.saleSubtotal)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.saleDnDeducted > 0 ? '#F87171' : 'var(--text-muted)' }}>
                          {r.saleDnDeducted > 0 ? `−${f2(r.saleDnDeducted)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#60A5FA' }}>{f2(r.netRevenue)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.purchaseCost > 0 ? '#FB923C' : 'var(--text-muted)' }}>
                          {r.purchaseCost > 0 ? f2(r.purchaseCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.purchaseDnRecovered > 0 ? '#10B981' : 'var(--text-muted)' }}>
                          {r.purchaseDnRecovered > 0 ? `+${f2(r.purchaseDnRecovered)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.netCost > 0 ? '#FB923C' : 'var(--text-muted)' }}>
                          {r.netCost > 0 ? f2(r.netCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: r.grossMargin >= 0 ? '#10B981' : '#F87171' }}>
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
                            ? <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#60A5FA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Link2 size={10}/>{r.linkedPurchaseInvoiceNo}</span>
                            : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))
                  }
                  {/* Totals */}
                  {filtMargin.length > 0 && (
                    <tr style={{ background: 'var(--bg-elevated)', borderTop: '2px solid var(--border-default)' }}>
                      <td colSpan={3} style={{ fontWeight: 800, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13 }}>
                        TOTAL ({filtMargin.length})
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, padding: '10px 12px', color: 'var(--text-primary)' }}>{f2(filtMargin.reduce((s,r)=>s+r.saleSubtotal,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, padding: '10px 12px', color: '#F87171' }}>−{f2(filtMargin.reduce((s,r)=>s+r.saleDnDeducted,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, padding: '10px 12px', color: '#60A5FA' }}>{f2(mTotals.revenue)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, padding: '10px 12px', color: '#FB923C' }}>{f2(filtMargin.reduce((s,r)=>s+r.purchaseCost,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, padding: '10px 12px', color: '#10B981' }}>{f2(filtMargin.reduce((s,r)=>s+r.purchaseDnRecovered,0))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, padding: '10px 12px', color: '#FB923C' }}>{f2(mTotals.cost)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, padding: '10px 12px', fontSize: 14, color: '#10B981' }}>{f2(mTotals.margin)}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}><MarginBadge pct={mTotals.avgPct}/></td>
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
