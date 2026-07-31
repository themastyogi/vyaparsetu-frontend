import { useState } from 'react';
import {
  Building2, FileText, Plus, Sparkles, Award, FileCheck,
  History, Calendar
} from 'lucide-react';
import { useProcurement, SYSTEM_EMPLOYEES } from '../hooks/useProcurement';
import { useMaster } from '../hooks/useMaster';

export default function ProcurementHub() {
  const {
    departments,
    masterDepartments,
    auditLogs,
    indents,
    rfqs,
    purchaseOrders,
    createIndent,
    generateRFQFromIndent,
    convertL1QuoteToPO,
    updateDepartmentBudget,
    addDepartment,
    addMasterDepartment,
    updateMasterDepartmentRecord,
    deleteMasterDepartment
  } = useProcurement();

  const { items: masterItems } = useMaster();

  const [activeTab, setActiveTab] = useState<'budgets' | 'indents' | 'rfqs' | 'pos'>('budgets');

  // User Role Switcher: 'admin' sees budget targets & edits; 'user' is restricted
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  // Department Master Table Modal State
  const [showMasterDeptModal, setShowMasterDeptModal] = useState(false);
  const [masterDeptForm, setMasterDeptForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  // Budget Allocation Audit Trail History Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState('2026-07-31');

  // Modal State for New Indent
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [indentForm, setIndentForm] = useState({
    departmentId: departments[0]?.id || 'dept-1',
    requestedBy: SYSTEM_EMPLOYEES[0]?.name || 'Vikram Singh (IT Head)',
    selectedItemId: masterItems[0]?.id || 'i1',
    itemDescription: masterItems[0]?.name || 'A4 Paper Ream',
    hsnCode: masterItems[0]?.hsn || '48021000',
    requestedQty: 10,
    availableStockQty: 2,
    estimatedRate: masterItems[0]?.price || 450,
    specifications: 'Standard 80GSM A4 Copier Paper, 500 Sheets per Ream, Bright White',
    expectedReceiptDate: '2026-08-15'
  });

  // Edit Budget Modal State
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [newBudgetVal, setNewBudgetVal] = useState<number>(5000000);

  // Add Department Modal State
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [addDeptForm, setAddDeptForm] = useState({
    name: '',
    code: '',
    budget: 1000000
  });

  const handleOpenEditBudget = (deptId: string, currentName: string, currentVal: number) => {
    setEditingDeptId(deptId);
    setEditingDeptName(currentName);
    setNewBudgetVal(currentVal);
    setShowEditBudgetModal(true);
  };

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeptId) {
      updateDepartmentBudget(editingDeptId, Number(newBudgetVal));
    }
    setShowEditBudgetModal(false);
  };

  const handleAddDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment(addDeptForm.name, addDeptForm.code || 'DEPT-00', Number(addDeptForm.budget));
    setShowAddDeptModal(false);
    setAddDeptForm({ name: '', code: '', budget: 1000000 });
  };

  const handleCreateMasterDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterDeptForm.code && masterDeptForm.name) {
      addMasterDepartment(masterDeptForm.code, masterDeptForm.name, masterDeptForm.description);
      setMasterDeptForm({ code: '', name: '', description: '' });
    }
  };

  const handleItemSelectChange = (itemId: string) => {
    const found = masterItems.find(i => i.id === itemId);
    if (found) {
      setIndentForm(f => ({
        ...f,
        selectedItemId: found.id,
        itemDescription: found.name,
        hsnCode: found.hsn || '8471',
        availableStockQty: (found as any).qty ?? 2,
        estimatedRate: found.price || 1000
      }));
    }
  };

  const handleCreateIndentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIndent({
      departmentId: indentForm.departmentId,
      requestedBy: indentForm.requestedBy,
      items: [
        {
          itemId: indentForm.selectedItemId,
          itemDescription: indentForm.itemDescription,
          hsnCode: indentForm.hsnCode,
          requestedQty: Number(indentForm.requestedQty),
          availableStockQty: Number(indentForm.availableStockQty),
          estimatedRate: Number(indentForm.estimatedRate),
          specifications: indentForm.specifications,
          expectedReceiptDate: indentForm.expectedReceiptDate
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            🏢 Departmental Procurement &amp; L1 Quote-to-Order Hub <Sparkles size={20} style={{ color: '#FBBF24' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Department Budget Tracking · Stock Verification · Multi-Vendor L1 Quotation Comparison · Audit Linked PO Conversion
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Role Switcher */}
          <div style={{ background: 'var(--bg-card)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Active Role:</span>
            <button
              onClick={() => setUserRole('admin')}
              style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: userRole === 'admin' ? 'var(--brand-primary)' : 'none', color: userRole === 'admin' ? '#fff' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
            >
              👑 Admin / Finance
            </button>
            <button
              onClick={() => setUserRole('user')}
              style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: userRole === 'user' ? '#10B981' : 'none', color: userRole === 'user' ? '#fff' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
            >
              👤 Normal Employee
            </button>
          </div>

          {/* Master Departments & Audit Trail History Buttons */}
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setShowMasterDeptModal(true)}
                className="btn-action btn-action-secondary"
                style={{ fontSize: 12, padding: '8px 14px', fontWeight: 800, gap: 6, borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
              >
                <Building2 size={15}/> ⚙️ Master Departments ({masterDepartments.length})
              </button>
              <button
                onClick={() => setShowAuditModal(true)}
                className="btn-action btn-action-secondary"
                style={{ fontSize: 12, padding: '8px 14px', fontWeight: 800, gap: 6 }}
              >
                <History size={15}/> 📜 Budget History Log
              </button>
            </>
          )}

          <button
            onClick={() => setShowIndentModal(true)}
            className="btn-action btn-action-primary"
            style={{ padding: '8px 18px', fontWeight: 800, gap: 8, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', borderColor: '#10B981' }}
          >
            <Plus size={16}/> + Raise Purchase Indent (PR)
          </button>
        </div>
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Manage annual/monthly budget allocations by department. System tracks real-time utilization &amp; alerts on over-budget indents.
            </span>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="btn-action btn-action-secondary"
              style={{ fontSize: 12, padding: '6px 14px', fontWeight: 800 }}
            >
              + Add New Department Budget
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allocated Budget</span>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleOpenEditBudget(dept.id, dept.departmentName, dept.allocatedBudget)}
                            style={{ background: 'rgba(108,71,255,0.15)', border: 'none', color: 'var(--brand-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                          >
                            ✏ Edit
                          </button>
                        )}
                      </div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                        {userRole === 'admin' ? `₹${dept.allocatedBudget.toLocaleString('en-IN')}` : '🔒 Restricted (Admin Only)'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Available Remaining</span>
                      <strong style={{ color: isOverBudget ? '#EF4444' : '#10B981', fontSize: 14 }}>
                        {userRole === 'admin' ? `₹${remaining.toLocaleString('en-IN')}` : '🔒 Restricted (Admin Only)'}
                      </strong>
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
                          Req: {item.requestedQty} Pcs | Actual Warehouse Stock: {item.availableStockQty} Pcs
                        </span>
                        {item.specifications && (
                          <div style={{ fontSize: 11, color: 'var(--brand-primary)', marginTop: 2, fontStyle: 'italic' }}>
                            📋 Specs: {item.specifications}
                          </div>
                        )}
                        {item.expectedReceiptDate && (
                          <div style={{ fontSize: 11, color: '#10B981', marginTop: 2, fontWeight: 700 }}>
                            📅 Expected Receipt: {item.expectedReceiptDate}
                          </div>
                        )}
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
                    <option key={d.id} value={d.id}>
                      {d.departmentName} {userRole === 'admin' ? `(Avail: ₹${(d.allocatedBudget - (d.consumedBudget + d.pendingPRValue)).toLocaleString('en-IN')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Requested By (Select Employee / User) *</label>
                <select
                  value={indentForm.requestedBy}
                  onChange={e => setIndentForm(f => ({ ...f, requestedBy: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 700 }}
                >
                  {SYSTEM_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      👤 {emp.name} — {emp.designation} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Select Item from System Master *</label>
                <select
                  value={indentForm.selectedItemId}
                  onChange={e => handleItemSelectChange(e.target.value)}
                  className="field-input"
                  style={{ fontWeight: 700, color: 'var(--brand-primary)' }}
                >
                  {masterItems.map(item => (
                    <option key={item.id} value={item.id}>
                      📦 {item.name} (HSN: {item.hsn} | Stock: {(item as any).qty ?? 2} {item.unit || 'Pcs'} | Est Rate: ₹{item.price})
                    </option>
                  ))}
                </select>
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
                    style={{ fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label className="field-label">Actual Warehouse Stock Qty</label>
                  <input
                    type="number"
                    readOnly
                    value={indentForm.availableStockQty}
                    className="field-input"
                    style={{ background: 'var(--bg-elevated)', fontWeight: 800, color: '#10B981' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Est. Unit Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={indentForm.estimatedRate}
                    onChange={e => setIndentForm(f => ({ ...f, estimatedRate: Number(e.target.value) }))}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Expected Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={indentForm.expectedReceiptDate}
                    onChange={e => setIndentForm(f => ({ ...f, expectedReceiptDate: e.target.value }))}
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Detailed Technical Specifications / Requirements *</label>
                <textarea
                  rows={2}
                  required
                  value={indentForm.specifications}
                  onChange={e => setIndentForm(f => ({ ...f, specifications: e.target.value }))}
                  placeholder="Enter detailed technical specs, model numbers, warranty requirements..."
                  className="field-input"
                  style={{ resize: 'vertical', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowIndentModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }}>
                  Submit Purchase Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DEPARTMENT BUDGET */}
      {showEditBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              ✏ Edit Allocated Budget
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Department: <strong>{editingDeptName}</strong>
            </p>

            <form onSubmit={handleSaveBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">New Allocated Annual Budget (₹) *</label>
                <input
                  type="number"
                  required
                  value={newBudgetVal}
                  onChange={e => setNewBudgetVal(Number(e.target.value))}
                  className="field-input"
                  style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowEditBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save Allocated Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW DEPARTMENT */}
      {showAddDeptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              ➕ Add New Department &amp; Allocated Budget
            </h3>

            <form onSubmit={handleAddDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Department Name *</label>
                <input
                  required
                  value={addDeptForm.name}
                  onChange={e => setAddDeptForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Research & Development (R&D)"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Department Code *</label>
                <input
                  required
                  value={addDeptForm.code}
                  onChange={e => setAddDeptForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. RND-05"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Allocated Annual Budget (₹) *</label>
                <input
                  type="number"
                  required
                  value={addDeptForm.budget}
                  onChange={e => setAddDeptForm(f => ({ ...f, budget: Number(e.target.value) }))}
                  className="field-input"
                  style={{ fontSize: 15, fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowAddDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }}>
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUDGET ALLOCATION AUDIT TRAIL HISTORY */}
      {showAuditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} style={{ color: 'var(--brand-primary)' }}/>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  📜 Department Budget Allocation Audit History
                </h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Filter Bar: From Date -> To Date */}
            <div style={{ padding: '12px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Calendar size={15} style={{ color: 'var(--brand-primary)' }}/>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>From Date:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="field-input"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Calendar size={15} style={{ color: 'var(--brand-primary)' }}/>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>To Date:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="field-input"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                />
              </div>

              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Showing <strong>{auditLogs.filter(a => a.date.substring(0, 10) >= fromDate && a.date.substring(0, 10) <= toDate).length}</strong> change records
              </span>
            </div>

            {/* Audit Logs Table */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Date &amp; Time</th>
                    <th style={{ padding: 10 }}>Department Name</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Old Budget</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>New Budget</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Change (+/-)</th>
                    <th style={{ padding: 10 }}>Modified By</th>
                    <th style={{ padding: 10 }}>Reason / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(a => a.date.substring(0, 10) >= fromDate && a.date.substring(0, 10) <= toDate)
                    .map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.date}</td>
                        <td style={{ padding: 10, fontWeight: 800, color: 'var(--text-primary)' }}>{log.departmentName}</td>
                        <td style={{ padding: 10, textAlign: 'right' }}>₹{log.oldAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{log.newAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 900, color: log.changeAmount >= 0 ? '#10B981' : '#EF4444' }}>
                          {log.changeAmount >= 0 ? `+₹${log.changeAmount.toLocaleString('en-IN')}` : `-₹${Math.abs(log.changeAmount).toLocaleString('en-IN')}`}
                        </td>
                        <td style={{ padding: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{log.changedBy}</td>
                        <td style={{ padding: 10, color: 'var(--text-muted)' }}>{log.reason || 'Manual Update'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAuditModal(false)} className="btn-action btn-action-ghost">Close History Audit</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: TENANT DEPARTMENT MASTER TABLE MANAGER */}
      {showMasterDeptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 840, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={22} style={{ color: 'var(--brand-primary)' }}/>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🏢 Tenant Department Master Table &amp; Central Lookup
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tenant-isolated master list of custom business departments &amp; codes</div>
                </div>
              </div>
              <button onClick={() => setShowMasterDeptModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Content: Form + Table */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Add New Master Department Form */}
              <form onSubmit={handleCreateMasterDeptSubmit} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-primary)', marginBottom: 10 }}>
                  ➕ Add New Custom Department to Tenant Master
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label className="field-label" style={{ fontSize: 11 }}>Dept Code *</label>
                    <input
                      required
                      placeholder="e.g. LOG-06"
                      value={masterDeptForm.code}
                      onChange={e => setMasterDeptForm(f => ({ ...f, code: e.target.value }))}
                      className="field-input"
                      style={{ fontWeight: 800, textTransform: 'uppercase', padding: '6px 10px', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: 11 }}>Department Name *</label>
                    <input
                      required
                      placeholder="e.g. Logistics & Supply Chain"
                      value={masterDeptForm.name}
                      onChange={e => setMasterDeptForm(f => ({ ...f, name: e.target.value }))}
                      className="field-input"
                      style={{ fontWeight: 700, padding: '6px 10px', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: 11 }}>Description / Scope</label>
                    <input
                      placeholder="e.g. Warehousing, freight & last-mile delivery"
                      value={masterDeptForm.description}
                      onChange={e => setMasterDeptForm(f => ({ ...f, description: e.target.value }))}
                      className="field-input"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    />
                  </div>
                  <button type="submit" className="btn-action btn-action-primary" style={{ height: 34, fontSize: 12, padding: '0 16px', fontWeight: 800 }}>
                    + Save to Master
                  </button>
                </div>
              </form>

              {/* Master Department Table */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Configured Tenant Departments ({masterDepartments.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: 10 }}>Code</th>
                      <th style={{ padding: 10 }}>Department Name</th>
                      <th style={{ padding: 10 }}>Description / Scope</th>
                      <th style={{ padding: 10 }}>Tenant ID</th>
                      <th style={{ padding: 10 }}>Status</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterDepartments.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 10, fontWeight: 900, color: 'var(--brand-primary)' }}>{d.code}</td>
                        <td style={{ padding: 10, fontWeight: 800, color: 'var(--text-primary)' }}>{d.name}</td>
                        <td style={{ padding: 10, color: 'var(--text-muted)' }}>{d.description}</td>
                        <td style={{ padding: 10 }}><code style={{ fontSize: 11 }}>{d.tenantId}</code></td>
                        <td style={{ padding: 10 }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: d.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: d.status === 'Active' ? '#10B981' : '#6B7280', fontWeight: 800 }}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: 10, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => updateMasterDepartmentRecord(d.id, { status: d.status === 'Active' ? 'Inactive' : 'Active' })}
                              style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              Toggle Status
                            </button>
                            <button
                              onClick={() => deleteMasterDepartment(d.id)}
                              style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', color: '#EF4444' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '12px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMasterDeptModal(false)} className="btn-action btn-action-ghost">Close Master Manager</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
