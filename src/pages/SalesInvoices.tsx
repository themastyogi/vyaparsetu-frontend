/**
 * SalesInvoices.tsx — Indian GST Sales Invoice
 * • Party/Customer typeahead from Parties master
 * • Item typeahead from Items master (auto-fills HSN, UOM, Rate, GST%)
 * • HTML <table> for items — each column is properly sized, nothing truncated
 * • Qty/Rate have clean +/- spinners with explicit visible widths
 * • CGST/SGST/IGST live breakdown with dark, readable text
 * • Fixed-height modal, inner scroll, footer always visible
 * • Number limits: Qty ≤ 99,999.999 (3dp) · Rate ≤ 99,99,999.99 (2dp)
 */
import { useState, useRef, useCallback } from 'react';
import {
  Plus, X, CheckCircle2, ChevronDown, ChevronUp,
  Printer, Zap, Trash2, AlertCircle, FileText, IndianRupee,
} from 'lucide-react';
import { useAccounting, type SalesInvoice, type InvoiceItem } from '../hooks/useAccounting';
import { useMaster } from '../hooks/useMaster';
import DebitNoteSlider from '../components/DebitNoteSlider';
import './Parties.css';

// ── Constants ──────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const UOM_LIST  = ['Nos', 'Kg', 'Quintal', 'MT', 'Bag', 'Litre', 'Meter', 'Box', 'Set', 'Dozen', 'Pack', 'Trip', 'Sub'];
const TAX_TYPES = ['CGST + SGST (Intra-state)', 'IGST (Inter-state)'] as const;
const MAX_QTY   = 99_999.999;
const MAX_RATE  = 99_99_999.99;

const f2  = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const clampQty  = (v: number) => Math.min(Math.max(0, parseFloat(v.toFixed(3))), MAX_QTY);
const clampRate = (v: number) => Math.min(Math.max(0, parseFloat(v.toFixed(2))), MAX_RATE);

// ── Extended Item type ─────────────────────────────────────────────
interface InvoiceItemExt extends InvoiceItem {
  uom: string; hsnSac: string;
  taxType: typeof TAX_TYPES[number];
  cgst: number; sgst: number; igst: number;
}

function emptyItem(taxType: typeof TAX_TYPES[number] = 'CGST + SGST (Intra-state)'): InvoiceItemExt {
  return {
    id: uid(), description: '', hsnSac: '', uom: 'Nos',
    qty: 0, rate: 0, amount: 0,
    gstRate: 5, gstAmount: 0, total: 0, taxType,
    cgst: 0, sgst: 0, igst: 0,
  };
}

function calcItem(item: InvoiceItemExt): InvoiceItemExt {
  const qty    = clampQty(item.qty);
  const rate   = clampRate(item.rate);
  const amount = parseFloat((qty * rate).toFixed(2));
  const gstAmt = parseFloat((amount * item.gstRate / 100).toFixed(2));
  const half   = parseFloat((gstAmt / 2).toFixed(2));
  const isIGST = item.taxType === 'IGST (Inter-state)';
  return {
    ...item, qty, rate, amount, gstAmount: gstAmt,
    total: parseFloat((amount + gstAmt).toFixed(2)),
    cgst: isIGST ? 0 : half,
    sgst: isIGST ? 0 : half,
    igst: isIGST ? gstAmt : 0,
  };
}

// ── Base styles ────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  width: '100%', padding: '7px 9px', borderRadius: 6,
  border: '1.5px solid #cbd5e1', background: '#fff',
  color: '#0f172a', fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};
const ERR_B: React.CSSProperties = { borderColor: '#ef4444' };
const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};
const TH: React.CSSProperties = {
  padding: '7px 8px', fontSize: 10, fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f1f5f9',
  borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '8px 6px', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9',
};

