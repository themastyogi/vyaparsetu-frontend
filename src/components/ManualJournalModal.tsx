import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, ArrowRightLeft, CreditCard, ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from 'lucide-react';
import { useAccounting, type JournalLine } from '../hooks/useAccounting';

interface Props {
  onClose: () => void;
}

type EasyModeAction = 'pay-vendor' | 'receive-customer' | 'pay-expense' | 'withdraw-cash' | 'deposit-cash' | 'party-transfer';

export default function ManualJournalModal({ onClose }: Props) {
  const { coa, postJournalEntry } = useAccounting();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  // Mode: 'easy' (Default Click-Click mode) vs 'advanced' (Pro Debit/Credit table)
  const [viewMode, setViewMode] = useState<'easy' | 'advanced'>('easy');

  // Parties & Banks from storage
  const [partiesList] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('vs_parties') || '[]'); }
    catch { return []; }
  });
  const [banksList] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('vs_bank_accounts') || '[]'); }
    catch { return []; }
  });

  // ── EASY CLICK-CLICK MODE STATE ───────────────────────────────────
  const [easyAction, setEasyAction] = useState<EasyModeAction>('pay-vendor');
  const [selectedParty, setSelectedParty] = useState('');
  const [toParty, setToParty] = useState('');
  const [selectedExpense, setSelectedExpense] = useState('Office Expenses');
  const [paymentMode, setPaymentMode] = useState<'Bank Account' | 'Cash Account'>('Bank Account');
  const [selectedBank, setSelectedBank] = useState(() => banksList[0]?.accountName || 'HDFC Bank - A/C 8234');
  const [amount, setAmount] = useState('1000');
  const [refNo, setRefNo] = useState(() => 'VOU-' + Math.floor(100000 + Math.random() * 900000));
  const [narration, setNarration] = useState('');

  // ── ADVANCED PRO MODE STATE ───────────────────────────────────────
  const [entryType, setEntryType] = useState('Journal Voucher');
  const [relatedNo, setRelatedNo] = useState(() => 'JV-' + Math.floor(100000 + Math.random() * 900000));
  const [party, setParty] = useState('General');
  const [lines, setLines] = useState<Array<{ account: string; debit: string; credit: string }>>([
    { account: coa[0]?.name || 'Office Expenses', debit: '1000', credit: '0' },
    { account: coa[1]?.name || 'Cash Account', debit: '0', credit: '1000' },
  ]);

  const addLine = () => {
    setLines(prev => [...prev, { account: coa[0]?.name || 'Office Expenses', debit: '0', credit: '0' }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) {
      alert('A journal entry must contain at least 2 lines (1 Debit & 1 Credit).');
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: 'account' | 'debit' | 'credit', val: string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  // ── EASY CLICK-CLICK SUBMIT HANDLER ────────────────────────────────
  const handleEasySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    let voucherType = 'Payment Voucher';
    let partyName = selectedParty || 'General';
    let lineDebits: JournalLine[] = [];

    const sourceAccount = paymentMode === 'Bank Account' ? selectedBank : 'Cash Account';

    switch (easyAction) {
      case 'pay-vendor':
        voucherType = 'Vendor Payment';
        lineDebits = [
          { account: 'Accounts Payable', debit: numAmt, credit: 0 },
          { account: sourceAccount, debit: 0, credit: numAmt },
        ];
        break;

      case 'receive-customer':
        voucherType = 'Customer Receipt';
        lineDebits = [
          { account: sourceAccount, debit: numAmt, credit: 0 },
          { account: 'Accounts Receivable', debit: 0, credit: numAmt },
        ];
        break;

      case 'pay-expense':
        voucherType = 'Expense Voucher';
        partyName = selectedExpense;
        lineDebits = [
          { account: selectedExpense, debit: numAmt, credit: 0 },
          { account: sourceAccount, debit: 0, credit: numAmt },
        ];
        break;

      case 'withdraw-cash':
        voucherType = 'Contra (Cash Withdrawal)';
        partyName = `Cash Withdrawal (${refNo})`;
        lineDebits = [
          { account: 'Cash Account', debit: numAmt, credit: 0 },
          { account: selectedBank, debit: 0, credit: numAmt },
        ];
        break;

      case 'deposit-cash':
        voucherType = 'Contra (Cash Deposit)';
        partyName = `Cash Deposit (${refNo})`;
        lineDebits = [
          { account: selectedBank, debit: numAmt, credit: 0 },
          { account: 'Cash Account', debit: 0, credit: numAmt },
        ];
        break;

      case 'party-transfer':
        voucherType = 'Party Transfer';
        partyName = `${selectedParty || 'Party A'} ➔ ${toParty || 'Party B'}`;
        lineDebits = [
          { account: 'Accounts Receivable', debit: numAmt, credit: 0 },
          { account: 'Accounts Payable', debit: 0, credit: numAmt },
        ];
        break;
    }

    postJournalEntry({
      date,
      entryType: voucherType,
      relatedId: 'easy_' + Date.now().toString(36),
      relatedNo: refNo.trim() || ('VOU-' + Date.now().toString().slice(-6)),
      party: partyName + (narration.trim() ? ` (${narration.trim()})` : ''),
      lines: lineDebits,
    });

    alert(`🎉 Voucher Posted Successfully!\nType: ${voucherType}\nAmount: ₹${numAmt.toLocaleString('en-IN')}`);
    onClose();
  };

  // ── ADVANCED PRO SUBMIT HANDLER ────────────────────────────────────
  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Total Debit must equal Total Credit before posting.');
      return;
    }

    const formattedLines: JournalLine[] = lines.map(l => ({
      account: l.account,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
    }));

    postJournalEntry({
      date,
      entryType,
      relatedId: 'manual_' + Date.now().toString(36),
      relatedNo: relatedNo.trim() || ('JV-' + Date.now().toString().slice(-6)),
      party: (party.trim() || 'General') + (narration.trim() ? ` (${narration.trim()})` : ''),
      lines: formattedLines,
    });

    alert('🎉 Manual Journal Entry Posted Successfully!');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 720, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)', maxHeight: '92vh', overflowY: 'auto', animation: 'fade-in 0.2s' }}>
        
        {/* Header with Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22}/>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Create Accounting Voucher</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick "Click-Click" Voucher &amp; Journal Entry Engine</div>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('easy')}
              style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: viewMode === 'easy' ? 'var(--brand-primary)' : 'transparent', color: viewMode === 'easy' ? '#fff' : 'var(--text-secondary)' }}
            >
              ⚡ Easy Click-Click
            </button>
            <button
              type="button"
              onClick={() => setViewMode('advanced')}
              style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: viewMode === 'advanced' ? 'var(--brand-primary)' : 'transparent', color: viewMode === 'advanced' ? '#fff' : 'var(--text-secondary)' }}
            >
              ⚙️ Pro Accountant Table
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, marginLeft: 10 }}>✕</button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            EASY CLICK-CLICK MODE (Default for Normal Users)
            ════════════════════════════════════════════════════════════════ */}
        {viewMode === 'easy' ? (
          <form onSubmit={handleEasySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Action Cards Grid */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
                1. Select Transaction Action ("Click-Click"):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                
                <div
                  onClick={() => setEasyAction('pay-vendor')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'pay-vendor' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'pay-vendor' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'pay-vendor' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <ArrowUpRight size={16} style={{ color: '#F87171' }}/> Pay Vendor / Party
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pay cash/bank to vendor or party</div>
                </div>

                <div
                  onClick={() => setEasyAction('receive-customer')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'receive-customer' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'receive-customer' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'receive-customer' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <ArrowDownLeft size={16} style={{ color: '#34D399' }}/> Receive from Customer
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Receive payment into bank/cash</div>
                </div>

                <div
                  onClick={() => setEasyAction('pay-expense')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'pay-expense' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'pay-expense' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'pay-expense' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <CreditCard size={16} style={{ color: '#FBBF24' }}/> Pay Expense
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rent, Tea, Office Supplies, Charges</div>
                </div>

                <div
                  onClick={() => setEasyAction('withdraw-cash')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'withdraw-cash' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'withdraw-cash' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'withdraw-cash' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <Wallet size={16} style={{ color: '#60A5FA' }}/> Withdraw Cash (Cheque)
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bank withdrawal for Petty Cash</div>
                </div>

                <div
                  onClick={() => setEasyAction('deposit-cash')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'deposit-cash' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'deposit-cash' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'deposit-cash' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <Landmark size={16} style={{ color: '#C084FC' }}/> Deposit Cash to Bank
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deposit cash in hand into Bank</div>
                </div>

                <div
                  onClick={() => setEasyAction('party-transfer')}
                  style={{ padding: 14, borderRadius: 10, border: `2px solid ${easyAction === 'party-transfer' ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: easyAction === 'party-transfer' ? 'rgba(108,71,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 800, fontSize: 13, color: easyAction === 'party-transfer' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <ArrowRightLeft size={16} style={{ color: '#EC4899' }}/> Party Transfer
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Transfer balance between 2 parties</div>
                </div>

              </div>
            </div>

            {/* Step 2: Dynamic Click-Click Form Fields */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                2. Enter Voucher Details:
              </div>

              {/* Party Selector for Pay Vendor / Receive Customer / Party Transfer */}
              {(easyAction === 'pay-vendor' || easyAction === 'receive-customer' || easyAction === 'party-transfer') && (
                <div style={{ display: 'grid', gridTemplateColumns: easyAction === 'party-transfer' ? '1fr 1fr' : '1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      {easyAction === 'party-transfer' ? 'From Party Subledger *' : 'Select Party / Master *'}
                    </label>
                    <select
                      value={selectedParty}
                      onChange={e => setSelectedParty(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                    >
                      <option value="">-- Select Party --</option>
                      {partiesList.map((p: any) => (
                        <option key={p.id || p.name} value={p.name}>
                          {p.name} ({p.type || 'Party'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {easyAction === 'party-transfer' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>To Party Subledger *</label>
                      <select
                        value={toParty}
                        onChange={e => setToParty(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                      >
                        <option value="">-- Select Target Party --</option>
                        {partiesList.map((p: any) => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Expense Selector */}
              {easyAction === 'pay-expense' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Expense Head *</label>
                  <select
                    value={selectedExpense}
                    onChange={e => setSelectedExpense(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                  >
                    {coa.filter(a => a.type === 'Expense').map(a => (
                      <option key={a.code} value={a.name}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment / Deposit Mode (Bank vs Cash) */}
              {(easyAction === 'pay-vendor' || easyAction === 'receive-customer' || easyAction === 'pay-expense') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mode of Payment *</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as any)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                    >
                      <option value="Bank Account">🏦 Bank Account (Cheque / Online)</option>
                      <option value="Cash Account">💵 Cash Account (Petty Cash)</option>
                    </select>
                  </div>

                  {paymentMode === 'Bank Account' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Bank Account *</label>
                      <select
                        value={selectedBank}
                        onChange={e => setSelectedBank(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                      >
                        {banksList.map((b: any) => (
                          <option key={b.id || b.accountName} value={b.glAccountName || b.accountName}>
                            {b.accountName} ({b.bankName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Selector for Cash Withdrawal / Deposit */}
              {(easyAction === 'withdraw-cash' || easyAction === 'deposit-cash') && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Bank Account *</label>
                  <select
                    value={selectedBank}
                    onChange={e => setSelectedBank(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                  >
                    {banksList.map((b: any) => (
                      <option key={b.id || b.accountName} value={b.glAccountName || b.accountName}>
                        {b.accountName} ({b.bankName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount, Date & Ref No Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--brand-primary)', background: 'var(--bg-card)', color: '#34D399', fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Posting Date *</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}/>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Voucher / Cheque No.</label>
                  <input type="text" required value={refNo} onChange={e => setRefNo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}/>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Narration / Remarks</label>
                <input type="text" value={narration} onChange={e => setNarration(e.target.value)} placeholder="e.g. Payment for monthly supply bill" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}/>
              </div>

            </div>

            {/* Post Voucher Button */}
            <button
              type="submit"
              className="btn-action btn-action-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 900, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              ⚡ Post Voucher ("Click-Click")
            </button>

          </form>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             ADVANCED PRO MODE (Manual Debit/Credit Table for Accountants)
             ════════════════════════════════════════════════════════════════ */
          <form onSubmit={handleAdvancedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Metadata Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Posting Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}/>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Voucher Type</label>
                <select value={entryType} onChange={e => setEntryType(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}>
                  <option value="Journal Voucher">Journal Voucher</option>
                  <option value="Party Transfer">Party Transfer</option>
                  <option value="Expense Voucher">Expense Voucher</option>
                  <option value="Vendor Payment">Vendor Payment</option>
                  <option value="Customer Receipt">Customer Receipt</option>
                  <option value="Inter-Bank Transfer">Inter-Bank Transfer</option>
                  <option value="Contra (Cash Withdrawal)">Contra (Cash Withdrawal)</option>
                  <option value="Contra (Cash Deposit)">Contra (Cash Deposit)</option>
                  <option value="Petty Cash Voucher">Petty Cash Voucher</option>
                  <option value="Adjustment Entry">Adjustment Entry</option>
                  <option value="Accrual">Accrual Entry</option>
                  <option value="Depreciation">Depreciation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Voucher Ref No.</label>
                <input type="text" required value={relatedNo} onChange={e => setRelatedNo(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Party / Particulars Reference</label>
                <input type="text" value={party} onChange={e => setParty(e.target.value)} placeholder="e.g. SAHIL TRADER, Internal Adjustment" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}/>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Narration / Description</label>
                <input type="text" value={narration} onChange={e => setNarration(e.target.value)} placeholder="e.g. Subledger transfer / adjustment" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}/>
              </div>
            </div>

            {/* Double Entry Lines Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Journal Lines (Double Entry Table)</label>
                <button type="button" onClick={addLine} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14}/> Add Row
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1.5px solid var(--border-default)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)' }}>Account Name (COA)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#60A5FA', width: 130 }}>Debit (₹)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#34D399', width: 130 }}>Credit (₹)</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 4px' }}>
                        <select value={line.account} onChange={e => updateLine(i, 'account', e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                          {coa.map(a => (
                            <option key={a.code} value={a.name}>{a.code} — {a.name} ({a.type})</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input type="number" step="0.01" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: '#60A5FA', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: 13 }}/>
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input type="number" step="0.01" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: '#34D399', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: 13 }}/>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={15}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Balance Verification Footer */}
            <div style={{ background: isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1.5px solid ${isBalanced ? '#10B981' : '#F87171'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isBalanced ? <CheckCircle2 size={20} style={{ color: '#10B981' }}/> : <AlertCircle size={20} style={{ color: '#F87171' }}/>}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isBalanced ? '#10B981' : '#F87171' }}>
                    {isBalanced ? '✓ Balanced Entry (Total Dr = Total Cr)' : `⚠ Out of Balance by ₹${diff.toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Total Debit: ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Total Credit: ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={!isBalanced} className="btn-action btn-action-primary" style={{ padding: '10px 22px', fontWeight: 800, background: isBalanced ? 'var(--brand-primary)' : 'var(--border-default)', cursor: isBalanced ? 'pointer' : 'not-allowed' }}>
                Post Journal Voucher
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
