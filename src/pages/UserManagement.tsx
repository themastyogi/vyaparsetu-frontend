import { useState } from 'react';
import {
  ShieldCheck, Plus, KeyRound, Building2
} from 'lucide-react';
import { useProcurement } from '../hooks/useProcurement';

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  role: 'Admin / Finance Manager' | 'Department Head' | 'Requester / Normal User' | 'Accountant';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const SEED_SYSTEM_USERS: SystemUser[] = [
  { id: 'user-1', username: 'admin_vikas', fullName: 'Vikas Kumar (Super Admin)', email: 'admin@vyaparsetu.com', department: 'Executive Board', role: 'Admin / Finance Manager', status: 'Active', lastLogin: '2026-07-31 14:10:00' },
  { id: 'user-2', username: 'vikram_singh', fullName: 'Vikram Singh', email: 'vikram.singh@company.com', department: 'IT & Hardware Infrastructure', role: 'Department Head', status: 'Active', lastLogin: '2026-07-30 09:30:00' },
  { id: 'user-3', username: 'rahul_sharma', fullName: 'Rahul Sharma', email: 'rahul.sharma@company.com', department: 'Manufacturing & Production', role: 'Department Head', status: 'Active', lastLogin: '2026-07-29 16:45:00' },
  { id: 'user-4', username: 'neha_gupta', fullName: 'Neha Gupta', email: 'neha.gupta@company.com', department: 'IT & Hardware Infrastructure', role: 'Requester / Normal User', status: 'Active', lastLogin: '2026-07-28 11:20:00' }
];

export default function UserManagement() {
  const { masterDepartments } = useProcurement();
  const [users, setUsers] = useState<SystemUser[]>(SEED_SYSTEM_USERS);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    department: masterDepartments[0]?.name || 'IT & Hardware Infrastructure',
    role: 'Requester / Normal User' as SystemUser['role'],
    status: 'Active' as 'Active' | 'Inactive'
  });

  const handleOpenEditRole = (u: SystemUser) => {
    setEditingUserId(u.id);
    setForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      department: u.department,
      role: u.role,
      status: u.status
    });
    setShowModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      setUsers(users.map(u => u.id === editingUserId ? { ...u, ...form } : u));
    } else {
      const newUser: SystemUser = {
        id: `user_${Date.now()}`,
        ...form,
        lastLogin: 'Never'
      };
      setUsers([newUser, ...users]);
    }
    setShowModal(false);
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            🛡️ User &amp; Role Access Control (RBAC) <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }}/>
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Tenant User Management · Role Assignments · Budget Visibility Restrictions · Password Policies
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUserId(null);
            setForm({ username: '', fullName: '', email: '', department: masterDepartments[0]?.name || '', role: 'Requester / Normal User', status: 'Active' });
            setShowModal(true);
          }}
          className="btn-action btn-action-primary"
          style={{ padding: '10px 20px', fontWeight: 800, gap: 8 }}
        >
          <Plus size={16}/> + Create System User
        </button>
      </div>

      {/* Users Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>User Details</th>
              <th style={{ padding: '12px 16px' }}>Assigned Department</th>
              <th style={{ padding: '12px 16px' }}>Assigned Role (RBAC)</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Last Activity</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Role Control</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.fullName}</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{u.username} | {u.email}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} style={{ color: 'var(--brand-primary)' }}/>
                    <span>{u.department}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, fontWeight: 800, background: u.role.includes('Admin') ? 'rgba(108,71,255,0.15)' : 'rgba(16,185,129,0.15)', color: u.role.includes('Admin') ? 'var(--brand-primary)' : '#10B981' }}>
                    👑 {u.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 800, background: u.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: u.status === 'Active' ? '#10B981' : '#6B7280' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {u.lastLogin}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleOpenEditRole(u)}
                    className="btn-action btn-action-secondary"
                    style={{ fontSize: 11, padding: '6px 12px', fontWeight: 800, gap: 6 }}
                  >
                    <KeyRound size={13}/> Assign Role / Permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: ASSIGN ROLE & PERMISSIONS */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              👑 Admin User Access &amp; Role Control
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Only Admin users can modify user role assignments and financial visibility.
            </p>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="field-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="field-label">Username / Login ID *</label>
                <input
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Assigned Department *</label>
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="field-input"
                >
                  {masterDepartments.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Assigned System Role (RBAC) *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as SystemUser['role'] }))}
                  className="field-input"
                  style={{ fontWeight: 800, color: 'var(--brand-primary)' }}
                >
                  <option value="Admin / Finance Manager">👑 Admin / Finance Manager (Full Access &amp; Budget Edits)</option>
                  <option value="Department Head">🏢 Department Head (Approval Rights &amp; PR Creation)</option>
                  <option value="Requester / Normal User">👤 Requester / Normal User (Budget Caps Masked)</option>
                  <option value="Accountant">📊 Accountant (Ledger &amp; Payments)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Account Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="field-input"
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Inactive">🔴 Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: 'var(--brand-primary)', fontWeight: 800 }}>
                  Save User Role Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
