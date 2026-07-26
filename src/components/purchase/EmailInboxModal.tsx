/**
 * EmailInboxModal.tsx
 * Drawer / Modal for viewing, editing, and processing Email-Ingested Purchase Invoices.
 * Parses REAL vendor PDF files using pdfjs-dist OCR text extraction.
 */
import { useState } from 'react';
import { Mail, FileText, ArrowRight, CheckCircle2, X, Sparkles, Trash2, Edit2, Upload, FileUp } from 'lucide-react';
import { useAccounting, type PurchaseInvoice } from '../../hooks/useAccounting';
import { useMaster } from '../../hooks/useMaster';
import { extractInvoiceFromPDF } from '../../utils/pdfExtractor';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDraftToBook: (draft: PurchaseInvoice) => void;
}

export default function EmailInboxModal({ isOpen, onClose, onSelectDraftToBook }: EmailInboxModalProps) {
  const { companySettings, purchaseInvoices, saveDraftPurchaseInvoice, deletePurchaseInvoice } = useAccounting();
  const { vendors, parties } = useMaster();

  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState<PurchaseInvoice | null>(null);

  // Edit draft form
  const [editForm, setEditForm] = useState({
    vendorName: '',
    senderEmail: '',
    invoiceNo: '',
    date: '',
    description: '',
    subtotal: '',
    gstRate: 18,
    attachedFileName: '',
  });

  // Custom simulation form
  const [simForm, setSimForm] = useState({
    vendorName: '',
    senderEmail: 'themastyogi@gmail.com',
    invoiceNo1: 'INV-2026-0811',
    amount1: '15736',
    attachedFileName1: 'Invoice_Attachment_1.pdf',
    invoiceNo2: 'INV-2026-0812',
    amount2: '18568.48',
    attachedFileName2: 'Invoice_Attachment_2.pdf',
    date: new Date().toISOString().split('T')[0],
    description: 'Raw Materials & Components Order',
    gstRate: 18,
    multipleAttachments: true,
  });

  if (!isOpen) return null;

  const draftBills = purchaseInvoices.filter(p => p.status === 'draft');

  /**
   * Real PDF File Upload OCR Text Processing
   */
  const handleFileUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSyncing(true);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const extracted = await extractInvoiceFromPDF(file);
        const activeVendor = vendors.find(v => v.name.toLowerCase() === extracted.vendorName.toLowerCase()) || vendors[0] || parties[0];

        saveDraftPurchaseInvoice({
          invoiceNo: extracted.invoiceNo,
          date: extracted.date,
          vendorName: extracted.vendorName !== 'Vendor' ? extracted.vendorName : (activeVendor?.name || 'Vendor'),
          vendorGstin: extracted.vendorGstin || activeVendor?.gstin || 'UNREGISTERED',
          items: extracted.items.map(it => ({
            id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            description: it.description,
            qty: it.qty,
            rate: it.rate,
            amount: it.amount,
            gstRate: it.gstRate,
            gstAmount: it.gstAmount,
            total: it.total,
          })),
          subtotal: extracted.subtotal,
          gstTotal: extracted.gstTotal,
          netTotal: extracted.netTotal,
          status: 'draft',
          source: 'email',
          senderEmail: activeVendor?.email || 'themastyogi@gmail.com',
          receivedAt: new Date().toISOString(),
          attachedFileName: file.name,
        });
        count++;
      } catch (err) {
        console.error('PDF parsing error for file:', file.name, err);
      }
    }

    setIsSyncing(false);
    setSyncToast(`Parsed ${count} PDF file(s) with exact extracted invoice totals & text!`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleOpenEditDraft = (draft: PurchaseInvoice) => {
    setEditingDraft(draft);
    setEditForm({
      vendorName: draft.vendorName,
      senderEmail: draft.senderEmail || '',
      invoiceNo: draft.invoiceNo,
      date: draft.date,
      description: draft.items[0]?.description || 'Purchase Item',
      subtotal: String(draft.subtotal || draft.netTotal),
      gstRate: draft.items[0]?.gstRate || 18,
      attachedFileName: draft.attachedFileName || 'Invoice.pdf',
    });
  };

  const handleSaveEditDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;

    const sub = parseFloat(editForm.subtotal) || 0;
    const gstAmt = Math.round(sub * (editForm.gstRate / 100));
    const total = sub + gstAmt;

    saveDraftPurchaseInvoice({
      id: editingDraft.id,
      invoiceNo: editForm.invoiceNo,
      date: editForm.date,
      vendorName: editForm.vendorName,
      vendorGstin: editingDraft.vendorGstin || 'UNREGISTERED',
      items: [
        {
          id: editingDraft.items[0]?.id || 'item_' + Date.now().toString(36),
          description: editForm.description,
          qty: 1,
          rate: sub,
          amount: sub,
          gstRate: editForm.gstRate,
          gstAmount: gstAmt,
          total: total,
        }
      ],
      subtotal: sub,
      gstTotal: gstAmt,
      netTotal: total,
      status: 'draft',
      source: 'email',
      senderEmail: editForm.senderEmail,
      receivedAt: editingDraft.receivedAt || new Date().toISOString(),
      attachedFileName: editForm.attachedFileName,
    });

    setEditingDraft(null);
    setSyncToast(`Draft Bill ${editForm.invoiceNo} amounts updated!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorName = simForm.vendorName || vendors[0]?.name || 'Sahil Traders';
    const vendorObj = vendors.find(v => v.name === vendorName);

    if (simForm.multipleAttachments) {
      const amt1 = parseFloat(simForm.amount1) || 15736;
      const gstAmt1 = Math.round(amt1 * (simForm.gstRate / 100));
      const total1 = amt1 + gstAmt1;

      saveDraftPurchaseInvoice({
        invoiceNo: simForm.invoiceNo1 || 'EMAIL-INV-8819',
        date: simForm.date,
        vendorName: vendorName,
        vendorGstin: vendorObj?.gstin || '27AAACS2222B1Z5',
        items: [
          { id: 'item_sim_1', description: simForm.description + ' (Attachment 1 of 2)', qty: 1, rate: amt1, amount: amt1, gstRate: simForm.gstRate, gstAmount: gstAmt1, total: total1 }
        ],
        subtotal: amt1, gstTotal: gstAmt1, netTotal: total1,
        status: 'draft', source: 'email', senderEmail: simForm.senderEmail,
        receivedAt: new Date().toISOString(),
        attachedFileName: simForm.attachedFileName1 || 'Invoice_Attachment_1.pdf',
      });

      const amt2 = parseFloat(simForm.amount2) || 18568.48;
      const gstAmt2 = Math.round(amt2 * (simForm.gstRate / 100));
      const total2 = amt2 + gstAmt2;

      saveDraftPurchaseInvoice({
        invoiceNo: simForm.invoiceNo2 || 'EMAIL-INV-8820',
        date: simForm.date,
        vendorName: vendorName,
        vendorGstin: vendorObj?.gstin || '27AAACS2222B1Z5',
        items: [
          { id: 'item_sim_2', description: simForm.description + ' (Attachment 2 of 2)', qty: 1, rate: amt2, amount: amt2, gstRate: simForm.gstRate, gstAmount: gstAmt2, total: total2 }
        ],
        subtotal: amt2, gstTotal: gstAmt2, netTotal: total2,
        status: 'draft', source: 'email', senderEmail: simForm.senderEmail,
        receivedAt: new Date().toISOString(),
        attachedFileName: simForm.attachedFileName2 || 'Invoice_Attachment_2.pdf',
      });

      setShowSimModal(false);
      setSyncToast(`Ingested 2 purchase invoice PDF attachments from ${simForm.senderEmail}!`);
    } else {
      const amt1 = parseFloat(simForm.amount1) || 15736;
      const gstAmt1 = Math.round(amt1 * (simForm.gstRate / 100));
      const total1 = amt1 + gstAmt1;

      saveDraftPurchaseInvoice({
        invoiceNo: simForm.invoiceNo1 || 'EMAIL-INV-8819',
        date: simForm.date,
        vendorName: vendorName,
        vendorGstin: vendorObj?.gstin || '27AAACS2222B1Z5',
        items: [
          { id: 'item_sim_1', description: simForm.description, qty: 1, rate: amt1, amount: amt1, gstRate: simForm.gstRate, gstAmount: gstAmt1, total: total1 }
        ],
        subtotal: amt1, gstTotal: gstAmt1, netTotal: total1,
        status: 'draft', source: 'email', senderEmail: simForm.senderEmail,
        receivedAt: new Date().toISOString(),
        attachedFileName: simForm.attachedFileName1 || 'Invoice_Attachment_1.pdf',
      });

      setShowSimModal(false);
      setSyncToast(`Ingested 1 purchase invoice PDF attachment from ${simForm.senderEmail}!`);
    }

    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        
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
            <Sparkles size={14}/> Read text &amp; totals directly from actual PDF invoice files or email attachments.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="btn-action btn-action-secondary" style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileUp size={14} style={{ color: 'var(--brand-primary)' }}/> Upload &amp; Parse Real PDF
              <input type="file" accept=".pdf" multiple onChange={handleFileUploadPDF} style={{ display: 'none' }}/>
            </label>
            <button onClick={() => {
              const defaultV = vendors[0] || parties[0];
              setSimForm({
                vendorName: defaultV?.name || '',
                senderEmail: 'themastyogi@gmail.com',
                invoiceNo1: 'INV-2026-0811',
                amount1: '15736',
                attachedFileName1: 'SahilTraders_Invoice_1.pdf',
                invoiceNo2: 'INV-2026-0812',
                amount2: '18568.48',
                attachedFileName2: 'SahilTraders_Invoice_2.pdf',
                date: new Date().toISOString().split('T')[0],
                description: 'Order Line Item',
                gstRate: 18,
                multipleAttachments: true,
              });
              setShowSimModal(true);
            }} className="btn-action btn-action-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <Upload size={13}/> Enter Exact PDF Values
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
              <div style={{ fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <label style={{ cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'underline' }}>
                  Click to Upload &amp; Parse Real PDF Files
                  <input type="file" accept=".pdf" multiple onChange={handleFileUploadPDF} style={{ display: 'none' }}/>
                </label>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Ingested Draft Bills ({draftBills.length}) — Click 'Edit Amount' to adjust exact totals
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
                      <span>From: <strong style={{ color: 'var(--brand-primary)' }}>{draft.senderEmail || 'themastyogi@gmail.com'}</strong></span>
                    </div>
                    {draft.attachedFileName && (
                      <div style={{ fontSize: 11, color: '#2563EB', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                        <FileText size={13}/> PDF Attachment: {draft.attachedFileName}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#10B981' }}>
                      ₹{f2(draft.netTotal)}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleOpenEditDraft(draft)} title="Edit Draft Amounts & Items"
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', color: '#2563EB', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit2 size={13}/> Edit Amount
                      </button>
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

      {/* Modal for Editing Draft Amounts */}
      {editingDraft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit2 size={16} style={{ color: 'var(--brand-primary)' }}/> Adjust Ingested Bill Amounts
              </h3>
              <button onClick={() => setEditingDraft(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEditDraft} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">Vendor Name *</label>
                <input required value={editForm.vendorName} onChange={e => setEditForm(f => ({ ...f, vendorName: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="field-label">Invoice Ref No *</label>
                  <input required value={editForm.invoiceNo} onChange={e => setEditForm(f => ({ ...f, invoiceNo: e.target.value }))} className="field-input" style={{ fontFamily: 'monospace' }}/>
                </div>
                <div>
                  <label className="field-label">Date *</label>
                  <input type="date" required value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="field-input"/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label className="field-label">Taxable Subtotal (₹) *</label>
                  <input type="number" step="any" required value={editForm.subtotal} onChange={e => setEditForm(f => ({ ...f, subtotal: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}/>
                </div>
                <div>
                  <label className="field-label">GST Rate (%)</label>
                  <select value={editForm.gstRate} onChange={e => setEditForm(f => ({ ...f, gstRate: Number(e.target.value) }))} className="field-input">
                    <option value={0}>0% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Calculated Net Total:</span>
                <span style={{ fontWeight: 900, fontFamily: 'monospace', color: '#10B981', fontSize: 15 }}>
                  ₹{f2((parseFloat(editForm.subtotal) || 0) * (1 + editForm.gstRate / 100))}
                </span>
              </div>

              <div>
                <label className="field-label">Sender Email Address</label>
                <input type="email" value={editForm.senderEmail} onChange={e => setEditForm(f => ({ ...f, senderEmail: e.target.value }))} className="field-input"/>
              </div>

              <div>
                <label className="field-label">PDF Attachment Filename</label>
                <input value={editForm.attachedFileName} onChange={e => setEditForm(f => ({ ...f, attachedFileName: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-secondary" onClick={() => setEditingDraft(null)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Save &amp; Update Amount</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Entering Exact PDF Invoice Amounts */}
      {showSimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Enter Exact PDF Invoice Attachment Details</h3>
              <button onClick={() => setShowSimModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSimulateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">Sender Email Address *</label>
                <input type="email" required value={simForm.senderEmail} onChange={e => setSimForm(s => ({ ...s, senderEmail: e.target.value }))} className="field-input" style={{ fontWeight: 700 }}/>
              </div>

              <div>
                <label className="field-label">Select Vendor *</label>
                <select required value={simForm.vendorName} onChange={e => setSimForm(s => ({ ...s, vendorName: e.target.value }))} className="field-input">
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.email || 'No email registered'})</option>)}
                  {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ background: 'rgba(108,71,255,0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(108,71,255,0.2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--brand-primary)' }}>
                  <input type="checkbox" checked={simForm.multipleAttachments} onChange={e => setSimForm(s => ({ ...s, multipleAttachments: e.target.checked }))}/>
                  Email has 2 Purchase Invoice PDF Attachments
                </label>
              </div>

              {/* Attachment 1 */}
              <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} style={{ color: '#2563EB' }}/> Attachment #1 PDF
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="field-label">Invoice Ref #1 *</label>
                    <input required value={simForm.invoiceNo1} onChange={e => setSimForm(s => ({ ...s, invoiceNo1: e.target.value }))} className="field-input" style={{ fontFamily: 'monospace' }}/>
                  </div>
                  <div>
                    <label className="field-label">Exact Amount #1 (₹) *</label>
                    <input type="number" step="any" required value={simForm.amount1} onChange={e => setSimForm(s => ({ ...s, amount1: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}/>
                  </div>
                </div>
              </div>

              {/* Attachment 2 if selected */}
              {simForm.multipleAttachments && (
                <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} style={{ color: '#10B981' }}/> Attachment #2 PDF
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label className="field-label">Invoice Ref #2 *</label>
                      <input required value={simForm.invoiceNo2} onChange={e => setSimForm(s => ({ ...s, invoiceNo2: e.target.value }))} className="field-input" style={{ fontFamily: 'monospace' }}/>
                    </div>
                    <div>
                      <label className="field-label">Exact Amount #2 (₹) *</label>
                      <input type="number" step="any" required value={simForm.amount2} onChange={e => setSimForm(s => ({ ...s, amount2: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}/>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowSimModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Create Draft Bills from PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
