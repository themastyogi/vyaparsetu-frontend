/**
 * DebitNoteSlider.tsx — Indian standard Debit Note
 * • Professional Indian format (Reason, HSN, UOM, CGST+SGST / IGST)
 * • Full input validation — no garbage data
 * • 4-step wizard: Sales DN → Vendor prompt → Purchase DN → Done
 * • Auto-generates double-entry Journal Entries for both
 */
import { useState } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, AlertTriangle, Zap,
  ArrowRight, AlertCircle, IndianRupee,
} from 'lucide-react';
import { useAccounting, type SalesInvoice, type DebitNote, type DebitNoteItem } from '../hooks/useAccounting';

// ── Constants ──────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const UOM_LIST  = ['Nos', 'Kg', 'Quintal', 'MT', 'Bag', 'Litre', 'Meter', 'Box', 'Set', 'Pack'];
const REASONS   = ['Moisture', 'Reject / Damage', 'B Grade', 'Short Delivery', 'Quality Issue', 'Rate Difference', 'Other / Custom'];
const TAX_TYPES = ['CGST + SGST (Intra-state)', 'IGST (Inter-state)'] as const;

const f2  = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Extended DN Item (with Indian fields) ──────────────────────────
interface DNItemExt extends DebitNoteItem {
  hsnSac: string;
  uom: string;
  taxType: typeof TAX_TYPES[number];
  cgst: number;
  sgst: number;
  igst: number;
  customReason?: string;
}

function emptyDNItem(taxType: typeof TAX_TYPES[number] = 'CGST + SGST (Intra-state)'): DNItemExt {
  return {
    id: uid(), reason: 'Moisture', customReason: '',
    hsnSac: '', uom: 'Kg',
    qty: undefined, rate: undefined, amount: 0,
    gstRate: 5, gstAmount: 0, total: 0,
    taxType, cgst: 0, sgst: 0, igst: 0,
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
    ...item, amount,
    gstAmount: gstAmt,
    total: parseFloat((amount + gstAmt).toFixed(2)),
    cgst: isIGST ? 0 : half,
    sgst: isIGST ? 0 : half,
    igst: isIGST ? gstAmt : 0,
  };
}

// ── Style helpers ──────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '1.5px solid #cbd5e1', background: '#fff',
  color: '#1a1a2e', fontSize: 12, boxSizing: 'border-box',
};
const inpErr: React.CSSProperties = { borderColor: '#ef4444' };
const numInp: React.CSSProperties = { ...inp, textAlign: 'right' };
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
};

type Step = 'sales-dn' | 'vendor-prompt' | 'purchase-dn' | 'done';

interface Props {
  salesInvoice: SalesInvoice;
  onClose: () => void;
}

// ── Totals helper ──────────────────────────────────────────────────
function totals(items: DNItemExt[]) {
  return {
    subtotal: items.reduce((s, i) => s + i.amount, 0),
    gst:      items.reduce((s, i) => s + i.gstAmount, 0),
    cgst:     items.reduce((s, i) => s + i.cgst, 0),
    sgst:     items.reduce((s, i) => s + i.sgst, 0),
    igst:     items.reduce((s, i) => s + i.igst, 0),
    net:      items.reduce((s, i) => s + i.total, 0),
  };
}

// ── Validate items ─────────────────────────────────────────────────
function validateItems(items: DNItemExt[]): Record<string, string> {
  const errs: Record<string, string> = {};
  items.forEach((it, i) => {
    if (it.amount <= 0) errs[`${i}_amount`] = 'Amount must be > 0';
  });
  return errs;
}

