
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, Clock } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function PreviewStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;

  const subtotal = data.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0) - (item.discount || 0)), 0);
  const estimatedGst = subtotal * 0.18; // Simple mock 18%
  const total = subtotal + estimatedGst;

  const handleSave = () => {
    wizard.setProcessing(true);
    
    // API Call Mock
    setTimeout(() => {
      wizard.setProcessing(false);
      // Let's pretend it succeeds
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

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('purchase.total_amount', 'Total Amount')}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>₹ {total.toLocaleString('en-IN')}</div>
      </div>

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
