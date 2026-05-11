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

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const company = useCompany();

  const currentHour = new Date().getHours();
  let greetingKey = 'dashboard.greeting_afternoon';
  if (currentHour < 12) greetingKey = 'dashboard.greeting_morning';
  else if (currentHour >= 17) greetingKey = 'dashboard.greeting_evening';

  const [printTxn, setPrintTxn] = useState<any>(null);
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, parties: 0, lowStock: 0 });

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
                    <button className="btn-action btn-action-ghost" onClick={() => {
                      setPrintTxn(txn);
                      setTimeout(() => window.print(), 100);
                    }}>
                      <Printer size={14} /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Printable Voucher for Dashboard Recent Txns */}
      {printTxn && (
        <div className="print-only-voucher" style={{ display: 'none' }}>
          <div style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
            
            <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '2px' }}>
              {company.companyName}
            </h1>
            <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '16px' }}>{company.address}</div>
            <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
              {printTxn.type} Voucher
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
              <div>No. : <b>{printTxn.id.split('-')[1]}</b></div>
              <div>Dated : <b>{printTxn.date}</b></div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #000', borderBottom: '2px solid #000', borderLeft: '1px solid #000', borderRight: '1px solid #000', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', background: 'rgba(0,0,0,0.03)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderRight: '1px solid #000', width: '60%', fontWeight: 'bold' }}>Particulars</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #000', width: '20%', fontWeight: 'bold' }}>Debit (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '20%', fontWeight: 'bold' }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '20px 12px', borderRight: '1px solid #000', verticalAlign: 'top', lineHeight: '1.6' }}>
                    {printTxn.type.includes('Sales') ? (
                      <>
                        <div style={{ fontWeight: 'bold' }}>{printTxn.party}</div>
                        <div style={{ marginLeft: '40px', marginTop: '12px' }}>To Sales A/c</div>
                        {Number(printTxn.gst) > 0 && (
                          <div style={{ marginLeft: '40px', marginTop: '8px' }}>To Output GST A/c</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 'bold' }}>Inventory / Expense A/c</div>
                        {Number(printTxn.gst) > 0 && (
                          <div style={{ fontWeight: 'bold', marginTop: '8px' }}>Input GST A/c</div>
                        )}
                        <div style={{ marginLeft: '40px', marginTop: '12px' }}>To {printTxn.party}</div>
                      </>
                    )}
                    <div style={{ marginTop: '40px', fontStyle: 'italic', fontSize: '13px' }}>
                      <b>Narration:</b> Being {printTxn.type} recorded for {printTxn.party} (Ref: {printTxn.id}).
                    </div>
                  </td>
                  <td style={{ padding: '20px 12px', textAlign: 'right', borderRight: '1px solid #000', verticalAlign: 'top', lineHeight: '1.6' }}>
                    {printTxn.type.includes('Sales') ? (
                      <>
                        <div>{Number(printTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div style={{ marginTop: '12px' }}></div>
                        <div style={{ marginTop: '8px' }}></div>
                      </>
                    ) : (
                      <>
                        <div>{(Number(printTxn.amount) - Number(printTxn.gst)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        {Number(printTxn.gst) > 0 && (
                          <div style={{ marginTop: '8px' }}>{Number(printTxn.gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        )}
                        <div style={{ marginTop: '12px' }}></div>
                      </>
                    )}
                  </td>
                  <td style={{ padding: '20px 12px', textAlign: 'right', verticalAlign: 'top', lineHeight: '1.6' }}>
                     {printTxn.type.includes('Sales') ? (
                      <>
                        <div></div>
                        <div style={{ marginTop: '12px' }}>{(Number(printTxn.amount) - Number(printTxn.gst)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        {Number(printTxn.gst) > 0 && (
                          <div style={{ marginTop: '8px' }}>{Number(printTxn.gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div></div>
                        <div style={{ marginTop: '8px' }}></div>
                        <div style={{ marginTop: '12px' }}>{Number(printTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </>
                    )}
                  </td>
                </tr>
                <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', background: 'rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '12px', textAlign: 'right', borderRight: '1px solid #000' }}>Total:</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderRight: '1px solid #000' }}>{Number(printTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{Number(printTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '30px', fontSize: '14px' }}>
              <span style={{ fontWeight: 'bold' }}>Amount (in words):</span> INR {numberToWords(Math.floor(Number(printTxn.amount)))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', width: '200px', marginBottom: '5px' }}></div>
                <div>Authorised Signatory</div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
