/**
 * DebitNoteSlider.tsx
 * Slide-in panel for raising a Debit Note against a Sales Invoice.
 * After posting, prompts: "Raise with vendor too?" → if Yes, shows Purchase Debit Note form.
 * Auto-generates double-entry Journal Entries for both.
 */
import { useState } from 'react';
import { X, Plus, Trash2, Check, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { useAccounting, type SalesInvoice, type DebitNote, type DebitNoteItem } from '../hooks/useAccounting';

interface Props {
  salesInvoice: SalesInvoice;
  onClose: () => void;
}

const GST_RATES = [0, 5, 12, 18];
const REASONS   = ['Moisture', 'Reject', 'B Grade', 'Damage', 'Short Delivery', 'Quality Issue', 'Custom'];
const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function emptyDNItem(): DebitNoteItem & { _customReason?: string } {
  return { id: uid(), reason: 'Moisture', qty: undefined, rate: undefined, amount: 0, gstRate: 5, gstAmount: 0, total: 0 };
}

function calcDNItem(item: DebitNoteItem & { _customReason?: string }): DebitNoteItem & { _customReason?: string } {
  const amount    = (item.qty && item.rate) ? item.qty * item.rate : item.amount;
  const gstAmount = amount * (item.gstRate / 100);
  return { ...item, amount, gstAmount, total: amount + gstAmount };
}

type Step = 'sales-dn' | 'vendor-prompt' | 'purchase-dn' | 'done';

export default function DebitNoteSlider({ salesInvoice, onClose }: Props) {
  const { postDebitNotePair, nextDnNo } = useAccounting();

  const [step, setStep] = useState<Step>('sales-dn');
  const [salesItems, setSalesItems] = useState<Array<DebitNoteItem & { _customReason?: string }>>([emptyDNItem()]);
  const [salesDate, setSalesDate]   = useState(new Date().toISOString().split('T')[0]);
  const [salesRemarks, setSalesRemarks] = useState('');
  const [formErr, setFormErr]       = useState('');

  // Vendor DN state
  const [purchItems, setPurchItems] = useState<Array<DebitNoteItem & { _customReason?: string }>>([]);
  const [purchDate, setPurchDate]   = useState(new Date().toISOString().split('T')[0]);
  const [purchVendor, setPurchVendor] = useState('');
  const [purchInvNo, setPurchInvNo]   = useState('');
  const [purchErr, setPurchErr]       = useState('');

  // ── Sales DN item handlers ───────────────────────────────────
  const updateSalesItem = (idx: number, changes: Partial<DebitNoteItem & { _customReason?: string }>) => {
    setSalesItems(prev => {
      const next = [...prev];
      next[idx] = calcDNItem({ ...next[idx], ...changes });
      return next;
    });
  };
  const addSalesRow    = () => setSalesItems(p => [...p, emptyDNItem()]);
  const removeSalesRow = (idx: number) => setSalesItems(p => p.filter((_, i) => i !== idx));

  // ── Purchase DN item handlers ────────────────────────────────
  const updatePurchItem = (idx: number, changes: Partial<DebitNoteItem & { _customReason?: string }>) => {
    setPurchItems(prev => {
      const next = [...prev];
      next[idx] = calcDNItem({ ...next[idx], ...changes });
      return next;
    });
  };
  const addPurchRow    = () => setPurchItems(p => [...p, emptyDNItem()]);
  const removePurchRow = (idx: number) => setPurchItems(p => p.filter((_, i) => i !== idx));

  // ── Totals ───────────────────────────────────────────────────
  const salesSubtotal = salesItems.reduce((s, i) => s + i.amount, 0);
  const salesGst      = salesItems.reduce((s, i) => s + i.gstAmount, 0);
  const salesNet      = salesSubtotal + salesGst;

  const purchSubtotal = purchItems.reduce((s, i) => s + i.amount, 0);
  const purchGst      = purchItems.reduce((s, i) => s + i.gstAmount, 0);
  const purchNet      = purchSubtotal + purchGst;

  // ── Validation ───────────────────────────────────────────────
  const validateSales = () => {
    if (salesItems.some(i => i.amount <= 0)) return 'Each deduction item must have an amount > 0.';
    if (salesNet <= 0) return 'Total deduction must be greater than 0.';
    return '';
  };

  const validatePurch = () => {
    if (!purchVendor.trim()) return 'Vendor name is required.';
    if (purchItems.some(i => i.amount <= 0)) return 'Each deduction item must have an amount > 0.';
    if (purchNet <= 0) return 'Total purchase deduction must be > 0.';
    return '';
  };

  // ── Step handlers ────────────────────────────────────────────
  const handlePostSales = () => {
    const err = validateSales();
    if (err) { setFormErr(err); return; }
    setFormErr('');
    setStep('vendor-prompt');
  };

  const handleVendorYes = () => {
    // Pre-fill purchase DN with same reasons / qty as sales DN
    setPurchItems(salesItems.map(si => ({
      ...si,
      id: uid(),
      // Keep qty/rate fields for vendor to adjust
    })));
    setStep('purchase-dn');
  };

  const handleFinalPost = (withVendor: boolean) => {
    const salesDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'> = {
      type: 'Sales',
      dnNo: nextDnNo('Sales'),
      date: salesDate,
      relatedInvoiceId: salesInvoice.id,
      relatedInvoiceNo: salesInvoice.invoiceNo,
      party: salesInvoice.customer,
      items: salesItems.map(({ _customReason, ...i }) => i),
      subtotal: salesSubtotal,
      totalGst: salesGst,
      netTotal: salesNet,
      remarks: salesRemarks || `Quality deduction against ${salesInvoice.invoiceNo}`,
    };

    let purchDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'> | undefined;
    if (withVendor) {
      const err = validatePurch();
      if (err) { setPurchErr(err); return; }
      purchDN = {
        type: 'Purchase',
        dnNo: nextDnNo('Purchase'),
        date: purchDate,
        relatedInvoiceId: purchInvNo || 'na',
        relatedInvoiceNo: purchInvNo || 'N/A',
        party: purchVendor,
        items: purchItems.map(({ _customReason, ...i }) => i),
        subtotal: purchSubtotal,
        totalGst: purchGst,
        netTotal: purchNet,
        remarks: `Purchase deduction linked to ${salesInvoice.invoiceNo}`,
      };
    }

    postDebitNotePair(salesDN, purchDN);
    setStep('done');
  };

  // ── Shared item row renderer ─────────────────────────────────
  const ItemRow = ({
    item, idx, onChange, onRemove, canRemove,
  }: {
    item: DebitNoteItem & { _customReason?: string };
    idx: number;
    onChange: (idx: number, c: Partial<DebitNoteItem & { _customReason?: string }>) => void;
    onRemove: (idx: number) => void;
    canRemove: boolean;
  }) => (
    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
      <td style={{ padding: '6px 8px' }}>
        <select value={item.reason === 'Custom' ? 'Custom' : item.reason}
          onChange={e => onChange(idx, { reason: e.target.value })}
          style={{ width: '100%', padding: '5px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 12 }}>
          {REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
        {item.reason === 'Custom' && (
          <input value={item._customReason ?? ''} onChange={e => onChange(idx, { _customReason: e.target.value, reason: e.target.value })}
            placeholder="Describe reason…" style={{ width: '100%', marginTop: 4, padding: '4px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 12 }} />
        )}
      </td>
      <td style={{ padding: '6px 8px' }}>
        <input type="number" min={0} value={item.qty ?? ''} onChange={e => onChange(idx, { qty: +e.target.value || undefined })}
          placeholder="optional"
          style={{ width: '100%', padding: '5px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', textAlign: 'right', fontSize: 12 }} />
      </td>
      <td style={{ padding: '6px 8px' }}>
        <input type="number" min={0} value={item.rate ?? ''} onChange={e => onChange(idx, { rate: +e.target.value || undefined })}
          placeholder="optional"
          style={{ width: '100%', padding: '5px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', textAlign: 'right', fontSize: 12 }} />
      </td>
      <td style={{ padding: '6px 8px' }}>
        <input type="number" min={0} value={item.amount}
          onChange={e => onChange(idx, { amount: +e.target.value, qty: undefined, rate: undefined })}
          placeholder="0.00"
          style={{ width: '100%', padding: '5px 6px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', textAlign: 'right', fontSize: 12, fontWeight: 700 }} />
      </td>
      <td style={{ padding: '6px 8px' }}>
        <select value={item.gstRate} onChange={e => onChange(idx, { gstRate: +e.target.value })}
          style={{ width: '100%', padding: '5px 4px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 12 }}>
          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </td>
      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{f2(item.gstAmount)}</td>
      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{f2(item.total)}</td>
      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
        {canRemove && <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>}
      </td>
    </tr>
  );

  const ItemTable = ({ items, onUpdate, onAdd, onRemove }: {
    items: Array<DebitNoteItem & { _customReason?: string }>;
    onUpdate: typeof updateSalesItem;
    onAdd: () => void;
    onRemove: (idx: number) => void;
  }) => (
    <>
      <div style={{ border: '1px solid var(--border-primary)', borderRadius: 10, overflow: 'auto', marginBottom: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
              <th style={{ padding: '7px 8px', textAlign: 'left', width: '22%' }}>Reason</th>
              <th style={{ padding: '7px 8px', textAlign: 'right', width: '10%' }}>Qty</th>
              <th style={{ padding: '7px 8px', textAlign: 'right', width: '12%' }}>Rate</th>
              <th style={{ padding: '7px 8px', textAlign: 'right', width: '16%' }}>Amount (₹) *</th>
              <th style={{ padding: '7px 8px', textAlign: 'center', width: '10%' }}>GST %</th>
              <th style={{ padding: '7px 8px', textAlign: 'right', width: '12%' }}>GST Amt</th>
              <th style={{ padding: '7px 8px', textAlign: 'right', width: '12%' }}>Total</th>
              <th style={{ width: '4%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <ItemRow key={item.id} item={item} idx={idx} onChange={onUpdate} onRemove={onRemove} canRemove={items.length > 1} />
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-action btn-action-ghost" style={{ fontSize: 12 }} onClick={onAdd}>
        <Plus size={13} /> Add Row
      </button>
    </>
  );

  // ────────────────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }} onClick={step !== 'done' ? undefined : onClose} />
      
      {/* Panel */}
      <div style={{ width: '680px', maxWidth: '95vw', background: 'var(--surface-primary)', boxShadow: '-8px 0 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* ── Panel Header ── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-secondary)', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Zap size={18} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Quality Deduction / Debit Note</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Against: <b style={{ color: 'var(--brand-primary)' }}>{salesInvoice.invoiceNo}</b> · {salesInvoice.customer} · ₹{f2(salesInvoice.netTotal)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* ── Step Indicators ── */}
        <div style={{ padding: '12px 24px', background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', gap: 6, flexShrink: 0 }}>
          {['Sales Debit Note', 'Vendor?', 'Purchase Debit Note', 'Done'].map((label, i) => {
            const stepMap: Step[] = ['sales-dn', 'vendor-prompt', 'purchase-dn', 'done'];
            const current = stepMap.indexOf(step);
            const active  = i === current;
            const done    = i < current;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: done ? '#22c55e22' : active ? 'var(--brand-primary)' : 'var(--surface-primary)',
                  color: done ? '#16a34a' : active ? '#fff' : 'var(--text-muted)',
                  border: done ? '1px solid #22c55e44' : active ? 'none' : '1px solid var(--border-primary)',
                }}>{done ? '✓ ' : ''}{label}</span>
                {i < 3 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
              </div>
            );
          })}
        </div>

        {/* ── Step: Sales Debit Note ── */}
        {step === 'sales-dn' && (
          <div style={{ padding: 24, flexGrow: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Debit Note Date</label>
                <input type="date" value={salesDate} onChange={e => setSalesDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Remarks</label>
                <input value={salesRemarks} onChange={e => setSalesRemarks(e.target.value)}
                  placeholder="Optional note"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            <ItemTable items={salesItems} onUpdate={updateSalesItem} onAdd={addSalesRow} onRemove={removeSalesRow} />

            {formErr && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 13 }}>
                {formErr}
              </div>
            )}

            {/* Totals */}
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Taxable Deduction:</span><b style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{f2(salesSubtotal)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>GST Reversal:</span><b style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{f2(salesGst)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#ef4444', borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: 8, marginTop: 4 }}>
                <span>Net Deduction from Customer:</span><span>₹{f2(salesNet)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-action btn-action-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-action btn-action-primary" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderColor: 'transparent' }} onClick={handlePostSales}>
                <Zap size={15} /> Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Vendor Prompt ── */}
        {step === 'vendor-prompt' && (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Raise with Vendor too?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
                You've raised a quality deduction of <b style={{ color: '#ef4444' }}>₹{f2(salesNet)}</b> against <b>{salesInvoice.customer}</b>.
                <br /><br />
                Do you also want to raise a <b>Purchase Debit Note</b> against your vendor for the same issue?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                className="btn-action btn-action-secondary"
                style={{ padding: '12px 28px', fontSize: 14 }}
                onClick={() => handleFinalPost(false)}
              >
                No, skip vendor
              </button>
              <button
                className="btn-action btn-action-primary"
                style={{ padding: '12px 28px', fontSize: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderColor: 'transparent' }}
                onClick={handleVendorYes}
              >
                <Zap size={15} /> Yes, raise with vendor →
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              <b>Sales Debit Note:</b> Dr Sales Returns, Dr Output GST · Cr Accounts Receivable<br />
              <b>Purchase Debit Note (if yes):</b> Dr Accounts Payable · Cr Purchase Returns, Cr Input GST
            </div>
          </div>
        )}

        {/* ── Step: Purchase Debit Note ── */}
        {step === 'purchase-dn' && (
          <div style={{ padding: 24, flexGrow: 1 }}>
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#2563eb' }}>
              <b>Purchase Debit Note:</b> Verify / adjust quantities and rates for the vendor's purchase invoice.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date</label>
                <input type="date" value={purchDate} onChange={e => setPurchDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Vendor Name *</label>
                <input value={purchVendor} onChange={e => setPurchVendor(e.target.value)} placeholder="Vendor name"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Related Purchase Invoice</label>
                <input value={purchInvNo} onChange={e => setPurchInvNo(e.target.value)} placeholder="e.g. PI-2026-06-001"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            <ItemTable items={purchItems} onUpdate={updatePurchItem} onAdd={addPurchRow} onRemove={removePurchRow} />

            {purchErr && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 13 }}>
                {purchErr}
              </div>
            )}

            <div style={{ marginTop: 16, padding: 16, background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Taxable:</span><b style={{ fontFamily: 'monospace' }}>₹{f2(purchSubtotal)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>GST Reversal:</span><b style={{ fontFamily: 'monospace' }}>₹{f2(purchGst)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#2563eb', borderTop: '1px solid rgba(59,130,246,0.2)', paddingTop: 8, marginTop: 4 }}>
                <span>Recovery from Vendor:</span><span>₹{f2(purchNet)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-action btn-action-secondary" onClick={() => setStep('vendor-prompt')}>← Back</button>
              <button className="btn-action btn-action-primary" onClick={() => handleFinalPost(true)}>
                <Check size={15} /> Post Both Debit Notes
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === 'done' && (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 20, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={32} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Debit Note(s) Posted!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
              Journal entries have been automatically generated and posted to the General Ledger.
              View them under <b>Reports → Journal Entries</b>.
            </p>
            <button className="btn-action btn-action-primary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
