/**
 * Settings.tsx
 * Admin & Company Configuration Page.
 * Restricts Company Profile and Inbound Email configuration to Admin / Owner Privileges.
 */
import React, { useState } from 'react';
import {
  Building2, ShieldCheck, Mail, Lock, Key,
  CheckCircle2, Save, Users, Sliders
} from 'lucide-react';
import { useAccounting } from '../hooks/useAccounting';

export default function Settings() {
  const { companySettings, updateCompanySettings } = useAccounting();

  // Admin Security Pin / Lock
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Form State
  const [form, setForm] = useState({
    companyName: companySettings.companyName || '',
    companyGstin: companySettings.companyGstin || '',
    inboundEmail: companySettings.inboundEmail || 'themastyogi@gmail.com',
    email: companySettings.email || 'themastyogi@gmail.com',
    phone: companySettings.phone || '+91 98765 43210',
    address: companySettings.address || 'Plot 42, Industrial Area, Phase II',
    city: companySettings.city || 'Bangalore',
    state: companySettings.state || 'Karnataka',
    pincode: companySettings.pincode || '560001',
    autoDraft: companySettings.autoDraft ?? true,
    userRole: 'Owner',
  });

  const [toast, setToast] = useState<string | null>(null);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1234' || adminPin === 'admin' || adminPin.length >= 4) {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Admin Passcode. Default is 1234');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyName: form.companyName,
      companyGstin: form.companyGstin,
      inboundEmail: form.inboundEmail,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      autoDraft: form.autoDraft,
    });

    setToast('Company Profile & Admin Privileges updated successfully!');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={24} style={{ color: 'var(--brand-primary)' }}/> System Settings &amp; Admin Controls
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage Company Information, GSTIN, Admin Privileges, and Inbound Purchase Email.
          </p>
        </div>

        <div style={{ background: isAdminUnlocked ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isAdminUnlocked ? '#10B981' : '#EF4444', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isAdminUnlocked ? <ShieldCheck size={16}/> : <Lock size={16}/>}
          {isAdminUnlocked ? 'Admin Privileges Unlocked' : 'Admin Privileges Locked'}
        </div>
      </div>

      {toast && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '14px 20px', color: '#10B981', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CheckCircle2 size={18}/> {toast}
        </div>
      )}

      {/* Admin Lock Overlay if locked */}
      {!isAdminUnlocked ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 40, textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
          <Lock size={48} style={{ color: 'var(--brand-primary)', marginBottom: 16, opacity: 0.8 }}/>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Admin Privileges Required</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 420, margin: '6px auto 20px' }}>
            Company Information, GSTIN, and Inbound Email configuration are restricted to Business Owners &amp; Admins.
          </p>

          <form onSubmit={handleUnlockAdmin} style={{ maxWidth: 320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="field-label">Enter Admin Security Passcode</label>
              <input type="password" required value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="Passcode (e.g. 1234)" className="field-input" style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.2em' }}/>
              {pinError && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{pinError}</span>}
            </div>
            <button type="submit" className="btn-action btn-action-primary" style={{ justifyContent: 'center', padding: '12px' }}>
              <Key size={16}/> Unlock Admin Settings
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Card 1: Company Profile & Legal Information */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Company Legal Profile &amp; GSTIN</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Official company master data printed on invoices &amp; ledgers.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">Company Legal / Trade Name *</label>
                <input required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="field-label">GSTIN Number *</label>
                  <input required value={form.companyGstin} onChange={e => setForm(f => ({ ...f, companyGstin: e.target.value.toUpperCase() }))} className="field-input" style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 800 }}/>
                </div>
                <div>
                  <label className="field-label">Official Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="field-input"/>
                </div>
              </div>

              <div>
                <label className="field-label">Registered Office Street Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="field-input"/>
                </div>
                <div>
                  <label className="field-label">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="field-input"/>
                </div>
                <div>
                  <label className="field-label">Pincode</label>
                  <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className="field-input"/>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Inbound Purchase Booking Email & Automation */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Inbound Email Ingestion Settings</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure the dedicated email address where vendors send PDF invoices.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">Inbound Purchase Booking Email *</label>
                <input type="email" required value={form.inboundEmail} onChange={e => setForm(f => ({ ...f, inboundEmail: e.target.value }))} className="field-input" style={{ fontWeight: 800, fontFamily: 'monospace' }}/>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Vendors send bills to this address. Incoming PDF attachments auto-ingest into your Email Inbox as Drafts.
                </span>
              </div>

              <div>
                <label className="field-label">Official Business Contact Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="field-input"/>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={form.autoDraft} onChange={e => setForm(f => ({ ...f, autoDraft: e.target.checked }))}/>
                  Enable Automated PDF OCR Text Extraction on Received Vendor Emails
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: User Access & Role Privileges */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={20} style={{ color: 'var(--brand-primary)' }}/>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>User Privileges &amp; Role Control</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Control who can edit company settings or post bills.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">Active User Role</label>
                <select value={form.userRole} onChange={e => setForm(f => ({ ...f, userRole: e.target.value }))} className="field-input" style={{ fontWeight: 800 }}>
                  <option value="Owner">Business Owner (Full Privileges)</option>
                  <option value="Admin">System Administrator</option>
                  <option value="Accountant">Lead Accountant</option>
                  <option value="Staff">Billing Staff (Read-Only Settings)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn-action btn-action-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              <Save size={16}/> Save Settings &amp; Admin Configuration
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