// ── Typeahead ──────────────────────────────────────────────────────
function Typeahead({ value, onChange, onSelect, options, placeholder, hasError }: {
  value: string; onChange: (v: string) => void; onSelect: (v: string) => void;
  options: { label: string; sub?: string }[]; placeholder?: string; hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.label.toLowerCase().includes(value.toLowerCase())).slice(0, 10);
  return (
    <div style={{ position: 'relative' }}>
      <input value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        placeholder={placeholder} autoComplete="off"
        style={{ ...INP, ...(hasError ? ERR_B : {}), fontWeight: 600 }} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', maxHeight: 210, overflowY: 'auto' }}>
          {filtered.map(o => (
            <div key={o.label} onMouseDown={() => { onSelect(o.label); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{o.label}</div>
              {o.sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{o.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Numeric spinner cell (Qty or Rate) ────────────────────────────
// Uses a plain <input type="number"> with visible +/- buttons.
// minWidth on the input ensures the value is ALWAYS visible.
function SpinCell({ value, onChange, step, decimals, max, placeholder }: {
  value: number; onChange: (v: number) => void;
  step: number; decimals: number; max: number; placeholder: string;
}) {
  const dec = (v: number) => parseFloat(Math.max(0, v - step).toFixed(decimals));
  const inc = (v: number) => parseFloat(Math.min(max, v + step).toFixed(decimals));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff', height: 34 }}>
      {/* − button */}
      <button type="button" onMouseDown={e => { e.preventDefault(); onChange(dec(value)); }}
        style={{ width: 28, height: '100%', background: '#f0f4f8', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 16, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, lineHeight: 1 }}>
        −
      </button>
      {/* Actual number input — minWidth: 72px guarantees it's always visible */}
      <input
        type="number"
        min={0} max={max} step={step}
        value={value === 0 ? '' : value}
        placeholder={placeholder}
        onChange={e => {
          const raw = parseFloat(e.target.value);
          if (!isNaN(raw)) onChange(parseFloat(Math.min(Math.max(0, raw), max).toFixed(decimals)));
          else onChange(0);
        }}
        style={{
          flex: 1, minWidth: 72, border: 'none', outline: 'none', height: '100%',
          textAlign: 'right', fontSize: 13, fontWeight: 700, padding: '0 8px',
          background: 'transparent', color: '#0f172a', fontFamily: 'monospace',
        }}
      />
      {/* + button */}
      <button type="button" onMouseDown={e => { e.preventDefault(); onChange(inc(value)); }}
        style={{ width: 28, height: '100%', background: '#f0f4f8', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 16, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, lineHeight: 1 }}>
        +
      </button>
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────
interface FormState {
  invoiceNo: string; date: string;
  customer: string; customerGstin: string; placeOfSupply: string;
  taxType: typeof TAX_TYPES[number];
  remarks: string; items: InvoiceItemExt[];
}

function validateForm(form: FormState) {
  const e: Record<string, string> = {};
  if (!form.invoiceNo.trim()) e.invoiceNo = 'Required';
  if (!form.date)             e.date       = 'Required';
  if (!form.customer.trim())  e.customer   = 'Required';
  if (form.customerGstin.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.customerGstin.trim().toUpperCase()))
    e.customerGstin = 'Invalid GSTIN';
  form.items.forEach((it, i) => {
    if (!it.description.trim()) e[`d${i}`] = 'Required';
    if (it.qty  <= 0)           e[`q${i}`] = '> 0';
    if (it.rate <= 0)           e[`r${i}`] = '> 0';
  });
  return e;
}

// ── Main Component ─────────────────────────────────────────────────
export default function SalesInvoices() {
  const { salesInvoices, postSalesInvoice, deleteSalesInvoice, nextSalesInvoiceNo } = useAccounting();
  const { customers, items: masterItems, getPartyByName } = useMaster();

  const [showForm,      setShowForm]      = useState(false);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [debitNoteFor,  setDebitNoteFor]  = useState<SalesInvoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fieldErrs,     setFieldErrs]     = useState<Record<string, string>>({});
  const [submitted,     setSubmitted]     = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const initForm = useCallback((): FormState => ({
    invoiceNo: nextSalesInvoiceNo(),
    date: new Date().toISOString().split('T')[0],
    customer: '', customerGstin: '', placeOfSupply: '',
    taxType: 'CGST + SGST (Intra-state)',
    remarks: '', items: [emptyItem()],
  }), [nextSalesInvoiceNo]);

  const [form, setForm] = useState<FormState>(initForm);
  const openNewForm = () => { setForm(initForm()); setFieldErrs({}); setSubmitted(false); setShowForm(true); };

  // ── Customer ───────────────────────────────────────────────────
  const selectCustomer = (name: string) => {
    const p = getPartyByName(name);
    setForm(f => ({ ...f, customer: name, customerGstin: p?.gstin ?? f.customerGstin, placeOfSupply: p?.state ?? f.placeOfSupply }));
  };

  // ── Tax type sync ──────────────────────────────────────────────
  const syncTaxType = (taxType: typeof TAX_TYPES[number]) =>
    setForm(f => ({ ...f, taxType, items: f.items.map(it => calcItem({ ...it, taxType })) }));

  // ── Item handlers ──────────────────────────────────────────────
  const updateItem = (idx: number, ch: Partial<InvoiceItemExt>) =>
    setForm(f => { const items = [...f.items]; items[idx] = calcItem({ ...items[idx], ...ch }); return { ...f, items }; });

  const selectItemFromMaster = (idx: number, name: string) => {
    const mi = masterItems.find(i => i.name === name);
    if (mi) updateItem(idx, { description: mi.name, hsnSac: mi.hsn, uom: mi.unit, rate: mi.price, gstRate: mi.gst });
    else updateItem(idx, { description: name });
  };

  const addRow    = () => setForm(f => ({ ...f, items: [...f.items, emptyItem(f.taxType)] }));
  const removeRow = (idx: number) => { if (form.items.length > 1) setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) })); };

  // ── Totals ─────────────────────────────────────────────────────
  const subtotal  = form.items.reduce((s, i) => s + i.amount, 0);
  const totalGst  = form.items.reduce((s, i) => s + i.gstAmount, 0);
  const totalCGST = form.items.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = form.items.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = form.items.reduce((s, i) => s + i.igst, 0);
  const netTotal  = parseFloat((subtotal + totalGst).toFixed(2));
  const isIGST    = form.taxType === 'IGST (Inter-state)';

  // ── Submit ─────────────────────────────────────────────────────
  const handlePost = () => {
    setSubmitted(true);
    const errs = validateForm(form);
    setFieldErrs(errs);
    if (Object.keys(errs).length > 0) { bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const items: InvoiceItem[] = form.items.map(it => ({
      id: it.id, description: it.description, qty: it.qty, rate: it.rate,
      amount: it.amount, gstRate: it.gstRate, gstAmount: it.gstAmount, total: it.total,
    }));
    postSalesInvoice({ invoiceNo: form.invoiceNo.trim(), date: form.date, customer: form.customer.trim(), items, subtotal, totalGst, netTotal, remarks: form.remarks || undefined });
    setShowForm(false);
  };

  // ── Print ──────────────────────────────────────────────────────
  const printInvoice = (inv: SalesInvoice) => {
    const rows = inv.items.map((it, i) => `
      <tr>
        <td style="padding:5px 8px;text-align:center;border:1px solid #c5cae9;">${i+1}</td>
        <td style="padding:5px 8px;border:1px solid #c5cae9;">${it.description}</td>
        <td style="padding:5px 8px;text-align:right;border:1px solid #c5cae9;">${it.qty}</td>
        <td style="padding:5px 8px;text-align:right;border:1px solid #c5cae9;">${f2(it.rate)}</td>
        <td style="padding:5px 8px;text-align:right;border:1px solid #c5cae9;">${f2(it.amount)}</td>
        <td style="padding:5px 8px;text-align:center;border:1px solid #c5cae9;">${it.gstRate}%</td>
        <td style="padding:5px 8px;text-align:right;border:1px solid #c5cae9;">${f2(it.gstAmount)}</td>
        <td style="padding:5px 8px;text-align:right;border:1px solid #c5cae9;font-weight:700;">${f2(it.total)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice ${inv.invoiceNo}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;}
    .page{width:210mm;margin:0 auto;padding:10mm;}table{width:100%;border-collapse:collapse;}
    .hdr{display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid #1e3a5f;margin-bottom:10px;}
    th{background:#e8eaf6;border:1px solid #9fa8da;padding:6px 8px;font-size:11px;}
    .gt{font-weight:bold;background:#e8eaf6;padding:6px 12px;border:2px solid #3949ab;border-radius:4px;display:inline-block;}
    .sign{display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px solid #000;}
    .sl{text-align:center;width:28%;}.sl div{border-top:1px solid #000;margin-top:28px;padding-top:4px;font-size:11px;}
    @media print{@page{size:A4;margin:8mm}}</style></head><body><div class="page">
    <div class="hdr"><div><div style="font-size:20px;font-weight:bold;color:#1a237e;">VyaparSetu</div><div style="font-size:11px;color:#555;">GST Tax Invoice</div></div>
    <div style="text-align:right"><div style="font-size:16px;font-weight:bold;color:#1a237e;">TAX INVOICE</div>
    <div style="font-size:11px;margin-top:4px;">No: <b>${inv.invoiceNo}</b> &nbsp;|&nbsp; Date: <b>${inv.date}</b></div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
    <div style="border:1px solid #9fa8da;padding:6px 10px;border-radius:4px;"><div style="font-size:10px;font-weight:700;color:#555;margin-bottom:2px;">BILL TO</div><div style="font-size:13px;font-weight:700;">${inv.customer}</div></div>
    <div style="border:1px solid #9fa8da;padding:6px 10px;border-radius:4px;"><div style="font-size:10px;font-weight:700;color:#555;margin-bottom:2px;">SHIP TO</div><div style="font-size:13px;font-weight:700;">${inv.customer}</div></div></div>
    <table><thead><tr>
    <th style="width:5%;text-align:center;">#</th><th style="text-align:left;">Description</th>
    <th style="width:8%;text-align:right;">Qty</th><th style="width:11%;text-align:right;">Rate</th>
    <th style="width:13%;text-align:right;">Taxable</th><th style="width:8%;text-align:center;">GST%</th>
    <th style="width:13%;text-align:right;">GST Amt</th><th style="width:14%;text-align:right;">Total</th>
    </tr></thead><tbody>${rows}
    <tr style="background:#f5f5f5;font-weight:bold;">
    <td colspan="4" style="padding:6px 8px;text-align:right;border:1px solid #c5cae9;">Sub-total</td>
    <td style="padding:6px 8px;text-align:right;border:1px solid #c5cae9;">${f2(inv.subtotal)}</td>
    <td colspan="2" style="padding:6px 8px;text-align:right;border:1px solid #c5cae9;">Total GST</td>
    <td style="padding:6px 8px;text-align:right;border:1px solid #c5cae9;">${f2(inv.totalGst)}</td>
    </tr></tbody></table>
    <div style="text-align:right;margin-top:10px;">
    <div style="font-size:12px;color:#555;">Taxable: <b>₹ ${f2(inv.subtotal)}</b> &nbsp;|&nbsp; GST: <b>₹ ${f2(inv.totalGst)}</b></div>
    <div style="margin-top:6px;" class="gt">Grand Total: ₹ ${f2(inv.netTotal)}</div></div>
    ${inv.remarks ? `<div style="margin-top:8px;padding:6px 10px;background:#fff9c4;border-radius:4px;font-size:11px;"><b>Remarks:</b> ${inv.remarks}</div>` : ''}
    <div class="sign"><div class="sl"><div>Customer Signature</div></div>
    <div style="font-size:10px;color:#555;align-self:flex-end;">Computer generated invoice</div>
    <div class="sl"><div>Authorised Signatory</div></div></div>
    </div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const fe = (k: string) => fieldErrs[k];

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="page-root animate-fade-in">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ color: 'var(--brand-primary)' }} /> Sales Invoices
          </h1>
          <p className="page-sub">GST-compliant · Linked to Parties & Items master · Journal entries auto-posted</p>
        </div>
        <button className="btn-action btn-action-primary" onClick={openNewForm} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="party-summary">
        <div className="summary-card"><div className="summary-val">{salesInvoices.length}</div><div className="summary-lbl">Total Invoices</div></div>
        <div className="summary-card summary-recv"><div className="summary-val">₹{f2(salesInvoices.reduce((s, i) => s + i.netTotal, 0))}</div><div className="summary-lbl">Total Revenue</div></div>
        <div className="summary-card summary-pay"><div className="summary-val">₹{f2(salesInvoices.reduce((s, i) => s + i.totalGst, 0))}</div><div className="summary-lbl">Total GST</div></div>
        <div className="summary-card"><div className="summary-val">{salesInvoices.filter(i => i.status === 'posted').length}</div><div className="summary-lbl">Posted</div></div>
      </div>

      {/* Invoice list */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th><th>Date</th><th>Customer</th>
                <th style={{ textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesInvoices.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No invoices yet — click "New Invoice" to create one</td></tr>
              ) : salesInvoices.map(inv => (
                <>
                  <tr key={inv.id}>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                        {inv.invoiceNo} {expandedId === inv.id ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
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
                          onClick={() => setDebitNoteFor(inv)}><Zap size={13}/> Debit Note</button>
                        <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => printInvoice(inv)}><Printer size={13}/></button>
                        {deleteConfirm === inv.id ? (
                          <>
                            <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef4444' }}
                              onClick={() => { deleteSalesInvoice(inv.id); setDeleteConfirm(null); }}><CheckCircle2 size={13}/> Yes</button>
                            <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm(null)}><X size={13}/></button>
                          </>
                        ) : (
                          <button className="btn-action btn-action-ghost" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setDeleteConfirm(inv.id)}><Trash2 size={13}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === inv.id && (
                    <tr key={`${inv.id}-x`}>
                      <td colSpan={8} style={{ background: 'var(--surface-secondary)', padding: '12px 16px' }}>
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
                              {inv.items.map((it, i) => (
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
                          {inv.remarks && <div style={{ marginTop: 8, color: 'var(--text-muted)' }}><b>Remarks:</b> {inv.remarks}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          NEW INVOICE MODAL
          Fixed height · Inner scroll · Footer always visible
          ═══════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16,
            width: '100%', maxWidth: 1080,           /* wider — gives room to every column */
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            border: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 32px)',
          }}>

            {/* ── Modal header (always visible) ── */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: '18px 28px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={19}/> New Tax Invoice
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Linked to Parties & Items master · Double-entry journal auto-posted</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={18}/></button>
            </div>

            {/* ── Scrollable body ── */}
            <div ref={bodyRef} style={{ overflowY: 'auto', flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Error banner */}
              {submitted && Object.keys(fieldErrs).length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Fix {Object.keys(fieldErrs).length} error(s) before posting.</span>
                </div>
              )}

              {/* ── Section 1: Invoice Details ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2, display: 'inline-block' }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice Details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={LBL}>Invoice No. *</label>
                    <input value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                      style={{ ...INP, ...(fe('invoiceNo') ? ERR_B : {}), fontWeight: 700 }} placeholder="SI-2026-07-001"/>
                    {fe('invoiceNo') && <span style={{ fontSize: 10, color: '#ef4444' }}>{fe('invoiceNo')}</span>}
                  </div>
                  <div>
                    <label style={LBL}>Date *</label>
                    <input type="date" value={form.date} max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      style={{ ...INP, ...(fe('date') ? ERR_B : {}) }}/>
                    {fe('date') && <span style={{ fontSize: 10, color: '#ef4444' }}>{fe('date')}</span>}
                  </div>
                  <div>
                    <label style={LBL}>Tax Type *</label>
                    <select value={form.taxType} onChange={e => syncTaxType(e.target.value as typeof TAX_TYPES[number])}
                      style={{ ...INP, cursor: 'pointer' }}>
                      {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* ── Section 2: Customer ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2, display: 'inline-block' }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer Details</span>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 400 }}>← Parties master</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={LBL}>Customer / Party *</label>
                    <Typeahead value={form.customer} onChange={v => setForm(f => ({ ...f, customer: v }))}
                      onSelect={selectCustomer} options={customers.map(c => ({ label: c.name, sub: c.gstin }))}
                      placeholder="Search or type customer name" hasError={!!fe('customer')}/>
                    {fe('customer') && <span style={{ fontSize: 10, color: '#ef4444' }}>{fe('customer')}</span>}
                  </div>
                  <div>
                    <label style={LBL}>Customer GSTIN</label>
                    <input value={form.customerGstin} onChange={e => setForm(f => ({ ...f, customerGstin: e.target.value.toUpperCase() }))}
                      maxLength={15} style={{ ...INP, ...(fe('customerGstin') ? ERR_B : {}), fontFamily: 'monospace', letterSpacing: '0.06em' }}
                      placeholder="27AAAAA0000A1Z5"/>
                    {fe('customerGstin') && <span style={{ fontSize: 10, color: '#ef4444' }}>{fe('customerGstin')}</span>}
                  </div>
                  <div>
                    <label style={LBL}>Place of Supply</label>
                    <input value={form.placeOfSupply} onChange={e => setForm(f => ({ ...f, placeOfSupply: e.target.value }))}
                      style={INP} placeholder="e.g. Maharashtra"/>
                  </div>
                </div>
              </section>

              {/* ── Section 3: Line Items — HTML TABLE ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2, display: 'inline-block' }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Line Items</span>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 400 }}>← Items master · Qty max 99,999 · Rate max ₹99,99,999</span>
                </div>

                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: 200 }}/>   {/* Description */}
                        <col style={{ width: 80 }}/>    {/* HSN/SAC */}
                        <col style={{ width: 72 }}/>    {/* UOM */}
                        <col style={{ width: 145 }}/>   {/* Qty — needs room for stepper */}
                        <col style={{ width: 155 }}/>   {/* Rate — needs room for stepper */}
                        <col style={{ width: 72 }}/>    {/* GST% */}
                        <col style={{ width: 120 }}/>   {/* Total */}
                        <col style={{ width: 36 }}/>    {/* Delete */}
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{ ...TH, textAlign: 'left' }}>Description *</th>
                          <th style={{ ...TH, textAlign: 'left' }}>HSN/SAC</th>
                          <th style={{ ...TH, textAlign: 'left' }}>UOM</th>
                          <th style={{ ...TH, textAlign: 'right' }}>Qty *</th>
                          <th style={{ ...TH, textAlign: 'right' }}>Rate (₹) *</th>
                          <th style={{ ...TH, textAlign: 'right' }}>GST %</th>
                          <th style={{ ...TH, textAlign: 'right' }}>Amount (₹)</th>
                          <th style={{ ...TH }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            {/* Description */}
                            <td style={TD}>
                              <Typeahead value={item.description}
                                onChange={v => updateItem(idx, { description: v })}
                                onSelect={name => selectItemFromMaster(idx, name)}
                                options={masterItems.map(i => ({ label: i.name, sub: `HSN: ${i.hsn} · ₹${i.price} · ${i.gst}% GST` }))}
                                placeholder="Search items…" hasError={!!fe(`d${idx}`)}/>
                              {fe(`d${idx}`) && <span style={{ fontSize: 10, color: '#ef4444' }}>Required</span>}
                            </td>
                            {/* HSN */}
                            <td style={TD}>
                              <input value={item.hsnSac}
                                onChange={e => updateItem(idx, { hsnSac: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                                placeholder="HSN" style={{ ...INP, fontFamily: 'monospace', fontSize: 12 }}/>
                            </td>
                            {/* UOM */}
                            <td style={TD}>
                              <select value={item.uom} onChange={e => updateItem(idx, { uom: e.target.value })}
                                style={{ ...INP, cursor: 'pointer', fontSize: 12 }}>
                                {UOM_LIST.map(u => <option key={u}>{u}</option>)}
                              </select>
                            </td>
                            {/* Qty — SpinCell */}
                            <td style={TD}>
                              <SpinCell value={item.qty} onChange={v => updateItem(idx, { qty: v })}
                                step={1} decimals={3} max={MAX_QTY} placeholder="0"/>
                              {fe(`q${idx}`) && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Must be &gt; 0</div>}
                            </td>
                            {/* Rate — SpinCell */}
                            <td style={TD}>
                              <SpinCell value={item.rate} onChange={v => updateItem(idx, { rate: v })}
                                step={10} decimals={2} max={MAX_RATE} placeholder="0.00"/>
                              {fe(`r${idx}`) && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Must be &gt; 0</div>}
                            </td>
                            {/* GST % */}
                            <td style={TD}>
                              <select value={item.gstRate} onChange={e => updateItem(idx, { gstRate: +e.target.value })}
                                style={{ ...INP, cursor: 'pointer', fontSize: 12 }}>
                                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                              </select>
                            </td>
                            {/* Computed total */}
                            <td style={{ ...TD, textAlign: 'right' }}>
                              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>₹{f2(item.total)}</div>
                              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                                Taxable: <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>₹{f2(item.amount)}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#475569' }}>
                                {isIGST
                                  ? <>IGST: <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>₹{f2(item.igst)}</span></>
                                  : <>C+S: <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>₹{f2(item.cgst)}+{f2(item.sgst)}</span></>
                                }
                              </div>
                            </td>
                            {/* Delete */}
                            <td style={{ ...TD, textAlign: 'center', paddingTop: 10 }}>
                              {form.items.length > 1 && (
                                <button onClick={() => removeRow(idx)}
                                  style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#ef4444', display: 'inline-flex' }}>
                                  <Trash2 size={13}/>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add row */}
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <button onClick={addRow}
                      style={{ background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Plus size={13}/> Add Item Row
                    </button>
                  </div>
                </div>
              </section>

              {/* ── Section 4: Tax Breakdown + Grand Total ── */}
              <section style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

                {/* Tax breakdown — HIGH CONTRAST */}
                <div style={{ flex: 1, minWidth: 240, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tax Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Taxable Amount</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{f2(subtotal)}</span>
                    </div>
                    {isIGST ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#374151' }}>IGST</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{f2(totalIGST)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>CGST</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{f2(totalCGST)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>SGST</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{f2(totalSGST)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ height: 1, background: '#e2e8f0', margin: '2px 0' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Total GST</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>₹{f2(totalGst)}</span>
                    </div>
                  </div>
                </div>

                {/* Grand total */}
                <div style={{ minWidth: 240, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: 12, padding: '18px 22px', textAlign: 'right', color: '#fff' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total</div>
                    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <IndianRupee size={22}/>{f2(netTotal)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Remarks */}
              <div>
                <label style={LBL}>Narration / Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  rows={2} maxLength={500} placeholder="Payment terms, delivery notes, etc."
                  style={{ ...INP, resize: 'none', lineHeight: 1.6 }}/>
                <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{form.remarks.length}/500</div>
              </div>

            </div>

            {/* ── Footer (always visible) ── */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0, background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setShowForm(false)}
                style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Cancel
              </button>
              <button onClick={handlePost}
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
                <CheckCircle2 size={16}/> Post Invoice + Journal Entry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Debit Note Slider */}
      {debitNoteFor && (
        <DebitNoteSlider salesInvoice={debitNoteFor} onClose={() => setDebitNoteFor(null)}/>
      )}
    </div>
  );
}
