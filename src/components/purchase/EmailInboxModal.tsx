/**
 * EmailInboxModal.tsx
 * Drawer / Modal for viewing and processing Email-Ingested Purchase Invoices.
 * Inbound Email: invoices.company@vyaparsetu.in
 */
import { useState } from 'react';
import { Mail, RefreshCw, FileText, ArrowRight, CheckCircle2, X, Sparkles, ShieldCheck } from 'lucide-react';
import { useAccounting, type PurchaseInvoice } from '../../hooks/useAccounting';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDraftToBook: (draft: PurchaseInvoice) => void;
}

export default function EmailInboxModal({ isOpen, onClose, onSelectDraftToBook }: EmailInboxModalProps) {
  const { companySettings, purchaseInvoices, saveDraftPurchaseInvoice } = useAccounting();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const draftBills = purchaseInvoices.filter(p => p.status === 'draft');

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Create a new realistic incoming email purchase invoice draft
      const sampleVendors = [
        { name: 'Tech Solutions India', email: 'billing@techsolutions.in', gstin: '27AAACS2222B1Z5', item: 'Cloud Server & Maintenance Sub', rate: 14500, gst: 18 },
        { name: 'Rajesh Steel Works',   email: 'invoices@rajeshsteel.com',  gstin: '09AAACK4567N1Z1', item: 'Steel Rods 12mm (Grade A)',      rate: 42000, gst: 18 },
        { name: 'Bharat Packaging',     email: 'sales@bharatpack.in',       gstin: '06AAACB5432F1Z7', item: 'Corrugated Cartons (500 Pcs)',    rate: 18500, gst: 12 },
      ];
      const randomVendor = sampleVendors[Math.floor(Math.random() * sampleVendors.length)];
      const invNo = 'EMAIL-INV-' + Math.floor(1000 + Math.random() * 9000);
      const amount = randomVendor.rate;
      const gstAmount = Math.round(amount * (randomVendor.gst / 100));
      const total = amount + gstAmount;

      const created = saveDraftPurchaseInvoice({
        invoiceNo: invNo,
        date: new Date().toISOString().split('T')[0],
        vendorName: randomVendor.name,
        vendorGstin: randomVendor.gstin,
        items: [
          {
            id: 'item_' + Date.now().toString(36),
            description: randomVendor.item,
            qty: 1,
            rate: amount,
            amount: amount,
            gstRate: randomVendor.gst,
            gstAmount: gstAmount,
            total: total,
          }
        ],
        subtotal: amount,
        gstTotal: gstAmount,
        netTotal: total,
        status: 'draft',
        source: 'email',
        senderEmail: randomVendor.email,
        receivedAt: new Date().toISOString(),
        attachedFileName: `${randomVendor.name.replace(/\s+/g, '_')}_Bill_${invNo}.pdf`,
      });

      setIsSyncing(false);
      setSyncToast(`New bill received from ${created.senderEmail} (${created.invoiceNo})!`);
      setTimeout(() => setSyncToast(null), 3000);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={20} style={{ color: 'var(--brand-primary)' }}/> Purchase Bill Email Ingestion
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Inbound Booking Email: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{companySettings.inboundEmail}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
        </div>

        {/* Info banner */}
        <div style={{ background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14}/> Vendors send PDF/Image invoices to this email. System auto-extracts line items into Draft Bills.
          </div>
          <button onClick={handleSimulateSync} disabled={isSyncing}
            style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Syncing...' : 'Sync Email Inbox'}
          </button>
        </div>

        {syncToast && (
          <div style={{ background: 'rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.3)', padding: '10px 24px', color: '#34D399', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15}/> {syncToast}
          </div>
        )}

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {draftBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Mail size={42} style={{ opacity: 0.3, marginBottom: 12 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No Pending Email Invoices</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Click "Sync Email Inbox" to check for incoming vendor bills</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Ingested Bills ({draftBills.length})
              </div>
              {draftBills.map(draft => (
                <div key={draft.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{draft.vendorName}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#FBBF24', fontWeight: 700 }}>
                        Draft · Email Ingested
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span>Ref: <strong style={{ color: 'var(--text-secondary)' }}>{draft.invoiceNo}</strong></span>
                      <span>Date: <strong>{draft.date}</strong></span>
                      <span>From: <strong style={{ color: 'var(--brand-primary)' }}>{draft.senderEmail}</strong></span>
                    </div>
                    {draft.attachedFileName && (
                      <div style={{ fontSize: 11, color: '#60A5FA', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={12}/> Attachment: {draft.attachedFileName}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#10B981' }}>
                      ₹{f2(draft.netTotal)}
                    </div>
                    <button onClick={() => { onClose(); onSelectDraftToBook(draft); }}
                      style={{ marginTop: 8, padding: '7px 14px', borderRadius: 8, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Review &amp; Book <ArrowRight size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={14} style={{ color: '#10B981' }}/> Automated OCR Line-Item Extraction</span>
          <button className="btn-action btn-action-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
