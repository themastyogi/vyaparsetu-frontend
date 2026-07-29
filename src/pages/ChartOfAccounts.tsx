/**
 * ChartOfAccounts.tsx
 * Full Chart of Accounts manager:
 *   • View all accounts grouped by type
 *   • Add / Edit / Delete custom accounts
 *   • Reset to standard 60-account Indian COA
 *   • Shows live balance from posted JEs
 */
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Check, RefreshCw, Search } from 'lucide-react';
import {
  useAccounting,
  type Account,
  type AccountType,
  type AccountGroup,
} from '../hooks/useAccounting';
import './Parties.css';

// ── Type config ───────────────────────────────────────────────────
const TYPE_META: Record<AccountType, { label: string; color: string; bg: string }> = {
  Asset:     { label: 'Asset',     color: '#60A5FA', bg: 'rgba(59,130,246,0.14)'  },
  Liability: { label: 'Liability', color: '#F87171', bg: 'rgba(239,68,68,0.14)'   },
  Equity:    { label: 'Equity',    color: '#C084FC', bg: 'rgba(168,85,247,0.14)'  },
  Income:    { label: 'Income',    color: '#34D399', bg: 'rgba(16,185,129,0.14)'  },
  Expense:   { label: 'Expense',  color: '#FB923C', bg: 'rgba(251,146,60,0.14)'  },
};
const ALL_TYPES: AccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

// ── Group options per type ────────────────────────────────────────
const GROUP_OPTIONS: Record<AccountType, AccountGroup[]> = {
  Asset:     ['Current Assets', 'Fixed Assets', 'Other Assets'],
  Liability: ['Current Liabilities', 'Long-term Liabilities'],
  Equity:    ['Capital & Reserves'],
  Income:    ['Revenue', 'Other Income'],
  Expense:   ['Cost of Goods Sold', 'Operating Expenses', 'Finance Costs', 'Depreciation'],
};

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Balance color helper ──────────────────────────────────────────
function balColor(balance: number, type: AccountType) {
  if (balance === 0) return 'var(--text-muted)';
  // Assets/Expenses: Dr balance (positive) is normal
  if (type === 'Asset' || type === 'Expense') return balance > 0 ? '#10B981' : '#F87171';
  // Liabilities/Equity/Income: Cr balance (negative) is normal
  return balance < 0 ? '#10B981' : '#F87171';
}
function balDisplay(balance: number, type: AccountType) {
  if (balance === 0) return '—';
  const isNormal = (type === 'Asset' || type === 'Expense') ? balance > 0 : balance < 0;
  const abs = f2(Math.abs(balance));
  const tag = balance > 0 ? 'Dr' : 'Cr';
  return `${abs} ${tag}${isNormal ? '' : ' ⚠'}`;
}

