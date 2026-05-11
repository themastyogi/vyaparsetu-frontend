import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useCompany } from '../../../hooks/useCompany';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

const numberToWords = (num: number): string => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero Only';
  const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)!;
  if (!n) return '';
  const crore = Number(n[1]), lakh = Number(n[2]), thousand = Number(n[3]), hundred = Number(n[4]), rest = Number(n[5]);
  let str = '';
  if (crore) str += (a[crore] || b[Math.floor(crore/10)] + ' ' + a[crore%10]) + ' Crore ';
  if (lakh) str += (a[lakh] || b[Math.floor(lakh/10)] + ' ' + a[lakh%10]) + ' Lakh ';
  if (thousand) str += (a[thousand] || b[Math.floor(thousand/10)] + ' ' + a[thousand%10]) + ' Thousand ';
  if (hundred) str += a[hundred] + ' Hundred ';
  if (rest) str += (str ? 'and ' : '') + (a[rest] || b[Math.floor(rest/10)] + ' ' + a[rest%10]);
  return str.trim() + ' Only';
};

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StatusStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { error, data } = wizard.state;
  const company = useCompany();
  const isSuccess = !error;

  useEffect(() => {}, []);

  // ── Compute totals ──────────────────────────────────────────────
  const taxableTotal = data.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const gstTotal     = data.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0) * ((i.gstRate || 0) / 100), 0);
  const discountAmt  = data.discount.type === 'fixed'
    ? data.discount.value
    : taxableTotal * (data.discount.value / 100);
  const chargesTotal = (data.charges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const grandTotal   = taxableTotal + gstTotal - discountAmt + chargesTotal;

  // ── Build double-entry rows ─────────────────────────────────────
  interface LedgerRow { name: string; indent: boolean; debit: number | null; credit: number | null; }
  const rows: LedgerRow[] = [];

  // DEBIT SIDE
  // Inventory / Expense
  rows.push({ name: 'Inventory / Purchase A/c', indent: false, debit: taxableTotal - discountAmt, credit: null });

  // Input GST (CGST + SGST or IGST)
  if (gstTotal > 0) {
    // Simple split: if inter-state could be one IGST line, but we'll show CGST+SGST as default
    const halfGst = gstTotal / 2;
    rows.push({ name: 'Input CGST A/c', indent: false, debit: halfGst, credit: null });
    rows.push({ name: 'Input SGST A/c', indent: false, debit: halfGst, credit: null });
  }

  // Charges
  if (chargesTotal > 0) {
    rows.push({ name: 'Freight / Charges A/c', indent: false, debit: chargesTotal, credit: null });
  }

  // CREDIT SIDE
  rows.push({ name: `To  ${data.vendorName || 'Vendor'} (Sundry Creditor)`, indent: true, debit: null, credit: grandTotal });

  const totalDebit  = rows.reduce((s, r) => s + (r.debit  ?? 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (r.credit ?? 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.015;

  const voucherTitle = 'Purchase Voucher';
  const printDate    = data.invoiceDate
    ? new Date(data.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Item detail rows ────────────────────────────────────────────
  const hasItems = data.items.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '0 20px' }}>

      {/* ══════════════════ PRINTABLE VOUCHER ══════════════════ */}
      <div className="print-only-voucher" style={{ display: 'none' }}>
        <div style={{ padding: '30px 40px', width: '100%', maxWidth: '820px', margin: '0 auto', fontFamily: '"Arial", sans-serif', fontSize: '13px', color: '#000', boxSizing: 'border-box' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{company.companyName}</div>
            {company.address && <div style={{ fontSize: '11px', marginTop: '2px' }}>{company.address}</div>}
          </div>
          <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '14px', textTransform: 'uppercase' }}>{voucherTitle}</div>

          {/* ── Voucher Meta ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
            <div><b>Voucher No.:</b> {data.invoiceNo || 'DRAFT'}</div>
            <div><b>Date:</b> {printDate}</div>
            <div><b>Ref. Bill No.:</b> {data.invoiceNo || '—'}</div>
          </div>

          {/* ── Double-Entry Table ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '0' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', borderRight: '1px solid #000', width: '55%' }}>Particulars</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', borderRight: '1px solid #000', width: '22.5%' }}>Debit (₹)</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', width: '22.5%' }}>Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px dashed #ccc' }}>
                  <td style={{ padding: row.indent ? '5px 10px 5px 30px' : '5px 10px', borderRight: '1px solid #000', fontWeight: row.indent ? 'normal' : 'bold' }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', borderRight: '1px solid #000', fontFamily: 'monospace' }}>
                    {row.debit !== null ? fmt(row.debit) : ''}
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {row.credit !== null ? fmt(row.credit) : ''}
                  </td>
                </tr>
              ))}

              {/* Narration */}
              <tr style={{ borderTop: '1px solid #aaa' }}>
                <td colSpan={3} style={{ padding: '8px 10px', fontStyle: 'italic', fontSize: '12px', color: '#333' }}>
                  <b>Narration:</b> Being goods/services purchased from {data.vendorName || 'Vendor'} vide Bill No. {data.invoiceNo || '—'} dated {printDate}.
                  {data.remarks ? ` Remarks: ${data.remarks}.` : ''}
                </td>
              </tr>

              {/* Totals */}
              <tr style={{ borderTop: '2px solid #000', background: '#f0f0f0', fontWeight: 'bold' }}>
                <td style={{ padding: '8px 10px', borderRight: '1px solid #000' }}>Grand Total</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #000', fontFamily: 'monospace', color: balanced ? '#000' : '#c00' }}>
                  {fmt(totalDebit)}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: balanced ? '#000' : '#c00' }}>
                  {fmt(totalCredit)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Amount in Words ── */}
          <div style={{ border: '1px solid #000', borderTop: 'none', padding: '6px 10px', fontSize: '12px', marginBottom: '14px' }}>
            <b>Amount in Words:</b> INR {numberToWords(Math.round(grandTotal))}
          </div>

          {/* ── Bill Details ── */}
          {hasItems && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '16px', marginBottom: '4px', textDecoration: 'underline' }}>Bill Details:</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '12px', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Item Name</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>Rate (₹)</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>GST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => {
                    const lineAmt = (item.qty || 0) * (item.rate || 0);
                    const lineGst = lineAmt * ((item.gstRate || 0) / 100);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 8px', borderRight: '1px solid #ccc' }}>{item.name}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>{item.qty}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #ccc', fontFamily: 'monospace' }}>{fmt(item.rate || 0)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>{item.gstRate || 0}%</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(lineAmt + lineGst)}</td>
                      </tr>
                    );
                  })}
                  {discountAmt > 0 && (
                    <tr style={{ borderTop: '1px solid #ccc' }}>
                      <td colSpan={4} style={{ padding: '4px 8px', textAlign: 'right', fontStyle: 'italic', borderRight: '1px solid #ccc' }}>Discount</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#c00' }}>- {fmt(discountAmt)}</td>
                    </tr>
                  )}
                  {chargesTotal > 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '4px 8px', textAlign: 'right', fontStyle: 'italic', borderRight: '1px solid #ccc' }}>Freight / Charges</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(chargesTotal)}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#f5f5f5', fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
                    <td colSpan={4} style={{ padding: '5px 8px', textAlign: 'right', borderRight: '1px solid #ccc' }}>Grand Total</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* ── Signatures ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '12px' }}>
            <div style={{ textAlign: 'center', minWidth: '160px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>Prepared By</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '160px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>Checked By</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '160px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>Authorised Signatory</div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
            This is a computer-generated voucher. | {company.companyName}
          </div>

        </div>
      </div>
      {/* ══════════════════ END PRINTABLE VOUCHER ══════════════════ */}

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
              <Printer size={18} style={{ marginRight: '8px' }} /> Print Purchase Voucher
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
