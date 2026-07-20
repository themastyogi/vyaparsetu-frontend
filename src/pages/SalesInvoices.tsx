/**
 * SalesInvoices.tsx — Indian GST-compliant Sales Invoice module
 * • Standard Indian invoice format (HSN, UOM, CGST+SGST / IGST)
 * • Full input validation — no garbage data allowed
 * • Clean opaque modal (no transparency issues)
 * • Print: proper A4 Indian invoice format
 */
import { useState, useRef } from 'react';
import {
  Plus, X, CheckCircle2, ChevronDown, ChevronUp,
  Printer, Zap, Trash2, AlertCircle, FileText, IndianRupee,
} from 'lucide-react';
import { useAccounting, type SalesInvoice, type InvoiceItem } from '../hooks/useAccounting';
import DebitNoteSlider from '../components/DebitNoteSlider';
import './Parties.css';

// ── Constants ─────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const UOM_LIST  = ['Nos', 'Kg', 'Quintal', 'MT', 'Bag', 'Litre', 'Meter', 'Box', 'Set', 'Dozen', 'Pack'];
const TAX_TYPES = ['CGST + SGST (Intra-state)', 'IGST (Inter-state)'] as const;

const f2  = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Extend InvoiceItem with Indian fields ─────────────────────────
interface InvoiceItemExt extends InvoiceItem {
  uom: string;
  hsnSac: string;
  taxType: typeof TAX_TYPES[number];
  cgst: number;
  sgst: number;
  igst: number;
}

function emptyItem(): InvoiceItemExt {
  return {
    id: uid(), description: '', hsnSac: '', uom: 'Nos',
    qty: 0, rate: 0, amount: 0,
    gstRate: 5, gstAmount: 0, total: 0,
    taxType: 'CGST + SGST (Intra-state)',
    cgst: 0, sgst: 0, igst: 0,
  };
}

function calcItem(item: InvoiceItemExt): InvoiceItemExt {
  const qty    = Math.max(0, item.qty);
  const rate   = Math.max(0, item.rate);
  const amount = parseFloat((qty * rate).toFixed(2));
  const gstAmt = parseFloat((amount * item.gstRate / 100).toFixed(2));
  const half   = parseFloat((gstAmt / 2).toFixed(2));
  const isIGST = item.taxType === 'IGST (Inter-state)';
  return {
    ...item, qty, rate, amount,
    gstAmount: gstAmt,
    total: parseFloat((amount + gstAmt).toFixed(2)),
    cgst: isIGST ? 0 : half,
    sgst: isIGST ? 0 : half,
    igst: isIGST ? gstAmt : 0,
  };
}

// ── Input style helpers ───────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid var(--border-primary)',
  background: '#fff', color: '#1a1a2e',
  fontSize: 13, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'Inter, sans-serif',
};
const errStyle: React.CSSProperties = {
  borderColor: '#ef4444',
};
const numInput: React.CSSProperties = { ...inputStyle, textAlign: 'right' };
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#64748b',
  display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
};

// ── Field validator ────────────────────────────────────────────────
interface FormState {
  invoiceNo: string;
  date: string;
  customer: string;
  customerGstin: string;
  placeOfSupply: string;
  taxType: typeof TAX_TYPES[number];
  remarks: string;
  items: InvoiceItemExt[];
}

function validateForm(form: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.invoiceNo.trim())  errs.invoiceNo  = 'Invoice number is required';
  if (!form.date)              errs.date        = 'Date is required';
  if (!form.customer.trim())   errs.customer    = 'Customer name is required';
  if (form.customerGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.customerGstin.trim().toUpperCase())) {
    errs.customerGstin = 'Invalid GSTIN format';
  }
  form.items.forEach((item, i) => {
    if (!item.description.trim()) errs[`item_${i}_desc`] = 'Required';
    if (item.qty <= 0)            errs[`item_${i}_qty`]  = 'Must be > 0';
    if (item.rate <= 0)           errs[`item_${i}_rate`] = 'Must be > 0';
  });
  return errs;
}

