import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, Camera, Filter, IndianRupee,
  Trash2, Link2, ChevronDown, ChevronUp, CheckCircle2, X,
} from 'lucide-react';
import { usePurchaseWizard } from '../components/purchase/usePurchaseWizard';
import PurchaseWizard from '../components/purchase/PurchaseWizard';
import { useAccounting, type PurchaseInvoice, type SalesInvoice } from '../hooks/useAccounting';
import './Parties.css';

// Kept for backward-compat (purchase wizard may still call it)
export let MOCK_PURCHASES: any[] = [];
export const addMockPurchase = (_p: any) => {
  // No-op: Purchases now go through useAccounting.postPurchaseInvoice
  window.dispatchEvent(new Event('purchases_updated'));
};

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Purchases() {
  const { t } = useTranslation();
  const wizard = usePurchaseWizard();
  const {
    purchaseInvoices, salesInvoices,
    deletePurchaseInvoice, linkSalesToPurchase,
  } = useAccounting();

  const [filter,      setFilter]      = useState<'all' | 'posted'>('all');
  const [search,      setSearch]      = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [linkModal,   setLinkModal]   = useState<PurchaseInvoice | null>(null);
  const [deleteConf,  setDeleteConf]  = useState<string | null>(null);
  const [linkSearch,  setLinkSearch]  = useState('');

  const filtered = purchaseInvoices.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
     p.invoiceNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalAmt = purchaseInvoices.reduce((s, p) => s + p.netTotal, 0);
  const totalGst = purchaseInvoices.reduce((s, p) => s + p.gstTotal, 0);

  const getSIForLink = (pi: PurchaseInvoice): SalesInvoice | undefined =>
    pi.linkedSalesInvoiceId ? salesInvoices.find(s => s.id === pi.linkedSalesInvoiceId) : undefined;

  const doLink = (piId: string, siId: string | null) => {
    linkSalesToPurchase(siId ?? '', piId);
    setLinkModal(null);
  };

  return (
    <div className="page-root animate-fade-in purchase-module">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('purchase.title', 'Purchase Bills')}</h1>
          <p className="page-sub">Linked to accounting ledger · All entries auto-posted · Link to Sales Invoice</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-action btn-action-secondary" onClick={() => { wizard.clearDraft(); wizard.updateData({ source: 'manual' }); wizard.openWizardAtStep('basic_details'); }}>
            <Plus size={15}/> Add Manually
          </button>
          <button className="btn-action btn-action-primary" onClick={() => { wizard.clearDraft(); wizard.updateData({ source: 'ocr' }); wizard.openWizardAtStep('ocr_camera'); }}>
            <Camera size={15}/> Scan Bill
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="party-summary">
        <div className="summary-card"><div className="summary-val">{purchaseInvoices.length}</div><div className="summary-lbl">Total Bills</div></div>
        <div className="summary-card summary-pay"><div className="summary-val">₹{f2(totalAmt)}</div><div className="summary-lbl">Total Amount</div></div>
        <div className="summary-card summary-recv"><div className="summary-val">₹{f2(totalGst)}</div><div className="summary-lbl">GST Credit</div></div>
        <div className="summary-card"><div className="summary-val">{purchaseInvoices.filter(p => p.linkedSalesInvoiceId).length}</div><div className="summary-lbl">Linked to Sales</div></div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input type="text" placeholder="Search by vendor or invoice no…"
            className="toolbar-search-input" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="filter-tabs">
          {(['all', 'posted'] as const).map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="icon-btn"><Filter size={15}/> Filter</button>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Invoice No & Date</th>
                <th style={{ textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Linked to SI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No bills found — add one manually or scan a bill</td></tr>
              ) : filtered.map(p => {
                const linkedSI = getSIForLink(p);
                return (
                  <>
                    <tr key={p.id}>
                      {/* Vendor */}
                      <td>
                        <div className="party-name-cell">
                          <div className="party-avatar">{p.vendorName.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.vendorName}</div>
                            {p.vendorGstin && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.vendorGstin}</div>}
                          </div>
                        </div>
                      </td>
                      {/* Invoice No */}
                      <td>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                          {p.invoiceNo} {expandedId === p.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </button>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.date}</div>
                      </td>
                      {/* Amounts */}
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(p.subtotal)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f2(p.gstTotal)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>₹{f2(p.netTotal)}</td>
                      {/* Linked SI */}
                      <td>
                        {linkedSI ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 5 }}>
                            {linkedSI.invoiceNo}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#2563eb', borderColor: '#2563eb' }}
                            onClick={() => { setLinkModal(p); setLinkSearch(''); }}>
                            <Link2 size={12}/> Link SI
                          </button>
                          {deleteConf === p.id ? (
                            <>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => { deletePurchaseInvoice(p.id); setDeleteConf(null); }}>
                                <CheckCircle2 size={12}/> Yes
                              </button>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }}
                                onClick={() => setDeleteConf(null)}><X size={12}/></button>
                            </>
                          ) : (
                            <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)' }}
                              onClick={() => setDeleteConf(p.id)}><Trash2 size={12}/></button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded items */}
                    {expandedId === p.id && (
                      <tr key={`${p.id}-x`}>
                        <td colSpan={7} style={{ background: 'var(--surface-secondary)', padding: '10px 16px' }}>
                          <div style={{ overflowX: 'auto', fontSize: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                                  {['#','Description','Qty','Rate','Taxable','GST%','GST Amt','Total'].map(h => (
                                    <th key={h} style={{ padding: '4px 8px', textAlign: h==='Description'?'left':'right', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {p.items.map((it, i) => (
                                  <tr key={it.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{i+1}</td>
                                    <td style={{ padding: '4px 8px' }}>{it.description}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{it.qty}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(it.rate)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(it.amount)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{it.gstRate}%</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(it.gstAmount)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{f2(it.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {p.remarks && <div style={{ marginTop: 6, color: 'var(--text-muted)' }}><b>Remarks:</b> {p.remarks}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard */}
      <PurchaseWizard wizard={wizard}/>

      {/* ── Link to Sales Invoice modal ── */}
      {linkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Link2 size={16}/> Link to Sales Invoice</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>Purchase: <b style={{ color: '#fef3c7' }}>{linkModal.invoiceNo}</b> · {linkModal.vendorName}</div>
              </div>
              <button onClick={() => setLinkModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={16}/></button>
            </div>
            {/* Search */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)} placeholder="Search sales invoices…"
                  style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1.5px solid #cbd5e1', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}/>
              </div>
            </div>
            {/* List */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {/* Unlink option */}
              {linkModal.linkedSalesInvoiceId && (
                <div onMouseEnter={e => (e.currentTarget.style.background='#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background='#fff')}
                  onClick={() => doLink(linkModal.id, null)}
                  style={{ padding: '11px 18px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <X size={14} style={{ color: '#ef4444' }}/>
                  <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Remove link</span>
                </div>
              )}
              {salesInvoices
                .filter(si => si.invoiceNo.toLowerCase().includes(linkSearch.toLowerCase()) || si.customer.toLowerCase().includes(linkSearch.toLowerCase()))
                .map(si => (
                  <div key={si.id}
                    onMouseEnter={e => (e.currentTarget.style.background='#eff6ff')} onMouseLeave={e => (e.currentTarget.style.background=si.id===linkModal.linkedSalesInvoiceId?'#f0fdf4':'#fff')}
                    onClick={() => doLink(linkModal.id, si.id)}
                    style={{ padding: '11px 18px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: si.id===linkModal.linkedSalesInvoiceId?'#f0fdf4':'#fff' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{si.invoiceNo}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{si.customer} · {si.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}><IndianRupee size={12}/>{f2(si.netTotal)}</div>
                      {si.id === linkModal.linkedSalesInvoiceId && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>✓ Linked</span>}
                    </div>
                  </div>
                ))
              }
              {salesInvoices.length === 0 && (
                <div style={{ padding: '24px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No sales invoices posted yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
