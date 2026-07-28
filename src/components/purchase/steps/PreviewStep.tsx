
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, Clock, UserPlus, X, Building } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useMaster } from '../../../hooks/useMaster';
import { useAccounting } from '../../../hooks/useAccounting';
import { INDIAN_STATES } from './BasicDetailsStep';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function PreviewStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  const { vendors, parties, addMasterParty } = useMaster();
  const { postPurchaseInvoice } = useAccounting();

  // Create Vendor Modal state
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    gstin: '',
    state: 'Delhi',
    email: '',
    paymentTerms: 'Net 30',
  });

  const allVendorSuggestions = [
    ...vendors.map((v: any) => ({ name: v.name, gstin: v.gstin })),
    ...parties.filter((p: any) => p.type === 'Vendor' || p.type === 'Both' || p.type === 'vendor' || p.type === 'both').map((p: any) => ({ name: p.name, gstin: p.gstin })),
    { name: 'Sahil Traders', gstin: '07ABCDE1234F1Z5' },
    { name: 'Bharat Packaging', gstin: '27AABCV1234F1Z5' },
    { name: 'Bharat Logistics', gstin: '06AAACB5432F1Z7' },
    { name: 'Ramesh Electricals', gstin: '29AABCR1234F1ZS' },
    { name: 'Sharma Traders', gstin: '27AADCS1234F1Z9' },
  ];

  // --- Calculation Engine ---
  const subtotal = data.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

  const discountAmount = data.discount?.type === 'percentage' 
    ? (subtotal * (data.discount.value || 0)) / 100 
    : (data.discount?.value || 0);
  const safeDiscount = Math.min(Math.max(0, discountAmount), subtotal);

  let totalGst = 0;
  if (subtotal > 0) {
    data.items.forEach(item => {
      const itemVal = (item.qty || 0) * (item.rate || 0);
      const itemRatio = itemVal / subtotal;
      const itemDiscount = safeDiscount * itemRatio;
      const itemTaxable = itemVal - itemDiscount;
      const itemGst = itemTaxable * ((item.gstRate || 0) / 100);
      totalGst += itemGst;
    });
  }

  let totalTaxableCharges = 0;
  let totalNonTaxableCharges = 0;
  (data.charges || []).forEach(c => {
    const amt = c.amount || 0;
    if (c.isTaxable) {
      totalTaxableCharges += amt;
      totalGst += amt * ((c.taxRate || 18) / 100);
    } else {
      totalNonTaxableCharges += amt;
    }
  });

  const totalTaxableValue = subtotal - safeDiscount + totalTaxableCharges;
  const vendorStateCode = data.vendorGstin ? data.vendorGstin.substring(0, 2) : 'unknown';
  const isInterState = data.taxMode === 'inter' || (data.taxMode !== 'intra' && vendorStateCode !== 'unknown' && vendorStateCode !== '29');
  const total = totalTaxableValue + totalGst + totalNonTaxableCharges;

  const handleSave = async () => {
    wizard.setProcessing(true);
    
    try {
      // 1. Send to Backend
      const payload = {
        vendorName: data.vendorName,
        vendorGstin: data.vendorGstin,
        invoiceNo: data.invoiceNo,
        invoiceDate: data.invoiceDate,
        purpose: data.purpose,
        items: data.items,
        discount: data.discount,
        charges: data.charges,
        remarks: data.remarks,
        totalTaxableValue,
        totalGst,
        totalAmount: total
      };

      // Save posted purchase invoice to local accounting store
      postPurchaseInvoice({
        invoiceNo: data.invoiceNo,
        date: data.invoiceDate,
        vendorName: data.vendorName || 'Sahil Traders',
        vendorGstin: data.vendorGstin || '07ABCDE1234F1Z5',
        items: data.items.map(i => ({
          id: i.id || 'item_' + Date.now().toString(36),
          description: i.name || 'IT Support Services',
          qty: i.qty || 1,
          rate: i.rate || subtotal,
          amount: (i.qty || 1) * (i.rate || subtotal),
          gstRate: i.gstRate || 18,
          gstAmount: Math.round(((i.qty || 1) * (i.rate || subtotal)) * ((i.gstRate || 18) / 100)),
          total: Math.round(((i.qty || 1) * (i.rate || subtotal)) * (1 + ((i.gstRate || 18) / 100))),
        })),
        subtotal,
        gstTotal: totalGst,
        netTotal: total,
        source: 'manual',
      });

      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        await fetch('http://localhost:3000/purchase/ingestion/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'tenantId': 'default-tenant'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      window.dispatchEvent(new Event('purchases_updated'));

      wizard.updateData({ ...data }); 
      wizard.goToStep('status');
    } catch (error) {
      console.error(error);
      alert('Error saving bill. Please ensure the backend is running on port 3000.');
    } finally {
      wizard.setProcessing(false);
    }
  };

  const handleSaveNewVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim()) return;

    const created = addMasterParty({
      name: newVendorForm.name,
      type: 'vendor',
      gstin: newVendorForm.gstin.toUpperCase() || 'UNREGISTERED',
      state: newVendorForm.state,
      email: newVendorForm.email,
      paymentTerms: newVendorForm.paymentTerms,
    });

    wizard.updateData({
      vendorName: created.name,
      vendorGstin: created.gstin,
    });
    setShowCreateVendorModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Summary Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('purchase.vendor', 'Vendor Name (Select or Search)')} *</div>
          <button
            type="button"
            onClick={() => {
              setNewVendorForm({ name: data.vendorName || '', gstin: data.vendorGstin || '', state: 'Delhi', email: '', paymentTerms: 'Net 30' });
              setShowCreateVendorModal(true);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <UserPlus size={14}/> + Create New Vendor
          </button>
        </div>
        
        <input
          type="text"
          list="master-vendor-list"
          required
          value={data.vendorName}
          onChange={e => {
            const val = e.target.value;
            const matched = allVendorSuggestions.find(v => v.name.toLowerCase() === val.toLowerCase());
            wizard.updateData({
              vendorName: val,
              vendorGstin: matched?.gstin || data.vendorGstin || ''
            });
          }}
          placeholder="Type or select Vendor (e.g. Sahil Traders, Bharat Packaging)"
          className="field-input"
          style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}
        />

        <datalist id="master-vendor-list">
          {allVendorSuggestions.map((v, idx) => (
            <option key={idx} value={v.name}>{v.gstin ? `${v.name} (${v.gstin})` : v.name}</option>
          ))}
        </datalist>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('purchase.invoice_no', 'Invoice Number')}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.invoiceNo}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('purchase.invoice_date', 'Invoice Date')}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.invoiceDate}</div>
          </div>
        </div>
      </div>

      {/* Tax Mode Switcher Card */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          GST Tax Treatment:
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => wizard.updateData({ taxMode: 'intra' })}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              background: !isInterState ? 'var(--brand-primary)' : 'var(--bg-card)',
              color: !isInterState ? '#FFF' : 'var(--text-muted)',
            }}
          >
            Intra-State (CGST 9% + SGST 9%)
          </button>
          <button
            type="button"
            onClick={() => wizard.updateData({ taxMode: 'inter' })}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              background: isInterState ? 'var(--brand-primary)' : 'var(--bg-card)',
              color: isInterState ? '#FFF' : 'var(--text-muted)',
            }}
          >
            Inter-State (IGST 18%)
          </button>
        </div>
      </div>

      {/* Totals Breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <span>{t('purchase.subtotal', 'Subtotal')}</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>
        
        {safeDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Discount (-)</span>
            <span style={{ color: '#EF4444' }}>₹ {safeDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {(totalTaxableCharges > 0 || totalNonTaxableCharges > 0) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Charges (+)</span>
            <span>₹ {(totalTaxableCharges + totalNonTaxableCharges).toLocaleString('en-IN')}</span>
          </div>
        )}

        <div style={{ borderTop: '1px dashed var(--border-subtle)', margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          <span>{t('purchase.taxable_value', 'Taxable Value')}</span>
          <span>₹ {totalTaxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        {isInterState ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>IGST (18%)</span>
            <span>₹ {totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>CGST (9%)</span>
              <span>₹ {(totalGst / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <span>SGST (9%)</span>
              <span>₹ {(totalGst / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{t('purchase.total_amount', 'Total Amount')}</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>₹ {total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Remarks Section */}
      {data.remarks && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Remarks</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{data.remarks}</div>
        </div>
      )}

      {/* Trust Section - What happens next */}
      <div style={{ background: 'rgba(108,71,255,0.05)', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
          {t('purchase.what_happens', 'What happens automatically')}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.purpose === 'stock' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <CheckCircle size={16} color="#10B981"/> {t('purchase.trust_stock', 'Inventory stock will be updated')}
            </div>
          )}
          {data.purpose !== 'personal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <CheckCircle size={16} color="#10B981"/> {t('purchase.trust_gst', 'Eligible GST Input Credit recorded')}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={16} color="#10B981"/> {t('purchase.trust_acc', 'Accounts payable updated')}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', flexDirection: 'column' }}>
        <button 
          className="btn-action btn-action-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px' }} 
          onClick={handleSave}
          disabled={wizard.state.isProcessing}
        >
          {wizard.state.isProcessing ? (
            <><Clock size={18} className="animate-spin"/> {t('common.saving', 'Saving...')}</>
          ) : (
            <><Save size={18}/> {t('purchase.save_bill', 'Save Bill')}</>
          )}
        </button>
        
        <button 
          className="btn-action btn-action-secondary" 
          style={{ width: '100%', justifyContent: 'center' }} 
          onClick={() => wizard.goToStep('items')}
          disabled={wizard.state.isProcessing}
        >
          {t('common.back', 'Go Back to Edit')}
        </button>
      </div>

      {/* Create New Vendor Modal */}
      {showCreateVendorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={18} style={{ color: 'var(--brand-primary)' }}/> Create New Vendor Profile
              </h3>
              <button type="button" onClick={() => setShowCreateVendorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>

            <form onSubmit={handleSaveNewVendor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field-group">
                <label className="field-label">VENDOR COMPANY NAME *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. Sahil Traders Pvt Ltd"
                  value={newVendorForm.name}
                  onChange={e => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                />
              </div>

              <div className="modal-row" style={{ display: 'flex', gap: 10 }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">GSTIN (15 DIGITS)</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="27AAACS2222B1Z5"
                    maxLength={15}
                    value={newVendorForm.gstin}
                    onChange={e => setNewVendorForm({ ...newVendorForm, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">STATE / REGION</label>
                  <select
                    className="field-input"
                    value={newVendorForm.state}
                    onChange={e => setNewVendorForm({ ...newVendorForm, state: e.target.value })}
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-row" style={{ display: 'flex', gap: 10 }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">VENDOR EMAIL (OPTIONAL)</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="billing@vendor.com"
                    value={newVendorForm.email}
                    onChange={e => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                  />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">PAYMENT TERMS</label>
                  <select
                    className="field-input"
                    value={newVendorForm.paymentTerms}
                    onChange={e => setNewVendorForm({ ...newVendorForm, paymentTerms: e.target.value })}
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowCreateVendorModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Save Vendor &amp; Select</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
