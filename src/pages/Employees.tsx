import { useState } from 'react';
import {
  Plus, Search, Filter, Mail, Phone, Building2, ShieldCheck, MapPin, Camera, User
} from 'lucide-react';
import { useProcurement, type Employee } from '../hooks/useProcurement';

const MASTER_ROLES = [
  'Department Head',
  'Plant Operations Lead',
  'Executive Officer',
  'Operations Officer',
  'Senior Engineer',
  'Procurement Specialist',
  'Finance & Accounts Lead',
  'Quality Auditor'
];

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
    firstName: '',
    lastName: '',
    department: masterDepartments[0]?.name || 'IT & Hardware Infrastructure',
    designation: '',
    role: MASTER_ROLES[0],
    email: '',
    phone: '',
    address: '',
    status: 'Active' as 'Active' | 'Inactive',
    dateOfJoining: new Date().toISOString().split('T')[0],
    dateOfExit: '',
    photoUrl: ''
  });

  const handleOpenAddModal = () => {
    setEditingEmpId(null);
    setForm({
      employeeCode: `EMP-${(employees.length + 101).toString()}`,
      firstName: '',
      lastName: '',
      department: masterDepartments[0]?.name || 'IT & Hardware Infrastructure',
      designation: '',
      role: MASTER_ROLES[0],
      email: '',
      phone: '',
      address: '',
      status: 'Active',
      dateOfJoining: new Date().toISOString().split('T')[0],
      dateOfExit: '',
      photoUrl: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setForm({
      employeeCode: emp.employeeCode || `EMP-100`,
      firstName: emp.firstName || emp.name.split(' ')[0] || '',
      lastName: emp.lastName || emp.name.split(' ').slice(1).join(' ') || '',
      department: emp.department,
      designation: emp.designation,
      role: emp.role || MASTER_ROLES[0],
      email: emp.email || '',
      phone: emp.phone || '',
      address: emp.address || '',
      status: emp.status || 'Active',
      dateOfJoining: emp.dateOfJoining || '2024-01-01',
      dateOfExit: emp.dateOfExit || '',
      photoUrl: emp.photoUrl || ''
    });
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deptObj = masterDepartments.find(d => d.name === form.department);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    if (editingEmpId) {
      updateEmployeeRecord(editingEmpId, {
        ...form,
        name: fullName,
        departmentCode: deptObj?.code
      });
    } else {
      addEmployee({
        ...form,
        name: fullName,
        departmentCode: deptObj?.code,
        tenantId: 'tenant_demo_01'
      });
    }
    setShowModal(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            👥 Employee Master Directory <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Tenant Personnel Cards · Photo Avatars · Master Role Assignments · Exit Date Audit
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
            placeholder="Search by Code, First/Last Name, Designation, or Role..."
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

      {/* Employee Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {filteredEmployees.map(emp => {
          const isInactive = emp.status === 'Inactive';

          return (
            <div
              key={emp.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: isInactive ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-default)',
                padding: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Top Row: Avatar Photo + Code + Status */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--brand-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      ) : (
                        <User size={24} style={{ color: 'var(--brand-primary)' }}/>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace', background: 'rgba(108,71,255,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                        {emp.employeeCode}
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {emp.designation}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: isInactive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: isInactive ? '#EF4444' : '#10B981' }}>
                    {emp.status}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={13} style={{ color: 'var(--brand-primary)' }}/>
                    <strong style={{ color: 'var(--text-primary)' }}>{emp.department}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={13} style={{ color: '#10B981' }}/>
                    <span style={{ color: 'var(--text-secondary)' }}>Master Role: <strong>{emp.role || 'Department Head'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Mail size={13}/> {emp.email || 'No email specified'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Phone size={13}/> {emp.phone || 'No phone specified'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-muted)' }}>
                    <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }}/> {emp.address || 'Address not configured'}
                  </div>
                </div>
              </div>

              {/* Dates & Footer Actions */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Joined: <strong>{emp.dateOfJoining}</strong></div>
                  {isInactive && emp.dateOfExit && (
                    <div style={{ color: '#EF4444', fontWeight: 800, marginTop: 2 }}>Exit Date: {emp.dateOfExit}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700 }}
                  >
                    ✏ Edit
                  </button>
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#EF4444' }}
                  >
                    🗑
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              {editingEmpId ? '✏ Edit Employee Master Card' : '👤 Add New Employee to Master'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Photo Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-elevated)', padding: 14, borderRadius: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--brand-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  ) : (
                    <User size={30} style={{ color: 'var(--brand-primary)' }}/>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,71,255,0.15)', padding: '6px 12px', borderRadius: 6 }}>
                    <Camera size={15}/> {form.photoUrl ? 'Change Employee Photo' : 'Upload Employee Photo'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }}/>
                  </label>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG or WebP avatar image</div>
                </div>
              </div>

              {/* Emp Code + First Name + Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 12 }}>
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
                  <label className="field-label">First Name *</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="e.g. Vikram"
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label className="field-label">Last Name *</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="e.g. Singh"
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Department + Master Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Department (Tenant Master) *</label>
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
                  <label className="field-label">Master Role Assignment *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  >
                    {MASTER_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="field-label">Official Designation *</label>
                <input
                  required
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. IT Operations Head / Factory Manager"
                  className="field-input"
                />
              </div>

              {/* Contact Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="employee@company.com"
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Phone Number *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="field-input"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="field-label">Residential / Office Address *</label>
                <input
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street Address, City, State, Pincode"
                  className="field-input"
                />
              </div>

              {/* Status + Joining Date + Exit Date (if inactive) */}
              <div style={{ display: 'grid', gridTemplateColumns: form.status === 'Inactive' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Employment Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                    className="field-input"
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={form.dateOfJoining}
                    onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))}
                    className="field-input"
                  />
                </div>

                {form.status === 'Inactive' && (
                  <div>
                    <label className="field-label" style={{ color: '#EF4444' }}>Date of Exit *</label>
                    <input
                      type="date"
                      required={form.status === 'Inactive'}
                      value={form.dateOfExit}
                      onChange={e => setForm(f => ({ ...f, dateOfExit: e.target.value }))}
                      className="field-input"
                      style={{ borderColor: '#EF4444', fontWeight: 800 }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save Employee Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
