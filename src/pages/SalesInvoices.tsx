import { useState } from 'react';
import { Plus, X, Check, ChevronDown, ChevronUp, Printer, Zap, Trash2 } from 'lucide-react';
import { useAccounting, type SalesInvoice, type InvoiceItem } from '../hooks/useAccounting';
import DebitNoteSlider from '../components/DebitNoteSlider';
import './Parties.css';

const GST_RATES = [0, 5, 12, 18];
const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function emptyItem(): InvoiceItem {
  return { id: uid(), description: '', qty: 1, rate: 0, amount: 0, gstRate: 5, gstAmount: 0, total: 0 };
}

function calcItem(item: InvoiceItem): InvoiceItem {
  const amount    = item.qty * item.rate;
  const gstAmount = amount * (item.gstRate / 100);
  return { ...item, amount, gstAmount, total: amount + gstAmount };
}

export default function SalesInvoices() {
  const { salesInvoices, postSalesInvoice, deleteSalesInvoice, nextSalesInvoiceNo } = useAccounting();

  // ── New Invoice form state ───────────────────────────────────
  const [showForm, setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [debitNoteFor, setDebitNoteFor] = useState<SalesInvoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    remarks: '',
    items: [emptyItem()],
  });
  const [formErr, setFormErr] = useState('');

  const openNewForm = () => {
    setForm({
      invoiceNo: nextSalesInvoiceNo(),
      date: new Date().toISOString().split('T')[0],
      customer: '', remarks: '',
      items: [emptyItem()],
    });
    setFormErr('');
    setShowForm(true);
  };

  // ── Item row handlers ───────────────────────────────────────
  const updateItem = (idx: number, changes: Partial<InvoiceItem>) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = calcItem({ ...items[idx], ...changes });
      return { ...f, items };
    });
  };

  const addItemRow = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItemRow = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  // ── Totals ──────────────────────────────────────────────────
  const subtotal  = form.items.reduce((s, i) => s + i.amount, 0);
  const totalGst  = form.items.reduce((s, i) => s + i.gstAmount, 0);
  const netTotal  = subtotal + totalGst;

  const validate = () => {
    if (!form.customer.trim()) return 'Customer name is required.';
    if (!form.invoiceNo.trim()) return 'Invoice number is required.';
    if (form.items.some(i => !i.description.trim())) return 'All item descriptions are required.';
    if (form.items.some(i => i.rate <= 0 || i.qty <= 0)) return 'Qty and Rate must be greater than 0.';
    return '';
  };

  const handlePost = () => {
    const err = validate();
    if (err) { setFormErr(err); return; }
    postSalesInvoice({
      invoiceNo: form.invoiceNo, date: form.date, customer: form.customer,
      items: form.items, subtotal, totalGst, netTotal,
      remarks: form.remarks,
    });
    setShowForm(false);
  };

  // ── Print voucher (isolated window) ─────────────────────────
  const printInvoice = (inv: SalesInvoice) => {
    const rows = inv.items.map(i => `
      <tr>
        <td style="padding:5px 8px;border-right:1px solid #ddd;">${i.description}</td>
        <td style="padding:5px 8px;text-align:right;border-right:1px solid #ddd;">${i.qty}</td>
        <td style="padding:5px 8px;text-align:right;border-right:1px solid #ddd;">${f2(i.rate)}</td>
        <td style="padding:5px 8px;text-align:right;border-right:1px solid #ddd;">${i.gstRate}%</td>
        <td style="padding:5px 8px;text-align:right;">${f2(i.total)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Sales Invoice ${inv.invoiceNo}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;}
      .page{width:210mm;margin:0 auto;padding:15mm;}table{width:100%;border-collapse:collapse;}
      @media print{@page{size:A4;margin:10mm}}</style></head><body><div class="page">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:4px;">
        <div style="font-size:20px;font-weight:bold;">Sales Invoice</div>
      </div>
      <table style="margin-bottom:12px;font-size:12px;">
        <tr><td style="width:33%;"><b>Invoice No.:</b> ${inv.invoiceNo}</td>
            <td style="width:34%;text-align:center;"><b>Date:</b> ${inv.date}</td>
            <td style="width:33%;text-align:right;"><b>Customer:</b> ${inv.customer}</td></tr>
      </table>
      <table style="border:1px solid #000;margin-bottom:0;">
        <thead><tr style="background:#e8e8e8;border-bottom:2px solid #000;">
          <th style="padding:7px;text-align:left;border-right:1px solid #000;width:35%;">Description</th>
          <th style="padding:7px;text-align:right;border-right:1px solid #000;width:10%;">Qty</th>
          <th style="padding:7px;text-align:right;border-right:1px solid #000;width:15%;">Rate</th>
          <th style="padding:7px;text-align:right;border-right:1px solid #000;width:10%;">GST%</th>
          <th style="padding:7px;text-align:right;width:15%;">Total</th>
        </tr></thead>
        <tbody>${rows}
          <tr style="border-top:2px solid #000;background:#e8e8e8;font-weight:bold;">
            <td colspan="4" style="padding:7px;text-align:right;border-right:1px solid #000;">Grand Total</td>
            <td style="padding:7px;text-align:right;">₹ ${f2(inv.netTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div style="border:1px solid #000;border-top:none;padding:5px 10px;font-size:12px;">
        Subtotal: ₹${f2(inv.subtotal)} &nbsp;|&nbsp; GST: ₹${f2(inv.totalGst)} &nbsp;|&nbsp; <b>Net Total: ₹${f2(inv.netTotal)}</b>
      </div>
      ${inv.remarks ? `<div style="margin-top:8px;font-size:12px;"><b>Remarks:</b> ${inv.remarks}</div>` : ''}
      <div style="display:flex;justify-content:flex-end;margin-top:40px;font-size:12px;">
        <div style="text-align:center;width:28%;"><div style="border-top:1px solid #000;padding-top:4px;">Authorised Signatory</div></div>
      </div>
      </div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=850,height=1100');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Invoices</h1>
          <p className="page-sub">Create and track customer invoices · journal entries auto-posted</p>
        </div>
        <button className="btn-action btn-action-primary" onClick={openNewForm}>
          <Plus size={15} /> New Sales Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="party-summary">
        <div className="summary-card">
          <div className="summary-val">{salesInvoices.length}</div>
          <div className="summary-lbl">Total Invoices</div>
        </div>
        <div className="summary-card summary-recv">
          <div className="summary-val">₹{f2(salesInvoices.reduce((s, i) => s + i.netTotal, 0))}</div>
          <div className="summary-lbl">Total Revenue</div>
        </div>
        <div className="summary-card summary-pay">
          <div className="summary-val">₹{f2(salesInvoices.reduce((s, i) => s + i.totalGst, 0))}</div>
          <div className="summary-lbl">Total GST</div>
        </div>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesInvoices.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No sales invoices yet — click "New Sales Invoice" to create one</td></tr>
              ) : (
                salesInvoices.map(inv => (
                  <>
                    <tr key={inv.id}>
                      <td>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13 }}
                          onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                          {inv.invoiceNo} {expandedId === inv.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                      <td style={{ fontSize: 13 }}>{inv.date}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(inv.subtotal)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f2(inv.totalGst)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{f2(inv.netTotal)}</td>
                      <td><span className="status-pill status-paid">Posted</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* ⚡ KEY ACTION — raise debit note */}
                          <button
                            className="btn-action btn-action-primary"
                            style={{ padding: '5px 12px', fontSize: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderColor: 'transparent' }}
                            onClick={() => setDebitNoteFor(inv)}
                            title="Raise Debit Note / Quality Deduction"
                          >
                            <Zap size={13} /> Debit Note
                          </button>
                          <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => printInvoice(inv)}>
                            <Printer size={13} />
                          </button>
                          {deleteConfirm === inv.id ? (
                            <>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#ef4444' }} onClick={() => { deleteSalesInvoice(inv.id); setDeleteConfirm(null); }}>
                                <Check size={13} /> Yes
                              </button>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm(null)}>
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setDeleteConfirm(inv.id)}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === inv.id && (
                      <tr key={`${inv.id}-exp`}>
                        <td colSpan={8} style={{ background: 'var(--surface-secondary)', padding: '0 12px 12px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Qty</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Rate</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Taxable</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>GST%</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>GST Amt</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inv.items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                  <td style={{ padding: '4px 8px' }}>{item.description}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.qty}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(item.rate)}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(item.amount)}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.gstRate}%</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(item.gstAmount)}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{f2(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {inv.remarks && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}><b>Remarks:</b> {inv.remarks}</div>}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Invoice Modal ─────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', paddingTop: 40 }}>
          <div style={{ background: 'var(--surface-primary)', borderRadius: 16, padding: 32, width: '90%', maxWidth: 720, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', margin: '0 auto 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>New Sales Invoice</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {formErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13 }}>{formErr}</div>}

            {/* Header fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Invoice No *</label>
                <input value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Customer Name *</label>
                <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  placeholder="Customer / Party name"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Items */}
            <div style={{ border: '1px solid var(--border-primary)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', width: '30%' }}>Description *</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '10%' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '14%' }}>Rate (₹)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '12%' }}>Amount</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '12%' }}>GST %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '12%' }}>GST</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '12%' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input value={item.description} onChange={e => updateItem(idx, { description: e.target.value })}
                          placeholder="Item / service description"
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 12 }} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input type="number" min={0} value={item.qty} onChange={e => updateItem(idx, { qty: +e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', textAlign: 'right', fontSize: 12 }} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input type="number" min={0} value={item.rate} onChange={e => updateItem(idx, { rate: +e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', textAlign: 'right', fontSize: 12 }} />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{f2(item.amount)}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <select value={item.gstRate} onChange={e => updateItem(idx, { gstRate: +e.target.value })}
                          style={{ width: '100%', padding: '5px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 12 }}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{f2(item.gstAmount)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{f2(item.total)}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItemRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-action btn-action-ghost" style={{ fontSize: 12, marginBottom: 16 }} onClick={addItemRow}>
              <Plus size={13} /> Add Item Row
            </button>

            {/* Totals */}
            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subtotal: <b style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>₹{f2(subtotal)}</b></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total GST: <b style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>₹{f2(totalGst)}</b></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Net Total: ₹{f2(netTotal)}</div>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Remarks</label>
              <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                rows={2} placeholder="Optional narration / notes"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-action btn-action-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-action btn-action-primary" onClick={handlePost}>
                <Check size={15} /> Post Invoice + Journal Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Debit Note Slider ──────────────────────────────────── */}
      {debitNoteFor && (
        <DebitNoteSlider
          salesInvoice={debitNoteFor}
          onClose={() => setDebitNoteFor(null)}
        />
      )}
    </div>
  );
}
