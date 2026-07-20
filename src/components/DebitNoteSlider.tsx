/**
 * DebitNoteSlider.tsx — Indian standard Debit Note
 * Fixes:
 *  • Debit Note net total CANNOT exceed original Sales Invoice net total
 *  • Vendor field linked to Parties master (typeahead)
 *  • Qty / Amount fields have ▲▼ stepper buttons
 *  • Number validation: max Qty = 99,999.999, max Amount = invoice net total
 *  • CGST/SGST/IGST breakdown live + correct
 *  • Panel has inner scroll — buttons always visible
 *  • GST breakdown shown in totals
 */
import { useState } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, AlertTriangle, Zap,
  ArrowRight, AlertCircle, IndianRupee, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useAccounting, type SalesInvoice, type DebitNote, type DebitNoteItem } from '../hooks/useAccounting';
import { useMaster } from '../hooks/useMaster';

// ── Constants ──────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const UOM_LIST  = ['Nos', 'Kg', 'Quintal', 'MT', 'Bag', 'Litre', 'Meter', 'Box', 'Set', 'Pack', 'Trip'];
const REASONS   = ['Moisture', 'Reject / Damage', 'B Grade', 'Short Delivery', 'Quality Issue', 'Rate Difference', 'Other / Custom'];
const TAX_TYPES = ['CGST + SGST (Intra-state)', 'IGST (Inter-state)'] as const;
const MAX_QTY   = 99_999.999;

const f2  = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Types ──────────────────────────────────────────────────────────
interface DNItemExt extends DebitNoteItem {
  hsnSac: string; uom: string;
  taxType: typeof TAX_TYPES[number];
  cgst: number; sgst: number; igst: number;
  customReason?: string;
}

function emptyDNItem(taxType: typeof TAX_TYPES[number] = 'CGST + SGST (Intra-state)'): DNItemExt {
  return {
    id: uid(), reason: 'Moisture', customReason: '',
    hsnSac: '', uom: 'Kg',
    qty: undefined, rate: undefined, amount: 0,
    gstRate: 5, gstAmount: 0, total: 0, taxType,
    cgst: 0, sgst: 0, igst: 0,
  };
}

function calcDNItem(item: DNItemExt): DNItemExt {
  const amount = (item.qty && item.rate && item.qty > 0 && item.rate > 0)
    ? parseFloat((item.qty * item.rate).toFixed(2))
    : Math.max(0, item.amount);
  const gstAmt = parseFloat((amount * item.gstRate / 100).toFixed(2));
  const half   = parseFloat((gstAmt / 2).toFixed(2));
  const isIGST = item.taxType === 'IGST (Inter-state)';
  return {
    ...item, amount, gstAmount: gstAmt,
    total: parseFloat((amount + gstAmt).toFixed(2)),
    cgst: isIGST ? 0 : half, sgst: isIGST ? 0 : half,
    igst: isIGST ? gstAmt : 0,
  };
}

function totals(items: DNItemExt[]) {
  return {
    subtotal: parseFloat(items.reduce((s, i) => s + i.amount, 0).toFixed(2)),
    gst:      parseFloat(items.reduce((s, i) => s + i.gstAmount, 0).toFixed(2)),
    cgst:     parseFloat(items.reduce((s, i) => s + i.cgst, 0).toFixed(2)),
    sgst:     parseFloat(items.reduce((s, i) => s + i.sgst, 0).toFixed(2)),
    igst:     parseFloat(items.reduce((s, i) => s + i.igst, 0).toFixed(2)),
    net:      parseFloat(items.reduce((s, i) => s + i.total, 0).toFixed(2)),
  };
}

// ── Style helpers ──────────────────────────────────────────────────
const INP: React.CSSProperties = {
  width: '100%', padding: '7px 9px', borderRadius: 7,
  border: '1.5px solid #cbd5e1', background: '#fff',
  color: '#1a1a2e', fontSize: 12, boxSizing: 'border-box', outline: 'none',
};
const ERR: React.CSSProperties = { borderColor: '#ef4444' };
const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
};

