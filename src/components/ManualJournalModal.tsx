import { useState } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccounting, type JournalLine } from '../hooks/useAccounting';

interface Props {
  onClose: () => void;
}

export default function ManualJournalModal({ onClose }: Props) {
  const { coa, postJournalEntry } = useAccounting();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [entryType, setEntryType] = useState('Journal Voucher');
  const [relatedNo, setRelatedNo] = useState(() => 'JV-' + Math.floor(100000 + Math.random() * 900000));
  const [party, setParty] = useState('General');
  const [narration, setNarration] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
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
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 680, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)', maxHeight: '90vh', overflowY: 'auto', animation: 'fade-in 0.2s' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(108,71,255,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22}/>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>+ New Manual Journal Entry</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Formal Double-Entry Voucher Posting</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
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
                <option value="Adjustment Entry">Adjustment Entry</option>
                <option value="Accrual">Accrual Entry</option>
                <option value="Depreciation">Depreciation</option>
                <option value="Provision">Provision Entry</option>
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
              <input type="text" value={party} onChange={e => setParty(e.target.value)} placeholder="e.g. SAHIL TRADER, Internal Adjustment, Monthly Rent" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}/>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Narration / Description</label>
              <input type="text" value={narration} onChange={e => setNarration(e.target.value)} placeholder="e.g. Monthly rent adjustment for Aug 2026" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}/>
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

      </div>
    </div>
  );
}
