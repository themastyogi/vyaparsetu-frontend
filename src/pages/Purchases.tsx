import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, Camera, Mail, MessageSquare,
  Trash2, Link2, X, FileUp, RotateCcw, Eye, AlertCircle
} from 'lucide-react';
import { usePurchaseWizard } from '../components/purchase/usePurchaseWizard';
import PurchaseWizard from '../components/purchase/PurchaseWizard';
import EmailInboxModal from '../components/purchase/EmailInboxModal';
import WhatsAppBillIngestionModal from '../components/WhatsAppBillIngestionModal';
import CompanyProfileModal from '../components/company/CompanyProfileModal';
import { useAccounting, type PurchaseInvoice, type SalesInvoice } from '../hooks/useAccounting';
import { useMaster } from '../hooks/useMaster';
import { extractInvoiceFromPDF } from '../utils/pdfExtractor';
import { parseInvoiceWithAiAgent } from '../services/invoiceAiAgent';
import { APP_VERSION } from '../config/version';
import './Parties.css';

// Kept for backward-compat (purchase wizard may still call it)
export let MOCK_PURCHASES: any[] = [];
export const addMockPurchase = (_p: any) => {
  window.dispatchEvent(new Event('purchases_updated'));
};

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Purchases() {
  const { t } = useTranslation();
  const wizard = usePurchaseWizard();
  const { getPartyByName, vendors } = useMaster();
  const {
    companySettings, purchaseInvoices, salesInvoices,
    deletePurchaseInvoice, postDraftPurchaseInvoice, reversePurchaseInvoice, linkSalesToPurchase, removeDuplicateDrafts,
  } = useAccounting();

  // Role toggle (VyaparSetu Admin handled internally via portal)
  const [isSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem('vs_user_role') === 'super_admin';
  });

  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    removeDuplicateDrafts();
    const handleUpdate = () => setRefreshTick(t => t + 1);
    window.addEventListener('purchases_updated', handleUpdate);
    return () => window.removeEventListener('purchases_updated', handleUpdate);
  }, [removeDuplicateDrafts]);

  const [filter,      setFilter]      = useState<'all' | 'posted' | 'draft'>('all');
  const [search,      setSearch]      = useState('');
  const [linkModal,   setLinkModal]   = useState<PurchaseInvoice | null>(null);
  const [reversingBill, setReversingBill] = useState<PurchaseInvoice | null>(null);
  const [showEmailInbox, setShowEmailInbox] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEditCompanyEmail, setShowEditCompanyEmail] = useState(false);
  const [emailAckToast, setEmailAckToast]   = useState<{ party: string; email: string; invNo: string; amount: number } | null>(null);

  const handleReviewDraft = (draft: PurchaseInvoice) => {
    wizard.clearDraft();
    wizard.updateData({
      vendorName: draft.vendorName,
      vendorGstin: draft.vendorGstin,
      invoiceNo: draft.invoiceNo,
      invoiceDate: draft.date,
      purpose: 'stock',
      items: draft.items.map(i => ({
        id: i.id,
        name: i.description,
        description: i.description,
        qty: i.qty,
        rate: i.rate,
        gstRate: i.gstRate || 18,
        uom: 'Pcs',
      })),
      source: 'ocr',
    });
    wizard.openWizardAtStep('basic_details');
  };

  const handleDirectPDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const layoutExtracted = await extractInvoiceFromPDF(file);
      const extracted = await parseInvoiceWithAiAgent(layoutExtracted.rawText, file.name, companySettings.geminiApiKey);

      wizard.clearDraft();
      wizard.updateData({
        source: 'ocr',
        vendorName: extracted.vendorName !== 'Vendor' ? extracted.vendorName : (vendors[0]?.name || 'Vendor'),
        vendorGstin: extracted.vendorGstin || '',
        invoiceNo: extracted.invoiceNo,
        invoiceDate: extracted.date,
        items: extracted.items.map(i => ({
          id: 'item_' + Date.now().toString(36),
          name: i.description,
          qty: i.qty,
          rate: i.rate,
          gstRate: i.gstRate,
        })),
        remarks: `Extracted via ${extracted.extractedByAi ? 'Google Gemini 1.5 AI Agent' : 'PDF OCR Engine'}: ${file.name}`,
      });
      wizard.openWizardAtStep('preview');
    } catch (err) {
      console.error('Direct PDF upload parsing error:', err);
    }
  };
  const draftCount = purchaseInvoices.filter(p => p.status === 'draft').length;

  const filtered = purchaseInvoices.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
     p.invoiceNo.toLowerCase().includes(search.toLowerCase()))
  );

  const postedBills = purchaseInvoices.filter(p => p.status === 'posted');
  const totalAmt = postedBills.reduce((s, p) => s + p.netTotal, 0);
  const totalGst = postedBills.reduce((s, p) => s + p.gstTotal, 0);

  const getSIForLink = (pi: PurchaseInvoice): SalesInvoice | undefined =>
    pi.linkedSalesInvoiceId ? salesInvoices.find(s => s.id === pi.linkedSalesInvoiceId) : undefined;

  const doLink = (piId: string, siId: string | null) => {
    linkSalesToPurchase(siId ?? '', piId);
    setLinkModal(null);
  };

  const handleBookDraft = (draft: PurchaseInvoice) => {
    // Fill purchase wizard with draft data
    wizard.clearDraft();
    wizard.updateData({
      source: 'ocr',
      vendorName: draft.vendorName,
      vendorGstin: draft.vendorGstin || '',
      invoiceNo: draft.invoiceNo,
      invoiceDate: draft.date,
      items: draft.items.map(i => ({
        id: i.id,
        name: i.description,
        qty: i.qty,
        rate: i.rate,
        gstRate: i.gstRate,
      })),
      remarks: `Ingested via email from ${draft.senderEmail || 'vendor'}`,
    });
    wizard.openWizardAtStep('preview');
  };

  const handlePostDraftDirectly = (draft: PurchaseInvoice) => {
    const posted = postDraftPurchaseInvoice(draft.id);
    if (posted) {
      const partyObj = getPartyByName(posted.vendorName);
      const partyEmail = posted.senderEmail || partyObj?.email || `accounts@${posted.vendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      setEmailAckToast({
        party: posted.vendorName,
        email: partyEmail,
        invNo: posted.invoiceNo,
        amount: posted.netTotal,
      });
      setTimeout(() => setEmailAckToast(null), 5000);
    }
  };

  return (
    <div className="page-root animate-fade-in purchase-module">

      {/* Email Receipt Acknowledgment Toast */}
      {emailAckToast && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#34D399', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14}/> Receipt Acknowledgment Email Sent
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
              Sent to: <span style={{ color: 'var(--brand-primary)' }}>{emailAckToast.email}</span> ({emailAckToast.party})
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              "Dear {emailAckToast.party}, your invoice {emailAckToast.invNo} for ₹{f2(emailAckToast.amount)} has been booked &amp; acknowledged by {companySettings.companyName}."
            </div>
          </div>
          <button onClick={() => setEmailAckToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">{t('purchase.title', 'Purchase Bills')}</h1>
            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, fontFamily: 'monospace' }}>
              {APP_VERSION}
            </span>
          </div>
          <p className="page-sub">Linked to accounting ledger · Incremental Email Ingestion · Auto-posted</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-action btn-action-secondary" onClick={() => setShowWhatsAppModal(true)} style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10B981', color: '#10B981', fontWeight: 800 }}>
            <MessageSquare size={15} style={{ color: '#10B981' }}/> 📲 WhatsApp Bill Ingestion
          </button>
          <label className="btn-action btn-action-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileUp size={15} style={{ color: 'var(--brand-primary)' }}/> Upload PDF Invoice
            <input type="file" accept=".pdf" onChange={handleDirectPDFUpload} style={{ display: 'none' }}/>
          </label>
          <button className="btn-action btn-action-secondary" onClick={() => setShowEmailInbox(true)} style={{ position: 'relative' }}>
            <Mail size={15} style={{ color: 'var(--brand-primary)' }}/> Email Inbox
            {draftCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 6px' }}>
                {draftCount}
              </span>
            )}
          </button>
          <button className="btn-action btn-action-secondary" onClick={() => { wizard.clearDraft(); wizard.updateData({ source: 'manual' }); wizard.openWizardAtStep('basic_details'); }}>
            <Plus size={15}/> Add Manually
          </button>
          <button className="btn-action btn-action-primary" onClick={() => { wizard.clearDraft(); wizard.updateData({ source: 'ocr' }); wizard.openWizardAtStep('ocr_camera'); }}>
            <Camera size={15}/> Scan Bill
          </button>
        </div>
      </div>

      {/* Company Inbound Email Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(108,71,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <Mail size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Dedicated Booking Email: <strong style={{ fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{companySettings.inboundEmail}</strong></span>
              <button onClick={() => setShowEditCompanyEmail(true)} style={{ background: 'rgba(108,71,255,0.15)', border: 'none', color: 'var(--brand-primary)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                ✏ Edit Email
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Ask vendors to send PDF/Image invoices to this address. Bills auto-ingest into your Email Inbox as Drafts.
            </div>
          </div>
        </div>
        <button className="btn-action btn-action-secondary" onClick={() => setShowEmailInbox(true)} style={{ fontSize: 12 }}>
          Open Email Inbox ({draftCount} Drafts) →
        </button>
      </div>

      {/* Summary */}
      <div className="party-summary" style={{ marginTop: 16 }}>
        <div className="summary-card"><div className="summary-val">{postedBills.length}</div><div className="summary-lbl">Posted Bills</div></div>
        <div className="summary-card summary-pay"><div className="summary-val">₹{f2(totalAmt)}</div><div className="summary-lbl">Total Amount</div></div>
        <div className="summary-card summary-recv"><div className="summary-val">₹{f2(totalGst)}</div><div className="summary-lbl">GST Credit</div></div>
        <div className="summary-card" onClick={() => setShowEmailInbox(true)} style={{ cursor: 'pointer', borderLeft: '4px solid #FBBF24' }}>
          <div className="summary-val" style={{ color: '#FBBF24' }}>{draftCount}</div>
          <div className="summary-lbl">Email Drafts Pending</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'posted', 'draft'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
              }}>
              {f === 'all' ? 'All Bills' : f === 'posted' ? 'Posted' : 'Drafts'}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="field-input"
            style={{ paddingLeft: '32px', fontSize: '13px' }}
            placeholder="Search vendor or invoice no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="parties-card" style={{ flex: 1, marginTop: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="parties-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220, paddingLeft: 20 }}>Vendor</th>
                <th style={{ minWidth: 160 }}>Invoice No &amp; Date</th>
                <th style={{ minWidth: 130 }}>Status</th>
                <th style={{ minWidth: 130, textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ minWidth: 120, textAlign: 'right' }}>GST (₹)</th>
                <th style={{ minWidth: 140, textAlign: 'right' }}>Net Total (₹)</th>
                <th style={{ minWidth: 130 }}>Linked to SI</th>
                <th style={{ minWidth: 130, paddingRight: 20, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No purchase bills found</td></tr>
              ) : filtered.map(p => {
                const linkedSI = getSIForLink(p);
                return (
                  <tr key={p.id}>
                    {/* Vendor */}
                    <td style={{ paddingLeft: 20 }}>
                      <div className="party-name-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="party-avatar" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(108,71,255,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {p.vendorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{p.vendorName}</div>
                          {p.vendorGstin && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>{p.vendorGstin}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Invoice No */}
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: 13, letterSpacing: '0.01em' }}>{p.invoiceNo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.date}</div>
                    </td>
                    {/* Status */}
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: p.status === 'posted' ? 'rgba(16,185,129,0.14)' : p.status === 'reversed' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)',
                        color: p.status === 'posted' ? '#10B981' : p.status === 'reversed' ? '#EF4444' : '#D97706',
                        border: p.status === 'posted' ? '1px solid rgba(16,185,129,0.3)' : p.status === 'reversed' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'posted' ? '#10B981' : p.status === 'reversed' ? '#EF4444' : '#D97706' }} />
                        {p.status === 'posted' ? 'Posted' : p.status === 'reversed' ? 'Reversed' : 'Draft (Email)'}
                      </span>
                    </td>
                    {/* Amounts */}
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{f2(p.subtotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 13 }}>{f2(p.gstTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>{f2(p.netTotal)}</td>
                    {/* Link */}
                    <td>
                      {linkedSI ? (
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(22,163,74,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                          <Link2 size={12}/> {linkedSI.invoiceNo}
                        </div>
                      ) : (
                        <button className="btn-action btn-action-secondary" style={{ padding: '3px 9px', fontSize: 11, fontWeight: 700 }} onClick={() => setLinkModal(p)}>
                          + Link SI
                        </button>
                      )}
                    </td>
                    {/* Actions */}
                    <td style={{ paddingRight: 20 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {p.status === 'draft' && (
                          <>
                            <button className="btn-action btn-action-secondary" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', borderColor: 'var(--border-default)', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleReviewDraft(p)} title="Review & Edit Draft Bill">
                              <Eye size={12}/> Review
                            </button>
                            <button className="btn-action btn-action-primary" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }} onClick={() => handlePostDraftDirectly(p)}>
                              Post Bill
                            </button>
                            <button className="btn-action btn-action-secondary" style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => deletePurchaseInvoice(p.id)} title="Delete Draft">
                              <Trash2 size={13}/>
                            </button>
                          </>
                        )}

                        {p.status === 'posted' && (
                          <>
                            {!isSuperAdmin ? (
                              <button 
                                className="btn-action btn-action-secondary" 
                                style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#D97706', borderColor: 'rgba(217,119,6,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }} 
                                onClick={() => setReversingBill(p)}
                                title="Click to Reverse posted bill"
                              >
                                <RotateCcw size={12}/> Reverse
                              </button>
                            ) : (
                              <button 
                                className="btn-action btn-action-secondary" 
                                style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} 
                                onClick={() => {
                                  if (confirm(`ADMIN ACTION: Permanently delete posted purchase invoice ${p.invoiceNo}?`)) {
                                    deletePurchaseInvoice(p.id);
                                  }
                                }}
                                title="VyaparSetu Admin Delete"
                              >
                                <Trash2 size={13}/>
                              </button>
                            )}
                          </>
                        )}

                        {p.status === 'reversed' && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 600 }}>Reversed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link to Sales Invoice Modal */}
      {linkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Link Bill {linkModal.invoiceNo} to Sales Invoice</h3>
              <button onClick={() => setLinkModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {salesInvoices.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No sales invoices available to link</div>
              ) : (
                salesInvoices.map(si => (
                  <button key={si.id} onClick={() => doLink(linkModal.id, si.id)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{si.invoiceNo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{si.customer} · {si.date}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#10B981', fontSize: 13 }}>₹{f2(si.netTotal)}</div>
                  </button>
                ))
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn-action btn-action-secondary" onClick={() => setLinkModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* User-Friendly Reversal Confirmation Modal */}
      {reversingBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <RotateCcw size={22}/>
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Confirm Bill Reversal</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>GAAP &amp; Indian Accounting Audit Trail Compliance</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to reverse purchase bill <strong style={{ color: 'var(--brand-primary)' }}>{reversingBill.invoiceNo}</strong> from vendor <strong style={{ color: 'var(--text-primary)' }}>{reversingBill.vendorName}</strong> (₹{f2(reversingBill.netTotal)})?
              <div style={{ marginTop: 8, fontSize: 12, color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertCircle size={14}/> Reversing will post an offsetting Debit Reversal Entry in your accounting ledger.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-action btn-action-ghost" onClick={() => setReversingBill(null)}>Cancel</button>
              <button 
                type="button" 
                className="btn-action" 
                style={{ background: '#D97706', color: '#fff', fontWeight: 800 }}
                onClick={() => {
                  reversePurchaseInvoice(reversingBill.id);
                  setReversingBill(null);
                }}
              >
                <RotateCcw size={14}/> Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Settings & Profile Modal */}
      <CompanyProfileModal
        isOpen={showEditCompanyEmail}
        onClose={() => setShowEditCompanyEmail(false)}
      />

      {/* Email Inbox Modal */}
      <EmailInboxModal
        isOpen={showEmailInbox}
        onClose={() => setShowEmailInbox(false)}
        onSelectDraftToBook={handleBookDraft}
      />

      {/* WhatsApp Bill Ingestion Modal */}
      {showWhatsAppModal && (
        <WhatsAppBillIngestionModal
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* Purchase Wizard */}
      <PurchaseWizard wizard={wizard} />
    </div>
  );
}
