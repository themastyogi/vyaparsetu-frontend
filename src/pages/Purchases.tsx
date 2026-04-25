import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Camera, Filter, FileText } from 'lucide-react';
import { usePurchaseWizard } from '../components/purchase/usePurchaseWizard';
import PurchaseWizard from '../components/purchase/PurchaseWizard';
import './Parties.css'; // Reusing layout CSS

// Mock data for the list
export let MOCK_PURCHASES = [
  { id: '1', vendorName: 'Sharma Traders', invoiceNo: 'INV-2026-042', date: '2026-04-20', amount: 45000, status: 'posted', isOcr: true },
  { id: '2', vendorName: 'Reliance Retail Ltd', invoiceNo: 'RR/001/26', date: '2026-04-22', amount: 12500, status: 'processing', isOcr: true },
  { id: '3', vendorName: 'Office World', invoiceNo: 'OW-8892', date: '2026-04-24', amount: 3200, status: 'failed', isOcr: false },
  { id: '4', vendorName: 'Tech Solutions India', invoiceNo: 'TSI-APR-05', date: '2026-04-18', amount: 89000, status: 'posted', isOcr: true },
];

export const addMockPurchase = (purchase: any) => {
  MOCK_PURCHASES = [purchase, ...MOCK_PURCHASES];
  window.dispatchEvent(new Event('purchases_updated'));
};

export default function Purchases() {
  const { t } = useTranslation();
  const wizard = usePurchaseWizard();
  const [purchases, setPurchases] = useState(MOCK_PURCHASES);
  const [filter, setFilter] = useState<'all' | 'posted' | 'processing' | 'failed'>('all');
  const [search, setSearch] = useState('');

  // Listen for newly added purchases
  useEffect(() => {
    const handleUpdate = () => setPurchases([...MOCK_PURCHASES]);
    window.addEventListener('purchases_updated', handleUpdate);
    return () => window.removeEventListener('purchases_updated', handleUpdate);
  }, []);

  const filtered = purchases
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => 
      p.vendorName.toLowerCase().includes(search.toLowerCase()) || 
      p.invoiceNo.toLowerCase().includes(search.toLowerCase())
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted': return <span className="status-pill status-paid">{t('purchase.status_posted', 'Posted')}</span>;
      case 'processing': return <span className="status-pill status-pending">{t('purchase.status_processing', 'Processing...')}</span>;
      case 'failed': return <span className="status-pill status-overdue">{t('purchase.status_failed', 'Failed')}</span>;
      default: return null;
    }
  };

  return (
    <div className="page-root animate-fade-in purchase-module">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('purchase.title', 'Purchase Bills')}</h1>
          <p className="page-sub">{t('purchase.subtitle', 'Manage all your vendor bills and expenses')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-action btn-action-secondary" onClick={() => {
            wizard.clearDraft();
            wizard.updateData({ source: 'manual' });
            wizard.openWizardAtStep('basic_details');
          }}>
            <Plus size={15}/> {t('purchase.add_manual', 'Add Manually')}
          </button>
          <button className="btn-action btn-action-primary" onClick={() => {
            wizard.clearDraft();
            wizard.updateData({ source: 'ocr' });
            wizard.openWizardAtStep('ocr_camera');
          }}>
            <Camera size={15}/> {t('purchase.scan_bill', 'Scan Bill')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="party-summary">
        <div className="summary-card">
          <div className="summary-val">{purchases.length}</div>
          <div className="summary-lbl">{t('purchase.total_bills', 'Total Bills')}</div>
        </div>
        <div className="summary-card summary-pay">
          <div className="summary-val">₹ 1,49,700</div>
          <div className="summary-lbl">{t('purchase.total_amount', 'Total Amount')}</div>
        </div>
        <div className="summary-card summary-recv">
          <div className="summary-val">₹ 26,946</div>
          <div className="summary-lbl">{t('purchase.gst_credit', 'Est. GST Credit')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon"/>
          <input
            type="text"
            placeholder={t('purchase.search_ph', 'Search by vendor or invoice no...')}
            className="toolbar-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(['all', 'posted', 'processing', 'failed'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {t(`purchase.filter_${f}`, f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>
        <button className="icon-btn">
          <Filter size={15}/> {t('common.filter', 'Filter')}
        </button>
      </div>

      {/* List / Table */}
      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('purchase.col_vendor', 'Vendor Name')}</th>
                <th>{t('purchase.col_invoice', 'Invoice No & Date')}</th>
                <th>{t('purchase.col_amount', 'Amount')}</th>
                <th>{t('purchase.col_status', 'Status')}</th>
                <th>{t('purchase.col_source', 'Source')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">{t('common.na', 'No bills found')}</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td data-label={t('purchase.col_vendor', 'Vendor Name')}>
                      <div className="party-name-cell">
                        <div className="party-avatar">
                          {p.vendorName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{p.vendorName}</span>
                      </div>
                    </td>
                    <td data-label={t('purchase.col_invoice', 'Invoice')}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.invoiceNo}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.date}</div>
                      </div>
                    </td>
                    <td data-label={t('purchase.col_amount', 'Amount')}>
                      <div style={{ fontWeight: 600 }}>₹ {p.amount.toLocaleString('en-IN')}</div>
                    </td>
                    <td data-label={t('purchase.col_status', 'Status')}>
                      {getStatusBadge(p.status)}
                    </td>
                    <td data-label={t('purchase.col_source', 'Source')}>
                      {p.isOcr ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-secondary)', fontSize: '12px' }}>
                          <Camera size={14} /> OCR
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          <FileText size={14} /> Manual
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Wizard (Hidden when isOpen=false) */}
      <PurchaseWizard wizard={wizard} />
    </div>
  );
}
