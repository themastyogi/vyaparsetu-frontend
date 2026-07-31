import { useState } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { useProcurement } from '../hooks/useProcurement';

export default function DepartmentMasterHub() {
  const {
    masterDepartments,
    addMasterDepartment,
    updateMasterDepartmentRecord,
    deleteMasterDepartment
  } = useProcurement();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.code && form.name) {
      addMasterDepartment(form.code, form.name, form.description);
      setForm({ code: '', name: '', description: '' });
      setShowModal(false);
    }
  };

  const filteredDepts = masterDepartments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            🏢 Tenant Department Master Registry <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Tenant-Isolated Business Departments · Custom Department Codes · Central System Lookup
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-action btn-action-primary"
          style={{ padding: '10px 20px', fontWeight: 800, gap: 8 }}
        >
          <Plus size={16}/> + Add Custom Department Code
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }}/>
          <input
            type="text"
            placeholder="Search by Department Code, Name, or Description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Department Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Dept Code</th>
              <th style={{ padding: '12px 16px' }}>Department Name</th>
              <th style={{ padding: '12px 16px' }}>Description / Operational Scope</th>
              <th style={{ padding: '12px 16px' }}>Tenant ID</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepts.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                  {d.code}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {d.name}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                  {d.description}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <code style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{d.tenantId}</code>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: d.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: d.status === 'Active' ? '#10B981' : '#6B7280' }}>
                    {d.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      onClick={() => updateMasterDepartmentRecord(d.id, { status: d.status === 'Active' ? 'Inactive' : 'Active' })}
                      style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      Toggle Status
                    </button>
                    <button
                      onClick={() => deleteMasterDepartment(d.id)}
                      style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#EF4444' }}
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

      {/* MODAL: ADD CUSTOM MASTER DEPARTMENT */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              🏢 Add Custom Department to Tenant Master
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Department Code *</label>
                <input
                  required
                  placeholder="e.g. LOG-06 or RND-05"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 800, textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label className="field-label">Department Name *</label>
                <input
                  required
                  placeholder="e.g. Logistics & Freight Operations"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="field-label">Operational Description / Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe key responsibilities and department scope..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="field-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save to Department Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
