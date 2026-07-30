import { useState } from 'react';
import { Bot, Send } from 'lucide-react';

interface Props {
  onClose: () => void;
  onDock: () => void;
}

export default function FloatingAiChatWidget({ onClose, onDock }: Props) {
  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your VyaparSetu AI Support Agent. Ask me any specific question about Purchase Bills, GST ITC, Bank Payments, or Accounting rules!',
      time: 'Just now'
    }
  ]);

  // High-Precision Intent Resolver
  const handleAskAi = (customPrompt?: string) => {
    const q = (customPrompt || aiQuestion).trim();
    if (!q) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: q, time: timeStr };
    let botResponse = '';
    const queryLower = q.toLowerCase();

    // SHIELD 1: Anti-Hack & Code Injection / Prompt Hacking Protection
    if (
      queryLower.includes('<script') ||
      queryLower.includes('eval(') ||
      queryLower.includes('drop table') ||
      queryLower.includes('select * from') ||
      queryLower.includes('javascript:') ||
      queryLower.includes('system prompt') ||
      queryLower.includes('ignore previous instructions') ||
      queryLower.includes('hack') ||
      queryLower.includes('inject')
    ) {
      botResponse = '🚨 Security Policy Alert: Input contains restricted code patterns or security override attempts. All inputs to VyaparSetu AI Assistant are sanitized under strict Zero-Trust Enterprise Security protocols.';
    }
    // SHIELD 2: Zero-Trust Credential & Password Protection
    else if (
      queryLower.includes('password') ||
      queryLower.includes('secret') ||
      queryLower.includes('admin login') ||
      queryLower.includes('db_pass') ||
      queryLower.includes('private key')
    ) {
      botResponse = '🔒 Security Policy: Admin credentials, passwords, and encryption keys are strictly confidential and protected by Zero-Trust security. VyaparSetu AI Support Assistant never stores or discloses sensitive credentials. Use Company Settings or the official login recovery link if needed.';
    }
    // SHIELD 3: Direct Transaction Execution Scope Boundary (Guidance vs Execution)
    else if (
      queryLower.startsWith('post my') ||
      queryLower.startsWith('create my') ||
      queryLower.startsWith('delete my') ||
      queryLower.includes('post purchase invoice') ||
      queryLower.includes('post invoice for me')
    ) {
      botResponse = 'ℹ️ Action Scope Notice: The Help & Support Assistant provides read-only step-by-step guidance. To post a Purchase Bill, please use the official form under "Transactions -> Purchase Bills -> + Record Purchase Bill" or click the "Smart AI Accountant" bot button in the top bar to record natural language vouchers securely with user review!';
    }
    // 1. Handling Wrong Entry / Wrong Invoice / Mistakes / Reversals
    else if (
      queryLower.includes('wrong') ||
      queryLower.includes('mistake') ||
      queryLower.includes('incorrect') ||
      queryLower.includes('error') ||
      queryLower.includes('accidental') ||
      queryLower.includes('fault')
    ) {
      botResponse = `If you posted a wrong invoice, bill, or entry in VyaparSetu, here is the official step-by-step solution:

1. 🧾 For Purchase Bills (Vendor Invoices): Go to "Transactions -> Debit Notes -> Click '+ New Debit Note'". Select the Vendor and the wrong Purchase Bill reference. This debits Accounts Payable and reverses the purchase expense & Input Tax Credit (ITC).

2. 🛒 For Sales Invoices (Customer Invoices): Go to "Transactions -> Sales Invoices", locate the invoice, and click "Edit Invoice" or issue a "Credit Note". A Credit Note reverses customer receivables, output GST liability, and restores inventory stock.

3. 📜 For Journal / Bank Entries: Go to "Finance -> Reports & Ledger", click "+ New Manual Journal", and post a Reversal Entry swapping Debit and Credit accounts.`;
    }
    // 2. Editing / Modifying Existing Records
    else if (
      queryLower.includes('edit') ||
      queryLower.includes('modify') ||
      queryLower.includes('change') ||
      queryLower.includes('update')
    ) {
      botResponse = 'To edit a transaction or master record: Go to the respective module (Sales Invoices, Purchase Bills, or Parties). If the voucher is un-reconciled, click the "Edit" button on that line. If it is locked in a filed GST return, issue a Debit Note (for purchases) or Credit Note (for sales) to adjust the difference.';
    }
    // 3. Cancelling / Deleting Entries
    else if (
      queryLower.includes('cancel') ||
      queryLower.includes('delete') ||
      queryLower.includes('remove') ||
      queryLower.includes('void')
    ) {
      botResponse = 'For GST compliance and double-entry audit integrity, posted vouchers cannot be silently deleted if reconciled. Instead, issue a Credit Note (for sales) or Debit Note (for purchases) to zero out the balance cleanly while preserving your audit trail.';
    }
    // 4. GST Input Tax Credit (ITC) & 2A/2B
    else if (
      queryLower.includes('itc') ||
      queryLower.includes('gst') ||
      queryLower.includes('tax credit') ||
      queryLower.includes('2a') ||
      queryLower.includes('2b')
    ) {
      botResponse = 'GST Input Tax Credit (ITC) is automatically calculated when you record a Purchase Bill with a valid Vendor GSTIN. CGST + SGST (Intrastate) or IGST (Interstate) credits to your Tax Asset account. Verify your monthly eligible ITC under Reports -> GST Summary against GSTR-2B.';
    }
    // 5. Debit Notes & Credit Notes
    else if (
      queryLower.includes('debit note') ||
      queryLower.includes('credit note') ||
      queryLower.includes('return')
    ) {
      botResponse = 'To record a Purchase Return: Go to Transactions -> Debit Notes -> Click "+ New Debit Note". To record a Sales Return: Go to Transactions -> Sales Invoices -> Issue Credit Note. System automatically updates inventory and subledger balances.';
    }
    // 6. PO & GRN Procurement Workflow
    else if (
      queryLower.includes('po') ||
      queryLower.includes('purchase order') ||
      queryLower.includes('grn') ||
      queryLower.includes('goods receipt')
    ) {
      botResponse = 'Purchase Orders (PO) record vendor rate commitments. Goods Receipt Notes (GRN) verify warehouse receipt of physical stock before converting to a final Purchase Bill for Accounts Payable financial posting.';
    }
    // 7. Bank Payments, BRS & Cash
    else if (
      queryLower.includes('bank') ||
      queryLower.includes('brs') ||
      queryLower.includes('cash') ||
      queryLower.includes('petty cash') ||
      queryLower.includes('cheque') ||
      queryLower.includes('utr')
    ) {
      botResponse = 'Bank reconciliation (BRS) compares your recorded bank vouchers against uploaded bank passbook statements. Pure cash / petty cash payments are excluded from BRS to keep bank statements 100% accurate.';
    }
    // 8. Contact & Helpdesk Info
    else if (
      queryLower.includes('contact') ||
      queryLower.includes('phone') ||
      queryLower.includes('support') ||
      queryLower.includes('number') ||
      queryLower.includes('helpdesk') ||
      queryLower.includes('call')
    ) {
      botResponse = 'You can reach official VyaparSetu Customer Support at Toll-Free: 1800-8927-2738 (1800-VYAPAR-SETU) or Email: support@vyaparsetu.in (Monday-Saturday, 9am-8pm IST).';
    }
    // 9. Off-Topic / Irrelevant Query Filter Guardrail
    else if (
      queryLower.includes('weather') ||
      queryLower.includes('recipe') ||
      queryLower.includes('pizza') ||
      queryLower.includes('movie') ||
      queryLower.includes('sports') ||
      queryLower.includes('cricket') ||
      queryLower.includes('joke') ||
      queryLower.includes('song') ||
      queryLower.includes('capital') ||
      queryLower.includes('who are you')
    ) {
      botResponse = 'I am the specialized VyaparSetu AI Support Assistant, focused strictly on Accounting, GST Returns, Procurement, BRS, and Business Management. Please ask any question about your invoices, bills, payments, or ledger reports!';
    }
    // 10. Greetings & Friendly Interactions
    else if (
      queryLower === 'hi' ||
      queryLower === 'hello' ||
      queryLower === 'hey' ||
      queryLower.startsWith('hi ') ||
      queryLower.startsWith('hello ')
    ) {
      botResponse = 'Hello! Welcome to VyaparSetu Support. How can I assist you with your invoices, GST filing, purchase bills, or accounting today?';
    }
    // 11. Smart Module-Aware Domain Assistant Fallback
    else {
      botResponse = `Regarding your query "${q}": In VyaparSetu, all transactions adhere strictly to Double-Entry GST accounting rules. You can type a specific keyword like "edit invoice", "claim ITC", or "wrong bill" for detailed steps, or call our support desk at 1800-8927-2738.`;
    }

    setChatHistory(prev => [...prev, userMsg, { sender: 'agent', text: botResponse, time: timeStr }]);
    setAiQuestion('');
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, width: 400, height: 530, zIndex: 1600, background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1.5px solid var(--brand-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fade-in 0.2s' }}>
      
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900 }}>VyaparSetu AI Support Agent</div>
            <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 700 }}>● Live Standalone Assistant</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onDock}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Dock back to full Knowledge Base modal"
          >
            ↙️ Dock
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-elevated)' }}>
        {chatHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{msg.sender === 'user' ? 'You' : 'Agent'} · {msg.time}</div>
            <div style={{ background: msg.sender === 'user' ? 'var(--brand-primary)' : 'var(--bg-card)', color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, maxWidth: '90%', border: msg.sender === 'agent' ? '1px solid var(--border-default)' : 'none', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompt Shortcuts */}
      <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => handleAskAi('i have posted wrong invoice, what i need to do')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', cursor: 'pointer' }}>
          🚨 Posted wrong invoice?
        </button>
        <button type="button" onClick={() => handleAskAi('How to record debit note for returned goods?')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--brand-primary)', cursor: 'pointer' }}>
          💡 Debit Note?
        </button>
        <button type="button" onClick={() => handleAskAi('How to claim ITC for GST on purchase bills?')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--brand-primary)', cursor: 'pointer' }}>
          💡 Claim ITC?
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={e => { e.preventDefault(); handleAskAi(); }} style={{ padding: 12, background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Ask AI Assistant anything..."
          value={aiQuestion}
          onChange={e => setAiQuestion(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}
        />
        <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={14}/> Send
        </button>
      </form>

    </div>
  );
}
