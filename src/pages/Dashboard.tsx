import { TrendingUp, TrendingDown, Users, Package, IndianRupee, AlertTriangle, ArrowUpRight, FileText, ShoppingCart, Clock } from 'lucide-react';
import './Dashboard.css';

const STATS = [
  {
    id: 'total-revenue',
    label: 'Total Revenue',
    value: '₹ 24,80,500',
    change: '+18.4%',
    positive: true,
    sub: 'vs last month',
    icon: <IndianRupee size={20}/>,
    color: 'purple',
  },
  {
    id: 'outstanding-receivable',
    label: 'Outstanding Receivable',
    value: '₹ 6,32,000',
    change: '-4.2%',
    positive: false,
    sub: '12 parties pending',
    icon: <TrendingUp size={20}/>,
    color: 'blue',
  },
  {
    id: 'total-parties',
    label: 'Total Parties',
    value: '148',
    change: '+6',
    positive: true,
    sub: 'added this month',
    icon: <Users size={20}/>,
    color: 'green',
  },
  {
    id: 'low-stock-items',
    label: 'Low Stock Items',
    value: '7',
    change: 'Action needed',
    positive: false,
    sub: 'below reorder level',
    icon: <Package size={20}/>,
    color: 'amber',
  },
];

const RECENT_TXN = [
  { id: 'txn-1', type: 'Sales Invoice', party: 'Ravi Enterprises', amount: '₹ 42,000', gst: '₹ 7,560', date: '23 Apr 2026', status: 'paid' },
  { id: 'txn-2', type: 'Purchase Bill', party: 'Sahil Traders',    amount: '₹ 18,500', gst: '₹ 3,330', date: '22 Apr 2026', status: 'pending' },
  { id: 'txn-3', type: 'Sales Invoice', party: 'Metro Retail Co.',  amount: '₹ 95,000', gst: '₹ 17,100', date: '21 Apr 2026', status: 'paid' },
  { id: 'txn-4', type: 'Credit Note',   party: 'Alpha Supplies',    amount: '₹ 5,200',  gst: '₹ 936',   date: '20 Apr 2026', status: 'draft' },
  { id: 'txn-5', type: 'Purchase Bill', party: 'Kumar & Sons',      amount: '₹ 31,000', gst: '₹ 5,580', date: '19 Apr 2026', status: 'overdue' },
];

const ALERTS = [
  { id: 'alert-gst', icon: <AlertTriangle size={14}/>, color: 'amber', text: 'GSTR-3B due in 5 days — ₹1.2L payable' },
  { id: 'alert-recon', icon: <Clock size={14}/>, color: 'blue', text: '3 purchase invoices pending reconciliation' },
];

const MONTHLY = [
  { m: 'Oct', rev: 60, exp: 40 },
  { m: 'Nov', rev: 75, exp: 50 },
  { m: 'Dec', rev: 85, exp: 55 },
  { m: 'Jan', rev: 65, exp: 45 },
  { m: 'Feb', rev: 90, exp: 60 },
  { m: 'Mar', rev: 80, exp: 52 },
  { m: 'Apr', rev: 100, exp: 65 },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'status-paid' },
  pending: { label: 'Pending', cls: 'status-pending' },
  draft:   { label: 'Draft',   cls: 'status-draft' },
  overdue: { label: 'Overdue', cls: 'status-overdue' },
};

export default function Dashboard() {
  return (
    <div className="dash-root animate-fade-in">
      {/* ── Page header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Good afternoon, Vikas 👋</h1>
          <p className="dash-sub">Here's what's happening with Sharma Traders today.</p>
        </div>
        <div className="dash-header-actions">
          <button id="new-invoice-btn" className="btn-action btn-action-secondary">
            <FileText size={15}/> New Invoice
          </button>
          <button id="new-purchase-btn" className="btn-action btn-action-primary">
            <ShoppingCart size={15}/> Record Purchase
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {ALERTS.map(a => (
        <div key={a.id} id={a.id} className={`dash-alert dash-alert-${a.color}`}>
          <span className="alert-icon">{a.icon}</span>
          <span className="alert-text">{a.text}</span>
          <button className="alert-dismiss">Dismiss</button>
        </div>
      ))}

      {/* ── KPI Stats ── */}
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

      {/* ── Charts + Quick actions ── */}
      <div className="dash-mid">
        {/* Bar chart */}
        <div className="dash-chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Revenue vs Expenses</h3>
              <p className="card-sub">Last 7 months · FY 2025–26</p>
            </div>
            <div className="chart-legend">
              <span className="legend-dot legend-purple"/>Revenue
              <span className="legend-dot legend-pink" style={{ marginLeft: 12 }}/>Expenses
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

        {/* Quick actions */}
        <div className="dash-quick-card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
          {[
            { id: 'qa-sales', icon: <FileText size={16}/>, label: 'Create Sales Invoice', sub: 'GST auto-calculated' },
            { id: 'qa-party', icon: <Users size={16}/>,    label: 'Add New Party',        sub: 'GSTIN validated' },
            { id: 'qa-item',  icon: <Package size={16}/>,  label: 'Add Item / Stock',     sub: 'HSN lookup ready' },
            { id: 'qa-trial', icon: <TrendingUp size={16}/>, label: 'View Trial Balance', sub: 'Live & updated' },
          ].map(q => (
            <button key={q.id} id={q.id} className="quick-btn">
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

      {/* ── Recent Transactions ── */}
      <div className="dash-table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Transactions</h3>
            <p className="card-sub">All vouchers · April 2026</p>
          </div>
          <button id="view-all-txn" className="view-all-btn">View all <ArrowUpRight size={13}/></button>
        </div>
        <div className="table-wrap">
          <table className="data-table" id="transactions-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Party</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TXN.map(t => (
                <tr key={t.id} id={t.id}>
                  <td><span className="txn-type">{t.type}</span></td>
                  <td><span className="txn-party">{t.party}</span></td>
                  <td><span className="txn-amount">{t.amount}</span></td>
                  <td><span className="txn-gst">{t.gst}</span></td>
                  <td><span className="txn-date">{t.date}</span></td>
                  <td>
                    <span className={`status-pill ${STATUS_MAP[t.status].cls}`}>
                      {STATUS_MAP[t.status].label}
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
