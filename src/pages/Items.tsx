import { useState } from 'react';
import { Plus, Search, Download, Package, ChevronRight, AlertTriangle } from 'lucide-react';
import './Parties.css';

const ITEMS = [
  { id: 'i1', name: 'A4 Paper Ream',        type: 'stock',   hsn: '48021000', gst: 12, unit: 'Box',  price: 450,  qty: 240,  reorder: 50,  emoji: '📄' },
  { id: 'i2', name: 'Office Chair – Mesh',   type: 'asset',   hsn: '94013000', gst: 18, unit: 'Pcs',  price: 8500, qty: 12,   reorder: 5,   emoji: '🪑' },
  { id: 'i3', name: 'Accounting Software',   type: 'service', hsn: '998314',   gst: 18, unit: 'Sub',  price: 5999, qty: null, reorder: null, emoji: '💻' },
  { id: 'i4', name: 'Printer Ink Cartridge', type: 'stock',   hsn: '84439920', gst: 18, unit: 'Pcs',  price: 1200, qty: 8,    reorder: 20,  emoji: '🖨️' },
  { id: 'i5', name: 'Rice Basmati 5kg',      type: 'stock',   hsn: '10063000', gst: 5,  unit: 'Bag',  price: 380,  qty: 500,  reorder: 100, emoji: '🌾' },
  { id: 'i6', name: 'Transport Charges',     type: 'expense', hsn: '996511',   gst: 5,  unit: 'Trip', price: 2500, qty: null, reorder: null, emoji: '🚚' },
  { id: 'i7', name: 'Stapler Machine',       type: 'asset',   hsn: '96130000', gst: 18, unit: 'Pcs',  price: 650,  qty: 0,    reorder: 3,   emoji: '📌' },
];

const TYPE_COLORS: Record<string, string> = {
  stock:   'tag-customer',
  service: 'tag-both',
  expense: 'tag-vendor',
  asset:   'tag-customer',
};

function stockStatus(qty: number | null, reorder: number | null) {
  if (qty === null) return null;
  if (qty === 0) return { cls: 'stock-out', label: 'Out of Stock' };
  if (reorder !== null && qty < reorder) return { cls: 'stock-low', label: 'Low Stock' };
  return { cls: 'stock-ok', label: 'In Stock' };
}

export default function Items() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'stock'|'service'|'expense'|'asset'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [newItem, setNewItem] = useState({ name: '', hsn: '', type: 'stock', gst: '18', price: '', unit: 'Pcs' });

  const filtered = ITEMS
    .filter(i => filter === 'all' || i.type === filter)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) ||
                 i.hsn.includes(search));

  const lowStockCount = ITEMS.filter(i => {
    const s = stockStatus(i.qty, i.reorder);
    return s?.cls === 'stock-low' || s?.cls === 'stock-out';
  }).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => { setShowAdd(false); setSaved(false); }, 1200);
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Items & Services</h1>
          <p className="page-sub">Manage your product catalogue, HSN codes, and GST rates</p>
        </div>
        <button id="add-item-btn" className="btn-action btn-action-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15}/> Add Item
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="dash-alert dash-alert-amber" style={{ display:'flex' }}>
          <AlertTriangle size={14} className="alert-icon"/>
          <span className="alert-text">
            {lowStockCount} items are low on stock or out of stock — review inventory
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="party-summary">
        {[
          { id: 'is-total', val: ITEMS.length,                                        lbl: 'Total Items' },
          { id: 'is-stock', val: ITEMS.filter(i=>i.type==='stock').length,             lbl: 'Stock Items' },
          { id: 'is-svc',   val: ITEMS.filter(i=>i.type==='service').length,           lbl: 'Services' },
          { id: 'is-low',   val: lowStockCount,                                        lbl: 'Need Restock' },
        ].map(s => (
          <div key={s.id} id={s.id} className="summary-card">
            <div className="summary-val">{s.val}</div>
            <div className="summary-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input
            id="item-search"
            type="text"
            placeholder="Search by name or HSN code…"
            className="toolbar-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(['all','stock','service','expense','asset'] as const).map(f => (
            <button
              key={f}
              id={`item-filter-${f}`}
              className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button id="export-items" className="icon-btn">
          <Download size={15}/> Export
        </button>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table" id="items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>HSN / SAC</th>
                <th>GST Rate</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No items found</td></tr>
              ) : filtered.map(item => {
                const st = stockStatus(item.qty, item.reorder);
                return (
                  <tr key={item.id} id={item.id}>
                    <td>
                      <div className="item-name-cell">
                        <div className="item-icon">{item.emoji}</div>
                        <span className="txn-party">{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-tag ${TYPE_COLORS[item.type]}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td><span className="mono">{item.hsn}</span></td>
                    <td><span className="txn-amount">{item.gst}%</span></td>
                    <td><span className="txn-amount">₹ {item.price.toLocaleString('en-IN')}</span></td>
                    <td>
                      {item.qty !== null
                        ? <span className="txn-date">{item.qty} {item.unit}</span>
                        : <span className="txn-gst">N/A</span>
                      }
                    </td>
                    <td>
                      {st
                        ? <span className={`stock-badge ${st.cls}`}>{st.label}</span>
                        : <span className="status-pill status-paid">Active</span>
                      }
                    </td>
                    <td>
                      <button id={`view-item-${item.id}`} className="row-action-btn" aria-label="View">
                        <ChevronRight size={15}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Item</h3>
              <button id="close-add-item" className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {saved ? (
              <div className="modal-success">
                <Package size={36} className="success-ico" style={{ color: '#10B981' }}/>
                <p>Item saved successfully!</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSave}>
                <div className="field-group">
                  <label className="field-label">Item Name *</label>
                  <input id="new-item-name" className="field-input" required
                    value={newItem.name} onChange={e => setNewItem(v=>({...v, name: e.target.value}))}
                    placeholder="e.g. A4 Paper Ream"/>
                </div>
                <div className="modal-row">
                  <div className="field-group" style={{flex:1}}>
                    <label className="field-label">Type *</label>
                    <select id="new-item-type" className="field-input"
                      value={newItem.type} onChange={e => setNewItem(v=>({...v, type: e.target.value}))}>
                      <option value="stock">Stock</option>
                      <option value="service">Service</option>
                      <option value="expense">Expense</option>
                      <option value="asset">Asset</option>
                    </select>
                  </div>
                  <div className="field-group" style={{flex:1}}>
                    <label className="field-label">GST Rate</label>
                    <select id="new-item-gst" className="field-input"
                      value={newItem.gst} onChange={e => setNewItem(v=>({...v, gst: e.target.value}))}>
                      {['0','5','12','18','28'].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-row">
                  <div className="field-group" style={{flex:1}}>
                    <label className="field-label">HSN / SAC *</label>
                    <input id="new-item-hsn" className="field-input" required
                      value={newItem.hsn} onChange={e => setNewItem(v=>({...v, hsn: e.target.value}))}
                      placeholder="e.g. 48021000"/>
                  </div>
                  <div className="field-group" style={{flex:1}}>
                    <label className="field-label">Unit Price (₹)</label>
                    <input id="new-item-price" className="field-input" type="number"
                      value={newItem.price} onChange={e => setNewItem(v=>({...v, price: e.target.value}))}
                      placeholder="0.00"/>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button id="save-item-btn" type="submit" className="btn-action btn-action-primary">Save Item</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