// ── Typeahead ──────────────────────────────────────────────────────
function Typeahead({ value, onChange, onSelect, options, placeholder, hasError }: {
  value: string; onChange: (v: string) => void; onSelect: (v: string) => void;
  options: { label: string; sub?: string }[]; placeholder?: string; hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.label.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
  return (
    <div style={{ position: 'relative' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder} autoComplete="off"
        style={{ ...INP, ...(hasError ? ERR : {}), fontWeight: 600 }} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 180, overflowY: 'auto' }}>
          {filtered.map(o => (
            <div key={o.label} onMouseDown={() => { onSelect(o.label); setOpen(false); }}
              style={{ padding: '7px 11px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{o.label}</div>
              {o.sub && <div style={{ fontSize: 10, color: '#64748b' }}>{o.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stepper for Qty ────────────────────────────────────────────────
function StepQty({ value, onChange, max }: { value?: number; onChange: (v?: number) => void; max: number }) {
  const v = value ?? 0;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #cbd5e1', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
      <button type="button" onMouseDown={() => onChange(Math.max(0, parseFloat((v - 1).toFixed(3))) || undefined)}
        style={{ padding: '4px 6px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
        <ChevronDown size={11} />
      </button>
      <input type="number" min={0} max={max} step={0.001}
        value={value ?? ''}
        onChange={e => { const n = parseFloat(e.target.value); onChange(isNaN(n) ? undefined : Math.min(n, max)); }}
        placeholder="opt."
        style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'right', fontSize: 11, fontWeight: 600, padding: '5px 6px', width: 0, minWidth: 0, background: 'transparent' }} />
      <button type="button" onMouseDown={() => onChange(Math.min(max, parseFloat((v + 1).toFixed(3))))}
        style={{ padding: '4px 6px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
        <ChevronUp size={11} />
      </button>
    </div>
  );
}

// ── Stepper for Amount ─────────────────────────────────────────────
function StepAmt({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #cbd5e1', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
      <button type="button" onMouseDown={() => onChange(Math.max(0, parseFloat((value - 100).toFixed(2))))}
        style={{ padding: '4px 6px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
        <ChevronDown size={11} />
      </button>
      <input type="number" min={0} max={max} step={0.01}
        value={value === 0 ? '' : value}
        onChange={e => { const n = parseFloat(e.target.value); onChange(isNaN(n) ? 0 : Math.min(n, max)); }}
        placeholder="0.00"
        style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'right', fontSize: 12, fontWeight: 700, padding: '5px 6px', width: 0, minWidth: 0, background: 'transparent', color: '#1a1a2e' }} />
      <button type="button" onMouseDown={() => onChange(Math.min(max, parseFloat((value + 100).toFixed(2))))}
        style={{ padding: '4px 6px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
        <ChevronUp size={11} />
      </button>
    </div>
  );
}

type Step = 'sales-dn' | 'vendor-prompt' | 'purchase-dn' | 'done';

interface Props { salesInvoice: SalesInvoice; onClose: () => void; }

export default function DebitNoteSlider({ salesInvoice, onClose }: Props) {
  const { postDebitNotePair, nextDnNo } = useAccounting();
  const { vendors, getPartyByName } = useMaster();

  const [step, setStep] = useState<Step>('sales-dn');

  // Sales DN
  const [salesTaxType, setSalesTaxType] = useState<typeof TAX_TYPES[number]>('CGST + SGST (Intra-state)');
  const [salesItems,   setSalesItems]   = useState<DNItemExt[]>([emptyDNItem()]);
  const [salesDate,    setSalesDate]    = useState(new Date().toISOString().split('T')[0]);
  const [salesRemarks, setSalesRemarks] = useState('');
  const [salesErrs,    setSalesErrs]    = useState<Record<string, string>>({});
  const [salesSubmit,  setSalesSubmit]  = useState(false);

  // Purchase DN
  const [purchTaxType, setPurchTaxType] = useState<typeof TAX_TYPES[number]>('CGST + SGST (Intra-state)');
  const [purchItems,   setPurchItems]   = useState<DNItemExt[]>([]);
  const [purchDate,    setPurchDate]    = useState(new Date().toISOString().split('T')[0]);
  const [purchVendor,  setPurchVendor]  = useState('');
  const [purchGstin,   setPurchGstin]   = useState('');
  const [purchInvNo,   setPurchInvNo]   = useState('');
  const [purchRemarks, setPurchRemarks] = useState('');
  const [purchErrs,    setPurchErrs]    = useState<Record<string, string>>({});
  const [purchSubmit,  setPurchSubmit]  = useState(false);

  const maxDN = salesInvoice.netTotal; // Debit note cannot exceed original invoice

  // ── Item updaters ──────────────────────────────────────────────
  const updSales = (idx: number, ch: Partial<DNItemExt>) =>
    setSalesItems(p => { const n = [...p]; n[idx] = calcDNItem({ ...n[idx], ...ch }); return n; });
  const syncSalesTT = (tt: typeof TAX_TYPES[number]) => {
    setSalesTaxType(tt); setSalesItems(p => p.map(i => calcDNItem({ ...i, taxType: tt })));
  };

  const updPurch = (idx: number, ch: Partial<DNItemExt>) =>
    setPurchItems(p => { const n = [...p]; n[idx] = calcDNItem({ ...n[idx], ...ch }); return n; });
  const syncPurchTT = (tt: typeof TAX_TYPES[number]) => {
    setPurchTaxType(tt); setPurchItems(p => p.map(i => calcDNItem({ ...i, taxType: tt })));
  };

  const sT = totals(salesItems);
  const pT = totals(purchItems);

  // ── Validation ─────────────────────────────────────────────────
  const validateSales = () => {
    const e: Record<string, string> = {};
    salesItems.forEach((it, i) => { if (it.amount <= 0) e[`${i}`] = 'Amount > 0'; });
    if (sT.net > maxDN + 0.01) e['exceed'] = `Total ₹${f2(sT.net)} exceeds invoice ₹${f2(maxDN)}`;
    return e;
  };
  const validatePurch = () => {
    const e: Record<string, string> = {};
    if (!purchVendor.trim()) e['vendor'] = 'Vendor name required';
    purchItems.forEach((it, i) => { if (it.amount <= 0) e[`${i}`] = 'Amount > 0'; });
    return e;
  };

  // ── Step handlers ──────────────────────────────────────────────
  const handleContinue = () => {
    setSalesSubmit(true);
    const e = validateSales(); setSalesErrs(e);
    if (Object.keys(e).length === 0) setStep('vendor-prompt');
  };

  const handleVendorYes = () => {
    setPurchItems(salesItems.map(si => ({ ...si, id: uid(), taxType: purchTaxType })));
    setStep('purchase-dn');
  };

  const buildItems = (items: DNItemExt[]): DebitNoteItem[] =>
    items.map(({ hsnSac: _h, uom: _u, taxType: _t, cgst: _c, sgst: _s, igst: _i, customReason: _r, ...rest }) => rest);

  const handlePost = (withVendor: boolean) => {
    if (withVendor) {
      setPurchSubmit(true);
      const e = validatePurch(); setPurchErrs(e);
      if (Object.keys(e).length > 0) return;
    }
    const salesDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'> = {
      type: 'Sales', dnNo: nextDnNo('Sales'), date: salesDate,
      relatedInvoiceId: salesInvoice.id, relatedInvoiceNo: salesInvoice.invoiceNo,
      party: salesInvoice.customer, items: buildItems(salesItems),
      subtotal: sT.subtotal, totalGst: sT.gst, netTotal: sT.net,
      remarks: salesRemarks || `Quality deduction against ${salesInvoice.invoiceNo}`,
    };
    const purchDN = withVendor ? {
      type: 'Purchase' as const, dnNo: nextDnNo('Purchase'), date: purchDate,
      relatedInvoiceId: purchInvNo || 'na', relatedInvoiceNo: purchInvNo || 'N/A',
      party: purchVendor, items: buildItems(purchItems),
      subtotal: pT.subtotal, totalGst: pT.gst, netTotal: pT.net,
      remarks: purchRemarks || `Purchase deduction linked to ${salesInvoice.invoiceNo}`,
    } : undefined;
    postDebitNotePair(salesDN, purchDN);
    setStep('done');
  };

  // ── Reusable item table ────────────────────────────────────────
  const ItemTable = ({
    items, onUpdate, onAdd, onRemove, errs, submitted, amtMax,
  }: {
    items: DNItemExt[]; onUpdate: (i: number, ch: Partial<DNItemExt>) => void;
    onAdd: () => void; onRemove: (i: number) => void;
    errs: Record<string, string>; submitted: boolean; amtMax: number;
  }) => (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{ background: '#f8fafc', padding: '7px 8px', display: 'grid', gridTemplateColumns: '1.6fr 0.65fr 0.6fr 0.6fr 0.85fr 0.8fr 0.95fr 0.38fr', gap: 5, borderBottom: '1.5px solid #e2e8f0' }}>
        {['Reason *','HSN','UOM','GST%','Qty','Rate(₹)','Amount(₹) *',''].map((h, i) => (
          <div key={i} style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i >= 4 ? 'right' : 'left' }}>{h}</div>
        ))}
      </div>

      {items.map((item, idx) => (
        <div key={item.id} style={{ padding: '9px 8px', display: 'grid', gridTemplateColumns: '1.6fr 0.65fr 0.6fr 0.6fr 0.85fr 0.8fr 0.95fr 0.38fr', gap: 5, borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
          {/* Reason */}
          <div>
            <select value={item.reason} onChange={e => onUpdate(idx, { reason: e.target.value })}
              style={{ ...INP, fontSize: 11 }}>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            {item.reason === 'Other / Custom' && (
              <input value={item.customReason ?? ''} onChange={e => onUpdate(idx, { customReason: e.target.value, reason: e.target.value })}
                placeholder="Describe…" style={{ ...INP, fontSize: 11, marginTop: 4 }} />
            )}
          </div>
          {/* HSN */}
          <input value={item.hsnSac} onChange={e => onUpdate(idx, { hsnSac: e.target.value.replace(/\D/g, '').slice(0, 8) })}
            placeholder="HSN" style={{ ...INP, fontSize: 10, fontFamily: 'monospace' }} />
          {/* UOM */}
          <select value={item.uom} onChange={e => onUpdate(idx, { uom: e.target.value })}
            style={{ ...INP, fontSize: 10, cursor: 'pointer' }}>
            {UOM_LIST.map(u => <option key={u}>{u}</option>)}
          </select>
          {/* GST % */}
          <select value={item.gstRate} onChange={e => onUpdate(idx, { gstRate: +e.target.value })}
            style={{ ...INP, fontSize: 10, cursor: 'pointer' }}>
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
          {/* Qty stepper */}
          <StepQty value={item.qty} onChange={v => onUpdate(idx, { qty: v })} max={MAX_QTY} />
          {/* Rate */}
          <input type="number" min={0} step={0.01}
            value={item.rate ?? ''}
            onChange={e => { const n = parseFloat(e.target.value); onUpdate(idx, { rate: isNaN(n) ? undefined : n }); }}
            placeholder="opt." style={{ ...INP, fontSize: 11, textAlign: 'right' }} />
          {/* Amount stepper */}
          <div>
            <StepAmt value={item.amount} onChange={v => onUpdate(idx, { amount: v, qty: undefined, rate: undefined })} max={amtMax} />
            <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b', marginTop: 2 }}>
              GST: ₹{f2(item.gstAmount)} | <b>Total: ₹{f2(item.total)}</b>
            </div>
            {submitted && errs[`${idx}`] && <span style={{ fontSize: 10, color: '#ef4444' }}>{errs[`${idx}`]}</span>}
          </div>
          {/* Delete */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            {items.length > 1 && (
              <button onClick={() => onRemove(idx)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 4, cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add row */}
      <div style={{ padding: '8px 10px', background: '#f8fafc' }}>
        <button onClick={onAdd} style={{ background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={12} /> Add Row
        </button>
      </div>
    </div>
  );

  // ── Total summary box ──────────────────────────────────────────
  const TotalBox = ({ t, color, label, warn }: { t: ReturnType<typeof totals>; color: string; label: string; warn?: string }) => (
    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
      {warn && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {warn}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Taxable Amount</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.subtotal)}</b></div>
        {t.igst > 0
          ? <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>IGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.igst)}</b></div>
          : <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>CGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.cgst)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.sgst)}</b></div>
            </>
        }
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#fff', background: color, borderRadius: 8, padding: '9px 12px', marginTop: 4, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IndianRupee size={14} />{label}</span>
          <span style={{ fontFamily: 'monospace' }}>{f2(t.net)}</span>
        </div>
      </div>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)' }} onClick={step === 'done' ? onClose : undefined} />

      {/* Slide-in panel — fixed height with inner scroll */}
      <div style={{ width: 740, maxWidth: '97vw', background: '#fff', boxShadow: '-8px 0 48px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Header — always visible */}
        <div style={{ background: 'linear-gradient(135deg,#92400e,#d97706)', padding: '16px 22px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 800, fontSize: 15 }}>
              <Zap size={17} /> Debit Note / Quality Deduction
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 }}>
              Against: <b style={{ color: '#fef3c7' }}>{salesInvoice.invoiceNo}</b> · {salesInvoice.customer} · Max: ₹{f2(maxDN)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={17} /></button>
        </div>

        {/* Step bar — always visible */}
        <div style={{ background: '#fffbeb', padding: '8px 18px', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          {(['Sales DN', 'Raise with Vendor?', 'Purchase DN', 'Done'] as const).map((label, i) => {
            const sm: Step[] = ['sales-dn', 'vendor-prompt', 'purchase-dn', 'done'];
            const cur = sm.indexOf(step);
            const isDone = i < cur, isActive = i === cur;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: isDone ? '#d1fae5' : isActive ? '#f59e0b' : '#f1f5f9', color: isDone ? '#065f46' : isActive ? '#fff' : '#94a3b8', border: isDone ? '1px solid #6ee7b7' : isActive ? 'none' : '1px solid #e2e8f0' }}>
                  {isDone ? '✓ ' : ''}{label}
                </span>
                {i < 3 && <ArrowRight size={10} style={{ color: '#94a3b8' }} />}
              </div>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── STEP 1: Sales DN ── */}
          {step === 'sales-dn' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Date *</label>
                  <input type="date" value={salesDate} max={new Date().toISOString().split('T')[0]}
                    onChange={e => setSalesDate(e.target.value)} style={INP} />
                </div>
                <div>
                  <label style={LBL}>Tax Type</label>
                  <select value={salesTaxType} onChange={e => syncSalesTT(e.target.value as typeof TAX_TYPES[number])} style={{ ...INP, cursor: 'pointer' }}>
                    {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Remarks</label>
                  <input value={salesRemarks} onChange={e => setSalesRemarks(e.target.value)} placeholder="Optional" style={INP} />
                </div>
              </div>

              {salesSubmit && salesErrs['exceed'] && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{salesErrs['exceed']}</span>
                </div>
              )}
              {salesSubmit && Object.keys(salesErrs).filter(k => k !== 'exceed').length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  Each deduction amount must be &gt; 0
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Deduction Items
                  <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>Max total: ₹{f2(maxDN)} (original invoice)</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                  💡 Enter Qty × Rate for auto-calc, OR use stepper on Amount directly. GST computed automatically.
                </div>
                <ItemTable items={salesItems} onUpdate={updSales} onAdd={() => setSalesItems(p => [...p, emptyDNItem(salesTaxType)])} onRemove={idx => { if (salesItems.length > 1) setSalesItems(p => p.filter((_, i) => i !== idx)); }} errs={salesErrs} submitted={salesSubmit} amtMax={maxDN} />
              </div>

              <TotalBox t={sT} color="linear-gradient(135deg,#dc2626,#ef4444)" label="Net Deduction from Customer"
                warn={sT.net > maxDN + 0.01 ? `⚠ Exceeds invoice (₹${f2(maxDN)}) by ₹${f2(sT.net - maxDN)}` : undefined} />
            </>
          )}

          {/* ── STEP 2: Vendor Prompt ── */}
          {step === 'vendor-prompt' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 22, textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Raise with Vendor too?</h3>
                <p style={{ fontSize: 13, color: '#64748b', maxWidth: 380, lineHeight: 1.7 }}>
                  You've raised a deduction of <b style={{ color: '#dc2626' }}>₹{f2(sT.net)}</b> against <b>{salesInvoice.customer}</b>.
                  <br />Do you also want to raise a <b>Purchase Debit Note</b> against your vendor?
                </p>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', fontSize: 11, color: '#475569', textAlign: 'left', maxWidth: 420, width: '100%' }}>
                <b style={{ color: '#16a34a' }}>Sales DN Entry:</b> Dr Sales Returns + Dr Output GST → Cr A/R<br /><br />
                <b style={{ color: '#2563eb' }}>Purchase DN Entry (if Yes):</b> Dr A/P → Cr Purchase Returns + Cr Input GST
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <button onClick={() => handlePost(false)} style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 9, padding: '11px 26px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  No, skip vendor
                </button>
                <button onClick={handleVendorYes} style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 26px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                  <Zap size={14} /> Yes, raise with vendor →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Purchase DN ── */}
          {step === 'purchase-dn' && (
            <>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                📋 Vendor linked to Parties master. Verify quantities and rates before posting.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Date *</label>
                  <input type="date" value={purchDate} max={new Date().toISOString().split('T')[0]}
                    onChange={e => setPurchDate(e.target.value)} style={INP} />
                </div>
                <div>
                  <label style={LBL}>Vendor Name * <span style={{ fontWeight: 400, color: '#2563eb' }}>← Parties</span></label>
                  <Typeahead value={purchVendor}
                    onChange={v => setPurchVendor(v)}
                    onSelect={name => {
                      const p = getPartyByName(name);
                      setPurchVendor(name);
                      setPurchGstin(p?.gstin ?? '');
                    }}
                    options={vendors.map(v => ({ label: v.name, sub: v.gstin }))}
                    placeholder="Search vendors…"
                    hasError={purchSubmit && !!purchErrs['vendor']}
                  />
                  {purchSubmit && purchErrs['vendor'] && <span style={{ fontSize: 10, color: '#ef4444' }}>Required</span>}
                </div>
                <div>
                  <label style={LBL}>Vendor GSTIN</label>
                  <input value={purchGstin} onChange={e => setPurchGstin(e.target.value.toUpperCase())} maxLength={15}
                    style={{ ...INP, fontFamily: 'monospace', letterSpacing: '0.05em' }} placeholder="auto-filled" />
                </div>
                <div>
                  <label style={LBL}>Tax Type</label>
                  <select value={purchTaxType} onChange={e => syncPurchTT(e.target.value as typeof TAX_TYPES[number])} style={{ ...INP, cursor: 'pointer' }}>
                    {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={LBL}>Related Purchase Invoice No.</label>
                <input value={purchInvNo} onChange={e => setPurchInvNo(e.target.value)} placeholder="e.g. PI-2026-001" style={{ ...INP, fontFamily: 'monospace' }} />
              </div>

              {purchSubmit && Object.keys(purchErrs).filter(k => k !== 'vendor').length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  Each amount must be &gt; 0
                </div>
              )}

              <ItemTable items={purchItems} onUpdate={updPurch} onAdd={() => setPurchItems(p => [...p, emptyDNItem(purchTaxType)])} onRemove={idx => { if (purchItems.length > 1) setPurchItems(p => p.filter((_, i) => i !== idx)); }} errs={purchErrs} submitted={purchSubmit} amtMax={9_99_99_999} />

              <div>
                <label style={LBL}>Remarks</label>
                <input value={purchRemarks} onChange={e => setPurchRemarks(e.target.value)} placeholder="Optional notes" style={INP} />
              </div>

              <TotalBox t={pT} color="linear-gradient(135deg,#1e3a5f,#2563eb)" label="Recovery from Vendor" />
            </>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Debit Note(s) Posted!</h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, lineHeight: 1.7 }}>
                Journal entries auto-generated and posted to General Ledger.<br />
                View under <b>Reports → Journal Entries</b>.
              </p>
              <button onClick={onClose} style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 30px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                Close
              </button>
            </div>
          )}

        </div>

        {/* Footer — always visible */}
        {(step === 'sales-dn' || step === 'purchase-dn') && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0, background: '#f8fafc' }}>
            {step === 'sales-dn' && (
              <>
                <button onClick={onClose} style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
                <button onClick={handleContinue} style={{ background: 'linear-gradient(135deg,#92400e,#d97706)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(217,119,6,0.35)' }}>
                  <Zap size={14} /> Continue →
                </button>
              </>
            )}
            {step === 'purchase-dn' && (
              <>
                <button onClick={() => setStep('vendor-prompt')} style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>← Back</button>
                <button onClick={() => handlePost(true)} style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
                  <CheckCircle2 size={14} /> Post Both Debit Notes
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