export default function DebitNoteSlider({ salesInvoice, onClose }: Props) {
  const { postDebitNotePair, nextDnNo } = useAccounting();

  const [step, setStep] = useState<Step>('sales-dn');

  // Sales DN state
  const [salesTaxType, setSalesTaxType] = useState<typeof TAX_TYPES[number]>('CGST + SGST (Intra-state)');
  const [salesItems,   setSalesItems]   = useState<DNItemExt[]>([emptyDNItem()]);
  const [salesDate,    setSalesDate]    = useState(new Date().toISOString().split('T')[0]);
  const [salesRemarks, setSalesRemarks] = useState('');
  const [salesErrs,    setSalesErrs]    = useState<Record<string, string>>({});
  const [salesSubmitted, setSalesSubmitted] = useState(false);

  // Purchase DN state
  const [purchTaxType, setPurchTaxType] = useState<typeof TAX_TYPES[number]>('CGST + SGST (Intra-state)');
  const [purchItems,   setPurchItems]   = useState<DNItemExt[]>([]);
  const [purchDate,    setPurchDate]    = useState(new Date().toISOString().split('T')[0]);
  const [purchVendor,  setPurchVendor]  = useState('');
  const [purchInvNo,   setPurchInvNo]   = useState('');
  const [purchRemarks, setPurchRemarks] = useState('');
  const [purchErrs,    setPurchErrs]    = useState<Record<string, string>>({});
  const [purchSubmitted, setPurchSubmitted] = useState(false);

  // ── Item updaters ────────────────────────────────────────────────
  const updateSales = (idx: number, ch: Partial<DNItemExt>) =>
    setSalesItems(p => { const n = [...p]; n[idx] = calcDNItem({ ...n[idx], ...ch }); return n; });
  const syncSalesTaxType = (tt: typeof TAX_TYPES[number]) => {
    setSalesTaxType(tt);
    setSalesItems(p => p.map(i => calcDNItem({ ...i, taxType: tt })));
  };
  const addSalesRow    = () => setSalesItems(p => [...p, emptyDNItem(salesTaxType)]);
  const removeSalesRow = (idx: number) => { if (salesItems.length > 1) setSalesItems(p => p.filter((_, i) => i !== idx)); };

  const updatePurch = (idx: number, ch: Partial<DNItemExt>) =>
    setPurchItems(p => { const n = [...p]; n[idx] = calcDNItem({ ...n[idx], ...ch }); return n; });
  const syncPurchTaxType = (tt: typeof TAX_TYPES[number]) => {
    setPurchTaxType(tt);
    setPurchItems(p => p.map(i => calcDNItem({ ...i, taxType: tt })));
  };
  const addPurchRow    = () => setPurchItems(p => [...p, emptyDNItem(purchTaxType)]);
  const removePurchRow = (idx: number) => { if (purchItems.length > 1) setPurchItems(p => p.filter((_, i) => i !== idx)); };

  const sT = totals(salesItems);
  const pT = totals(purchItems);

  // ── Step handlers ────────────────────────────────────────────────
  const handleContinue = () => {
    setSalesSubmitted(true);
    const errs = validateItems(salesItems);
    setSalesErrs(errs);
    if (Object.keys(errs).length > 0) return;
    setStep('vendor-prompt');
  };

  const handleVendorYes = () => {
    // Pre-fill purchase items from sales items (user can adjust)
    setPurchItems(salesItems.map(si => ({ ...si, id: uid() })));
    setStep('purchase-dn');
  };

  const buildDNItems = (items: DNItemExt[]): DebitNoteItem[] =>
    items.map(({ hsnSac: _h, uom: _u, taxType: _t, cgst: _c, sgst: _s, igst: _i, customReason: _cr, ...rest }) => rest);

  const handleFinalPost = (withVendor: boolean) => {
    if (withVendor) {
      setPurchSubmitted(true);
      const errs: Record<string, string> = { ...validateItems(purchItems) };
      if (!purchVendor.trim()) errs['vendor'] = 'Vendor name is required';
      setPurchErrs(errs);
      if (Object.keys(errs).length > 0) return;
    }

    const salesDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'> = {
      type: 'Sales',
      dnNo: nextDnNo('Sales'),
      date: salesDate,
      relatedInvoiceId: salesInvoice.id,
      relatedInvoiceNo: salesInvoice.invoiceNo,
      party: salesInvoice.customer,
      items: buildDNItems(salesItems),
      subtotal: sT.subtotal,
      totalGst: sT.gst,
      netTotal: parseFloat(sT.net.toFixed(2)),
      remarks: salesRemarks || `Quality deduction against ${salesInvoice.invoiceNo}`,
    };

    const purchDN = withVendor ? ({
      type: 'Purchase' as const,
      dnNo: nextDnNo('Purchase'),
      date: purchDate,
      relatedInvoiceId: purchInvNo || 'na',
      relatedInvoiceNo: purchInvNo || 'N/A',
      party: purchVendor,
      items: buildDNItems(purchItems),
      subtotal: pT.subtotal,
      totalGst: pT.gst,
      netTotal: parseFloat(pT.net.toFixed(2)),
      remarks: purchRemarks || `Purchase deduction linked to ${salesInvoice.invoiceNo}`,
    } satisfies Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'>) : undefined;

    postDebitNotePair(salesDN, purchDN);
    setStep('done');
  };

  // ── Reusable item row ────────────────────────────────────────────
  const ItemRows = ({
    items, onUpdate, onAdd, onRemove, errs, submitted,
  }: {
    items: DNItemExt[];
    onUpdate: (idx: number, ch: Partial<DNItemExt>) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    errs: Record<string, string>;
    submitted: boolean;
  }) => (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
      {/* Header */}
      <div style={{ background: '#f8fafc', padding: '8px 10px', display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.6fr 0.6fr 1fr 1fr 0.7fr 1fr 0.4fr', gap: 6, borderBottom: '1.5px solid #e2e8f0' }}>
        {['Reason *','HSN/SAC','UOM','GST%','Qty','Rate (₹)','Tax Type','Amount (₹)',''].map((h, i) => (
          <div key={i} style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i >= 4 ? 'right' : 'left' }}>{h}</div>
        ))}
      </div>

      {items.map((item, idx) => (
        <div key={item.id} style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.6fr 0.6fr 1fr 1fr 0.7fr 1fr 0.4fr', gap: 6, borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
          {/* Reason */}
          <div>
            <select value={item.reason === 'Other / Custom' ? 'Other / Custom' : item.reason}
              onChange={e => onUpdate(idx, { reason: e.target.value })}
              style={{ ...inp, fontSize: 11 }}>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            {item.reason === 'Other / Custom' && (
              <input value={item.customReason ?? ''}
                onChange={e => onUpdate(idx, { customReason: e.target.value, reason: e.target.value })}
                placeholder="Describe reason…"
                style={{ ...inp, fontSize: 11, marginTop: 4 }} />
            )}
          </div>
          {/* HSN */}
          <input value={item.hsnSac}
            onChange={e => onUpdate(idx, { hsnSac: e.target.value.replace(/\D/g, '').slice(0, 8) })}
            placeholder="HSN" style={{ ...inp, fontSize: 11, fontFamily: 'monospace' }} />
          {/* UOM */}
          <select value={item.uom} onChange={e => onUpdate(idx, { uom: e.target.value })}
            style={{ ...inp, fontSize: 11, cursor: 'pointer' }}>
            {UOM_LIST.map(u => <option key={u}>{u}</option>)}
          </select>
          {/* GST % */}
          <select value={item.gstRate} onChange={e => onUpdate(idx, { gstRate: +e.target.value })}
            style={{ ...inp, fontSize: 11, cursor: 'pointer' }}>
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
          {/* Qty (optional — if given, amount = qty×rate) */}
          <input type="number" min="0" step="0.001"
            value={item.qty ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              onUpdate(idx, { qty: isNaN(v) ? undefined : v });
            }}
            placeholder="optional"
            style={{ ...numInp, fontSize: 11 }} />
          {/* Rate (optional) */}
          <input type="number" min="0" step="0.01"
            value={item.rate ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              onUpdate(idx, { rate: isNaN(v) ? undefined : v });
            }}
            placeholder="optional"
            style={{ ...numInp, fontSize: 11 }} />
          {/* Tax type */}
          <select value={item.taxType} onChange={e => onUpdate(idx, { taxType: e.target.value as typeof TAX_TYPES[number] })}
            style={{ ...inp, fontSize: 10, cursor: 'pointer' }}>
            {TAX_TYPES.map(t => <option key={t} value={t}>{t === 'CGST + SGST (Intra-state)' ? 'C+S GST' : 'IGST'}</option>)}
          </select>
          {/* Amount — editable when qty/rate not set */}
          <div>
            <input type="number" min="0" step="0.01"
              value={item.amount === 0 ? '' : item.amount}
              onChange={e => {
                const v = parseFloat(e.target.value);
                onUpdate(idx, { amount: isNaN(v) ? 0 : v, qty: undefined, rate: undefined });
              }}
              placeholder="0.00"
              style={{ ...numInp, fontSize: 12, fontWeight: 700, ...(submitted && errs[`${idx}_amount`] ? inpErr : {}) }} />
            {submitted && errs[`${idx}_amount`] && <span style={{ fontSize: 10, color: '#ef4444' }}>Required &gt; 0</span>}
            <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b', marginTop: 2 }}>
              GST: ₹{f2(item.gstAmount)} | Total: <b>₹{f2(item.total)}</b>
            </div>
          </div>
          {/* Delete */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            {items.length > 1 && (
              <button onClick={() => onRemove(idx)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{ padding: '10px 12px', background: '#f8fafc' }}>
        <button onClick={onAdd} style={{ background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={13} /> Add Row
        </button>
      </div>
    </div>
  );

  // ── Total summary box ────────────────────────────────────────────
  const TotalBox = ({ t, color, label }: { t: ReturnType<typeof totals>; color: string; label: string }) => (
    <div style={{ background: '#f8fafc', border: `1.5px solid #e2e8f0`, borderRadius: 10, padding: '14px 16px', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        <span>Taxable Amount</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.subtotal)}</b>
      </div>
      {t.igst > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
          <span>IGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.igst)}</b>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            <span>CGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.cgst)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
            <span>SGST</span><b style={{ fontFamily: 'monospace' }}>₹{f2(t.sgst)}</b>
          </div>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#fff', background: color, borderRadius: 8, padding: '10px 14px', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IndianRupee size={15} /> {label}</span>
        <span style={{ fontFamily: 'monospace' }}>{f2(t.net)}</span>
      </div>
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(3px)' }} onClick={step === 'done' ? onClose : undefined} />

      {/* Slide-in panel */}
      <div style={{ width: 720, maxWidth: '97vw', background: '#fff', boxShadow: '-8px 0 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Panel header */}
        <div style={{ background: 'linear-gradient(135deg,#92400e,#d97706)', padding: '18px 24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 800, fontSize: 16 }}>
              <Zap size={18} /> Debit Note / Quality Deduction
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
              Against: <b style={{ color: '#fef3c7' }}>{salesInvoice.invoiceNo}</b> · {salesInvoice.customer} · ₹{f2(salesInvoice.netTotal)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <div style={{ background: '#fffbeb', padding: '10px 20px', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          {(['Sales Debit Note', 'Raise with Vendor?', 'Purchase Debit Note', 'Done'] as const).map((label, i) => {
            const stepMap: Step[] = ['sales-dn', 'vendor-prompt', 'purchase-dn', 'done'];
            const cur   = stepMap.indexOf(step);
            const isDone   = i < cur;
            const isActive = i === cur;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: isDone ? '#d1fae5' : isActive ? '#f59e0b' : '#f1f5f9',
                  color: isDone ? '#065f46' : isActive ? '#fff' : '#94a3b8',
                  border: isDone ? '1px solid #6ee7b7' : isActive ? 'none' : '1px solid #e2e8f0',
                }}>{isDone ? '✓ ' : ''}{label}</span>
                {i < 3 && <ArrowRight size={11} style={{ color: '#94a3b8' }} />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Sales DN ── */}
        {step === 'sales-dn' && (
          <div style={{ padding: 24, flexGrow: 1 }}>
            {/* Header fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={lbl}>Debit Note Date *</label>
                <input type="date" value={salesDate} max={new Date().toISOString().split('T')[0]}
                  onChange={e => setSalesDate(e.target.value)} style={{ ...inp }} />
              </div>
              <div>
                <label style={lbl}>Tax Type</label>
                <select value={salesTaxType} onChange={e => syncSalesTaxType(e.target.value as typeof TAX_TYPES[number])}
                  style={{ ...inp, cursor: 'pointer', fontSize: 12 }}>
                  {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Remarks</label>
                <input value={salesRemarks} onChange={e => setSalesRemarks(e.target.value)}
                  placeholder="Optional note" style={{ ...inp }} />
              </div>
            </div>

            {/* Error banner */}
            {salesSubmitted && Object.keys(salesErrs).length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Each item amount must be greater than 0.</span>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Deduction Items
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              💡 Enter Qty × Rate for auto-calculation, OR directly enter Amount. GST is computed automatically.
            </div>

            <ItemRows items={salesItems} onUpdate={updateSales} onAdd={addSalesRow} onRemove={removeSalesRow} errs={salesErrs} submitted={salesSubmitted} />

            <TotalBox t={sT} color="linear-gradient(135deg,#dc2626,#ef4444)" label="Net Deduction from Customer" />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={onClose} style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Cancel
              </button>
              <button onClick={handleContinue}
                style={{ background: 'linear-gradient(135deg,#92400e,#d97706)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(217,119,6,0.4)' }}>
                <Zap size={14} /> Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Vendor Prompt ── */}
        {step === 'vendor-prompt' && (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 24, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={36} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>Raise with Vendor too?</h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.7 }}>
                You've raised a quality deduction of <b style={{ color: '#dc2626' }}>₹{f2(sT.net)}</b> against <b style={{ color: '#1e3a5f' }}>{salesInvoice.customer}</b>.
                <br />
                Do you also want to raise a <b>Purchase Debit Note</b> against your vendor for the same quality issue?
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', fontSize: 12, color: '#475569', textAlign: 'left', maxWidth: 440, width: '100%' }}>
              <b style={{ color: '#16a34a' }}>Sales Debit Note Journal Entry:</b><br />
              Dr Sales Returns &nbsp;|&nbsp; Dr Output GST &nbsp;→&nbsp; Cr Accounts Receivable
              <br /><br />
              <b style={{ color: '#2563eb' }}>Purchase Debit Note Journal Entry (if Yes):</b><br />
              Dr Accounts Payable &nbsp;→&nbsp; Cr Purchase Returns &nbsp;|&nbsp; Cr Input GST
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => handleFinalPost(false)}
                style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#475569' }}>
                No, skip vendor
              </button>
              <button onClick={handleVendorYes}
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
                <Zap size={15} /> Yes, raise with vendor →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Purchase DN ── */}
        {step === 'purchase-dn' && (
          <div style={{ padding: 24, flexGrow: 1 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 9, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
              📋 Purchase Debit Note — Verify quantities and rates for vendor's invoice. You can adjust values before posting.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={purchDate} max={new Date().toISOString().split('T')[0]}
                  onChange={e => setPurchDate(e.target.value)} style={{ ...inp }} />
              </div>
              <div>
                <label style={lbl}>Vendor Name *</label>
                <input value={purchVendor} onChange={e => setPurchVendor(e.target.value)}
                  placeholder="Enter vendor name"
                  style={{ ...inp, ...(purchSubmitted && purchErrs['vendor'] ? inpErr : {}), fontWeight: 600 }} />
                {purchSubmitted && purchErrs['vendor'] && <span style={{ fontSize: 10, color: '#ef4444' }}>Required</span>}
              </div>
              <div>
                <label style={lbl}>Purchase Invoice No.</label>
                <input value={purchInvNo} onChange={e => setPurchInvNo(e.target.value)}
                  placeholder="e.g. PI-2026-001" style={{ ...inp, fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={lbl}>Tax Type</label>
                <select value={purchTaxType} onChange={e => syncPurchTaxType(e.target.value as typeof TAX_TYPES[number])}
                  style={{ ...inp, cursor: 'pointer', fontSize: 12 }}>
                  {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {purchSubmitted && Object.keys(purchErrs).some(k => k !== 'vendor') && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Each item amount must be greater than 0.</span>
              </div>
            )}

            <ItemRows items={purchItems} onUpdate={updatePurch} onAdd={addPurchRow} onRemove={removePurchRow} errs={purchErrs} submitted={purchSubmitted} />

            <div>
              <label style={{ ...lbl, marginTop: 14 }}>Remarks</label>
              <input value={purchRemarks} onChange={e => setPurchRemarks(e.target.value)}
                placeholder="Optional notes for vendor" style={{ ...inp }} />
            </div>

            <TotalBox t={pT} color="linear-gradient(135deg,#1e3a5f,#2563eb)" label="Recovery from Vendor" />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setStep('vendor-prompt')}
                style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                ← Back
              </button>
              <button onClick={() => handleFinalPost(true)}
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 28px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
                <CheckCircle2 size={15} /> Post Both Debit Notes
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 'done' && (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 20, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d1fae5', border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} style={{ color: '#16a34a' }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Debit Note(s) Posted!</h3>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 380, lineHeight: 1.7 }}>
              Journal entries have been automatically generated and posted to the General Ledger.
              View them under <b>Reports → Journal Entries</b>.
            </p>
            <button onClick={onClose}
              style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
