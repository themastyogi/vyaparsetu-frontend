/**
 * Payments.tsx
 * Payment Management Module:
 *   • Customer Receipts (Collections)
 *   • Vendor Disbursements (Payments)
 *   • Smart Payment Advisor (Bank-balance aware, priority & terms based recommendation engine)
 *   • Bank Accounts Master (Multiple bank accounts synced to COA)
 *   • Bank Reconciliation Statement (BRS)
 *   • Payment Register
 */
import { useState, useMemo } from 'react';
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, Sparkles, Search,
  CheckCircle2, IndianRupee, Trash2, Building2, CheckSquare, Square, Plus, FileCheck
} from 'lucide-react';
import { useAccounting } from '../hooks/useAccounting';
import { useMaster } from '../hooks/useMaster';
import './Parties.css';

const f2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = 'advisor' | 'receipts' | 'disbursements' | 'banks' | 'brs' | 'register';

export default function Payments() {
  const {
    payments, recordPayment, deletePayment, nextPaymentVoucherNo,
    getSmartPaymentSuggestions, bankAccounts, addBankAccount,
    getBankReconciliationSummary, toggleBRSClearance,
  } = useAccounting();

  const { customers, vendors, parties } = useMaster();

  const [tab, setTab] = useState<Tab>('advisor');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [modalType, setModalType] = useState<'Receipt' | 'Payment'>('Receipt');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // BRS state
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [statementAsOf, setStatementAsOf]   = useState<string>(new Date().toISOString().split('T')[0]);
  const [statementBalanceInput, setStatementBalanceInput] = useState<string>('');

  // New Bank Account Form
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNo: '',
    ifsc: '',
    branch: '',
    accountType: 'Current' as 'Current' | 'Savings' | 'Overdraft' | 'Cash Credit',
    openingBalance: '',
  });

  // Form state for manual payment/receipt
  const [form, setForm] = useState({
    voucherNo: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Receipt' as 'Receipt' | 'Payment',
    party: '',
    amount: '',
    bankAccount: bankAccounts[0]?.glAccountName || 'Bank Account',
    reference: '',
    remarks: '',
  });

  const activeBankId = selectedBankId || bankAccounts[0]?.id || '';
  const stmtBal = parseFloat(statementBalanceInput) || 0;

  const brsData = useMemo(() =>
    getBankReconciliationSummary(activeBankId, statementAsOf, stmtBal),
    [activeBankId, statementAsOf, stmtBal, getBankReconciliationSummary, payments]
  );

  const smartData = useMemo(() => getSmartPaymentSuggestions(), [getSmartPaymentSuggestions, payments]);

  const openNewModal = (type: 'Receipt' | 'Payment', prefillParty?: string, prefillAmount?: number) => {
    const vNo = nextPaymentVoucherNo(type);
    setForm({
      voucherNo: vNo,
      date: new Date().toISOString().split('T')[0],
      type,
      party: prefillParty || (type === 'Receipt' ? customers[0]?.name || '' : vendors[0]?.name || ''),
      amount: prefillAmount ? String(prefillAmount) : '',
      bankAccount: bankAccounts[0]?.glAccountName || 'HDFC Bank - A/C 8234',
      reference: '',
      remarks: type === 'Receipt' ? 'Customer Payment Receipt' : 'Vendor Bill Disbursement',
    });
    setModalType(type);
    setShowModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return;

    const recorded = recordPayment({
      voucherNo: form.voucherNo,
      date: form.date,
      type: form.type,
      party: form.party,
      amount: amt,
      bankAccount: form.bankAccount,
      reference: form.reference,
      remarks: form.remarks,
    });

    setShowModal(false);
    setToastMsg(`${form.type === 'Receipt' ? 'Receipt' : 'Payment'} ${recorded.voucherNo} recorded & posted to GL!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const opBal = parseFloat(newBank.openingBalance) || 0;
    const glName = `${newBank.bankName} - A/C ${newBank.accountNo.slice(-4)}`;
    
    addBankAccount({
      bankName: newBank.bankName,
      accountNo: newBank.accountNo,
      ifsc: newBank.ifsc,
      branch: newBank.branch,
      accountType: newBank.accountType,
      openingBalance: opBal,
      glAccountName: glName,
      active: true,
    });

    setShowAddBank(false);
    setNewBank({ bankName: '', accountNo: '', ifsc: '', branch: '', accountType: 'Current', openingBalance: '' });
    setToastMsg(`Bank Account ${glName} added & synchronized with Chart of Accounts!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePayRecommendedSuggestion = (s: any) => {
    openNewModal('Payment', s.vendorName, s.recommendedPayment);
  };

  const filteredPayments = payments.filter(p =>
    (tab === 'receipts' ? p.type === 'Receipt' : tab === 'disbursements' ? p.type === 'Payment' : true) &&
    (p.party.toLowerCase().includes(search.toLowerCase()) ||
     p.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
     (p.reference && p.reference.toLowerCase().includes(search.toLowerCase())))
  );

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    padding: '20px 22px',
  };

  return (
    <div className="page-root animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={22} style={{ color: 'var(--brand-primary)' }}/> Payment Management &amp; BRS
          </h1>
          <p className="page-sub">Customer Collections · Vendor Payments · Bank Accounts Master · Bank Reconciliation (BRS)</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-action btn-action-secondary" onClick={() => setShowAddBank(true)}>
            <Building2 size={15}/> Add Bank Account
          </button>
          <button className="btn-action btn-action-secondary" onClick={() => openNewModal('Receipt')}>
            <ArrowDownLeft size={15} style={{ color: '#10B981' }}/> Collect Receipt
          </button>
          <button className="btn-action btn-action-primary" onClick={() => openNewModal('Payment')}>
            <ArrowUpRight size={15}/> Pay Vendor
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '12px 20px', borderRadius: 10, color: '#34D399', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={16}/> {toastMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20, overflowX: 'auto' }}>
        {[
          { id: 'advisor',       label: 'Smart Payment Advisor', icon: <Sparkles size={13}/> },
          { id: 'receipts',      label: 'Customer Collections',  icon: <ArrowDownLeft size={13}/> },
          { id: 'disbursements', label: 'Vendor Payments',       icon: <ArrowUpRight size={13}/> },
          { id: 'banks',         label: 'Bank Accounts Master',  icon: <Building2 size={13}/> },
          { id: 'brs',           label: 'Bank Reconciliation (BRS)', icon: <FileCheck size={13}/> },
          { id: 'register',     label: 'Payment Register',      icon: <CreditCard size={13}/> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500, whiteSpace: 'nowrap',
              borderBottom: `2.5px solid ${tab === t.id ? 'var(--brand-primary)' : 'transparent'}`,
              color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)',
              background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
              borderRadius: '6px 6px 0 0', transition: 'all 0.15s',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          SMART PAYMENT ADVISOR
          ══════════════════════════════════════════════════ */}
      {tab === 'advisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Funds summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available Bank Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#60A5FA', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IndianRupee size={16}/>{f2(smartData.availableFunds)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Across all Bank &amp; Cash Accounts</div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Unpaid Bills</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#F87171', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IndianRupee size={16}/>{f2(smartData.totalPendingPayables)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Across all posted Vendor Invoices</div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommended Payment Plan</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#34D399', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IndianRupee size={16}/>{f2(smartData.totalRecommended)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Optimized within available funds</div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unallocated Buffer</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IndianRupee size={16}/>{f2(smartData.unallocatedFunds)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Safety cushion remaining</div>
            </div>
          </div>

          {/* Recommendations Table */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              Prioritized Vendor Payment Recommendations ({smartData.suggestions.length})
            </div>

            {smartData.suggestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} style={{ color: '#10B981', marginBottom: 8 }}/>
                <div style={{ fontSize: 14, fontWeight: 600 }}>All vendor bills are fully paid!</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Invoice Ref</th>
                      <th>Terms</th>
                      <th>Due Date</th>
                      <th>Status / Reason</th>
                      <th style={{ textAlign: 'right' }}>Pending Bill (₹)</th>
                      <th style={{ textAlign: 'right' }}>Recommended Pay (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smartData.suggestions.map((s, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.vendorName}</div>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10,
                            background: s.priority === 'High' ? 'rgba(239,68,68,0.15)' : s.priority === 'Low' ? 'rgba(100,116,139,0.15)' : 'rgba(245,158,11,0.15)',
                            color: s.priority === 'High' ? '#F87171' : s.priority === 'Low' ? '#94A3B8' : '#FBBF24',
                          }}>
                            {s.priority} Priority
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: 'var(--brand-primary)' }}>{s.invoiceNo}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.paymentTerms}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{s.dueDate}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                            background: s.daysOverdue > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: s.daysOverdue > 0 ? '#F87171' : '#34D399',
                          }}>
                            {s.reason}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{f2(s.pendingAmount)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: s.recommendedPayment > 0 ? '#10B981' : 'var(--text-muted)' }}>
                          ₹{f2(s.recommendedPayment)}
                        </td>
                        <td>
                          <button onClick={() => handlePayRecommendedSuggestion(s)} disabled={s.recommendedPayment <= 0}
                            style={{
                              padding: '5px 12px', borderRadius: 6, background: s.recommendedPayment > 0 ? 'var(--brand-primary)' : 'var(--bg-elevated)',
                              color: s.recommendedPayment > 0 ? '#fff' : 'var(--text-muted)', border: 'none', fontWeight: 700, fontSize: 12, cursor: s.recommendedPayment > 0 ? 'pointer' : 'not-allowed'
                            }}>
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          BANK ACCOUNTS MASTER TAB
          ══════════════════════════════════════════════════ */}
      {tab === 'banks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Company Bank Accounts Master ({bankAccounts.length})</h2>
            <button className="btn-action btn-action-primary" onClick={() => setShowAddBank(true)}>
              <Plus size={14}/> Add New Bank Account
            </button>
          </div>

          <div style={cardStyle}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>IFSC Code</th>
                    <th>Branch</th>
                    <th>Type</th>
                    <th>Linked Ledger Account</th>
                    <th style={{ textAlign: 'right' }}>Opening Bal (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{b.bankName}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{b.accountNo}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{b.ifsc}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.branch}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontWeight: 600 }}>
                          {b.accountType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 12, color: '#60A5FA' }}>{b.glAccountName}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>₹{f2(b.openingBalance)}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: 10 }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          BANK RECONCILIATION STATEMENT (BRS) TAB
          ══════════════════════════════════════════════════ */}
      {tab === 'brs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* BRS Controls */}
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <label className="field-label">Select Bank Account *</label>
                <select value={activeBankId} onChange={e => setSelectedBankId(e.target.value)} className="field-input">
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} - A/C {b.accountNo.slice(-4)} ({b.glAccountName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Statement As-Of Date</label>
                <input type="date" value={statementAsOf} onChange={e => setStatementAsOf(e.target.value)} className="field-input"/>
              </div>

              <div>
                <label className="field-label">Bank Statement Balance (₹) *</label>
                <input type="number" step="any" value={statementBalanceInput} onChange={e => setStatementBalanceInput(e.target.value)} placeholder="e.g. 245000" className="field-input" style={{ fontWeight: 800 }}/>
              </div>
            </div>
          </div>

          {/* BRS Calculation Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Book Balance (GL)</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#60A5FA', marginTop: 4 }}>₹{f2(brsData.bookBalance)}</div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#F87171', textTransform: 'uppercase' }}>Uncleared Deposits</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#F87171', marginTop: 4 }}>- ₹{f2(brsData.unclearedDeposits)}</div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>Uncleared Cheques</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#34D399', marginTop: 4 }}>+ ₹{f2(brsData.unclearedCheques)}</div>
            </div>

            <div style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>Calculated Bank Bal</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#60A5FA', marginTop: 4 }}>₹{f2(brsData.calculatedBankBalance)}</div>
            </div>

            <div style={{
              background: brsData.isReconciled ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
              border: `1.5px solid ${brsData.isReconciled ? '#10B981' : '#F87171'}`,
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: brsData.isReconciled ? '#34D399' : '#F87171', textTransform: 'uppercase' }}>
                {brsData.isReconciled ? '✔ RECONCILED' : '⚠ DIFFERENCE'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: brsData.isReconciled ? '#34D399' : '#F87171', marginTop: 4 }}>
                ₹{f2(Math.abs(brsData.difference))}
              </div>
            </div>
          </div>

          {/* BRS Table */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
              Bank Ledger Transactions for {brsData.targetBank?.bankName || 'Bank'} — Click checkmark to toggle Cleared status
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Cleared</th>
                    <th>Date</th>
                    <th>Voucher Ref</th>
                    <th>Entry Type</th>
                    <th>Party</th>
                    <th style={{ textAlign: 'right' }}>Deposit / Dr (₹)</th>
                    <th style={{ textAlign: 'right' }}>Withdrawal / Cr (₹)</th>
                    <th>Cleared Date</th>
                  </tr>
                </thead>
                <tbody>
                  {brsData.items.length === 0 ? (
                    <tr><td colSpan={8} className="empty-cell">No bank transactions found for this account</td></tr>
                  ) : brsData.items.map((item, i) => (
                    <tr key={i} style={{ background: item.isCleared ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => toggleBRSClearance(item.jeId, activeBankId, item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.isCleared ? '#10B981' : 'var(--text-muted)' }}>
                          {item.isCleared ? <CheckSquare size={18}/> : <Square size={18}/>}
                        </button>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{item.date}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 12 }}>{item.refNo}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.entryType}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.party}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: item.debit > 0 ? '#34D399' : 'var(--text-muted)' }}>
                        {item.debit > 0 ? f2(item.debit) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: item.credit > 0 ? '#F87171' : 'var(--text-muted)' }}>
                        {item.credit > 0 ? f2(item.credit) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: item.isCleared ? '#34D399' : 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.isCleared ? (item.clearedDate || 'Cleared') : 'Uncleared'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          REGISTER / CUSTOMER RECEIPTS / VENDOR PAYMENTS
          ══════════════════════════════════════════════════ */}
      {tab !== 'advisor' && tab !== 'banks' && tab !== 'brs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by party, voucher no, reference..."
              className="toolbar-search-input" style={{ paddingLeft: 32 }}/>
          </div>

          <div style={cardStyle}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher No</th>
                    <th>Type</th>
                    <th>Party Name</th>
                    <th>Account</th>
                    <th>Reference / UTR</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={8} className="empty-cell">No payment vouchers found</td></tr>
                  ) : filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.date}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13 }}>{p.voucherNo}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                          background: p.type === 'Receipt' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: p.type === 'Receipt' ? '#34D399' : '#F87171',
                        }}>
                          {p.type === 'Receipt' ? '⬇ Receipt (Customer)' : '⬆ Payment (Vendor)'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.party}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.bankAccount}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.reference || '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: p.type === 'Receipt' ? '#34D399' : '#F87171' }}>
                        ₹{f2(p.amount)}
                      </td>
                      <td>
                        <button onClick={() => deletePayment(p.id)} className="btn-action btn-action-ghost" style={{ padding: '3px 8px', color: '#F87171' }}>
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Receipt / Payment Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {modalType === 'Receipt' ? <ArrowDownLeft size={20} style={{ color: '#10B981' }}/> : <ArrowUpRight size={20} style={{ color: '#F87171' }}/>}
                {modalType === 'Receipt' ? 'Customer Payment Receipt' : 'Vendor Bill Payment'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Voucher No</label>
                  <input value={form.voucherNo} disabled className="field-input" style={{ opacity: 0.7, fontFamily: 'monospace' }}/>
                </div>
                <div>
                  <label className="field-label">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="field-input"/>
                </div>
              </div>

              <div>
                <label className="field-label">{modalType === 'Receipt' ? 'Customer Name *' : 'Vendor Name *'}</label>
                <select required value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))} className="field-input">
                  {(modalType === 'Receipt' ? customers : vendors).map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.type})</option>
                  ))}
                  {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Amount (₹) *</label>
                  <input type="number" step="any" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 25000" className="field-input" style={{ fontWeight: 800 }}/>
                </div>
                <div>
                  <label className="field-label">Bank / Cash Account</label>
                  <select value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} className="field-input">
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.glAccountName}>{b.glAccountName}</option>
                    ))}
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Reference / UTR / Cheque No</label>
                <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. UTR9823102391" className="field-input"/>
              </div>

              <div>
                <label className="field-label">Remarks</label>
                <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" className="field-input"/>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary" style={{ background: modalType === 'Receipt' ? '#10B981' : 'var(--brand-primary)' }}>
                  Record &amp; Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add New Bank Account Modal ── */}
      {showAddBank && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} style={{ color: 'var(--brand-primary)' }}/> Add Company Bank Account
              </h2>
              <button onClick={() => setShowAddBank(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Bank Name *</label>
                  <input required value={newBank.bankName} onChange={e => setNewBank(b => ({ ...b, bankName: e.target.value }))} placeholder="e.g. HDFC Bank" className="field-input"/>
                </div>
                <div>
                  <label className="field-label">Account Number *</label>
                  <input required value={newBank.accountNo} onChange={e => setNewBank(b => ({ ...b, accountNo: e.target.value }))} placeholder="e.g. 50100293412" className="field-input" style={{ fontFamily: 'monospace' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">IFSC Code *</label>
                  <input required value={newBank.ifsc} onChange={e => setNewBank(b => ({ ...b, ifsc: e.target.value.toUpperCase() }))} placeholder="e.g. HDFC0001234" className="field-input" style={{ fontFamily: 'monospace' }}/>
                </div>
                <div>
                  <label className="field-label">Account Type</label>
                  <select value={newBank.accountType} onChange={e => setNewBank(b => ({ ...b, accountType: e.target.value as any }))} className="field-input">
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                    <option value="Overdraft">Overdraft (OD)</option>
                    <option value="Cash Credit">Cash Credit (CC)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Branch Name</label>
                  <input value={newBank.branch} onChange={e => setNewBank(b => ({ ...b, branch: e.target.value }))} placeholder="e.g. MG Road Branch" className="field-input"/>
                </div>
                <div>
                  <label className="field-label">Opening Balance (₹)</label>
                  <input type="number" step="any" value={newBank.openingBalance} onChange={e => setNewBank(b => ({ ...b, openingBalance: e.target.value }))} placeholder="e.g. 250000" className="field-input" style={{ fontWeight: 800 }}/>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8 }}>
                💡 Automatically creates a linked Asset account in Chart of Accounts under Current Assets.
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-action btn-action-secondary" onClick={() => setShowAddBank(false)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Add Bank Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
