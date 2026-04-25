import { useState } from 'react';
import { Plus, Search, Download, Users, ChevronRight, CheckCircle } from 'lucide-react';
import './Parties.css';

type Party = {
  id: string; name: string; type: string; gstin: string;
  state: string; balance: number; balType: string; active: boolean;
};

const SAMPLE: Party[] = [
  { id: 'p1', name: 'Ravi Enterprises',   type: 'customer', gstin: '29AABCR1234F1ZS', state: 'Karnataka',    balance: 42000,  balType: 'receivable', active: true },
  { id: 'p2', name: 'Sahil Traders',      type: 'vendor',   gstin: '27AAACS2222B1Z5', state: 'Maharashtra',  balance: 18500,  balType: 'payable',    active: true },
  { id: 'p3', name: 'Metro Retail Co.',   type: 'both',     gstin: '07AAACM5678K1ZP', state: 'Delhi',        balance: 95000,  balType: 'receivable', active: true },
  { id: 'p4', name: 'Alpha Supplies',     type: 'vendor',   gstin: '24AAACA7890L1Z3', state: 'Gujarat',      balance: 0,      balType: 'nil',        active: true },
  { id: 'p5', name: 'Kumar & Sons',       type: 'vendor',   gstin: '09AAACK4567N1Z1', state: 'UP',           balance: 31000,  balType: 'payable',    active: false },
  { id: 'p6', name: 'Priya Medical Hub',  type: 'customer', gstin: '33AAACP1111M1ZQ', state: 'Tamil Nadu',   balance: 12400,  balType: 'receivable', active: true },
  { id: 'p7', name: 'Bharat Logistics',   type: 'both',     gstin: '06AAACB5432F1Z7', state: 'Haryana',      balance: 7800,   balType: 'payable',    active: true },
];

const TYPE_MAP: Record<string, { label: string; cls: string }> = {
  customer: { label: 'Customer', cls: 'tag-customer' },
  vendor:   { label: 'Vendor',   cls: 'tag-vendor' },
  both:     { label: 'Both',     cls: 'tag-both' },
};

const BAL_MAP: Record<string, string> = {
  receivable: 'bal-recv',
  payable:    'bal-pay',
  nil:        'bal-nil',
};

export default function Parties() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all'|'customer'|'vendor'|'both'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newParty, setNewParty] = useState({ name: '', gstin: '', type: 'customer', state: '' });
  const [saved, setSaved]     = useState(false);

  const filtered = SAMPLE
    .filter(p => filter === 'all' || p.type === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ||
                 p.gstin.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => { setShowAdd(false); setSaved(false); setNewParty({ name:'', gstin:'', type:'customer', state:'' }); }, 1200);
  };

  const totalRec = SAMPLE.filter(p => p.balType === 'receivable').reduce((s,p) => s+p.balance, 0);
  const totalPay = SAMPLE.filter(p => p.balType === 'payable').reduce((s,p) => s+p.balance, 0);

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Parties</h1>
          <p className="page-sub">Manage your customers, vendors, and business contacts</p>
        </div>
        <button id="add-party-btn" className="btn-action btn-action-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15}/> Add Party
        </button>
      </div>

      {/* Summary cards */}
      <div className="party-summary">
        <div id="summary-total" className="summary-card">
          <Users size={18} className="summary-icon"/>
          <div className="summary-val">{SAMPLE.length}</div>
          <div className="summary-lbl">Total Parties</div>
        </div>
        <div id="summary-receivable" className="summary-card summary-recv">
          <div className="summary-val">₹ {(totalRec/100000).toFixed(1)}L</div>
          <div className="summary-lbl">Total Receivable</div>
        </div>
        <div id="summary-payable" className="summary-card summary-pay">
          <div className="summary-val">₹ {(totalPay/1000).toFixed(0)}K</div>
          <div className="summary-lbl">Total Payable</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input
            id="party-search"
            type="text"
            placeholder="Search by name or GSTIN…"
            className="toolbar-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(['all','customer','vendor','both'] as const).map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button id="export-parties" className="icon-btn">
          <Download size={15}/> Export
        </button>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table" id="parties-table">
            <thead>
              <tr>
                <th>Party Name</th>
                <th>Type</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No parties found</td></tr>
              ) : filtered.map(p => (
              <tr key={p.id} id={p.id}>
                  <td data-label="Party">
                    <div className="party-name-cell">
                      <div className="party-avatar">{p.name.charAt(0)}</div>
                      <span className="txn-party">{p.name}</span>
                    </div>
                  </td>
                  <td data-label="Type"><span className={`type-tag ${TYPE_MAP[p.type].cls}`}>{TYPE_MAP[p.type].label}</span></td>
                  <td data-label="GSTIN" className="col-mobile-hide"><span className="mono">{p.gstin}</span></td>
                  <td data-label="State" className="col-mobile-hide"><span className="txn-date">{p.state}</span></td>
                  <td data-label="Balance">
                    <span className={`balance-cell ${BAL_MAP[p.balType]}`}>
                      {p.balance === 0 ? '—' : `₹ ${p.balance.toLocaleString('en-IN')}`}
                      {p.balance > 0 && <span className="bal-suffix">{p.balType === 'receivable' ? 'Dr' : 'Cr'}</span>}
                    </span>
                  </td>
                  <td data-label="Status">
                    {p.active
                      ? <span className="status-pill status-paid">Active</span>
                      : <span className="status-pill status-overdue">Inactive</span>
                    }
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
                <p>Party saved successfully!</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSave}>
                <div className="field-group">
                  <label className="field-label">Party Name *</label>
                  <input id="new-party-name" className="field-input" required value={newParty.name}
                    onChange={e => setNewParty(v => ({...v, name: e.target.value}))} placeholder="e.g. Ravi Enterprises"/>
                </div>
                <div className="modal-row">
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">GSTIN</label>
                    <input id="new-party-gstin" className="field-input" value={newParty.gstin}
                      onChange={e => setNewParty(v => ({...v, gstin: e.target.value.toUpperCase()}))}
                      placeholder="15-char GSTIN" maxLength={15}/>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">Type *</label>
                    <select id="new-party-type" className="field-input" value={newParty.type}
                      onChange={e => setNewParty(v => ({...v, type: e.target.value}))}>
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">State</label>
                  <input id="new-party-state" className="field-input" value={newParty.state}
                    onChange={e => setNewParty(v => ({...v, state: e.target.value}))} placeholder="e.g. Maharashtra"/>
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
