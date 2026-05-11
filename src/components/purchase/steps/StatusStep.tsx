import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function StatusStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { error, data } = wizard.state;

  const isSuccess = !error;

  useEffect(() => {
    // Only clear draft if user navigates away, but since we are showing status and might want to print,
    // we keep the data for now. We clear it when "Add Another Bill" is clicked.
  }, []);

  const total = data.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '0 20px' }}>
      
      {/* Hidden Printable Voucher */}
      <div className="print-only-voucher" style={{ display: 'none' }}>
        <div style={{ border: '2px solid #000', padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left', fontFamily: 'serif' }}>
          <h1 style={{ textAlign: 'center', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>Journal Voucher</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontWeight: 'bold' }}>
            <div>Vendor: {data.vendorName}</div>
            <div>Date: {data.invoiceDate || new Date().toLocaleDateString()}</div>
          </div>
          <div style={{ marginBottom: '20px', fontWeight: 'bold' }}>Invoice Ref: {data.invoiceNo}</div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '30px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Particulars</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px' }}>Inventory / Expense A/c<br/><small style={{ marginLeft: '20px' }}>(Being goods purchased from {data.vendorName})</small></td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}></td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px' }}>To {data.vendorName} A/c</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '10px', width: '200px', textAlign: 'center' }}>Prepared By</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '10px', width: '200px', textAlign: 'center' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
      
      {isSuccess ? (
        <>
          <div className="success-ico">
            <CheckCircle size={64} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('purchase.success_title', 'Bill Saved Successfully')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            {t('purchase.success_sub', 'The system is now processing your bill in the background. Stock and GST will be updated automatically.')}
          </p>
        </>
      ) : (
        <>
          <div>
            <XCircle size={64} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('purchase.error_title', 'Something went wrong')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {error || t('purchase.error_sub', 'We could not save your bill. Please try again.')}
          </p>
        </>
      )}

      <div style={{ marginTop: '30px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isSuccess ? (
          <>
            <button className="btn-action btn-action-secondary" style={{ justifyContent: 'center', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)' }} onClick={() => window.print()}>
              <Printer size={18} style={{ marginRight: '8px' }} /> Print Journal Voucher
            </button>
            <button className="btn-action btn-action-primary" style={{ justifyContent: 'center' }} onClick={() => {
              wizard.clearDraft();
              wizard.goToStep('entry_options');
            }}>
              {t('purchase.add_another', 'Add Another Bill')}
            </button>
            <button className="btn-action btn-action-secondary" style={{ justifyContent: 'center' }} onClick={() => wizard.closeWizard()}>
              {t('purchase.go_home', 'Go to Purchase List')}
            </button>
          </>
        ) : (
          <>
            <button className="btn-action btn-action-primary" style={{ justifyContent: 'center' }} onClick={() => wizard.goToStep('preview')}>
              {t('common.retry', 'Retry')}
            </button>
            <button className="btn-action btn-action-secondary" style={{ justifyContent: 'center' }} onClick={() => wizard.closeWizard()}>
              {t('common.cancel', 'Cancel')}
            </button>
          </>
        )}
      </div>

    </div>
  );
}