// ── Main Component ────────────────────────────────────────────────
export default function SalesInvoices() {
  const { salesInvoices, postSalesInvoice, deleteSalesInvoice, nextSalesInvoiceNo } = useAccounting();

  const [showForm,      setShowForm]      = useState(false);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [debitNoteFor,  setDebitNoteFor]  = useState<SalesInvoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fieldErrs,     setFieldErrs]     = useState<Record<string, string>>({});
  const [submitted,     setSubmitted]     = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const initForm = (): FormState => ({
    invoiceNo: nextSalesInvoiceNo(),
    date: new Date().toISOString().split('T')[0],
    customer: '', customerGstin: '', placeOfSupply: '',
    taxType: 'CGST + SGST (Intra-state)',
    remarks: '', items: [emptyItem()],
  });
  const [form, setForm] = useState<FormState>(initForm);

  const openNewForm = () => { setForm(initForm()); setFieldErrs({}); setSubmitted(false); setShowForm(true); };

  // ── Item handlers ─────────────────────────────────────────────
  const updateItem = (idx: number, ch: Partial<InvoiceItemExt>) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = calcItem({ ...items[idx], ...ch });
      return { ...f, items };
    });
  };
  const syncTaxType = (taxType: typeof TAX_TYPES[number]) => {
    setForm(f => ({
      ...f, taxType,
      items: f.items.map(it => calcItem({ ...it, taxType })),
    }));
  };
  const addRow    = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem(), taxType: f.taxType }] }));
  const removeRow = (idx: number) => { if (form.items.length > 1) setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) })); };

  // ── Totals ────────────────────────────────────────────────────
  const subtotal = form.items.reduce((s, i) => s + i.amount, 0);
  const totalGst = form.items.reduce((s, i) => s + i.gstAmount, 0);
  const totalCGST = form.items.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = form.items.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = form.items.reduce((s, i) => s + i.igst, 0);
  const netTotal  = parseFloat((subtotal + totalGst).toFixed(2));
  const isIGST    = form.taxType === 'IGST (Inter-state)';

  // ── Submit ────────────────────────────────────────────────────
  const handlePost = () => {
    setSubmitted(true);
    const errs = validateForm(form);
    setFieldErrs(errs);
    if (Object.keys(errs).length > 0) {
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Convert ext items back to InvoiceItem (pick matching fields)
    const items: InvoiceItem[] = form.items.map(it => ({
      id: it.id, description: it.description,
      qty: it.qty, rate: it.rate, amount: it.amount,
      gstRate: it.gstRate, gstAmount: it.gstAmount, total: it.total,
    }));
    postSalesInvoice({
      invoiceNo: form.invoiceNo.trim(), date: form.date,
      customer: form.customer.trim(), items, subtotal, totalGst, netTotal,
      remarks: form.remarks || undefined,
    });
    setShowForm(false);
  };

  // ── Print — proper Indian A4 invoice ─────────────────────────
  const printInvoice = (inv: SalesInvoice) => {
    const rows = inv.items.map((it, i) => `
      <tr style="border-bottom:1px solid #e0e0e0;">
        <td style="padding:6px 8px;text-align:center;">${i + 1}</td>
        <td style="padding:6px 8px;">${it.description}</td>
        <td style="padding:6px 8px;text-align:right;">${it.qty}</td>
        <td style="padding:6px 8px;text-align:right;">${f2(it.rate)}</td>
        <td style="padding:6px 8px;text-align:right;">${f2(it.amount)}</td>
        <td style="padding:6px 8px;text-align:center;">${it.gstRate}%</td>
        <td style="padding:6px 8px;text-align:right;">${f2(it.gstAmount)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;">${f2(it.total)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Invoice ${inv.invoiceNo}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:12px;color:#000;}
      .page{width:210mm;margin:0 auto;padding:10mm;border:2px solid #000;}
      table{width:100%;border-collapse:collapse;}
      .header-top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:8px;border-bottom:2px solid #000;margin-bottom:8px;}
      .company-name{font-size:20px;font-weight:bold;color:#1a237e;}
      .invoice-title{font-size:18px;font-weight:bold;text-align:right;color:#1a237e;}
      .party-box{border:1px solid #000;padding:6px 10px;margin-bottom:8px;border-radius:4px;}
      .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .data-table th{background:#e8eaf6;border:1px solid #9fa8da;padding:6px 8px;font-size:11px;}
      .data-table td{border:1px solid #c5cae9;}
      .totals{margin-top:8px;display:flex;flex-direction:column;align-items:flex-end;gap:3px;}
      .grand-total{font-size:14px;font-weight:bold;background:#e8eaf6;padding:6px 12px;border:2px solid #3949ab;border-radius:4px;}
      .sign-row{display:flex;justify-content:space-between;margin-top:24px;padding-top:12px;border-top:1px solid #000;}
      .sign-box{text-align:center;width:30%;}
      .sign-line{border-top:1px solid #000;margin-top:30px;padding-top:4px;font-size:11px;}
      @media print{@page{size:A4;margin:8mm}.page{border:none;}}
    </style></head><body><div class="page">
    <div class="header-top">
      <div>
        <div class="company-name">VyaparSetu</div>
        <div style="font-size:11px;color:#555;">GST Invoice</div>
      </div>
      <div>
        <div class="invoice-title">TAX INVOICE</div>
        <table style="font-size:11px;margin-top:4px;">
          <tr><td style="padding:2px 6px;text-align:right;color:#555;">Invoice No.:</td><td style="padding:2px 6px;font-weight:700;">${inv.invoiceNo}</td></tr>
          <tr><td style="padding:2px 6px;text-align:right;color:#555;">Date:</td><td style="padding:2px 6px;font-weight:700;">${inv.date}</td></tr>
        </table>
      </div>
    </div>
    <div class="party-grid" style="margin-bottom:8px;">
      <div class="party-box">
        <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:3px;">BILL TO</div>
        <div style="font-size:13px;font-weight:700;">${inv.customer}</div>
      </div>
      <div class="party-box">
        <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:3px;">SHIP TO</div>
        <div style="font-size:13px;font-weight:700;">${inv.customer}</div>
      </div>
    </div>
    <table class="data-table">
      <thead><tr>
        <th style="width:5%;">#</th>
        <th style="width:30%;text-align:left;">Description of Goods / Services</th>
        <th style="width:8%;">Qty</th>
        <th style="width:12%;text-align:right;">Rate (₹)</th>
        <th style="width:13%;text-align:right;">Taxable Value (₹)</th>
        <th style="width:8%;">GST %</th>
        <th style="width:12%;text-align:right;">GST Amt (₹)</th>
        <th style="width:12%;text-align:right;">Total (₹)</th>
      </tr></thead>
      <tbody>${rows}
        <tr style="background:#f5f5f5;font-weight:bold;">
          <td colspan="4" style="padding:7px 8px;text-align:right;border:1px solid #9fa8da;">Sub-total</td>
          <td style="padding:7px 8px;text-align:right;border:1px solid #9fa8da;">${f2(inv.subtotal)}</td>
          <td colspan="2" style="padding:7px 8px;text-align:right;border:1px solid #9fa8da;">Total GST</td>
          <td style="padding:7px 8px;text-align:right;border:1px solid #9fa8da;">${f2(inv.totalGst)}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals">
      <div style="font-size:12px;color:#555;">Taxable Amount: <b>₹ ${f2(inv.subtotal)}</b></div>
      <div style="font-size:12px;color:#555;">Total GST: <b>₹ ${f2(inv.totalGst)}</b></div>
      <div class="grand-total">Grand Total: ₹ ${f2(inv.netTotal)}</div>
    </div>
    ${inv.remarks ? `<div style="margin-top:8px;padding:6px 10px;background:#fff9c4;border-radius:4px;font-size:11px;"><b>Remarks:</b> ${inv.remarks}</div>` : ''}
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">Customer Signature</div></div>
      <div style="font-size:10px;text-align:center;color:#555;align-self:flex-end;">This is a computer-generated invoice</div>
      <div class="sign-box"><div class="sign-line">Authorised Signatory</div></div>
    </div>
    </div>
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Field error helper ────────────────────────────────────────
  const fe = (key: string) => fieldErrs[key];

  return (
    <div className="page-root animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ color: 'var(--brand-primary)' }} /> Sales Invoices
          </h1>
          <p className="page-sub">GST-compliant tax invoices · journal entries auto-posted to ledger</p>
        </div>
        <button className="btn-action btn-action-primary" onClick={openNewForm} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* ── Summary ── */}
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
        <div className="summary-card">
          <div className="summary-val">{salesInvoices.filter(i => i.status === 'posted').length}</div>
          <div className="summary-lbl">Posted</div>
        </div>
      </div>

      {/* ── Invoice List ── */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesInvoices.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No invoices yet — click "New Invoice" to create one</td></tr>
              ) : (
                salesInvoices.map(inv => (
                  <>
                    <tr key={inv.id}>
                      <td>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                          {inv.invoiceNo} {expandedId === inv.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                      <td style={{ fontSize: 13 }}>{inv.date}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(inv.subtotal)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f2(inv.totalGst)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>₹{f2(inv.netTotal)}</td>
                      <td><span className="status-pill status-paid">Posted</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-action btn-action-primary"
                            style={{ padding: '5px 12px', fontSize: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderColor: 'transparent' }}
                            onClick={() => setDebitNoteFor(inv)} title="Raise Debit Note">
                            <Zap size={13} /> Debit Note
                          </button>
                          <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => printInvoice(inv)} title="Print">
                            <Printer size={13} />
                          </button>
                          {deleteConfirm === inv.id ? (
                            <>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => { deleteSalesInvoice(inv.id); setDeleteConfirm(null); }}>
                                <CheckCircle2 size={13} /> Yes
                              </button>
                              <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm(null)}><X size={13} /></button>
                            </>
                          ) : (
                            <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setDeleteConfirm(inv.id)}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded item rows */}
                    {expandedId === inv.id && (
                      <tr key={`${inv.id}-exp`}>
                        <td colSpan={8} style={{ background: 'var(--surface-secondary)', padding: '12px 16px' }}>
                          <div style={{ fontSize: 12, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                                  {['#','Description','Qty','Rate','Taxable','GST%','GST Amt','Total'].map(h => (
                                    <th key={h} style={{ padding: '4px 8px', textAlign: h === 'Description' ? 'left' : 'right', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((it, i) => (
                                  <tr key={it.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{i + 1}</td>
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
                            {inv.remarks && <div style={{ marginTop: 8, color: 'var(--text-muted)' }}><b>Remarks:</b> {inv.remarks}</div>}
                          </div>
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

      {/* ════════════════════════════════════════════════════════════
          NEW INVOICE MODAL — Professional Indian Format
          ════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '24px 16px',
        }}>
          <div ref={formRef} style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 860,
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            border: '1px solid #e2e8f0',
            margin: '0 auto 40px',
          }}>

            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              padding: '20px 28px', borderRadius: '16px 16px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} /> New Tax Invoice
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>GST-compliant · Double-entry auto-posted</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Error banner */}
              {submitted && Object.keys(fieldErrs).length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Please fix {Object.keys(fieldErrs).length} error(s) below before posting.</span>
                </div>
              )}

              {/* ── Section 1: Invoice Header ── */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 14, background: '#2563eb', borderRadius: 2, display: 'inline-block' }} /> Invoice Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Invoice No. *</label>
                    <input value={form.invoiceNo}
                      onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                      style={{ ...inputStyle, ...(fe('invoiceNo') ? errStyle : {}), fontWeight: 700 }}
                      placeholder="e.g. SI-2026-07-001" />
                    {fe('invoiceNo') && <span style={{ fontSize: 11, color: '#ef4444' }}>{fe('invoiceNo')}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Invoice Date *</label>
                    <input type="date" value={form.date}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      style={{ ...inputStyle, ...(fe('date') ? errStyle : {}) }} />
                    {fe('date') && <span style={{ fontSize: 11, color: '#ef4444' }}>{fe('date')}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Type *</label>
                    <select value={form.taxType} onChange={e => syncTaxType(e.target.value as typeof TAX_TYPES[number])}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Customer Details ── */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 14, background: '#2563eb', borderRadius: 2, display: 'inline-block' }} /> Customer Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / 2' }}>
                    <label style={labelStyle}>Customer / Party Name *</label>
                    <input value={form.customer}
                      onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                      style={{ ...inputStyle, ...(fe('customer') ? errStyle : {}), fontWeight: 600 }}
                      placeholder="Enter customer name" />
                    {fe('customer') && <span style={{ fontSize: 11, color: '#ef4444' }}>{fe('customer')}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Customer GSTIN</label>
                    <input value={form.customerGstin}
                      onChange={e => setForm(f => ({ ...f, customerGstin: e.target.value.toUpperCase() }))}
                      maxLength={15}
                      style={{ ...inputStyle, ...(fe('customerGstin') ? errStyle : {}), fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      placeholder="27AAAAA0000A1Z5" />
                    {fe('customerGstin') && <span style={{ fontSize: 11, color: '#ef4444' }}>{fe('customerGstin')}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Place of Supply</label>
                    <input value={form.placeOfSupply}
                      onChange={e => setForm(f => ({ ...f, placeOfSupply: e.target.value }))}
                      style={inputStyle} placeholder="e.g. Maharashtra" />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Line Items ── */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 14, background: '#2563eb', borderRadius: 2, display: 'inline-block' }} /> Items / Services
                </div>

                {/* Line item table */}
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{ background: '#f8fafc', padding: '8px 10px', display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 0.7fr 1fr 1fr 0.9fr 1fr 0.5fr', gap: 8, borderBottom: '1.5px solid #e2e8f0' }}>
                    {['Description *', 'HSN/SAC', 'UOM', 'Qty *', 'Rate (₹) *', 'GST %', 'Amount (₹)', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</div>
                    ))}
                  </div>

                  {/* Item rows */}
                  {form.items.map((item, idx) => (
                    <div key={item.id} style={{ padding: '10px 10px', display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 0.7fr 1fr 1fr 0.9fr 1fr 0.5fr', gap: 8, borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                      {/* Description */}
                      <div>
                        <input value={item.description}
                          onChange={e => updateItem(idx, { description: e.target.value })}
                          placeholder="Item / service name"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12, ...(fe(`item_${idx}_desc`) ? errStyle : {}) }} />
                        {fe(`item_${idx}_desc`) && <span style={{ fontSize: 10, color: '#ef4444' }}>Required</span>}
                      </div>
                      {/* HSN/SAC */}
                      <div>
                        <input value={item.hsnSac}
                          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); updateItem(idx, { hsnSac: v }); }}
                          placeholder="HSN"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12, fontFamily: 'monospace' }} />
                      </div>
                      {/* UOM */}
                      <div>
                        <select value={item.uom} onChange={e => updateItem(idx, { uom: e.target.value })}
                          style={{ ...inputStyle, padding: '7px 6px', fontSize: 12, cursor: 'pointer' }}>
                          {UOM_LIST.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      {/* Qty */}
                      <div>
                        <input type="number" min="0.001" step="0.001"
                          value={item.qty === 0 ? '' : item.qty}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v >= 0) updateItem(idx, { qty: v });
                            else if (e.target.value === '') updateItem(idx, { qty: 0 });
                          }}
                          onBlur={e => { if (!e.target.value || parseFloat(e.target.value) < 0) updateItem(idx, { qty: 0 }); }}
                          placeholder="0"
                          style={{ ...numInput, padding: '7px 10px', fontSize: 12, ...(fe(`item_${idx}_qty`) ? errStyle : {}) }} />
                        {fe(`item_${idx}_qty`) && <span style={{ fontSize: 10, color: '#ef4444' }}>Must be &gt; 0</span>}
                      </div>
                      {/* Rate */}
                      <div>
                        <input type="number" min="0.01" step="0.01"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v >= 0) updateItem(idx, { rate: v });
                            else if (e.target.value === '') updateItem(idx, { rate: 0 });
                          }}
                          onBlur={e => { if (!e.target.value || parseFloat(e.target.value) < 0) updateItem(idx, { rate: 0 }); }}
                          placeholder="0.00"
                          style={{ ...numInput, padding: '7px 10px', fontSize: 12, ...(fe(`item_${idx}_rate`) ? errStyle : {}) }} />
                        {fe(`item_${idx}_rate`) && <span style={{ fontSize: 10, color: '#ef4444' }}>Must be &gt; 0</span>}
                      </div>
                      {/* GST % */}
                      <div>
                        <select value={item.gstRate} onChange={e => updateItem(idx, { gstRate: +e.target.value })}
                          style={{ ...inputStyle, padding: '7px 6px', fontSize: 12, cursor: 'pointer', textAlign: 'right' }}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                      {/* Amount (computed) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#1e3a5f', padding: '7px 0' }}>
                          ₹{f2(item.total)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b' }}>
                          Taxable: ₹{f2(item.amount)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b' }}>
                          GST: ₹{f2(item.gstAmount)}
                        </div>
                      </div>
                      {/* Delete */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
                        {form.items.length > 1 && (
                          <button onClick={() => removeRow(idx)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add row button */}
                  <div style={{ padding: '10px 14px', background: '#f8fafc' }}>
                    <button onClick={addRow} style={{ background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', color: '#2563eb', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Add Item Row
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Section 4: Totals + Tax breakdown ── */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {/* Tax breakdown */}
                <div style={{ flex: 1, minWidth: 240, background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Tax Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Taxable Amount</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{f2(subtotal)}</span>
                    </div>
                    {isIGST ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>IGST</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{f2(totalIGST)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>CGST</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{f2(totalCGST)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>SGST</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{f2(totalSGST)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 2 }}>
                      <span style={{ color: '#64748b' }}>Total GST</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{f2(totalGst)}</span>
                    </div>
                  </div>
                </div>

                {/* Grand total */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, minWidth: 220 }}>
                  <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: 12, padding: '16px 20px', textAlign: 'right', color: '#fff' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <IndianRupee size={18} /> {f2(netTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Remarks ── */}
              <div>
                <label style={labelStyle}>Narration / Remarks</label>
                <textarea value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  rows={2} maxLength={500}
                  placeholder="Optional: Add payment terms, delivery instructions, or any notes…"
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
                <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{form.remarks.length}/500</div>
              </div>

              {/* ── Action Buttons ── */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #e2e8f0' }}>
                <button className="btn-action btn-action-secondary" onClick={() => setShowForm(false)} style={{ padding: '11px 24px' }}>
                  Cancel
                </button>
                <button onClick={handlePost}
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
                  <CheckCircle2 size={16} /> Post Invoice + Journal Entry
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Debit Note Slider ── */}
      {debitNoteFor && (
        <DebitNoteSlider salesInvoice={debitNoteFor} onClose={() => setDebitNoteFor(null)} />
      )}
    </div>
  );
}
