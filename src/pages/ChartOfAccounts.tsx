import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Check } from 'lucide-react';
import { useAccounting, type Account, type AccountType } from '../hooks/useAccounting';
import './Parties.css';

const TYPE_COLORS: Record<AccountType, { bg: string; color: string }> = {
  Asset:     { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
  Liability: { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  Income:    { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb' },
  Expense:   { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
};

const ACCOUNT_TYPES: AccountType[] = ['Asset', 'Liability', 'Income', 'Expense'];

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ChartOfAccounts() {
  const { coa, addAccount, updateAccount, deleteAccount, getGeneralLedger } = useAccounting();
  const gl = getGeneralLedger();
  const balanceMap = Object.fromEntries(gl.map(a => [a.account, a.balance]));

  const [showForm, setShowForm]   = useState(false);
  const [editCode, setEditCode]   = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'All'>('All');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ code: '', name: '', type: 'Asset' as AccountType });
  const [formErr, setFormErr] = useState<string>('');

  const filtered = coa
    .filter(a => typeFilter === 'All' || a.type === typeFilter)
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  const openAdd = () => {
    setForm({ code: '', name: '', type: 'Asset' });
    setFormErr('');
    setEditCode(null);
    setShowForm(true);
  };

  const openEdit = (acct: Account) => {
    setForm({ code: acct.code, name: acct.name, type: acct.type });
    setFormErr('');
    setEditCode(acct.code);
    setShowForm(true);
  };

  const validateForm = () => {
    if (!form.code.trim()) return 'Account code is required.';
    if (!form.name.trim()) return 'Account name is required.';
    if (!/^\d+$/.test(form.code.trim())) return 'Account code must be numeric.';
    if (editCode === null && coa.some(a => a.code === form.code.trim())) return 'Account code already exists.';
    return '';
  };

  const handleSave = () => {
    const err = validateForm();
    if (err) { setFormErr(err); return; }
    if (editCode !== null) {
      updateAccount(editCode, { name: form.name.trim(), type: form.type });
    } else {
      addAccount({ code: form.code.trim(), name: form.name.trim(), type: form.type });
    }
    setShowForm(false);
  };

  const handleDelete = (code: string) => {
    deleteAccount(code);
    setDeleteConfirm(null);
  };

  const totals = {
    Asset:     filtered.filter(a => a.type === 'Asset').length,
    Liability: filtered.filter(a => a.type === 'Liability').length,
    Income:    filtered.filter(a => a.type === 'Income').length,
    Expense:   filtered.filter(a => a.type === 'Expense').length,
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} style={{ color: 'var(--brand-primary)' }} /> Chart of Accounts
          </h1>
          <p className="page-sub">Master list of all ledger accounts · {coa.length} accounts</p>
        </div>
        <button className="btn-action btn-action-primary" onClick={openAdd}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {/* Summary */}
      <div className="party-summary">
        {(Object.entries(totals) as [AccountType, number][]).map(([type]) => (
          <div key={type} className="summary-card" style={{ borderLeft: `4px solid ${TYPE_COLORS[type].color}` }}>
            <div className="summary-val" style={{ color: TYPE_COLORS[type].color }}>{coa.filter(a => a.type === type).length}</div>
            <div className="summary-lbl">{type} Accounts</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <input
            type="text" placeholder="Search by code or name…"
            className="toolbar-search-input"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
        <div className="filter-tabs">
          {(['All', 'Asset', 'Liability', 'Income', 'Expense'] as const).map(t => (
            <button
              key={t}
              className={`filter-tab ${typeFilter === t ? 'filter-tab-active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Current Balance (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">No accounts found</td></tr>
              ) : (
                filtered.map(acct => {
                  const bal = balanceMap[acct.name] ?? 0;
                  const tc  = TYPE_COLORS[acct.type];
                  return (
                    <tr key={acct.code}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                          {acct.code}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{acct.name}</span>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: tc.bg, color: tc.color }}>
                          {acct.type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: bal < 0 ? '#ef4444' : bal > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {bal !== 0 ? (bal < 0 ? `(${f2(Math.abs(bal))})` : f2(bal)) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-action btn-action-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(acct)}>
                            <Pencil size={13} /> Edit
                          </button>
                          {deleteConfirm === acct.code ? (
                            <>
                              <button className="btn-action btn-action-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(acct.code)}>
                                <Check size={13} /> Confirm
                              </button>
                              <button className="btn-action btn-action-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm(null)}>
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <button className="btn-action btn-action-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setDeleteConfirm(acct.code)}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface-primary)', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editCode ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {formErr && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13 }}>
                {formErr}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Account Code *</label>
                <input
                  type="text" placeholder="e.g. 7000"
                  disabled={!!editCode}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: editCode ? 'var(--surface-secondary)' : 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Account Name *</label>
                <input
                  type="text" placeholder="e.g. Office Expenses"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Account Type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
              <button className="btn-action btn-action-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-action btn-action-primary" onClick={handleSave}>
                <Check size={15} /> {editCode ? 'Update' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
