import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <h1 className="page-title">{t('parties.title')}</h1>
          <p className="page-sub">{t('parties.subtitle')}</p>
        </div>
        <button id="add-party-btn" className="btn-action btn-action-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15}/> {t('parties.add')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="party-summary">
        <div id="summary-total" className="summary-card">
          <Users size={18} className="summary-icon"/>
          <div className="summary-val">{SAMPLE.length}</div>
          <div className="summary-lbl">{t('parties.total')}</div>
        </div>
        <div id="summary-receivable" className="summary-card summary-recv">
          <div className="summary-val">₹ {(totalRec/100000).toFixed(1)}L</div>
          <div className="summary-lbl">{t('parties.receivable')}</div>
        </div>
        <div id="summary-payable" className="summary-card summary-pay">
          <div className="summary-val">₹ {(totalPay/1000).toFixed(0)}K</div>
          <div className="summary-lbl">{t('parties.payable')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input
            id="party-search"
            type="text"
            placeholder={t('parties.search')}
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
              {t(`parties.${f}`, f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>
        <button id="export-parties" className="icon-btn">
          <Download size={15}/> {t('parties.export')}
        </button>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table" id="parties-table">
            <thead>
              <tr>
                <th>{t('parties.col_name')}</th>
                <th>{t('parties.col_type')}</th>
                <th>{t('parties.col_gstin')}</th>
                <th>{t('parties.col_state')}</th>
                <th>{t('parties.col_balance')}</th>
                <th>{t('parties.col_status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">{t('parties.empty')}</td></tr>
              ) : filtered.map(p => (
              <tr key={p.id} id={p.id}>
                  <td data-label={t('parties.col_name')}>
                    <div className="party-name-cell">
                      <div className="party-avatar">{p.name.charAt(0)}</div>
                      <span className="txn-party">{p.name}</span>
                    </div>
                  </td>
                  <td data-label={t('parties.col_type')}><span className={`type-tag ${TYPE_MAP[p.type].cls}`}>{t(`parties.${p.type}`, TYPE_MAP[p.type].label)}</span></td>
                  <td data-label={t('parties.col_gstin')} className="col-mobile-hide"><span className="mono">{p.gstin}</span></td>
                  <td data-label={t('parties.col_state')} className="col-mobile-hide"><span className="txn-date">{p.state}</span></td>
                  <td data-label={t('parties.col_balance')}>
                    <span className={`balance-cell ${BAL_MAP[p.balType]}`}>
                      {p.balance === 0 ? '—' : `₹ ${p.balance.toLocaleString('en-IN')}`}
                      {p.balance > 0 && <span className="bal-suffix">{p.balType === 'receivable' ? 'Dr' : 'Cr'}</span>}
                    </span>
                  </td>
                  <td data-label={t('parties.col_status')}>
                    {p.active
                      ? <span className="status-pill status-paid">{t('parties.active')}</span>
                      : <span className="status-pill status-overdue">{t('parties.inactive')}</span>
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
              <h3 className="modal-title">{t('parties.modal_title')}</h3>
              <button id="close-add-party" className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {saved ? (
              <div className="modal-success">
                <CheckCircle size={36} className="success-ico"/>
                <p>{t('parties.saved')}</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSave}>
                <div className="field-group">
                  <label className="field-label">{t('parties.name_label')}</label>
                  <input id="new-party-name" className="field-input" required value={newParty.name}
                    onChange={e => setNewParty(v => ({...v, name: e.target.value}))} placeholder={t('parties.name_ph')}/>
                </div>
                <div className="modal-row">
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">{t('parties.gstin_label')}</label>
                    <input id="new-party-gstin" className="field-input" value={newParty.gstin}
                      onChange={e => setNewParty(v => ({...v, gstin: e.target.value.toUpperCase()}))}
                      placeholder={t('parties.gstin_ph')} maxLength={15}/>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">{t('parties.type_label')}</label>
                    <select id="new-party-type" className="field-input" value={newParty.type}
                      onChange={e => setNewParty(v => ({...v, type: e.target.value}))}>
                      <option value="customer">{t('parties.customer')}</option>
                      <option value="vendor">{t('parties.vendor')}</option>
                      <option value="both">{t('parties.both')}</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t('parties.state_label')}</label>
                  <input id="new-party-state" className="field-input" value={newParty.state}
                    onChange={e => setNewParty(v => ({...v, state: e.target.value}))} placeholder={t('parties.state_ph')}/>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowAdd(false)}>{t('parties.cancel')}</button>
                  <button id="save-party-btn" type="submit" className="btn-action btn-action-primary">{t('parties.save')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
