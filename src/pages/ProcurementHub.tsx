import { useState } from 'react';
import {
  Building2, FileText, Plus, Sparkles, Award, FileCheck
} from 'lucide-react';
import { useProcurement } from '../hooks/useProcurement';

export default function ProcurementHub() {
  const {
    departments,
    indents,
    rfqs,
    purchaseOrders,
    createIndent,
    generateRFQFromIndent,
    convertL1QuoteToPO
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<'budgets' | 'indents' | 'rfqs' | 'pos'>('budgets');

  // Modal State for New Indent
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [indentForm, setIndentForm] = useState({
    departmentId: departments[0]?.id || 'dept-1',
    requestedBy: 'Department Head',
    itemDescription: 'High-Performance Laptops',
    hsnCode: '8471',
    requestedQty: 10,
    availableStockQty: 2,
    estimatedRate: 65000
  });

  const handleCreateIndentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIndent({
      departmentId: indentForm.departmentId,
      requestedBy: indentForm.requestedBy,
      items: [
        {
          itemDescription: indentForm.itemDescription,
          hsnCode: indentForm.hsnCode,
          requestedQty: Number(indentForm.requestedQty),
          availableStockQty: Number(indentForm.availableStockQty),
          estimatedRate: Number(indentForm.estimatedRate)
        }
      ]
    });
    setShowIndentModal(false);
    setActiveTab('indents');
  };

  const handleGenerateRFQSubmit = (indentId: string) => {
    generateRFQFromIndent(indentId, [
      'Apex Infotech Solutions',
      'Reliancesoft Systems',
      'Sahil Traders Pvt Ltd'
    ]);
    setActiveTab('rfqs');
  };

  const handleConvertL1PO = (rfqId: string) => {
    convertL1QuoteToPO(rfqId);
    setActiveTab('pos');
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            🏢 Departmental Procurement &amp; L1 Quote-to-Order Hub <Sparkles size={20} style={{ color: '#FBBF24' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Department Budget Tracking · Stock Verification · Multi-Vendor L1 Quotation Comparison · Audit Linked PO Conversion
          </p>
        </div>

        <button
          onClick={() => setShowIndentModal(true)}
          className="btn-action btn-action-primary"
          style={{ padding: '10px 20px', fontWeight: 800, gap: 8, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', borderColor: '#10B981' }}
        >
          <Plus size={16}/> + Raise New Purchase Indent (PR)
        </button>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border-subtle)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('budgets')}
          style={{
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 800,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'budgets' ? '3px solid #10B981' : '3px solid transparent',
            color: activeTab === 'budgets' ? '#10B981' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Building2 size={16}/> 1. Department Budgets ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('indents')}
          style={{
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 800,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'indents' ? '3px solid #10B981' : '3px solid transparent',
            color: activeTab === 'indents' ? '#10B981' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FileText size={16}/> 2. Purchase Indents / PR ({indents.length})
        </button>

        <button
          onClick={() => setActiveTab('rfqs')}
          style={{
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 800,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rfqs' ? '3px solid #10B981' : '3px solid transparent',
            color: activeTab === 'rfqs' ? '#10B981' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Award size={16}/> 3. L1 Vendor Quotes / RFQ ({rfqs.length})
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          style={{
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 800,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pos' ? '3px solid #10B981' : '3px solid transparent',
            color: activeTab === 'pos' ? '#10B981' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FileCheck size={16}/> 4. Converted Orders / PO ({purchaseOrders.length})
        </button>
      </div>

      {/* TAB 1: DEPARTMENT BUDGETS */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map(dept => {
            const totalUsed = dept.consumedBudget + dept.pendingPRValue;
            const remaining = dept.allocatedBudget - totalUsed;
            const pctUsed = Math.min(100, Math.round((totalUsed / dept.allocatedBudget) * 100));
            const isOverBudget = remaining < 0;

            return (
              <div key={dept.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: isOverBudget ? '2px solid #EF4444' : '1px solid var(--border-default)', padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>{dept.code}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0' }}>{dept.departmentName}</h3>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: isOverBudget ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: isOverBudget ? '#EF4444' : '#10B981' }}>
                    {isOverBudget ? '🔴 BEYOND BUDGET' : '🟢 Within Budget'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Allocated Annual Budget</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>₹{dept.allocatedBudget.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Available Remaining</span>
                    <strong style={{ color: isOverBudget ? '#EF4444' : '#10B981', fontSize: 14 }}>₹{remaining.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Budget Utilized ({pctUsed}%)</span>
                    <span>Consumed: ₹{dept.consumedBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ width: `${pctUsed}%`, height: '100%', background: isOverBudget ? '#EF4444' : pctUsed > 85 ? '#F59E0B' : '#10B981', transition: 'width 0.3s' }}/>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                  Pending PR Indents Value: <strong>₹{dept.pendingPRValue.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PURCHASE INDENTS / PR */}
      {activeTab === 'indents' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Indent No</th>
                <th style={{ padding: '12px 16px' }}>Department &amp; Requester</th>
                <th style={{ padding: '12px 16px' }}>Items Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Est. Amount</th>
                <th style={{ padding: '12px 16px' }}>Stock Availability Check</th>
                <th style={{ padding: '12px 16px' }}>Budget Check</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {indents.map(pr => (
                <tr key={pr.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--brand-primary)' }}>{pr.indentNo}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{pr.departmentName}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>By: {pr.requestedBy}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {pr.items.map((item, idx) => (
                      <div key={idx}>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.itemDescription}</strong>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                          Req: {item.requestedQty} Pcs | Avail Stock: {item.availableStockQty} Pcs
                        </span>
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>
                    ₹{pr.totalEstimatedAmount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 700, background: pr.stockAvailabilityStatus.includes('Out') ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: pr.stockAvailabilityStatus.includes('Out') ? '#EF4444' : '#10B981' }}>
                      {pr.stockAvailabilityStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 700, background: pr.budgetsCheckStatus.includes('WARNING') ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: pr.budgetsCheckStatus.includes('WARNING') ? '#EF4444' : '#10B981' }}>
                      {pr.budgetsCheckStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {pr.status === 'Pending Quote' ? (
                      <button
                        onClick={() => handleGenerateRFQSubmit(pr.id)}
                        className="btn-action btn-action-primary"
                        style={{ fontSize: 11, padding: '6px 12px', fontWeight: 800, background: '#3B82F6', borderColor: '#3B82F6' }}
                      >
                        ⚡ Generate Quotes (RFQ) →
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{pr.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: L1 VENDOR QUOTATION COMPARISON */}
      {activeTab === 'rfqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rfqs.map(rfq => (
            <div key={rfq.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>{rfq.rfqNo} (Linked Indent: {rfq.indentNo})</span>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0' }}>{rfq.itemDescription} (Qty: {rfq.qty} Pcs)</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Department: {rfq.departmentName}</span>
                </div>

                {rfq.status !== 'Converted to PO' && (
                  <button
                    onClick={() => handleConvertL1PO(rfq.id)}
                    className="btn-action btn-action-primary"
                    style={{ padding: '10px 20px', fontWeight: 900, background: '#10B981', borderColor: '#10B981', gap: 8 }}
                  >
                    ⚡ Convert L1 Quote to Purchase Order (PO) →
                  </button>
                )}
              </div>

              {/* Vendor Quotes Comparison Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: 8 }}>Vendor Name</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Freight</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>GST %</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Total Landed Cost</th>
                    <th style={{ padding: 8 }}>Delivery Days</th>
                    <th style={{ padding: 8 }}>Payment Terms</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>L1 Evaluation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.vendorResponses.map((v, idx) => (
                    <tr key={idx} style={{ background: v.isL1 ? 'rgba(16,185,129,0.08)' : 'transparent', borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 8, fontWeight: 800, color: 'var(--text-primary)' }}>{v.vendorName}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>₹{v.unitRate.toLocaleString('en-IN')}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>₹{v.freightAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{v.gstPct}%</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 900, color: v.isL1 ? '#10B981' : 'var(--text-primary)', fontSize: 13 }}>
                        ₹{v.totalLandedCost.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 8 }}>{v.deliveryDays} Days</td>
                      <td style={{ padding: 8 }}>{v.paymentTerms}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        {v.isL1 ? (
                          <span style={{ padding: '4px 10px', borderRadius: 12, background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Award size={13}/> L1 Lowest Bidder
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Non-L1 Bid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PURCHASE ORDERS & AUDIT CHAIN LINKAGE */}
      {activeTab === 'pos' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>PO Number</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Vendor Name</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Net Amount</th>
                <th style={{ padding: '12px 16px' }}>Audit Chain Linkage</th>
                <th style={{ padding: '12px 16px' }}>PO Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--brand-primary)' }}>{po.poNo}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{po.date}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>{po.vendorName}</td>
                  <td style={{ padding: '14px 16px' }}>{po.departmentName}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, color: '#10B981' }}>
                    ₹{po.netTotal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4 }}>Indent: {po.indentNo}</span>
                      <span>➔</span>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4 }}>Quote: {po.rfqNo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE INDENT */}
      {showIndentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              📝 Raise New Department Purchase Indent (PR)
            </h3>

            <form onSubmit={handleCreateIndentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Target Department *</label>
                <select
                  value={indentForm.departmentId}
                  onChange={e => setIndentForm(f => ({ ...f, departmentId: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 700 }}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentName} (Avail: ₹{(d.allocatedBudget - (d.consumedBudget + d.pendingPRValue)).toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Requested By (Staff Name / Designation) *</label>
                <input
                  required
                  value={indentForm.requestedBy}
                  onChange={e => setIndentForm(f => ({ ...f, requestedBy: e.target.value }))}
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Item Description *</label>
                <input
                  required
                  value={indentForm.itemDescription}
                  onChange={e => setIndentForm(f => ({ ...f, itemDescription: e.target.value }))}
                  className="field-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Requested Qty *</label>
                  <input
                    type="number"
                    required
                    value={indentForm.requestedQty}
                    onChange={e => setIndentForm(f => ({ ...f, requestedQty: Number(e.target.value) }))}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Warehouse Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={indentForm.availableStockQty}
                    onChange={e => setIndentForm(f => ({ ...f, availableStockQty: Number(e.target.value) }))}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Estimated Rate per Unit (₹) *</label>
                <input
                  type="number"
                  required
                  value={indentForm.estimatedRate}
                  onChange={e => setIndentForm(f => ({ ...f, estimatedRate: Number(e.target.value) }))}
                  className="field-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowIndentModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }}>
                  Submit Purchase Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
