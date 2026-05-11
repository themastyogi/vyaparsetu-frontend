import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Users, Package, IndianRupee, AlertTriangle, ArrowUpRight, FileText, ShoppingCart, Clock, Printer } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import './Dashboard.css';

const MONTHLY = [
  { m: 'Oct', rev: 60, exp: 40 }, { m: 'Nov', rev: 75, exp: 50 },
  { m: 'Dec', rev: 85, exp: 55 }, { m: 'Jan', rev: 65, exp: 45 },
  { m: 'Feb', rev: 90, exp: 60 }, { m: 'Mar', rev: 80, exp: 52 },
  { m: 'Apr', rev: 100, exp: 65 },
];

const RECENT_TXN = [
  { id: 'txn-1', type: 'Sales Invoice',  party: 'Ravi Enterprises', amount: '42000', gst: '7560',  date: '23 Apr 2026', status: 'paid' },
  { id: 'txn-2', type: 'Purchase Bill',  party: 'Sahil Traders',    amount: '18500', gst: '3330',  date: '22 Apr 2026', status: 'pending' },
  { id: 'txn-3', type: 'Sales Invoice',  party: 'Metro Retail Co.', amount: '95000', gst: '17100', date: '21 Apr 2026', status: 'paid' },
  { id: 'txn-4', type: 'Credit Note',    party: 'Alpha Supplies',   amount: '5200',  gst: '936',    date: '20 Apr 2026', status: 'draft' },
  { id: 'txn-5', type: 'Purchase Bill',  party: 'Kumar & Sons',     amount: '31000', gst: '5580',  date: '19 Apr 2026', status: 'overdue' },
];



