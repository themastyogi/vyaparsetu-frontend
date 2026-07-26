import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, Camera, Mail,
  Trash2, Link2, X, FileUp
} from 'lucide-react';
import { usePurchaseWizard } from '../components/purchase/usePurchaseWizard';
import PurchaseWizard from '../components/purchase/PurchaseWizard';
import EmailInboxModal from '../components/purchase/EmailInboxModal';
import CompanyProfileModal from '../components/company/CompanyProfileModal';
import { useAccounting, type PurchaseInvoice, type SalesInvoice } from '../hooks/useAccounting';
import { useMaster } from '../hooks/useMaster';
import { extractInvoiceFromPDF } from '../utils/pdfExtractor';
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
    deletePurchaseInvoice, postDraftPurchaseInvoice, linkSalesToPurchase,
  } = useAccounting();

  const [filter,      setFilter]      = useState<'all' | 'posted' | 'draft'>('all');
  const [search,      setSearch]      = useState('');
  const [linkModal,   setLinkModal]   = useState<PurchaseInvoice | null>(null);
  const [showEmailInbox, setShowEmailInbox] = useState(false);
  const [showEditCompanyEmail, setShowEditCompanyEmail] = useState(false);
  const [emailAckToast, setEmailAckToast]   = useState<{ party: string; email: string; invNo: string; amount: number } | null>(null);

  const handleDirectPDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const extracted = await extractInvoiceFromPDF(file);

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
        remarks: `Extracted text from PDF file: ${file.name}`,
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
          <h1 className="page-title">{t('purchase.title', 'Purchase Bills')}</h1>
          <p className="page-sub">Linked to accounting ledger · Email Ingestion · Auto-posted</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input type="text" placeholder="Search by vendor or invoice no…"
            className="toolbar-search-input" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="filter-tabs">
          {(['all', 'posted', 'draft'] as const).map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Bills' : f === 'posted' ? 'Posted Bills' : 'Draft Bills'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Invoice No &amp; Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Linked to SI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No bills found</td></tr>
              ) : filtered.map(p => {
                const linkedSI = getSIForLink(p);
                return (
                  <tr key={p.id}>
                    {/* Vendor */}
                    <td>
                      <div className="party-name-cell">
                        <div className="party-avatar">{p.vendorName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.vendorName}</div>
                          {p.vendorGstin && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.vendorGstin}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Invoice No */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13 }}>{p.invoiceNo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.date}</div>
                    </td>
                    {/* Status */}
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                        background: p.status === 'posted' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: p.status === 'posted' ? '#34D399' : '#FBBF24',
                      }}>
                        {p.status === 'posted' ? 'Posted' : 'Draft (Email)'}
                      </span>
                    </td>
                    {/* Amounts */}
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(p.subtotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f2(p.gstTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{f2(p.netTotal)}</td>
                    {/* Link */}
                    <td>
                      {linkedSI ? (
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link2 size={12}/> {linkedSI.invoiceNo}
                        </div>
                      ) : (
                        <button className="btn-action btn-action-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setLinkModal(p)}>
                          + Link SI
                        </button>
                      )}
                    </td>
                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {p.status === 'draft' && (
                          <button className="btn-action btn-action-primary" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => handlePostDraftDirectly(p)}>
                            Post Bill
                          </button>
                        )}
                        <button className="btn-action btn-action-ghost" style={{ padding: '3px 8px', color: '#ef4444' }} onClick={() => deletePurchaseInvoice(p.id)}>
                          <Trash2 size={13}/>
                        </button>
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

      {/* Purchase Wizard */}
      <PurchaseWizard wizard={wizard} />
    </div>
  );
}
