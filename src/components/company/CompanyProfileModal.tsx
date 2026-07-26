/**
 * CompanyProfileModal.tsx
 * Configures company information (GSTIN, Address, Contact, Inbound Booking Email) for any business.
 */
import React, { useState, useEffect } from 'react';
import { Building2, Mail, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { useAccounting } from '../../hooks/useAccounting';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanyProfileModal({ isOpen, onClose }: CompanyProfileModalProps) {
  const { companySettings, updateCompanySettings } = useAccounting();

  const [form, setForm] = useState({
    companyName: companySettings.companyName || '',
    companyGstin: companySettings.companyGstin || '',
    inboundEmail: companySettings.inboundEmail || '',
    email: companySettings.email || '',
    phone: companySettings.phone || '',
    address: companySettings.address || '',
    city: companySettings.city || '',
    state: companySettings.state || '',
    pincode: companySettings.pincode || '',
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      companyName: companySettings.companyName || '',
      companyGstin: companySettings.companyGstin || '',
      inboundEmail: companySettings.inboundEmail || '',
      email: companySettings.email || '',
      phone: companySettings.phone || '',
      address: companySettings.address || '',
      city: companySettings.city || '',
      state: companySettings.state || '',
      pincode: companySettings.pincode || '',
    });
  }, [companySettings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
    });

    setToast('Company Profile & Inbound Email updated successfully!');
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', border: '1px solid var(--border-default)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} style={{ color: 'var(--brand-primary)' }}/> Company Information &amp; Settings
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Configure your business details, GSTIN, and inbound purchase booking email.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
        </div>

        {toast && (
          <div style={{ background: 'rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.3)', padding: '12px 24px', color: '#10B981', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16}/> {toast}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Business Core Info */}
          <div>
            <label className="field-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Company Legal / Trade Name *</label>
            <input required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="e.g. My Business Pvt Ltd" className="field-input" style={{ fontWeight: 700 }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">GSTIN Number *</label>
              <input required value={form.companyGstin} onChange={e => setForm(f => ({ ...f, companyGstin: e.target.value.toUpperCase() }))} placeholder="e.g. 29AABCV1234F1Z5" className="field-input" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}/>
            </div>
            <div>
              <label className="field-label">Contact Phone Number</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="field-input"/>
            </div>
          </div>

          {/* Inbound Booking Email Card */}
          <div style={{ background: 'rgba(108,71,255,0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(108,71,255,0.2)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Mail size={16}/> Inbound Purchase Booking Email Address *
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: '1.4' }}>
              Vendors send PDF purchase invoices to this email address. The system automatically reads and drafts bills for this email.
            </p>
            <input type="email" required value={form.inboundEmail} onChange={e => setForm(f => ({ ...f, inboundEmail: e.target.value }))} placeholder="e.g. themastyogi@gmail.com or billing@yourcompany.com" className="field-input" style={{ fontWeight: 800, background: 'var(--bg-card)' }}/>
          </div>

          {/* Contact Email & Address */}
          <div>
            <label className="field-label">Official Contact Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@yourcompany.com" className="field-input"/>
          </div>

          <div>
            <label className="field-label">Registered Office Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street Address, Industrial Area" className="field-input"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label className="field-label">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="field-input"/>
            </div>
            <div>
              <label className="field-label">State</label>
              <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" className="field-input"/>
            </div>
            <div>
              <label className="field-label">Pincode</label>
              <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="560001" className="field-input"/>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} style={{ color: '#10B981', flexShrink: 0 }}/>
            100% User Configurable — All invoice templates, emails, and ledgers automatically reflect your saved company details.
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-action btn-action-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-action btn-action-primary">Save Company Profile</button>
          </div>

        </form>
      </div>
    </div>
  );
}
