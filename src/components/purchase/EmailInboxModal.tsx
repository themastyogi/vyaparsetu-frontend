/**
 * EmailInboxModal.tsx
 * Drawer / Modal for viewing and processing Email-Ingested Purchase Invoices.
 * Inbound Email: invoices.company@vyaparsetu.in
 */
import { useState } from 'react';
import { Mail, RefreshCw, FileText, ArrowRight, CheckCircle2, X, Sparkles, Trash2, Plus } from 'lucide-react';
import { useAccounting, type PurchaseInvoice } from '../../hooks/useAccounting';
import { useMaster } from '../../hooks/useMaster';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDraftToBook: (draft: PurchaseInvoice) => void;
}

export default function EmailInboxModal({ isOpen, onClose, onSelectDraftToBook }: EmailInboxModalProps) {
  const { companySettings, purchaseInvoices, saveDraftPurchaseInvoice, deletePurchaseInvoice } = useAccounting();
  const { vendors, parties } = useMaster();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);

  // Custom simulation form
  const [simForm, setSimForm] = useState({
    vendorName: '',
    senderEmail: '',
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Raw Materials & Inventory Purchase',
    amount: '25000',
    gstRate: 18,
    attachedFileName: 'Vendor_Tax_Invoice.pdf',
  });

  if (!isOpen) return null;

  const draftBills = purchaseInvoices.filter(p => p.status === 'draft');

  // Automatic sync pulling from real vendors in Party Master
  const handleAutoSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const activeVendors = vendors.length > 0 ? vendors : parties;
      const targetVendor = activeVendors.length > 0
        ? activeVendors[Math.floor(Math.random() * activeVendors.length)]
        : { name: 'Sahil Traders', email: 'accounts@sahiltraders.in', gstin: '27AAACS2222B1Z5' };

      const invNo = 'EMAIL-INV-' + Math.floor(1000 + Math.random() * 9000);
      const baseAmount = 15000 + Math.floor(Math.random() * 25000);
      const gstRate = 18;
      const gstAmount = Math.round(baseAmount * (gstRate / 100));
      const total = baseAmount + gstAmount;

      const created = saveDraftPurchaseInvoice({
        invoiceNo: invNo,
        date: new Date().toISOString().split('T')[0],
        vendorName: targetVendor.name,
        vendorGstin: targetVendor.gstin || 'UNREGISTERED',
        items: [
          {
            id: 'item_' + Date.now().toString(36),
            description: 'Inventory & Supplies Order',
            qty: 1,
            rate: baseAmount,
            amount: baseAmount,
            gstRate: gstRate,
            gstAmount: gstAmount,
            total: total,
          }
        ],
        subtotal: baseAmount,
        gstTotal: gstAmount,
        netTotal: total,
        status: 'draft',
        source: 'email',
        senderEmail: targetVendor.email || `invoices@${targetVendor.name.toLowerCase().replace(/\s+/g, '')}.com`,
        receivedAt: new Date().toISOString(),
        attachedFileName: `${targetVendor.name.replace(/\s+/g, '_')}_Invoice_${invNo}.pdf`,
      });

      setIsSyncing(false);
      setSyncToast(`New bill ingested from ${created.vendorName} (${created.invoiceNo})!`);
      setTimeout(() => setSyncToast(null), 3500);
    }, 800);
  };

  const handleCustomSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(simForm.amount) || 10000;
    const gstAmt = Math.round(amt * (simForm.gstRate / 100));
    const total = amt + gstAmt;

    const created = saveDraftPurchaseInvoice({
      invoiceNo: simForm.invoiceNo || 'EMAIL-INV-' + Math.floor(1000 + Math.random() * 9000),
      date: simForm.date,
      vendorName: simForm.vendorName || (vendors[0]?.name || 'Sahil Traders'),
      vendorGstin: vendors.find(v => v.name === simForm.vendorName)?.gstin || '27AAACS2222B1Z5',
      items: [
        {
          id: 'item_' + Date.now().toString(36),
          description: simForm.description,
          qty: 1,
          rate: amt,
          amount: amt,
          gstRate: simForm.gstRate,
          gstAmount: gstAmt,
          total: total,
        }
      ],
      subtotal: amt,
      gstTotal: gstAmt,
      netTotal: total,
      status: 'draft',
      source: 'email',
      senderEmail: simForm.senderEmail || 'billing@vendor.com',
      receivedAt: new Date().toISOString(),
      attachedFileName: simForm.attachedFileName || 'Invoice_Document.pdf',
    });

    setShowSimModal(false);
    setSyncToast(`Draft Bill ${created.invoiceNo} from ${created.vendorName} created!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={20} style={{ color: 'var(--brand-primary)' }}/> Purchase Bill Email Ingestion Inbox
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Inbound Booking Email: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{companySettings.inboundEmail}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
        </div>

        {/* Info banner & actions */}
        <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.18)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Sparkles size={14}/> Vendors email bills to <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{companySettings.inboundEmail}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const defaultV = vendors[0] || parties[0];
              setSimForm({
                vendorName: defaultV?.name || '',
                senderEmail: defaultV?.email || 'sales@vendor.com',
                invoiceNo: 'EMAIL-INV-' + Math.floor(1000 + Math.random() * 9000),
                date: new Date().toISOString().split('T')[0],
                description: 'Custom Raw Materials Order',
                amount: '20000',
                gstRate: 18,
                attachedFileName: 'Vendor_Invoice.pdf',
              });
              setShowSimModal(true);
            }} className="btn-action btn-action-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <Plus size={13}/> Simulate Custom Email
            </button>
            <button onClick={handleAutoSync} disabled={isSyncing} className="btn-action btn-action-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Syncing...' : 'Sync Email Inbox'}
            </button>
          </div>
        </div>

        {syncToast && (
          <div style={{ background: 'rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.3)', padding: '10px 24px', color: '#10B981', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15}/> {syncToast}
          </div>
        )}

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {draftBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Mail size={42} style={{ opacity: 0.3, marginBottom: 12 }}/>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>No Pending Ingested Email Bills</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Vendor emails sent to <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{companySettings.inboundEmail}</span> will automatically appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Draft Bills ({draftBills.length})
              </div>
              {draftBills.map(draft => (
                <div key={draft.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{draft.vendorName}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#D97706', fontWeight: 700 }}>
                        Draft · Email Ingested
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span>Ref: <strong style={{ color: 'var(--text-secondary)' }}>{draft.invoiceNo}</strong></span>
                      <span>Date: <strong>{draft.date}</strong></span>
                      <span>From: <strong style={{ color: 'var(--brand-primary)' }}>{draft.senderEmail || 'email-ingestion'}</strong></span>
                    </div>
                    {draft.attachedFileName && (
                      <div style={{ fontSize: 11, color: '#2563EB', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <FileText size={12}/> Attachment: {draft.attachedFileName}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#10B981' }}>
                      ₹{f2(draft.netTotal)}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => deletePurchaseInvoice(draft.id)} title="Delete Draft Bill"
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        <Trash2 size={13}/>
                      </button>
                      <button onClick={() => { onClose(); onSelectDraftToBook(draft); }}
                        style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Review &amp; Book <ArrowRight size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Custom Email Simulation */}
      {showSimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Simulate Incoming Vendor Email Bill</h3>
              <button onClick={() => setShowSimModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCustomSimulateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">Select Vendor *</label>
                <select required value={simForm.vendorName} onChange={e => {
                  const vName = e.target.value;
                  const vObj = vendors.find(v => v.name === vName);
                  setSimForm(s => ({ ...s, vendorName: vName, senderEmail: vObj?.email || `invoices@${vName.toLowerCase().replace(/\s+/g, '')}.com` }));
                }} className="field-input">
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.email || 'No email registered'})</option>)}
                  {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="field-label">Invoice / Ref No *</label>
                  <input required value={simForm.invoiceNo} onChange={e => setSimForm(s => ({ ...s, invoiceNo: e.target.value }))} className="field-input" style={{ fontFamily: 'monospace' }}/>
                </div>
                <div>
                  <label className="field-label">Date *</label>
                  <input type="date" required value={simForm.date} onChange={e => setSimForm(s => ({ ...s, date: e.target.value }))} className="field-input"/>
                </div>
              </div>

              <div>
                <label className="field-label">Sender Email Address</label>
                <input type="email" value={simForm.senderEmail} onChange={e => setSimForm(s => ({ ...s, senderEmail: e.target.value }))} className="field-input"/>
              </div>

              <div>
                <label className="field-label">Line Item Description</label>
                <input value={simForm.description} onChange={e => setSimForm(s => ({ ...s, description: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="field-label">Taxable Amount (₹) *</label>
                  <input type="number" step="any" required value={simForm.amount} onChange={e => setSimForm(s => ({ ...s, amount: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}/>
                </div>
                <div>
                  <label className="field-label">GST Rate (%)</label>
                  <select value={simForm.gstRate} onChange={e => setSimForm(s => ({ ...s, gstRate: Number(e.target.value) }))} className="field-input">
                    <option value={0}>0% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Attached PDF Filename</label>
                <input value={simForm.attachedFileName} onChange={e => setSimForm(s => ({ ...s, attachedFileName: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowSimModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Create Email Draft Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
