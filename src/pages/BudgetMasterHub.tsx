import { useState } from 'react';
import { History, Calendar, Plus, ShieldCheck } from 'lucide-react';
import { useProcurement } from '../hooks/useProcurement';

export default function BudgetMasterHub() {
  const {
    departments,
    masterDepartments,
    auditLogs,
    updateDepartmentBudget,
    addDepartment
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState('2026-07-31');

  // Edit Budget Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [newBudgetVal, setNewBudgetVal] = useState<number>(5000000);

  // Add Budget Modal with Master Department Lookup
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState(masterDepartments[0]?.id || '');
  const [addBudgetForm, setAddBudgetForm] = useState({
    departmentName: masterDepartments[0]?.name || '',
    code: masterDepartments[0]?.code || '',
    description: masterDepartments[0]?.description || '',
    allocatedBudget: 5000000
  });

  const handleOpenEditBudget = (deptId: string, currentName: string, currentVal: number) => {
    setEditingDeptId(deptId);
    setEditingDeptName(currentName);
    setNewBudgetVal(currentVal);
    setShowEditModal(true);
  };

  const handleMasterDeptLookupChange = (masterId: string) => {
    setSelectedMasterId(masterId);
    const found = masterDepartments.find(m => m.id === masterId);
    if (found) {
      setAddBudgetForm(f => ({
        ...f,
        departmentName: found.name,
        code: found.code,
        description: found.description
      }));
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeptId) {
      updateDepartmentBudget(editingDeptId, Number(newBudgetVal));
      setShowEditModal(false);
    }
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment(addBudgetForm.departmentName, addBudgetForm.code, Number(addBudgetForm.allocatedBudget));
    setShowAddBudgetModal(false);
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            💰 Departmental Budget Master &amp; Audit Logs <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Annual Budget Allocation Master · Real-time Consumption Tracking · Date-to-Date Audit Trail
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (masterDepartments[0]) handleMasterDeptLookupChange(masterDepartments[0].id);
              setShowAddBudgetModal(true);
            }}
            className="btn-action btn-action-primary"
            style={{ fontWeight: 800, gap: 6 }}
          >
            <Plus size={16}/> + Allocate Budget to Department
          </button>

          <button
            onClick={() => setActiveTab('current')}
            className={`btn-action ${activeTab === 'current' ? 'btn-action-primary' : 'btn-action-secondary'}`}
            style={{ fontWeight: 800 }}
          >
            📊 Active Budgets
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn-action ${activeTab === 'history' ? 'btn-action-primary' : 'btn-action-secondary'}`}
            style={{ fontWeight: 800, gap: 6 }}
          >
            <History size={16}/> 📜 Date-to-Date Audit History
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE BUDGETS */}
      {activeTab === 'current' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {departments.map(dept => {
            const masterDeptObj = masterDepartments.find(m => m.code === dept.code || m.name === dept.departmentName);
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

                {/* Master Description */}
                {masterDeptObj && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
                    📋 {masterDeptObj.description}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allocated Budget</span>
                      <button
                        onClick={() => handleOpenEditBudget(dept.id, dept.departmentName, dept.allocatedBudget)}
                        style={{ background: 'rgba(108,71,255,0.15)', border: 'none', color: 'var(--brand-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                      >
                        ✏ Edit
                      </button>
                    </div>
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
                    <span>₹{totalUsed.toLocaleString('en-IN')} / ₹{dept.allocatedBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pctUsed}%`, height: '100%', background: isOverBudget ? '#EF4444' : pctUsed > 80 ? '#F59E0B' : '#10B981', transition: 'width 0.3s' }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
          
          {/* Date Range Picker */}
          <div style={{ padding: 16, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Date &amp; Time</th>
                <th style={{ padding: 12 }}>Department Name</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Old Budget</th>
                <th style={{ padding: 12, textAlign: 'right' }}>New Budget</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Change (+/-)</th>
                <th style={{ padding: 12 }}>Modified By</th>
                <th style={{ padding: 12 }}>Reason / Note</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs
                .filter(a => a.date.substring(0, 10) >= fromDate && a.date.substring(0, 10) <= toDate)
                .map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.date}</td>
                    <td style={{ padding: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{log.departmentName}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>₹{log.oldAmount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{log.newAmount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 900, color: log.changeAmount >= 0 ? '#10B981' : '#EF4444' }}>
                      {log.changeAmount >= 0 ? `+₹${log.changeAmount.toLocaleString('en-IN')}` : `-₹${Math.abs(log.changeAmount).toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ padding: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{log.changedBy}</td>
                    <td style={{ padding: 12, color: 'var(--text-muted)' }}>{log.reason || 'Manual Allocation'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD BUDGET WITH MASTER DEPARTMENT LOOKUP */}
      {showAddBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              ➕ Allocate Budget (Tenant Master Lookup)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select a Department from Tenant Master Table. Department code and operational scope will auto-update!
            </p>

            <form onSubmit={handleAddBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Select Tenant Master Department *</label>
                <select
                  value={selectedMasterId}
                  onChange={e => handleMasterDeptLookupChange(e.target.value)}
                  className="field-input"
                  style={{ fontWeight: 800, color: 'var(--brand-primary)' }}
                >
                  {masterDepartments.map(d => (
                    <option key={d.id} value={d.id}>
                      🏢 {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Dept Code</label>
                  <input
                    readOnly
                    value={addBudgetForm.code}
                    className="field-input"
                    style={{ background: 'var(--bg-elevated)', fontWeight: 900, color: 'var(--brand-primary)' }}
                  />
                </div>
                <div>
                  <label className="field-label">Department Name</label>
                  <input
                    readOnly
                    value={addBudgetForm.departmentName}
                    className="field-input"
                    style={{ background: 'var(--bg-elevated)', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Master Operational Scope / Description</label>
                <textarea
                  rows={2}
                  readOnly
                  value={addBudgetForm.description}
                  className="field-input"
                  style={{ background: 'var(--bg-elevated)', resize: 'none', fontSize: 12 }}
                />
              </div>

              <div>
                <label className="field-label">Annual Allocated Budget (₹) *</label>
                <input
                  type="number"
                  required
                  value={addBudgetForm.allocatedBudget}
                  onChange={e => setAddBudgetForm(f => ({ ...f, allocatedBudget: Number(e.target.value) }))}
                  className="field-input"
                  style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowAddBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }}>
                  Allocate Department Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUDGET MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              ✏ Edit Allocated Budget Amount
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Updating budget for <strong style={{ color: 'var(--brand-primary)' }}>{editingDeptName}</strong>. System will record date-to-date audit trail log.
            </p>

            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">New Annual Budget (₹) *</label>
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
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save Allocated Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
