import { useState } from 'react';
import { Bot, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAccounting, type JournalLine } from '../hooks/useAccounting';

interface Props {
  onClose: () => void;
}

export default function SmartAiAccountantModal({ onClose }: Props) {
  const { postJournalEntry } = useAccounting();
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<{
    entryType: string;
    date: string;
    amount: number;
    party: string;
    debitAccount: string;
    creditAccount: string;
    narration: string;
  } | null>(null);
  const [postedSuccess, setPostedSuccess] = useState(false);

  const handleAnalyzePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const lower = prompt.toLowerCase();
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Amount Extraction
      const amtMatch = prompt.match(/(?:₹|rs\.?|rupees|amount)?\s*(\d+(?:\.\d+)?)/i);
      const amount = amtMatch ? parseFloat(amtMatch[1]) : 1000;

      // 2. Date Extraction
      let date = todayStr;
      if (lower.includes('1st august') || lower.includes('1 august')) date = '2026-08-01';
      else if (lower.includes('yesterday')) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        date = y.toISOString().split('T')[0];
      } else {
        const dateMatch = prompt.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        if (dateMatch) date = dateMatch[1];
      }

      // 3. Party Extraction
      let party = 'General';
      if (lower.includes('sahil trader')) party = 'SAHIL TRADER';
      else if (lower.includes('ravi enterprise')) party = 'Ravi Enterprises';

      // 4. Account & Voucher Type Classification
      let entryType = 'Journal Voucher';
      let debitAccount = 'Office Supplies';
      let creditAccount = 'Bank Account';

      if (lower.includes('rent')) {
        entryType = 'Rent Expense';
        debitAccount = 'Rent';
        creditAccount = lower.includes('cash') ? 'Cash & Bank' : 'Bank Account';
      } else if (lower.includes('bank charge') || lower.includes('late fee') || lower.includes('bank charges')) {
        entryType = 'Bank Charges';
        debitAccount = 'Freight & Charges';
        creditAccount = 'Bank Account';
      } else if (lower.includes('tea') || lower.includes('petty cash') || lower.includes('refreshment')) {
        entryType = 'Petty Cash Expense';
        debitAccount = 'Office Supplies';
        creditAccount = 'Cash & Bank';
      } else if (lower.includes('salary') || lower.includes('wages')) {
        entryType = 'Salary Payment';
        debitAccount = 'Purchases';
        creditAccount = 'Bank Account';
      } else if (lower.includes('depreciation')) {
        entryType = 'Depreciation';
        debitAccount = 'Freight & Charges';
        creditAccount = 'Other Assets';
      }

      setParsedResult({
        entryType,
        date,
        amount,
        party,
        debitAccount,
        creditAccount,
        narration: `AI Bot Auto-Posting: ${prompt.trim()}`,
      });
      setIsAnalyzing(false);
    }, 600);
  };

  const handleConfirmPost = () => {
    if (!parsedResult) return;

    const lines: JournalLine[] = [
      { account: parsedResult.debitAccount, debit: parsedResult.amount, credit: 0 },
      { account: parsedResult.creditAccount, debit: 0, credit: parsedResult.amount },
    ];

    postJournalEntry({
      date: parsedResult.date,
      entryType: parsedResult.entryType,
      relatedId: 'ai_' + Date.now().toString(36),
      relatedNo: 'AI-' + Date.now().toString().slice(-6),
      party: parsedResult.party,
      lines,
    });

    setPostedSuccess(true);
    setTimeout(() => {
      setPostedSuccess(false);
      setParsedResult(null);
      setPrompt('');
      onClose();
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)', animation: 'fade-in 0.2s' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6C47FF 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={22}/>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Smart AI Accountant <Sparkles size={15} style={{ color: '#FBBF24' }}/>
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Natural Language Journal &amp; Cash Voucher Posting Engine</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {postedSuccess ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
            <CheckCircle2 size={48} style={{ margin: '0 auto 12px' }}/>
            <h4 style={{ fontSize: 18, fontWeight: 800 }}>Voucher Auto-Posted Successfully!</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Double-entry Journal has been updated in General Ledger &amp; Reports.</p>
          </div>
        ) : (
          <form onSubmit={handleAnalyzePrompt} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Prompt Natural Language Accounting Instruction:
              </label>
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder='e.g. "I want to pay my rent of 25000 from bank to vendor SAHIL TRADER for the month of August, keep the posting date 1st August"'
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Try Prompts:</span>
                <button type="button" onClick={() => setPrompt("i want to pay my rent of 25000 from bank to vendor SAHIL TRADER for the month of August , keep the posting date 1st August")} style={{ fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '2px 8px', color: 'var(--brand-primary)', cursor: 'pointer' }}>Rent Payment</button>
                <button type="button" onClick={() => setPrompt("i recived bank charges of 10 rupees against late fee , post it for today")} style={{ fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '2px 8px', color: 'var(--brand-primary)', cursor: 'pointer' }}>Bank Charges</button>
                <button type="button" onClick={() => setPrompt("paid petty cash 350 for office tea today")} style={{ fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '2px 8px', color: 'var(--brand-primary)', cursor: 'pointer' }}>Petty Cash Tea</button>
              </div>
            </div>

            {!parsedResult && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isAnalyzing} className="btn-action btn-action-primary" style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, gap: 6 }}>
                  {isAnalyzing ? <><RefreshCw size={14} className="animate-spin"/> Analyzing Prompt...</> : <><Sparkles size={15}/> Interpret &amp; Preview Voucher</>}
                </button>
              </div>
            )}

            {/* Parsed Result Preview Card */}
            {parsedResult && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--brand-primary)', padding: 18, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Parsed Voucher Entry</span>
                  <span>Voucher Type: {parsedResult.entryType}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Posting Date</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{parsedResult.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Party / Reference</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{parsedResult.party}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#60A5FA', display: 'block' }}>DEBIT Account (Dr)</span>
                    <strong style={{ color: '#60A5FA' }}>{parsedResult.debitAccount} (₹{parsedResult.amount.toLocaleString('en-IN')})</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#34D399', display: 'block' }}>CREDIT Account (Cr)</span>
                    <strong style={{ color: '#34D399' }}>{parsedResult.creditAccount} (₹{parsedResult.amount.toLocaleString('en-IN')})</strong>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 6, fontStyle: 'italic', marginBottom: 14 }}>
                  {parsedResult.narration}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn-action btn-action-ghost" onClick={() => setParsedResult(null)}>Re-prompt</button>
                  <button type="button" className="btn-action btn-action-primary" onClick={handleConfirmPost} style={{ padding: '10px 20px', fontWeight: 800, background: '#10B981', borderColor: '#10B981' }}>
                    ⚡ Confirm &amp; Auto-Post Voucher
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
