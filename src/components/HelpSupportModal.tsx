import { useState, useMemo } from 'react';
import { Search, BookOpen, HelpCircle, ShieldAlert, Sparkles, ChevronRight, Landmark, Users, Package, ShoppingCart, FileText, BarChart3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

type ModeDepth = 'basic' | 'deep';

interface ScreenHelpContent {
  id: string;
  title: string;
  category: string;
  icon: any;
  layman: {
    whatIsIt: string;
    howToAdd: string[];
    rulesAndLimits: string[];
    proTips: string[];
  };
  deepDive: {
    technicalArch: string;
    coaGLMapping: string[];
    controlFlow: string[];
    auditTrail: string;
  };
}

const HELP_DATABASE: Record<string, ScreenHelpContent> = {
  'chart-of-accounts': {
    id: 'chart-of-accounts',
    title: 'Chart of Accounts (COA)',
    category: 'FINANCE & GL',
    icon: BookOpen,
    layman: {
      whatIsIt: 'The Chart of Accounts is the master list of all financial buckets in your business (Assets, Liabilities, Income, Expenses, Equity). Think of it like your digital filing cabinet where every rupee spent, earned, or owed gets recorded cleanly.',
      howToAdd: [
        'Click "+ Add New Account" button at top right.',
        'Select the Account Type (e.g. Expense, Asset, Liability, Revenue).',
        'Enter a clean Account Name (e.g. "Internet & WiFi Expense" or "Office Rent").',
        'Specify Opening Balance if migrating from another software.',
        'Click "Save Account" to register it in your Chart of Accounts.'
      ],
      rulesAndLimits: [
        'Normal users CAN add new sub-accounts or edit account display names.',
        'Core System Accounts (like "Cash Account", "HDFC Bank", "Accounts Receivable", "Accounts Payable") CANNOT be deleted because double-entry vouchers rely on them.',
        'Every transaction automatically posts strictly through a registered COA account.'
      ],
      proTips: [
        'Keep account names short and descriptive.',
        'Group similar expenses under standard categories (e.g. Office Expenses, Utility Bills).'
      ]
    },
    deepDive: {
      technicalArch: 'VyaparSetu enforces a strict 4-digit GL coding structure: 1000s (Assets), 2000s (Liabilities), 3000s (Equity), 4000s (Revenue), 5000s (COGS), 6000s (Expenses).',
      coaGLMapping: [
        'Automatic GL Route Enforcer (resolveCOARoute) verifies 100% of journal entries against vs_coa.',
        'Missing accounts are auto-provisioned under proper parent GL roots to prevent unposted orphan transactions.',
        'Supports multi-currency GL rollups and trial balance balance checks (Dr = Cr).'
      ],
      controlFlow: [
        'Voucher Entry -> COA Route Enforcer -> Journal Storage (vs_journal) -> Real-time Ledger Aggregator.'
      ],
      auditTrail: 'All account creations and modifications are stamped with user ID, timestamp, and immutable audit logs.'
    }
  },

  'reports': {
    id: 'reports',
    title: 'Reports & General Ledger',
    category: 'FINANCE & AUDIT',
    icon: BarChart3,
    layman: {
      whatIsIt: 'This section displays your real-time financial statements (Profit & Loss, Balance Sheet, Trial Balance, General Ledger, Cash Flow). Everything is calculated live from your double-entry vouchers.',
      howToAdd: [
        'Select the report tab (e.g. General Ledger, Profit & Loss, Trial Balance).',
        'Use the Date Range filter to view specific months or financial years.',
        'Click "+ New Manual Journal" if you need to post an adjustment entry.',
        'Click "Export PDF" or "Export Excel" to download reports for your accountant or GST file.'
      ],
      rulesAndLimits: [
        'Normal users can view reports and post manual accounting vouchers.',
        'Financial reports cannot be manually edited; they reflect exact double-entry voucher calculations.'
      ],
      proTips: [
        'Check Trial Balance regularly to verify Total Debit equals Total Credit.',
        'Use the General Ledger filter to inspect line-by-line history of any specific party or bank.'
      ]
    },
    deepDive: {
      technicalArch: 'Financial statements are dynamically aggregated in memory using transactional double-entry line sums from localStorage key vs_journal.',
      coaGLMapping: [
        'P&L Accounts: 4000s (Revenue) minus 5000s/6000s (Expenses).',
        'Balance Sheet Accounts: 1000s (Assets) vs 2000s (Liabilities) + 3000s (Equity).'
      ],
      controlFlow: [
        'Journal Entries -> Dynamic GL Aggregator -> Live Balance Sheet / P&L Generator.'
      ],
      auditTrail: 'Vouchers retain full reference numbers (JV-XXXXXX, VOU-XXXXXX) for one-click audit tracing.'
    }
  },

  'parties': {
    id: 'parties',
    title: 'Parties & Subledgers',
    category: 'MASTERS',
    icon: Users,
    layman: {
      whatIsIt: 'The Parties directory stores all your Customers, Vendors (Suppliers), and Dual-Role partners. Every party gets an automatic subledger linked to your Chart of Accounts.',
      howToAdd: [
        'Click "+ Add New Party" button.',
        'Enter Party Name, Email Address, and GSTIN (if registered).',
        'Choose Party Type: "Customer", "Vendor", or "Both (Customer & Vendor)".',
        'Set Payment Terms (e.g. Net 30, Due on Receipt) and Opening Balance.',
        'Click "Save Party".'
      ],
      rulesAndLimits: [
        'If a party buys from you AND sells to you, select "Both (Customer & Vendor)".',
        'When posting vouchers for a "Both" party, you can toggle between their Customer (Receivable) and Vendor (Payable) account with 1 click!'
      ],
      proTips: [
        'Always provide a valid email address so VyaparSetu can automatically email payment receipts and invoice acknowledgments.'
      ]
    },
    deepDive: {
      technicalArch: 'Party master records are stored under vs_parties. Subledger balances map directly to Accounts Receivable (1010) or Accounts Payable (2010).',
      coaGLMapping: [
        'Customers -> Subledger under Accounts Receivable (Asset).',
        'Vendors -> Subledger under Accounts Payable (Liability).',
        'Both -> Dual subledger mapping allowing AR/AP contra settlements.'
      ],
      controlFlow: [
        'Party Creation -> Subledger Registration -> Automated Invoice/Voucher Route Binding.'
      ],
      auditTrail: 'GSTIN validation and email dispatch timestamps are logged for compliance.'
    }
  },

  'items': {
    id: 'items',
    title: 'Inventory & Items',
    category: 'MASTERS',
    icon: Package,
    layman: {
      whatIsIt: 'The Items directory manages all products, goods, and services that you sell or purchase. Stock levels update automatically whenever invoices or bills are created.',
      howToAdd: [
        'Click "+ Add Item" button.',
        'Enter Item Name, SKU/HSN Code, and Unit of Measure (Pcs, Kg, Box).',
        'Specify Selling Price, Purchase Price, and GST Tax Rate (e.g. 18%).',
        'Enter Opening Stock Quantity.',
        'Click "Save Item".'
      ],
      rulesAndLimits: [
        'Items with opening stock automatically post Opening Inventory asset balance.',
        'Stock quantity decreases on Sales Invoices and increases on Purchase Bills.'
      ],
      proTips: [
        'Keep HSN/SAC codes updated for seamless GST return filing.'
      ]
    },
    deepDive: {
      technicalArch: 'Items are stored under vs_items with perpetual inventory valuation support.',
      coaGLMapping: [
        'Inventory Asset (1020), Sales Revenue (4010), Cost of Goods Sold (5010), Tax Accounts (Output GST / Input Tax Credit).'
      ],
      controlFlow: [
        'Invoice Post -> Stock Ledger Deduction -> Revenue & Tax GL Double-Entry Posting.'
      ],
      auditTrail: 'Stock movements retain invoice and bill serial linkage.'
    }
  },

  'sales': {
    id: 'sales',
    title: 'Sales Invoices',
    category: 'TRANSACTIONS',
    icon: ShoppingCart,
    layman: {
      whatIsIt: 'Create and manage tax invoices for your customers. VyaparSetu automatically calculates GST, posts double-entry vouchers, and emails receipt acknowledgments.',
      howToAdd: [
        'Click "+ Create Sales Invoice".',
        'Select Customer from dropdown (or add a new customer).',
        'Pick items, set quantities and discounts.',
        'Verify GST calculation (CGST + SGST or IGST).',
        'Click "Post Invoice".'
      ],
      rulesAndLimits: [
        'Posted invoices automatically update Customer Receivable balance and Inventory stock.',
        'Tax rates are automatically determined based on Customer State vs Company State.'
      ],
      proTips: [
        'Use Smart Express Voucher mode if you received direct bank/cash payment for the sale.'
      ]
    },
    deepDive: {
      technicalArch: 'Invoices generate multi-line GL journal entries debiting Accounts Receivable and crediting Sales Account & Output Tax Liabilities.',
      coaGLMapping: [
        'Dr. Accounts Receivable (1010), Cr. Sales Revenue (4010), Cr. Output CGST/SGST/IGST Payable (2020).'
      ],
      controlFlow: [
        'Invoice Form -> Tax Calculator -> COA Voucher Generator -> Stock & Ledger Dispatcher.'
      ],
      auditTrail: 'Digital invoice hashes and email dispatch logs are archived.'
    }
  },

  'purchases': {
    id: 'purchases',
    title: 'Purchase Bills & Vendor Invoices',
    category: 'TRANSACTIONS',
    icon: FileText,
    layman: {
      whatIsIt: 'Record purchase bills from your suppliers and vendors. Claims Input Tax Credit (ITC) for GST and updates stock inventory.',
      howToAdd: [
        'Click "+ Record Purchase Bill".',
        'Select Vendor from party list.',
        'Enter Vendor Bill No. and Date.',
        'Add purchased items and prices.',
        'Click "Save Purchase Bill".'
      ],
      rulesAndLimits: [
        'Purchase bills increase Accounts Payable (money you owe to vendor) and increase inventory stock.',
        'Input Tax Credit (ITC) is automatically credited to your Tax Asset account.'
      ],
      proTips: [
        'Verify Vendor GSTIN to ensure eligibility for Input Tax Credit.'
      ]
    },
    deepDive: {
      technicalArch: 'Purchase bills generate double-entry records debiting Inventory/Expenses & Input Tax Credit, and crediting Accounts Payable.',
      coaGLMapping: [
        'Dr. Inventory Asset (1020) / Purchase Expense (5010), Dr. Input CGST/SGST ITC Asset (1030), Cr. Accounts Payable (2010).'
      ],
      controlFlow: [
        'Purchase Form -> ITC Claim Engine -> COA Voucher Generator -> Vendor Ledger update.'
      ],
      auditTrail: 'Vendor bill serial reference linked for 2A/2B GST reconciliation.'
    }
  },

  'payments': {
    id: 'payments',
    title: 'Payments & Bank Reconciliation',
    category: 'FINANCE & BANKING',
    icon: Landmark,
    layman: {
      whatIsIt: 'Manage bank payments, customer receipts, petty cash, and bank reconciliation statements (BRS).',
      howToAdd: [
        'Click "+ New Manual Journal" or "Open Smart AI Accountant".',
        'Select action: Pay Vendor, Receive Customer, Withdraw Cash, or Deposit Cash.',
        'Pick Bank Account and Party Name.',
        'Enter Amount and click "Post Voucher".'
      ],
      rulesAndLimits: [
        'Pure Cash / Petty cash transactions are excluded from Bank Reconciliation (BRS) so your bank statement stays 100% accurate.',
        'Vouchers preview exact layman financial impact before posting.'
      ],
      proTips: [
        'Use "Smart AI Accountant" to type natural prompts like "Paid 2000 cash for tea" or "Withdraw 5000 from HDFC cheque 45922".'
      ]
    },
    deepDive: {
      technicalArch: 'Bank vouchers route through resolveCOARoute and update vs_brs_records for bank reconciliation matching.',
      coaGLMapping: [
        'Dr./Cr. Bank GL Account (1002), Dr./Cr. AR/AP (1010/2010), Dr./Cr. Cash Account (1001).'
      ],
      controlFlow: [
        'Payment Modal -> Impact Preview -> Double Entry Dispatcher -> BRS Filter.'
      ],
      auditTrail: 'Cheque numbers and bank UTR references are stored for audit verification.'
    }
  }
};

export default function HelpSupportModal({ onClose }: Props) {
  const location = useLocation();

  // Detect current screen from route
  const currentScreenKey = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('chart-of-accounts') || path.includes('coa')) return 'chart-of-accounts';
    if (path.includes('reports')) return 'reports';
    if (path.includes('parties')) return 'parties';
    if (path.includes('items')) return 'items';
    if (path.includes('sales')) return 'sales';
    if (path.includes('purchases')) return 'purchases';
    if (path.includes('payments') || path.includes('debit-notes')) return 'payments';
    return 'chart-of-accounts'; // Default fallback
  }, [location.pathname]);

  const [selectedScreen, setSelectedScreen] = useState<string>(currentScreenKey);
  const [modeDepth, setModeDepth] = useState<ModeDepth>('basic');
  const [searchQuery, setSearchQuery] = useState('');

  const activeContent = HELP_DATABASE[selectedScreen] || HELP_DATABASE['chart-of-accounts'];
  const ActiveIcon = activeContent.icon;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return Object.values(HELP_DATABASE);
    const q = searchQuery.toLowerCase();
    return Object.values(HELP_DATABASE).filter(h => 
      h.title.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q) ||
      h.layman.whatIsIt.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 900, height: '88vh', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fade-in 0.2s' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6C47FF 0%, #3B82F6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={24}/>
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>VyaparSetu Help &amp; Support Knowledge Base</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Context-Aware Screen Guides &amp; Layman Documentation</div>
            </div>
          </div>

          {/* Right Mode Switcher & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Information Depth Switcher Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 8, padding: 3, border: '1px solid var(--border-default)' }}>
              <button
                type="button"
                onClick={() => setModeDepth('basic')}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: modeDepth === 'basic' ? '#10B981' : 'transparent', color: modeDepth === 'basic' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🟢 Basic Business Owner Guide
              </button>
              <button
                type="button"
                onClick={() => setModeDepth('deep')}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: modeDepth === 'deep' ? '#6C47FF' : 'transparent', color: modeDepth === 'deep' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🎓 Deep-Dive Guide (Accountants)
              </button>
            </div>

            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {/* Modal Main Body Grid (Sidebar + Content) */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar Topics Menu */}
          <div style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--border-subtle)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {/* Topic Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }}/>
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12 }}
              />
            </div>

            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
              Select Screen Topic:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredTopics.map(topic => {
                const Icon = topic.icon;
                const isSelected = selectedScreen === topic.id;
                const isCurrentScreen = currentScreenKey === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedScreen(topic.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'transparent'}`,
                      background: isSelected ? 'rgba(108,71,255,0.08)' : 'transparent',
                      color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{topic.title}</div>
                        {isCurrentScreen && (
                          <div style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>📍 Active Screen</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ opacity: isSelected ? 1 : 0.4 }}/>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Topic Details Body */}
          <div style={{ padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg-card)' }}>
            
            {/* Topic Header Card */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(108,71,255,0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActiveIcon size={24}/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeContent.category} MODULE</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{activeContent.title} Guide</h2>
              </div>
            </div>

            {/* Mode Content Render */}
            {modeDepth === 'basic' ? (
              /* ════════════════════════════════════════════════════════════════
                 BASIC BUSINESS OWNER LAYMAN GUIDE
                 ════════════════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* What is this screen */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 18 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10B981', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💡 What is {activeContent.title}? (In Simple Terms)
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    {activeContent.layman.whatIsIt}
                  </p>
                </div>

                {/* How to add / use this screen */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                    📌 How to Use &amp; Perform Actions:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeContent.layman.howToAdd.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ marginTop: 2 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules & What Normal Users Cannot Do */}
                <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 12, padding: 18, border: '1.5px solid rgba(239,68,68,0.2)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#F87171', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={18}/> Rules, Safety &amp; Restrictions for Normal Users:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.layman.rulesAndLimits.map((rule, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tips */}
                <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 12, padding: 18, border: '1.5px solid rgba(59,130,246,0.2)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18}/> Business Best Practices &amp; Pro Tips:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.layman.proTips.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ) : (
              /* ════════════════════════════════════════════════════════════════
                 DEEP-DIVE TECHNICAL & ACCOUNTANT GUIDE
                 ════════════════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ background: 'rgba(108,71,255,0.08)', borderRadius: 12, padding: 18, border: '1.5px solid var(--brand-primary)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-primary)', margin: '0 0 6px 0' }}>
                    ⚙️ Technical Architecture &amp; System Flow:
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontFamily: 'monospace' }}>
                    {activeContent.deepDive.technicalArch}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                    📊 Chart of Accounts GL Mapping Rules:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.deepDive.coaGLMapping.map((item, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                    🔄 Subledger Control Flow:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.deepDive.controlFlow.map((item, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    🛡️ Audit Trail &amp; Compliance Integrity:
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {activeContent.deepDive.auditTrail}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
