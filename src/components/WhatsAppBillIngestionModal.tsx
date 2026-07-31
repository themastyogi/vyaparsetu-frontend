import { useState } from 'react';
import { MessageSquare, Sparkles, CheckCircle2, FileText, Bot, RefreshCw } from 'lucide-react';
import { MOCK_WHATSAPP_INBOX, type WhatsAppIncomingInvoice } from '../utils/whatsAppInvoiceIngestor';
import { useAccounting, type JournalLine } from '../hooks/useAccounting';

interface Props {
  onClose: () => void;
  onSuccessIngest?: () => void;
}

export default function WhatsAppBillIngestionModal({ onClose, onSuccessIngest }: Props) {
  const { postJournalEntry, companySettings } = useAccounting();
  const [inbox, setInbox] = useState<WhatsAppIncomingInvoice[]>(MOCK_WHATSAPP_INBOX);
  const [selectedInvoice, setSelectedInvoice] = useState<WhatsAppIncomingInvoice | null>(MOCK_WHATSAPP_INBOX[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const activeWhatsAppNo = companySettings.whatsAppNumber || '+91 98765 43210';

  const handleIngestAndPost = (inv: WhatsAppIncomingInvoice) => {
    setIsProcessing(true);

    setTimeout(() => {
      // Create AP Journal Voucher lines
      const lines: JournalLine[] = [
        { account: 'Purchases / Raw Material Stock', debit: inv.extractedData.subtotal, credit: 0 },
        { account: 'Input GST Tax Credit Asset', debit: inv.extractedData.gstTotal, credit: 0 },
        { account: inv.extractedData.vendorName, debit: 0, credit: inv.extractedData.totalAmount }
      ];

      postJournalEntry({
        date: inv.extractedData.invoiceDate,
        entryType: 'Purchase Bill (WhatsApp Ingested)',
        relatedId: inv.id,
        relatedNo: inv.extractedData.invoiceNo,
        party: inv.extractedData.vendorName,
        lines
      });

      // Update local inbox state
      setInbox(prev => prev.map(item => item.id === inv.id ? { ...item, status: 'Ingested & Posted' } : item));
      setIsProcessing(false);
      setIngestSuccess(`Invoice #${inv.extractedData.invoiceNo} from ${inv.extractedData.vendorName} successfully ingested & posted to Accounts Payable!`);

      if (onSuccessIngest) onSuccessIngest();
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 860, height: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', padding: '16px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24}/>
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                WhatsApp Vendor Bill Ingestion Hub <Sparkles size={16} style={{ color: '#FDE047' }}/>
              </h3>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                Configured WhatsApp Number: <strong>{activeWhatsAppNo}</strong> (Tenant ID: <code>tenant_demo_01</code>)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              {showSetupGuide ? '📥 Back to Inbox' : '📖 2-Min Setup Guide'}
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {/* Setup Guide Banner View */}
        {showSetupGuide ? (
          <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-card)' }}>
            <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>📱 How to Setup Your WhatsApp Business Phone Number</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Option A */}
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid #10B981', padding: 20 }}>
                <h5 style={{ fontSize: 15, fontWeight: 800, color: '#10B981', margin: '0 0 8px' }}>Option A: WhatsApp Business App (Free - 2 Mins)</h5>
                <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                  <li>Install <strong>WhatsApp Business App</strong> on your phone.</li>
                  <li>Verify your company SIM card number via SMS OTP.</li>
                  <li>Set Company Name &amp; Profile Picture.</li>
                  <li>Open VyaparSetu ➔ <strong>Purchase Bills</strong> ➔ click <strong>✏ Edit WhatsApp Number</strong> and save your phone number!</li>
                </ol>
              </div>

              {/* Option B */}
              <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, border: '1px solid #3B82F6', padding: 20 }}>
                <h5 style={{ fontSize: 15, fontWeight: 800, color: '#3B82F6', margin: '0 0 8px' }}>Option B: Meta Cloud API (Enterprise Auto-Bot)</h5>
                <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                  <li>Go to <strong>developers.facebook.com</strong> and click <strong>Create App</strong>.</li>
                  <li>Select <strong>Business</strong> and add the <strong>WhatsApp</strong> product.</li>
                  <li>Register phone number &amp; copy <strong>Phone Number ID</strong>.</li>
                  <li>Set Webhook URL: <code>https://api.vyaparsetu.in/v1/whatsapp/webhook</code></li>
                </ol>
              </div>
            </div>

            <button type="button" onClick={() => setShowSetupGuide(false)} className="btn-action btn-action-primary" style={{ background: '#10B981', borderColor: '#10B981' }}>
              Got It! Back to Live WhatsApp Inbox →
            </button>
          </div>
        ) : (
          /* Content Body: Left Inbox List + Right AI Extraction Canvas */
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: WhatsApp Incoming Messages */}
          <div style={{ borderRight: '1px solid var(--border-default)', background: 'var(--bg-elevated)', overflowY: 'auto', padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 10, padding: '0 4px' }}>
              Incoming Vendor Messages ({inbox.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inbox.map(msg => {
                const isSelected = selectedInvoice?.id === msg.id;
                const isIngested = msg.status === 'Ingested & Posted';

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedInvoice(msg)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
                      border: isSelected ? '1.5px solid #10B981' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{msg.senderName}</strong>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <FileText size={13} style={{ color: '#10B981' }}/>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{msg.fileName} ({msg.fileSize})</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>₹{msg.extractedData.totalAmount.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: isIngested ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: isIngested ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                        {msg.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated WhatsApp Vendor Action Tip */}
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', fontSize: 11, color: 'var(--text-secondary)' }}>
              💡 <strong>How Vendors Send Bills:</strong> Vendors simply message their PDF/Photo invoice to your WhatsApp number <strong>{activeWhatsAppNo}</strong>. VyaparSetu AI extracts line items automatically!
            </div>
          </div>

          {/* Right Panel: Selected Invoice AI Extraction Canvas */}
          <div style={{ padding: 24, overflowY: 'auto', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
            {selectedInvoice ? (
              <>
                {ingestSuccess && (
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10B981', color: '#10B981', padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={20}/>
                    <span>{ingestSuccess}</span>
                  </div>
                )}

                {/* AI Document Banner */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-default)', padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#10B981', fontWeight: 800, letterSpacing: '0.05em' }}>AI Vision OCR Extracted Data</span>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0' }}>{selectedInvoice.extractedData.vendorName}</h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>GSTIN: {selectedInvoice.extractedData.vendorGstin} | Bill No: {selectedInvoice.extractedData.invoiceNo}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Bill Value</span>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>₹{selectedInvoice.extractedData.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Extracted Line Items Table */}
                <div style={{ marginBottom: 20, flex: 1 }}>
                  <h5 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>Extracted Line Items &amp; Tax Calculation</h5>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Item Description</th>
                        <th style={{ padding: 8 }}>HSN</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.extractedData.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: 8, fontWeight: 600, color: 'var(--text-primary)' }}>{item.description}</td>
                          <td style={{ padding: 8, color: 'var(--text-muted)' }}>{item.hsn}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>{item.qty}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>₹{item.rate.toLocaleString('en-IN')}</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Breakdown */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <div style={{ width: 240, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Subtotal:</span>
                        <strong>₹{selectedInvoice.extractedData.subtotal.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Input Tax Credit (GST):</span>
                        <strong>₹{selectedInvoice.extractedData.gstTotal.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: 14, fontWeight: 900, borderTop: '1px solid var(--border-default)', paddingTop: 6 }}>
                        <span>Net Payable:</span>
                        <span>₹{selectedInvoice.extractedData.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automated WhatsApp Bot Auto-Reply Preview */}
                <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px dashed #10B981', padding: 12, marginBottom: 16, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bot size={20} style={{ color: '#10B981', flexShrink: 0 }}/>
                  <div>
                    <strong>Auto WhatsApp Confirmation Bot Reply:</strong>
                    <div>"Hi {selectedInvoice.senderName}, your Purchase Invoice #{selectedInvoice.extractedData.invoiceNo} for ₹{selectedInvoice.extractedData.totalAmount.toLocaleString('en-IN')} has been verified &amp; ingested into VyaparSetu AP Ledger."</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" className="btn-action btn-action-ghost" onClick={onClose}>Close</button>
                  {selectedInvoice.status !== 'Ingested & Posted' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleIngestAndPost(selectedInvoice)}
                      className="btn-action btn-action-primary"
                      style={{ padding: '10px 24px', fontWeight: 900, background: '#10B981', borderColor: '#10B981', gap: 8 }}
                    >
                      {isProcessing ? <><RefreshCw size={16} className="animate-spin"/> Ingesting &amp; Posting...</> : <><Sparkles size={16}/> ⚡ Confirm &amp; Post to Purchase Bills</>}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                Select an incoming WhatsApp vendor message on the left panel to inspect AI extracted bill details.
              </div>
            )}
          </div>

        </div>
        )}

      </div>
    </div>
  );
}
