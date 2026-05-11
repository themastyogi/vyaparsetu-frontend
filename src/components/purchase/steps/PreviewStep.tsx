
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, Clock } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

import { useCompany } from '../../../hooks/useCompany';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function PreviewStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  const company = useCompany();

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
  const isInterState = vendorStateCode !== 'unknown' && vendorStateCode !== company.stateCode;
  const total = totalTaxableValue + totalGst + totalNonTaxableCharges;

  const handleSave = () => {
    wizard.setProcessing(true);
    
    // API Call Mock
    setTimeout(() => {
      wizard.setProcessing(false);
      
      // Add the newly saved bill to the mock list so it shows up in Purchases.tsx
      import('../../../pages/Purchases').then(({ addMockPurchase }) => {
        const newBill = {
          id: crypto.randomUUID(),
          vendorName: data.vendorName || 'Unknown Vendor',
          invoiceNo: data.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`,
          date: data.invoiceDate || new Date().toISOString().split('T')[0],
          amount: total,
          status: 'posted',
          isOcr: data.source === 'ocr'
        };
        addMockPurchase(newBill);
      });

      wizard.updateData({ ...data }); // normally update with server ID
      wizard.goToStep('status');
      // In a real app we'd clear local storage here, but we'll let StatusStep handle it if needed
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Summary Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('purchase.vendor', 'Vendor')}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{data.vendorName}</div>
        
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
            <span>IGST</span>
            <span>₹ {totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>CGST</span>
              <span>₹ {(totalGst / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <span>SGST</span>
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

    </div>
  );
}
