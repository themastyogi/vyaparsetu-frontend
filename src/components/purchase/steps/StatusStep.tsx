import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useCompany } from '../../../hooks/useCompany';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

// ────────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────────
function numberToWords(num: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
             'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
             'Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (!num) return 'Zero Only';
  const n = ('000000000' + Math.floor(num)).slice(-9)
              .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)!;
  let s = '';
  if (+n[1]) s += (a[+n[1]] || b[+n[1][0]] + ' ' + a[+n[1][1]]) + ' Crore ';
  if (+n[2]) s += (a[+n[2]] || b[+n[2][0]] + ' ' + a[+n[2][1]]) + ' Lakh ';
  if (+n[3]) s += (a[+n[3]] || b[+n[3][0]] + ' ' + a[+n[3][1]]) + ' Thousand ';
  if (+n[4]) s += a[+n[4]] + ' Hundred ';
  if (+n[5]) s += (s ? 'and ' : '') + (a[+n[5]] || b[+n[5][0]] + ' ' + a[+n[5][1]]);
  return s.trim() + ' Only';
}

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ────────────────────────────────────────────────────────────────
//  Main component
// ────────────────────────────────────────────────────────────────
export default function StatusStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { error, data } = wizard.state;
  const company = useCompany();
  const isSuccess = !error;

  // ── Totals ────────────────────────────────────────────────────
  const taxableTotal = data.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const gstTotal     = data.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0) * ((i.gstRate || 0) / 100), 0);
  const discountAmt  = data.discount.type === 'fixed'
    ? data.discount.value
    : taxableTotal * (data.discount.value / 100);
  const chargesTotal = (data.charges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const grandTotal   = taxableTotal + gstTotal - discountAmt + chargesTotal;

  const printDate = data.invoiceDate
    ? new Date(data.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Print: open isolated window ────────────────────────────────
  const handlePrint = () => {
    // Build ledger rows
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    // Item rows HTML
    const itemRowsHtml = data.items.map(item => {
      const lineAmt = (item.qty || 0) * (item.rate || 0);
      const lineGst = lineAmt * ((item.gstRate || 0) / 100);
      return `<tr>
        <td style="padding:4px 8px;border-right:1px solid #ccc;">${item.name}</td>
        <td style="padding:4px 8px;text-align:right;border-right:1px solid #ccc;">${item.qty}</td>
        <td style="padding:4px 8px;text-align:right;border-right:1px solid #ccc;">${f2(item.rate || 0)}</td>
        <td style="padding:4px 8px;text-align:right;border-right:1px solid #ccc;">${item.gstRate || 0}%</td>
        <td style="padding:4px 8px;text-align:right;">${f2(lineAmt)}</td>
        <td style="padding:4px 8px;text-align:right;">${f2(lineGst)}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:bold;">${f2(lineAmt + lineGst)}</td>
      </tr>`;
    }).join('');

    const discountRow = discountAmt > 0
      ? `<tr><td colspan="6" style="padding:4px 8px;text-align:right;border-right:1px solid #ccc;font-style:italic;">Discount</td>
           <td style="padding:4px 8px;text-align:right;color:#c00;">- ${f2(discountAmt)}</td></tr>` : '';

    const chargesRow = chargesTotal > 0
      ? `<tr><td colspan="6" style="padding:4px 8px;text-align:right;border-right:1px solid #ccc;font-style:italic;">Freight / Charges</td>
           <td style="padding:4px 8px;text-align:right;">${f2(chargesTotal)}</td></tr>` : '';

    const gstRows = gstTotal > 0 ? `
      <tr style="border-bottom:1px dashed #ddd;">
        <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Input CGST A/c</td>
        <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:Courier New,monospace;">${f2(cgst)}</td>
        <td style="padding:6px 10px;text-align:right;"></td>
      </tr>
      <tr style="border-bottom:1px dashed #ddd;">
        <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Input SGST A/c</td>
        <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:Courier New,monospace;">${f2(sgst)}</td>
        <td style="padding:6px 10px;text-align:right;"></td>
      </tr>` : '';

    const chargesLedgerRow = chargesTotal > 0 ? `
      <tr style="border-bottom:1px dashed #ddd;">
        <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Freight / Charges A/c</td>
        <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:Courier New,monospace;">${f2(chargesTotal)}</td>
        <td style="padding:6px 10px;text-align:right;"></td>
      </tr>` : '';

    const totalDr = (taxableTotal - discountAmt) + gstTotal + chargesTotal;
    const totalCr = grandTotal;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Purchase Voucher - ${data.invoiceNo || 'DRAFT'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#000; background:#fff; }
    .page { width:210mm; min-height:297mm; margin:0 auto; padding:15mm 15mm 10mm 15mm; }
    table { width:100%; border-collapse:collapse; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      @page { size:A4; margin:10mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:4px;">
    <div style="font-size:20px; font-weight:bold; letter-spacing:0.5px;">${company.companyName}</div>
    ${company.address ? `<div style="font-size:11px; margin-top:2px; color:#444;">${company.address}</div>` : ''}
  </div>
  <div style="text-align:center; font-size:14px; font-weight:bold; letter-spacing:2px; margin:6px 0 12px; text-transform:uppercase;">Purchase Voucher</div>

  <!-- Meta Row -->
  <table style="margin-bottom:12px; font-size:12px;">
    <tr>
      <td style="width:33%;"><b>Voucher No.:</b> ${data.invoiceNo || 'DRAFT'}</td>
      <td style="width:34%; text-align:center;"><b>Date:</b> ${printDate}</td>
      <td style="width:33%; text-align:right;"><b>Vendor Bill No.:</b> ${data.invoiceNo || '—'}</td>
    </tr>
    <tr>
      <td colspan="3" style="padding-top:2px;"><b>Party:</b> ${data.vendorName || '—'} ${data.vendorGstin ? `| <b>GSTIN:</b> ${data.vendorGstin}` : ''}</td>
    </tr>
  </table>

  <!-- Double-Entry Accounting Table -->
  <table style="border:1px solid #000; margin-bottom:0;">
    <thead>
      <tr style="background:#e8e8e8; border-bottom:2px solid #000;">
        <th style="padding:8px 10px; text-align:left; border-right:1px solid #000; width:55%;">Particulars</th>
        <th style="padding:8px 10px; text-align:right; border-right:1px solid #000; width:22%;">Debit (₹)</th>
        <th style="padding:8px 10px; text-align:right; width:23%;">Credit (₹)</th>
      </tr>
    </thead>
    <tbody>
      <!-- Debit: Inventory -->
      <tr style="border-bottom:1px dashed #ddd;">
        <td style="padding:6px 10px; font-weight:bold; border-right:1px solid #000;">Inventory / Purchase A/c</td>
        <td style="padding:6px 10px; text-align:right; border-right:1px solid #000; font-family:Courier New,monospace;">${f2(taxableTotal - discountAmt)}</td>
        <td style="padding:6px 10px; text-align:right;"></td>
      </tr>
      <!-- Debit: GST -->
      ${gstRows}
      <!-- Debit: Charges -->
      ${chargesLedgerRow}
      <!-- Credit: Vendor -->
      <tr style="border-bottom:1px dashed #ddd;">
        <td style="padding:6px 10px 6px 28px; border-right:1px solid #000;">To &nbsp;<b>${data.vendorName || 'Vendor'}</b> (Sundry Creditor)</td>
        <td style="padding:6px 10px; text-align:right; border-right:1px solid #000;"></td>
        <td style="padding:6px 10px; text-align:right; font-family:Courier New,monospace;">${f2(totalCr)}</td>
      </tr>
      <!-- Narration -->
      <tr style="border-top:1px solid #bbb;">
        <td colspan="3" style="padding:7px 10px; font-style:italic; font-size:12px; color:#333;">
          <b>Narration:</b> Being goods/services purchased from ${data.vendorName || 'Vendor'} vide Bill No. ${data.invoiceNo || '—'} dated ${printDate}.${data.remarks ? ' ' + data.remarks + '.' : ''}
        </td>
      </tr>
      <!-- Grand Total -->
      <tr style="border-top:2px solid #000; background:#e8e8e8; font-weight:bold;">
        <td style="padding:8px 10px; border-right:1px solid #000;">Grand Total</td>
        <td style="padding:8px 10px; text-align:right; border-right:1px solid #000; font-family:Courier New,monospace;">${f2(totalDr)}</td>
        <td style="padding:8px 10px; text-align:right; font-family:Courier New,monospace;">${f2(totalCr)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Amount in Words -->
  <div style="border:1px solid #000; border-top:none; padding:5px 10px; font-size:12px; margin-bottom:16px;">
    <b>Amount in Words:</b> INR ${numberToWords(Math.round(grandTotal))}
  </div>

  ${data.items.length > 0 ? `
  <!-- Bill / Item Details -->
  <div style="font-size:12px; font-weight:bold; margin-bottom:4px; text-decoration:underline;">Bill Details:</div>
  <table style="border:1px solid #ccc; font-size:11px; margin-bottom:16px;">
    <thead>
      <tr style="background:#f0f0f0; border-bottom:1px solid #ccc;">
        <th style="padding:5px 8px; text-align:left; border-right:1px solid #ccc; width:30%;">Item Description</th>
        <th style="padding:5px 8px; text-align:right; border-right:1px solid #ccc; width:8%;">Qty</th>
        <th style="padding:5px 8px; text-align:right; border-right:1px solid #ccc; width:13%;">Rate (₹)</th>
        <th style="padding:5px 8px; text-align:right; border-right:1px solid #ccc; width:10%;">Taxable (₹)</th>
        <th style="padding:5px 8px; text-align:right; border-right:1px solid #ccc; width:8%;">GST %</th>
        <th style="padding:5px 8px; text-align:right; border-right:1px solid #ccc; width:13%;">GST Amt (₹)</th>
        <th style="padding:5px 8px; text-align:right; width:14%;">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
      ${discountRow}
      ${chargesRow}
      <tr style="background:#f0f0f0; font-weight:bold; border-top:1px solid #ccc;">
        <td colspan="6" style="padding:5px 8px; text-align:right; border-right:1px solid #ccc;">Grand Total</td>
        <td style="padding:5px 8px; text-align:right;">${f2(grandTotal)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  <!-- Signatures -->
  <div style="display:flex; justify-content:space-between; margin-top:40px; font-size:12px;">
    <div style="text-align:center; width:28%;">
      <div style="border-top:1px solid #000; padding-top:4px;">Prepared By</div>
    </div>
    <div style="text-align:center; width:28%;">
      <div style="border-top:1px solid #000; padding-top:4px;">Checked By</div>
    </div>
    <div style="text-align:center; width:28%;">
      <div style="border-top:1px solid #000; padding-top:4px;">Authorised Signatory</div>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center; margin-top:14px; font-size:10px; color:#888; border-top:1px dashed #ccc; padding-top:5px;">
    This is a computer-generated voucher &nbsp;|&nbsp; ${company.companyName}
  </div>

</div>
<script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=850,height=1100,scrollbars=yes');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '0 20px' }}>

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
            <button
              className="btn-action btn-action-secondary"
              style={{ justifyContent: 'center', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)' }}
              onClick={handlePrint}
            >
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
