import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ChevronRight, CheckCircle, Mail, Clock } from 'lucide-react';
import { useMaster, type MasterParty } from '../hooks/useMaster';
import './Parties.css';

const TYPE_MAP: Record<string, { label: string; cls: string }> = {
  customer: { label: 'Customer', cls: 'tag-customer' },
  vendor:   { label: 'Vendor',   cls: 'tag-vendor' },
  both:     { label: 'Both',     cls: 'tag-both' },
};

export default function Parties() {
  const { t } = useTranslation();
  const { parties } = useMaster();
  const [partyList, setPartyList] = useState<MasterParty[]>(parties);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all'|'customer'|'vendor'|'both'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '', gstin: '', type: 'customer', state: '',
    email: '', paymentTerms: 'Net 30', priority: 'Medium' as 'High' | 'Medium' | 'Low'
  });
  const [saved, setSaved]     = useState(false);

  const filtered = partyList
    .filter(p => filter === 'all' || p.type === filter || p.type === 'both')
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ||
                 p.gstin.toLowerCase().includes(search.toLowerCase()) ||
                 (p.email && p.email.toLowerCase().includes(search.toLowerCase())));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MasterParty = {
      id: 'p_' + Date.now().toString(36),
      name: newParty.name,
      type: newParty.type,
      gstin: newParty.gstin,
      state: newParty.state,
      email: newParty.email,
      paymentTerms: newParty.paymentTerms,
      priority: newParty.priority,
    };
    const nextList = [created, ...partyList];
    setPartyList(nextList);
    localStorage.setItem('vs_parties', JSON.stringify(nextList));
    setSaved(true);
    setTimeout(() => {
      setShowAdd(false);
      setSaved(false);
      setNewParty({ name: '', gstin: '', type: 'customer', state: '', email: '', paymentTerms: 'Net 30', priority: 'Medium' });
    }, 1200);
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('parties.title', 'Parties Master')}</h1>
          <p className="page-sub">Manage Customers & Vendors · Inbound Email & Payment Terms</p>
        </div>
        <button id="add-party-btn" className="btn-action btn-action-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15}/> {t('parties.add', 'Add Party')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="party-summary">
        <div id="summary-total" className="summary-card">
          <div className="summary-val">{partyList.length}</div>
          <div className="summary-lbl">Total Parties</div>
        </div>
        <div id="summary-recv" className="summary-card">
          <div className="summary-val">{partyList.filter(p => p.type === 'customer' || p.type === 'both').length}</div>
          <div className="summary-lbl">Customers</div>
        </div>
        <div id="summary-pay" className="summary-card">
          <div className="summary-val">{partyList.filter(p => p.type === 'vendor' || p.type === 'both').length}</div>
          <div className="summary-lbl">Vendors</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={15} className="toolbar-search-icon"/>
          <input id="party-search" type="text" placeholder="Search by name, GSTIN, or email…"
            className="toolbar-search-input" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="filter-tabs">
          {(['all', 'customer', 'vendor', 'both'] as const).map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'customer' ? 'Customers' : f === 'vendor' ? 'Vendors' : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table id="parties-table" className="data-table">
            <thead>
              <tr>
                <th>Party Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Payment Terms</th>
                <th>Priority</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td data-label="Party Name">
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                  </td>
                  <td data-label="Type">
                    <span className={`party-tag ${TYPE_MAP[p.type]?.cls ?? ''}`}>
                      {TYPE_MAP[p.type]?.label ?? p.type}
                    </span>
                  </td>
                  <td data-label="Email">
                    {p.email ? (
                      <span style={{ fontSize: 12, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12}/>{p.email}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td data-label="Payment Terms">
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12}/>{p.paymentTerms ?? 'Net 30'}
                    </span>
                  </td>
                  <td data-label="Priority">
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: p.priority === 'High' ? 'rgba(239,68,68,0.14)' : p.priority === 'Low' ? 'rgba(100,116,139,0.14)' : 'rgba(245,158,11,0.14)',
                      color: p.priority === 'High' ? '#F87171' : p.priority === 'Low' ? '#94A3B8' : '#FBBF24',
                    }}>
                      {p.priority ?? 'Medium'}
                    </span>
                  </td>
                  <td data-label="GSTIN" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                    {p.gstin || 'UNREGISTERED'}
                  </td>
                  <td data-label="State" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {p.state}
                  </td>
                  <td>
                    <button className="row-action-btn" id={`view-${p.id}`} aria-label="View">
                      <ChevronRight size={15}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Party Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Party</h3>
              <button id="close-add-party" className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {saved ? (
              <div className="modal-success">
                <CheckCircle size={36} className="success-ico"/>
                <p>Party Saved Successfully!</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSave}>
                <div className="field-group">
                  <label className="field-label">Party Name *</label>
                  <input id="new-party-name" className="field-input" required value={newParty.name}
                    onChange={e => setNewParty(v => ({...v, name: e.target.value}))} placeholder="e.g. Acme Corporation"/>
                </div>

                <div className="modal-row">
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">Email Address (for Invoices &amp; Receipts)</label>
                    <input type="email" className="field-input" value={newParty.email}
                      onChange={e => setNewParty(v => ({...v, email: e.target.value}))}
                      placeholder="e.g. accounts@acme.com"/>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">Party Type *</label>
                    <select id="new-party-type" className="field-input" value={newParty.type}
                      onChange={e => setNewParty(v => ({...v, type: e.target.value}))}>
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="both">Both (Customer &amp; Vendor)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-row">
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">Payment Terms</label>
                    <select className="field-input" value={newParty.paymentTerms}
                      onChange={e => setNewParty(v => ({...v, paymentTerms: e.target.value}))}>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 45">Net 45 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">Priority Level (for Smart Payments)</label>
                    <select className="field-input" value={newParty.priority}
                      onChange={e => setNewParty(v => ({...v, priority: e.target.value as any}))}>
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Priority</option>
                      <option value="Low">⚪ Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="modal-row">
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">GSTIN</label>
                    <input id="new-party-gstin" className="field-input" value={newParty.gstin}
                      onChange={e => setNewParty(v => ({...v, gstin: e.target.value.toUpperCase()}))}
                      placeholder="15-digit GSTIN" maxLength={15}/>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">State</label>
                    <input id="new-party-state" className="field-input" value={newParty.state}
                      onChange={e => setNewParty(v => ({...v, state: e.target.value}))} placeholder="State name"/>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button id="save-party-btn" type="submit" className="btn-action btn-action-primary">Save Party</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
