import { useState } from 'react';
import {
  Plus, Search, Filter, Mail, Phone, Building2, ShieldCheck, Trash2, Edit3
} from 'lucide-react';
import { useProcurement, type Employee } from '../hooks/useProcurement';

export default function Employees() {
  const {
    employees,
    masterDepartments,
    addEmployee,
    updateEmployeeRecord,
    deleteEmployee
  } = useProcurement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeCode: '',
    name: '',
    department: masterDepartments[0]?.name || 'IT & Hardware Infrastructure',
    designation: '',
    email: '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
    dateOfJoining: new Date().toISOString().split('T')[0]
  });

  const handleOpenAddModal = () => {
    setEditingEmpId(null);
    setForm({
      employeeCode: `EMP-${(employees.length + 101).toString()}`,
      name: '',
      department: masterDepartments[0]?.name || 'IT & Hardware Infrastructure',
      designation: '',
      email: '',
      phone: '',
      status: 'Active',
      dateOfJoining: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setForm({
      employeeCode: emp.employeeCode || `EMP-100`,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || 'Active',
      dateOfJoining: emp.dateOfJoining || '2024-01-01'
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deptObj = masterDepartments.find(d => d.name === form.department);
    if (editingEmpId) {
      updateEmployeeRecord(editingEmpId, {
        ...form,
        departmentCode: deptObj?.code
      });
    } else {
      addEmployee({
        ...form,
        departmentCode: deptObj?.code,
        tenantId: 'tenant_demo_01'
      });
    }
    setShowModal(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            👥 Employee Master &amp; Personnel Directory <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Central Tenant Employee Registry · Department Assignments · RBAC Requisition Lookups
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-action btn-action-primary"
          style={{ padding: '10px 20px', fontWeight: 800, gap: 8, background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}
        >
          <Plus size={16}/> + Add New Employee
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }}/>
          <input
            type="text"
            placeholder="Search by Employee Code, Name, or Designation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Department:</span>
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            className="field-input"
            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
          >
            <option value="ALL">All Departments ({employees.length})</option>
            {masterDepartments.map(d => (
              <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Emp Code</th>
              <th style={{ padding: '12px 16px' }}>Employee Name</th>
              <th style={{ padding: '12px 16px' }}>Department</th>
              <th style={{ padding: '12px 16px' }}>Designation</th>
              <th style={{ padding: '12px 16px' }}>Contact Info</th>
              <th style={{ padding: '12px 16px' }}>Joining Date</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                  {emp.employeeCode}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {emp.name}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} style={{ color: 'var(--brand-primary)' }}/>
                    <strong style={{ color: 'var(--text-primary)' }}>{emp.department}</strong>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                  {emp.designation}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Mail size={12}/> {emp.email || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', marginTop: 2 }}>
                    <Phone size={12}/> {emp.phone || 'N/A'}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                  {emp.dateOfJoining}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: emp.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: emp.status === 'Active' ? '#10B981' : '#6B7280' }}>
                    {emp.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--brand-primary)' }}
                      title="Edit Employee"
                    >
                      <Edit3 size={14}/>
                    </button>
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#EF4444' }}
                      title="Delete Employee"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              {editingEmpId ? '✏ Edit Employee Details' : '👤 Add New Employee to Master'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Emp Code *</label>
                  <input
                    required
                    value={form.employeeCode}
                    onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                    className="field-input"
                    style={{ fontWeight: 800, textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label className="field-label">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Vikram Singh"
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Assigned Department (Tenant Master) *</label>
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 700 }}
                >
                  {masterDepartments.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Designation / Role *</label>
                <input
                  required
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Senior Systems Admin / Factory Manager"
                  className="field-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Official Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="employee@company.com"
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="field-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Date of Joining</label>
                  <input
                    type="date"
                    value={form.dateOfJoining}
                    onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Employment Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                    className="field-input"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save Employee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
