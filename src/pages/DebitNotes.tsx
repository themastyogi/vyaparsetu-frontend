import { useState } from 'react';
import { Zap, Search } from 'lucide-react';
import { useAccounting } from '../hooks/useAccounting';
import './Parties.css';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DebitNotes() {
  const { debitNotes } = useAccounting();
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sales' | 'Purchase'>('All');
  const [search, setSearch] = useState('');

  const filtered = debitNotes
    .filter(d => typeFilter === 'All' || d.type === typeFilter)
    .filter(d =>
      d.party.toLowerCase().includes(search.toLowerCase()) ||
      d.dnNo.toLowerCase().includes(search.toLowerCase()) ||
      d.relatedInvoiceNo.toLowerCase().includes(search.toLowerCase())
    );

  const totalSalesDeductions   = debitNotes.filter(d => d.type === 'Sales').reduce((s, d) => s + d.netTotal, 0);
  const totalPurchaseRecoveries = debitNotes.filter(d => d.type === 'Purchase').reduce((s, d) => s + d.netTotal, 0);

  return (
    <div className="page-root animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={22} style={{ color: '#f59e0b' }} /> Debit Notes
          </h1>
          <p className="page-sub">Quality deductions and purchase recoveries · auto-posted to ledger</p>
        </div>
      </div>

      <div className="party-summary">
        <div className="summary-card">
          <div className="summary-val">{debitNotes.length}</div>
          <div className="summary-lbl">Total Debit Notes</div>
        </div>
        <div className="summary-card summary-pay">
          <div className="summary-val">₹{f2(totalSalesDeductions)}</div>
          <div className="summary-lbl">Customer Deductions</div>
        </div>
        <div className="summary-card summary-recv">
          <div className="summary-val">₹{f2(totalPurchaseRecoveries)}</div>
          <div className="summary-lbl">Vendor Recoveries</div>
        </div>
        <div className="summary-card">
          <div className="summary-val" style={{ color: totalPurchaseRecoveries - totalSalesDeductions >= 0 ? '#22c55e' : '#ef4444' }}>
            ₹{f2(Math.abs(totalPurchaseRecoveries - totalSalesDeductions))}
          </div>
          <div className="summary-lbl">Net Position</div>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={14} className="toolbar-search-icon" />
          <input type="text" placeholder="Search by party, DN no. or invoice no…"
            className="toolbar-search-input" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {(['All', 'Sales', 'Purchase'] as const).map(f => (
            <button key={f} className={`filter-tab ${typeFilter === f ? 'filter-tab-active' : ''}`} onClick={() => setTypeFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="page-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>DN No.</th>
                <th>Type</th>
                <th>Date</th>
                <th>Party</th>
                <th>Related Invoice</th>
                <th>Reasons</th>
                <th style={{ textAlign: 'right' }}>Taxable (₹)</th>
                <th style={{ textAlign: 'right' }}>GST (₹)</th>
                <th style={{ textAlign: 'right' }}>Net Total (₹)</th>
                <th>Linked?</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-cell">
                    No debit notes yet — raise one from the ⚡ button on a Sales Invoice
                  </td>
                </tr>
              ) : (
                filtered.map(dn => (
                  <tr key={dn.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{dn.dnNo}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: dn.type === 'Sales' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                        color: dn.type === 'Sales' ? '#dc2626' : '#2563eb',
                      }}>
                        {dn.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{dn.date}</td>
                    <td style={{ fontWeight: 600 }}>{dn.party}</td>
                    <td style={{ fontSize: 12, color: 'var(--brand-primary)' }}>{dn.relatedInvoiceNo}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {dn.items.map(i => i.reason).join(', ')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{f2(dn.subtotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f2(dn.totalGst)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: dn.type === 'Sales' ? '#ef4444' : '#2563eb' }}>
                      {f2(dn.netTotal)}
                    </td>
                    <td>
                      {dn.linkedPurchaseDnId ? (
                        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Vendor linked</span>
                      ) : dn.type === 'Sales' ? (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
