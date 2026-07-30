import { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { resolveAiIntent } from '../utils/aiSupportResolver';

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
    
    const botResponse = resolveAiIntent(q, 'VyaparSetu');

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