export default function ChartOfAccounts() {
  const { coa, addAccount, updateAccount, deleteAccount, resetCOA, getGeneralLedger } = useAccounting();

  const gl       = useMemo(() => getGeneralLedger(), [getGeneralLedger, coa]);
  const balMap   = useMemo(() => Object.fromEntries(gl.map(a => [a.account, a.balance])), [gl]);

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState<AccountType | 'All'>('All');
  const [showForm,    setShowForm]    = useState(false);
  const [editCode,    setEditCode]    = useState<string | null>(null);
  const [deleteConf,  setDeleteConf]  = useState<string | null>(null);
  const [resetConf,   setResetConf]   = useState(false);
  const [form, setForm] = useState<{ code: string; name: string; type: AccountType; group: AccountGroup }>({
    code: '', name: '', type: 'Expense', group: 'Operating Expenses',
  });
  const [formErr, setFormErr] = useState('');

  const filtered = useMemo(() =>
    coa
      .filter(a => typeFilter === 'All' || a.type === typeFilter)
      .filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [coa, typeFilter, search]
  );

  // Grouped view
  const grouped = useMemo(() => {
    const map = new Map<AccountType, Account[]>();
    for (const type of ALL_TYPES) map.set(type, []);
    for (const a of filtered) map.get(a.type)!.push(a);
    return map;
  }, [filtered]);

  const stats = useMemo(() => Object.fromEntries(ALL_TYPES.map(t => [t, coa.filter(a => a.type === t).length])), [coa]);

  const openAdd = () => {
    setForm({ code: '', name: '', type: 'Expense', group: 'Operating Expenses' });
    setFormErr(''); setEditCode(null); setShowForm(true);
  };
  const openEdit = (a: Account) => {
    setForm({ code: a.code, name: a.name, type: a.type, group: a.group });
    setFormErr(''); setEditCode(a.code); setShowForm(true);
  };

  const handleTypeChange = (t: AccountType) => {
    setForm(f => ({ ...f, type: t, group: GROUP_OPTIONS[t][0] }));
  };

  const validate = () => {
    if (!form.code.trim())   return 'Account code required';
    if (!form.name.trim())   return 'Account name required';
    if (!/^\d+$/.test(form.code.trim())) return 'Code must be numeric';
    if (!editCode && coa.some(a => a.code === form.code.trim())) return 'Code already exists';
    return '';
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setFormErr(err); return; }
    if (editCode) {
      updateAccount(editCode, { name: form.name.trim(), type: form.type, group: form.group });
    } else {
      addAccount({ code: form.code.trim(), name: form.name.trim(), type: form.type, group: form.group });
    }
    setShowForm(false);
  };

  const handleDownloadOBTemplate = () => {
    const csvContent = "Name,Category,Opening Balance (₹),Type\nSahil Trader,Party,50000.00,Cr\nRavi Enterprises,Party,120000.00,Dr\nHDFC Bank - A/C 8234,Bank,250000.00,Dr\nOffice Furniture & Fixtures,GL,75000.00,Dr\nCapital Account,GL,445000.00,Cr\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Opening_Balances_Template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadOB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      const lines = text.split('\n');
      let partyUpdated = 0, bankUpdated = 0, glUpdated = 0;

      const parties = JSON.parse(localStorage.getItem('vs_parties') || '[]');
      const banks = JSON.parse(localStorage.getItem('vs_bank_accounts') || '[]');
      const coaList = JSON.parse(localStorage.getItem('vs_coa') || '[]');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 3) continue;

        const name = parts[0].trim();
        const category = parts[1].trim().toLowerCase();
        const amount = parseFloat(parts[2].trim()) || 0;
        const balType = (parts[3]?.trim().toUpperCase() === 'DR' ? 'Dr' : 'Cr') as 'Dr' | 'Cr';

        if (category === 'party') {
          const norm = (s: string) => (s || '').toLowerCase().trim().replace(/s$/, '').replace(/[^a-z0-9]/g, '');
          const p = parties.find((x: any) => norm(x.name) === norm(name));
          if (p) {
            p.openingBalance = amount;
            p.openingBalanceType = balType;
            partyUpdated++;
          }
        } else if (category === 'bank') {
          const b = banks.find((x: any) => x.bankName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(x.bankName.toLowerCase()));
          if (b) {
            b.openingBalance = amount;
            bankUpdated++;
          }
        } else {
          const a = coaList.find((x: any) => x.name.toLowerCase() === name.toLowerCase() || x.code === name);
          if (a) {
            a.openingBalance = amount;
            a.openingBalanceType = balType;
            glUpdated++;
          }
        }
      }

      localStorage.setItem('vs_parties', JSON.stringify(parties));
      localStorage.setItem('vs_bank_accounts', JSON.stringify(banks));
      localStorage.setItem('vs_coa', JSON.stringify(coaList));
      window.dispatchEvent(new Event('storage'));

      alert(`🎉 Opening Balances Batch Upload Complete!\n\n• ${partyUpdated} Party Opening Balances updated\n• ${bankUpdated} Bank Account Opening Balances updated\n• ${glUpdated} G/L Account Opening Balances updated`);
      window.location.reload();
    };
    reader.readAsText(file);
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 8,
    border: '1.5px solid var(--border-default)',
    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={20} style={{ color: 'var(--brand-primary)' }}/> Chart of Accounts
          </h1>
          <p className="page-sub">{coa.length} accounts · Add your own or reset to the standard Indian Business COA</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-action btn-action-ghost" onClick={handleDownloadOBTemplate} title="Download sample template for batch uploading Opening Balances">
            📄 Download OB Template
          </button>
          <label className="btn-action btn-action-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
            📤 Upload Opening Balances (CSV/Excel)
            <input type="file" accept=".csv,.txt,.json,.xlsx" onChange={handleUploadOB} style={{ display: 'none' }}/>
          </label>
          <button className="btn-action btn-action-secondary" onClick={() => setResetConf(true)}>
            <RefreshCw size={14}/> Reset to Standard
          </button>
          <button className="btn-action btn-action-primary" onClick={openAdd}>
            <Plus size={14}/> Add Account
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        {ALL_TYPES.map(t => {
          const m = TYPE_META[t];
          return (
            <div key={t} onClick={() => setTypeFilter(prev => prev === t ? 'All' : t)}
              style={{ background: typeFilter === t ? m.bg : 'var(--bg-elevated)', border: `1.5px solid ${typeFilter === t ? m.color : 'var(--border-subtle)'}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', transition: 'all 0.15s', minWidth: 110 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>{stats[t]}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>accounts</div>
            </div>
          );
        })}
        <div onClick={() => setTypeFilter('All')}
          style={{ background: typeFilter === 'All' ? 'rgba(37,99,235,0.14)' : 'var(--bg-elevated)', border: `1.5px solid ${typeFilter === 'All' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', transition: 'all 0.15s', minWidth: 90 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ALL</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>{coa.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search" style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input type="text" placeholder="Search by code or name…" className="toolbar-search-input"
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }}/>
        </div>
      </div>

      {/* Table — grouped by type */}
      {ALL_TYPES.filter(t => typeFilter === 'All' || typeFilter === t).map(type => {
        const accounts = grouped.get(type) ?? [];
        if (accounts.length === 0 && typeFilter !== 'All') return null;
        const m = TYPE_META[type];
        return (
          <div key={type} className="page-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            {/* Group header */}
            <div style={{ background: m.bg, borderBottom: `1px solid var(--border-subtle)`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: m.color }}>{m.label} Accounts</span>
              <span style={{ fontSize: 11, background: m.bg, border: `1px solid ${m.color}44`, color: m.color, borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>{accounts.length}</span>
            </div>
            {accounts.length === 0 ? (
              <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--text-muted)' }}>No {type} accounts. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Add one →</button></div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Code</th>
                      <th>Account Name</th>
                      <th>Group</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th style={{ width: 130 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(a => {
                      const bal = balMap[a.name] ?? 0;
                      return (
                        <tr key={a.code}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>{a.code}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>
                              {a.group}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: balColor(bal, a.type) }}>
                            {balDisplay(bal, a.type)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button className="btn-action btn-action-ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => openEdit(a)}>
                                <Pencil size={12}/> Edit
                              </button>
                              {deleteConf === a.code ? (
                                <>
                                  <button className="btn-action btn-action-ghost" style={{ padding: '3px 9px', fontSize: 12, color: '#F87171', borderColor: '#F87171' }} onClick={() => { deleteAccount(a.code); setDeleteConf(null); }}>
                                    <Check size={12}/>
                                  </button>
                                  <button className="btn-action btn-action-ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => setDeleteConf(null)}>
                                    <X size={12}/>
                                  </button>
                                </>
                              ) : (
                                <button className="btn-action btn-action-ghost" style={{ padding: '3px 9px', fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setDeleteConf(a.code)}>
                                  <Trash2 size={12}/>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editCode ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            {formErr && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13 }}>
                {formErr}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Code + Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Code *</label>
                  <input placeholder="e.g. 6200" disabled={!!editCode} value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={{ ...inp, opacity: editCode ? 0.6 : 1 }}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Account Name *</label>
                  <input placeholder="e.g. Printing Expenses" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp}/>
                </div>
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Account Type *</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_TYPES.map(t => {
                    const m = TYPE_META[t];
                    return (
                      <button key={t} onClick={() => handleTypeChange(t)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${form.type === t ? m.color : 'var(--border-default)'}`, background: form.type === t ? m.bg : 'var(--bg-elevated)', color: form.type === t ? m.color : 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Group / Sub-category *</label>
                <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value as AccountGroup }))} style={inp}>
                  {GROUP_OPTIONS[form.type].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  Group determines where this account appears in Balance Sheet / P&L
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
              <button className="btn-action btn-action-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-action btn-action-primary" onClick={handleSave}>
                <Check size={14}/> {editCode ? 'Update' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Confirmation ── */}
      {resetConf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '32px', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>Reset Chart of Accounts?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              This will replace all accounts with the standard <b>60-account Indian Business COA</b>.<br/>
              Journal entries and transactions will be <b>unaffected</b>, but any custom accounts will be removed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-action btn-action-secondary" onClick={() => setResetConf(false)}>Cancel</button>
              <button className="btn-action btn-action-primary" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}
                onClick={() => { resetCOA(); setResetConf(false); }}>
                <RefreshCw size={14}/> Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
