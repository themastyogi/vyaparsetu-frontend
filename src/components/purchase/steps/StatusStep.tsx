import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useCompany } from '../../../hooks/useCompany';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function StatusStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { error, data } = wizard.state;
  const company = useCompany();

  const isSuccess = !error;

  const numberToWords = (num: number): string => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
    str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
    str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
    str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
    str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
    return str.trim() ? str.trim() + ' Only' : 'Zero';
  };

  useEffect(() => {
    // Only clear draft if user navigates away, but since we are showing status and might want to print,
    // we keep the data for now. We clear it when "Add Another Bill" is clicked.
  }, []);

  const total = data.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '0 20px' }}>
      
      {/* Hidden Printable Voucher */}
      <div className="print-only-voucher" style={{ display: 'none' }}>
        <div style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
          
          <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '2px' }}>
            {company.companyName}
          </h1>
          <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '16px' }}>{company.address}</div>
          <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
            Purchase Voucher
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
            <div>No. : <b>{data.invoiceNo || '1'}</b></div>
            <div>Dated : <b>{data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}</b></div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000', borderLeft: '1px solid #000', borderRight: '1px solid #000', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #000', width: '75%' }}>Particulars</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '25%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 8px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Account :</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ marginLeft: '20px', fontWeight: 'bold' }}>{data.vendorName}</span>
                    <span>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Cr</span>
                  </div>
                  <div style={{ marginLeft: '20px', marginTop: '20px', fontSize: '12px' }}>
                    (Purchase Ref: {data.invoiceNo})
                  </div>
                  
                  <div style={{ fontWeight: 'bold', marginTop: '30px', marginBottom: '4px' }}>Through :</div>
                  <div style={{ marginLeft: '20px' }}>Inventory / Expense A/c</div>
                  
                  <div style={{ fontWeight: 'bold', marginTop: '30px', marginBottom: '4px' }}>Amount (in words) :</div>
                  <div style={{ marginLeft: '20px' }}>INR {numberToWords(Math.floor(total))}</div>
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'top' }}>
                  <div style={{ marginTop: '20px' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid #000' }}>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #000' }}>₹</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', width: '200px', marginBottom: '5px' }}></div>
              <div>Authorised Signatory</div>
            </div>
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