export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const company = useCompany();

  const currentHour = new Date().getHours();
  let greetingKey = 'dashboard.greeting_afternoon';
  if (currentHour < 12) greetingKey = 'dashboard.greeting_morning';
  else if (currentHour >= 17) greetingKey = 'dashboard.greeting_evening';

  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, parties: 0, lowStock: 0 });

  // ── Print voucher in an isolated new window (no app CSS) ─────────
  const printVoucher = (txn: typeof RECENT_TXN[0]) => {
    const amt    = Number(txn.amount);
    const gst    = Number(txn.gst);
    const taxable = amt - gst;
    const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const ntw = (num: number): string => {
      const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      if (!num) return 'Zero Only';
      const n = ('000000000' + Math.floor(num)).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)!;
      let s = '';
      if (+n[1]) s += (a[+n[1]] || b[+n[1][0]] + ' ' + a[+n[1][1]]) + ' Crore ';
      if (+n[2]) s += (a[+n[2]] || b[+n[2][0]] + ' ' + a[+n[2][1]]) + ' Lakh ';
      if (+n[3]) s += (a[+n[3]] || b[+n[3][0]] + ' ' + a[+n[3][1]]) + ' Thousand ';
      if (+n[4]) s += a[+n[4]] + ' Hundred ';
      if (+n[5]) s += (s ? 'and ' : '') + (a[+n[5]] || b[+n[5][0]] + ' ' + a[+n[5][1]]);
      return s.trim() + ' Only';
    };
    const isSales    = txn.type.includes('Sales');
    const isPurchase = txn.type.includes('Purchase');
    const vType      = isSales ? 'Sales Invoice Voucher' : isPurchase ? 'Purchase Voucher' : `${txn.type} Voucher`;

    const drRows = isSales
      ? `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">${txn.party} (Sundry Debtor)</td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:'Courier New',monospace;">${f2(amt)}</td>
           <td style="padding:6px 10px;text-align:right;"></td>
         </tr>`
      : `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Inventory / Purchase A/c</td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:'Courier New',monospace;">${f2(taxable)}</td>
           <td style="padding:6px 10px;text-align:right;"></td>
         </tr>
         ${gst > 0 ? `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Input CGST A/c</td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:'Courier New',monospace;">${f2(gst / 2)}</td>
           <td style="padding:6px 10px;text-align:right;"></td>
         </tr>
         <tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px;font-weight:bold;border-right:1px solid #000;">Input SGST A/c</td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;font-family:'Courier New',monospace;">${f2(gst / 2)}</td>
           <td style="padding:6px 10px;text-align:right;"></td>
         </tr>` : ''}`;

    const crRows = isSales
      ? `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px 6px 28px;border-right:1px solid #000;">To &nbsp;<b>Sales A/c</b></td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;"></td>
           <td style="padding:6px 10px;text-align:right;font-family:'Courier New',monospace;">${f2(taxable)}</td>
         </tr>
         ${gst > 0 ? `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px 6px 28px;border-right:1px solid #000;">To &nbsp;<b>Output CGST A/c</b></td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;"></td>
           <td style="padding:6px 10px;text-align:right;font-family:'Courier New',monospace;">${f2(gst / 2)}</td>
         </tr>
         <tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px 6px 28px;border-right:1px solid #000;">To &nbsp;<b>Output SGST A/c</b></td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;"></td>
           <td style="padding:6px 10px;text-align:right;font-family:'Courier New',monospace;">${f2(gst / 2)}</td>
         </tr>` : ''}`
      : `<tr style="border-bottom:1px dashed #ddd;">
           <td style="padding:6px 10px 6px 28px;border-right:1px solid #000;">To &nbsp;<b>${txn.party}</b> (Sundry Creditor)</td>
           <td style="padding:6px 10px;text-align:right;border-right:1px solid #000;"></td>
           <td style="padding:6px 10px;text-align:right;font-family:'Courier New',monospace;">${f2(amt)}</td>
         </tr>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${vType}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:13px;color:#000;background:#fff;}
      .page{width:210mm;margin:0 auto;padding:15mm;} table{width:100%;border-collapse:collapse;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{size:A4;margin:10mm;}}</style></head><body>
      <div class="page">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:4px;">
          <div style="font-size:20px;font-weight:bold;">${company.companyName}</div>
          ${company.address ? `<div style="font-size:11px;margin-top:2px;color:#444;">${company.address}</div>` : ''}
        </div>
        <div style="text-align:center;font-size:14px;font-weight:bold;letter-spacing:2px;margin:6px 0 12px;text-transform:uppercase;">${vType}</div>
        <table style="margin-bottom:12px;font-size:12px;">
          <tr>
            <td style="width:40%;"><b>Voucher No.:</b> ${txn.id}</td>
            <td style="width:30%;text-align:center;"><b>Date:</b> ${txn.date}</td>
            <td style="width:30%;text-align:right;"><b>Status:</b> ${txn.status.toUpperCase()}</td>
          </tr>
        </table>
        <table style="border:1px solid #000;margin-bottom:0;">
          <thead>
            <tr style="background:#e8e8e8;border-bottom:2px solid #000;">
              <th style="padding:8px 10px;text-align:left;border-right:1px solid #000;width:55%;">Particulars</th>
              <th style="padding:8px 10px;text-align:right;border-right:1px solid #000;width:22%;">Debit (&#8377;)</th>
              <th style="padding:8px 10px;text-align:right;width:23%;">Credit (&#8377;)</th>
            </tr>
          </thead>
          <tbody>
            ${drRows}
            ${crRows}
            <tr style="border-top:1px solid #bbb;">
              <td colspan="3" style="padding:7px 10px;font-style:italic;font-size:12px;color:#333;">
                <b>Narration:</b> Being ${txn.type.toLowerCase()} recorded for ${txn.party} dated ${txn.date}.
              </td>
            </tr>
            <tr style="border-top:2px solid #000;background:#e8e8e8;font-weight:bold;">
              <td style="padding:8px 10px;border-right:1px solid #000;">Grand Total</td>
              <td style="padding:8px 10px;text-align:right;border-right:1px solid #000;font-family:'Courier New',monospace;">${f2(amt)}</td>
              <td style="padding:8px 10px;text-align:right;font-family:'Courier New',monospace;">${f2(amt)}</td>
            </tr>
          </tbody>
        </table>
        <div style="border:1px solid #000;border-top:none;padding:5px 10px;font-size:12px;margin-bottom:20px;">
          <b>Amount in Words:</b> INR ${ntw(Math.round(amt))}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px;">
          <div style="text-align:center;width:28%;"><div style="border-top:1px solid #000;padding-top:4px;">Prepared By</div></div>
          <div style="text-align:center;width:28%;"><div style="border-top:1px solid #000;padding-top:4px;">Checked By</div></div>
          <div style="text-align:center;width:28%;"><div style="border-top:1px solid #000;padding-top:4px;">Authorised Signatory</div></div>
        </div>
        <div style="text-align:center;margin-top:12px;font-size:10px;color:#888;border-top:1px dashed #ccc;padding-top:5px;">Computer-generated voucher &nbsp;|&nbsp; ${company.companyName}</div>
      </div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=850,height=1100,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
  };

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isLocalhost) {
      // Mock calculations for Vercel
      const totalRevenue = RECENT_TXN.filter(t => t.type === 'Sales Invoice').reduce((sum, t) => sum + Number(t.amount), 0);
      const outstanding = RECENT_TXN.filter(t => t.type === 'Sales Invoice' && (t.status === 'pending' || t.status === 'overdue')).reduce((sum, t) => sum + Number(t.amount), 0);
      const totalParties = new Set(RECENT_TXN.map(t => t.party)).size;
      setStats({ revenue: totalRevenue, outstanding, parties: totalParties, lowStock: 2 });
      return;
    }

    fetch('http://localhost:3000/finance/dashboard-stats', {
      headers: { 'tenantId': 'default-tenant' }
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          revenue: Number(data.revenue) || 0,
          outstanding: Number(data.payables) || 0, // Using payables as mock for outstanding in this context
          parties: 15, // Mocking from backend for now
          lowStock: 2
        });
      })
      .catch(err => {
        console.error('Failed to fetch stats', err);
        // Fallback to local mock
        const totalRevenue = RECENT_TXN.filter(t => t.type === 'Sales Invoice').reduce((sum, t) => sum + Number(t.amount), 0);
        const outstanding = RECENT_TXN.filter(t => t.type === 'Sales Invoice' && (t.status === 'pending' || t.status === 'overdue')).reduce((sum, t) => sum + Number(t.amount), 0);
        const totalParties = new Set(RECENT_TXN.map(t => t.party)).size;
        setStats({ revenue: totalRevenue, outstanding, parties: totalParties, lowStock: 2 });
      });
  }, []);

  const STATS = [
    { id: 'total-revenue',         label: t('dashboard.total_revenue'), value: `₹ ${stats.revenue.toLocaleString('en-IN')}`, change: '+18.4%', positive: true,  sub: t('dashboard.vs_last_month'),    icon: <IndianRupee size={20}/>, color: 'purple', path: '/dashboard/sales' },
    { id: 'outstanding-receivable', label: t('dashboard.outstanding'),  value: `₹ ${stats.outstanding.toLocaleString('en-IN')}`,  change: '-4.2%',  positive: false, sub: `2 ${t('dashboard.parties_pending')}`, icon: <TrendingUp size={20}/>, color: 'blue', path: '/dashboard/parties' },
    { id: 'total-parties',          label: t('dashboard.total_parties'), value: stats.parties.toString(),         change: '+2',     positive: true,  sub: t('dashboard.added_month'),      icon: <Users size={20}/>,        color: 'green', path: '/dashboard/parties' },
    { id: 'low-stock-items',        label: t('dashboard.low_stock'),    value: stats.lowStock.toString(),            change: t('dashboard.action_needed'), positive: false, sub: t('dashboard.below_reorder'), icon: <Package size={20}/>, color: 'amber', path: '/dashboard/items' },
  ];

  const ALERTS = [
    { id: 'alert-gst',  icon: <AlertTriangle size={14}/>, color: 'amber', text: t('alerts.gstr3b') },
    { id: 'alert-recon', icon: <Clock size={14}/>,         color: 'blue',  text: t('alerts.recon') },
  ];

  const STATUS_KEYS: Record<string, { key: string; cls: string }> = {
    paid:    { key: 'status.paid',    cls: 'status-paid' },
    pending: { key: 'status.pending', cls: 'status-pending' },
    draft:   { key: 'status.draft',   cls: 'status-draft' },
    overdue: { key: 'status.overdue', cls: 'status-overdue' },
  };

  const QUICK = [
    { id: 'qa-sales', icon: <FileText size={16}/>,   label: t('dashboard.create_invoice'), sub: t('dashboard.gst_auto'),    path: '/dashboard/sales' },
    { id: 'qa-party', icon: <Users size={16}/>,       label: t('dashboard.add_party'),      sub: t('dashboard.gstin_val'),   path: '/dashboard/parties' },
    { id: 'qa-item',  icon: <Package size={16}/>,     label: t('dashboard.add_item'),       sub: t('dashboard.hsn_ready'),   path: '/dashboard/items' },
    { id: 'qa-trial', icon: <TrendingUp size={16}/>,  label: t('dashboard.view_trial'),     sub: t('dashboard.live_updated'), path: '/dashboard/reports' },
  ];

  return (
    <div className="dash-root animate-fade-in">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{t(greetingKey)}, Vikas 👋</h1>
          <p className="dash-sub">{company.companyName}</p>
        </div>
        <div className="dash-header-actions">
          <button id="new-invoice-btn" className="btn-action btn-action-secondary" onClick={() => navigate('/dashboard/sales')}>
            <FileText size={15}/> {t('dashboard.new_invoice')}
          </button>
          <button id="new-purchase-btn" className="btn-action btn-action-primary" onClick={() => navigate('/dashboard/purchases')}>
            <ShoppingCart size={15}/> {t('dashboard.record_purchase')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {ALERTS.map(a => (
        <div key={a.id} id={a.id} className={`dash-alert dash-alert-${a.color}`}>
          <span className="alert-icon">{a.icon}</span>
          <span className="alert-text">{a.text}</span>
          <button className="alert-dismiss">{t('common.dismiss','Dismiss')}</button>
        </div>
      ))}

      {/* KPI Stats */}
      <div className="dash-stats">
        {STATS.map(s => (
          <div key={s.id} id={s.id} className={`stat-card stat-card-${s.color}`} onClick={() => navigate(s.path)} style={{ cursor: 'pointer' }}>
            <div className="stat-top">
              <div className={`stat-icon-wrap stat-icon-${s.color}`}>{s.icon}</div>
              <div className={`stat-change ${s.positive ? 'change-up' : 'change-down'}`}>
                {s.positive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                <span>{s.change}</span>
              </div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts + Quick Actions */}
      <div className="dash-mid">
        <div className="dash-chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{t('dashboard.revenue_expenses')}</h3>
              <p className="card-sub">{t('dashboard.last_7')}</p>
            </div>
            <div className="chart-legend">
              <span className="legend-dot legend-purple"/>{t('dashboard.revenue')}
              <span className="legend-dot legend-pink" style={{ marginLeft: 12 }}/>{t('dashboard.expenses')}
            </div>
          </div>
          <div className="bar-chart">
            {MONTHLY.map((row, i) => (
              <div key={i} className="bar-group">
                <div className="bar-col">
                  <div className="bar bar-rev" style={{ height: `${row.rev}%` }}/>
                  <div className="bar bar-exp" style={{ height: `${row.exp}%` }}/>
                </div>
                <span className="bar-label">{row.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-quick-card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>{t('dashboard.quick_actions')}</h3>
          {QUICK.map(q => (
            <button key={q.id} id={q.id} className="quick-btn" onClick={() => navigate(q.path)}>
              <div className="quick-icon">{q.icon}</div>
              <div className="quick-info">
                <span className="quick-label">{q.label}</span>
                <span className="quick-sub">{q.sub}</span>
              </div>
              <ArrowUpRight size={14} className="quick-arrow"/>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dash-table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{t('dashboard.recent_txn')}</h3>
            <p className="card-sub">{t('dashboard.all_vouchers')}</p>
          </div>
          <button id="view-all-txn" className="view-all-btn">
            {t('dashboard.view_all')} <ArrowUpRight size={13}/>
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table" id="transactions-table">
            <thead>
              <tr>
                <th>{t('txn.type')}</th>
                <th>{t('txn.party')}</th>
                <th>{t('txn.amount')}</th>
                <th>{t('txn.gst')}</th>
                <th>{t('txn.date')}</th>
                <th>{t('txn.status')}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TXN.map(txn => (
                <tr key={txn.id} id={txn.id}>
                  <td data-label={t('txn.type')}><span className="txn-type">{txn.type}</span></td>
                  <td data-label={t('txn.party')}><span className="txn-party">{txn.party}</span></td>
                  <td data-label={t('txn.amount')}><span className="txn-amount">₹ {Number(txn.amount).toLocaleString('en-IN')}</span></td>
                  <td data-label={t('txn.gst')}><span className="txn-gst">₹ {Number(txn.gst).toLocaleString('en-IN')}</span></td>
                  <td data-label={t('txn.date')}><span className="txn-date">{txn.date}</span></td>
                  <td data-label={t('txn.status')}>
                    <span className={`status-pill ${STATUS_KEYS[txn.status].cls}`}>
                      {t(STATUS_KEYS[txn.status].key)}
                    </span>
                  </td>
                  <td data-label="Action">
                    <button className="btn-action btn-action-ghost" onClick={() => printVoucher(txn)}>
                      <Printer size={14} /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}


