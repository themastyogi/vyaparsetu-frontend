import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Users, Package, IndianRupee, AlertTriangle, ArrowUpRight, FileText, ShoppingCart, Clock } from 'lucide-react';
import './Dashboard.css';

const MONTHLY = [
  { m: 'Oct', rev: 60, exp: 40 }, { m: 'Nov', rev: 75, exp: 50 },
  { m: 'Dec', rev: 85, exp: 55 }, { m: 'Jan', rev: 65, exp: 45 },
  { m: 'Feb', rev: 90, exp: 60 }, { m: 'Mar', rev: 80, exp: 52 },
  { m: 'Apr', rev: 100, exp: 65 },
];

const RECENT_TXN = [
  { id: 'txn-1', type: 'Sales Invoice',  party: 'Ravi Enterprises', amount: '₹ 42,000', gst: '₹ 7,560',  date: '23 Apr 2026', status: 'paid' },
  { id: 'txn-2', type: 'Purchase Bill',  party: 'Sahil Traders',    amount: '₹ 18,500', gst: '₹ 3,330',  date: '22 Apr 2026', status: 'pending' },
  { id: 'txn-3', type: 'Sales Invoice',  party: 'Metro Retail Co.', amount: '₹ 95,000', gst: '₹ 17,100', date: '21 Apr 2026', status: 'paid' },
  { id: 'txn-4', type: 'Credit Note',    party: 'Alpha Supplies',   amount: '₹ 5,200',  gst: '₹ 936',    date: '20 Apr 2026', status: 'draft' },
  { id: 'txn-5', type: 'Purchase Bill',  party: 'Kumar & Sons',     amount: '₹ 31,000', gst: '₹ 5,580',  date: '19 Apr 2026', status: 'overdue' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STATS = [
    { id: 'total-revenue',         label: t('dashboard.total_revenue'), value: '₹ 24,80,500', change: '+18.4%', positive: true,  sub: t('dashboard.vs_last_month'),    icon: <IndianRupee size={20}/>, color: 'purple' },
    { id: 'outstanding-receivable', label: t('dashboard.outstanding'),  value: '₹ 6,32,000',  change: '-4.2%',  positive: false, sub: `12 ${t('dashboard.parties_pending')}`, icon: <TrendingUp size={20}/>, color: 'blue' },
    { id: 'total-parties',          label: t('dashboard.total_parties'), value: '148',         change: '+6',     positive: true,  sub: t('dashboard.added_month'),      icon: <Users size={20}/>,        color: 'green' },
    { id: 'low-stock-items',        label: t('dashboard.low_stock'),    value: '7',            change: t('dashboard.action_needed'), positive: false, sub: t('dashboard.below_reorder'), icon: <Package size={20}/>, color: 'amber' },
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
          <h1 className="dash-title">{t('dashboard.greeting')}, Vikas 👋</h1>
          <p className="dash-sub">{t('dashboard.subtitle', { company: 'Sharma Traders' })}</p>
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
          <div key={s.id} id={s.id} className={`stat-card stat-card-${s.color}`}>
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
              </tr>
            </thead>
            <tbody>
              {RECENT_TXN.map(txn => (
                <tr key={txn.id} id={txn.id}>
                  <td data-label={t('txn.type')}><span className="txn-type">{txn.type}</span></td>
                  <td data-label={t('txn.party')}><span className="txn-party">{txn.party}</span></td>
                  <td data-label={t('txn.amount')}><span className="txn-amount">{txn.amount}</span></td>
                  <td data-label={t('txn.gst')}><span className="txn-gst">{txn.gst}</span></td>
                  <td data-label={t('txn.date')}><span className="txn-date">{txn.date}</span></td>
                  <td data-label={t('txn.status')}>
                    <span className={`status-pill ${STATUS_KEYS[txn.status].cls}`}>
                      {t(STATUS_KEYS[txn.status].key)}
                    </span>
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
