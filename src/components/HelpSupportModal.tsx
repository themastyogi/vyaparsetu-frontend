import { useState, useMemo } from 'react';
import { Search, BookOpen, HelpCircle, ShieldAlert, Sparkles, ChevronRight, Landmark, Users, Package, ShoppingCart, FileText, BarChart3, Phone, Send, Bot } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Props {
  onClose: () => void;
  onPopout?: () => void;
}

type ModeDepth = 'basic' | 'deep';

interface ScreenHelpContent {
  id: string;
  title: string;
  category: string;
  icon: any;
  businessUser: {
    whatIsIt: string;
    processesAndSteps: { title: string; steps: string[] }[];
    rulesAndLimits: string[];
    proTips: string[];
  };
  advancedGuide: {
    technicalArch: string;
    coaGLMapping: string[];
    controlFlow: string[];
    auditTrail: string;
  };
}

const HELP_DATABASE: Record<string, ScreenHelpContent> = {
  'purchases': {
    id: 'purchases',
    title: 'Purchase Bills & Procurement Workflow',
    category: 'PROCUREMENT & VENDORS',
    icon: FileText,
    businessUser: {
      whatIsIt: 'The Purchase & Procurement module manages the complete vendor purchase lifecycle — from Purchase Orders (PO) and Goods Receipt Notes (GRN) to Vendor Purchase Bills, Input Tax Credit (ITC 2A/2B) claiming, Debit Notes (Purchase Returns), and Vendor Accounts Payable aging.',
      processesAndSteps: [
        {
          title: '1. Purchase Orders (PO) & Vendor Requisitions',
          steps: [
            'Click "+ Record Purchase Bill" or navigate to PO creation.',
            'Select Supplier/Vendor from Party Master.',
            'Enter item quantities, agreed unit rates, and delivery dates.',
            'System generates a PO reference number for vendor tracking.'
          ]
        },
        {
          title: '2. Goods Receipt Note (GRN) & Physical Stock Receipt',
          steps: [
            'When goods arrive at warehouse, verify items against the vendor delivery challan.',
            'System automatically updates physical stock inventory upon GRN confirmation.',
            'Discrepancies in quantity or damaged goods are flagged before final bill posting.'
          ]
        },
        {
          title: '3. Vendor Purchase Bills & GST Input Tax Credit (ITC 2A/2B)',
          steps: [
            'Enter Vendor Bill Serial No., Invoice Date, and Vendor GSTIN.',
            'Map purchased line items to Inventory Asset or Purchase Expense accounts.',
            'System calculates CGST + SGST (Intra-state) or IGST (Inter-state) ITC tax credit.',
            'Verifies Input Tax Credit eligibility against GSTR-2B monthly auto-drafted returns.'
          ]
        },
        {
          title: '4. Debit Notes & Purchase Return Vouchers',
          steps: [
            'If returning defective goods or receiving price adjustments from vendor, click "Debit Notes".',
            'Select original Purchase Bill reference and items returned.',
            'System posts Debit Note voucher: Debits Vendor Accounts Payable and Credits Inventory/Purchase Return.'
          ]
        },
        {
          title: '5. Vendor Accounts Payable & Payment Aging',
          steps: [
            'View outstanding vendor dues broken down by aging slabs (Current, 1-30 Days, 31-60 Days, >90 Days).',
            'Post vendor payments via Bank Transfer / Cheque with 1 click.'
          ]
        }
      ],
      rulesAndLimits: [
        'Normal users can record purchase bills, generate POs, and record debit notes.',
        'Posted purchase bills automatically credit Vendor Accounts Payable and debit Inventory/Expense GL accounts.',
        'Input Tax Credit (ITC) requires valid Vendor GSTIN matching GSTR-2B returns.'
      ],
      proTips: [
        'Always enter exact Vendor Invoice Number to enable automated 2A/2B GST reconciliation.',
        'Use Debit Notes instead of deleting purchase bills to preserve full GST audit trail compliance.'
      ]
    },
    advancedGuide: {
      technicalArch: 'Purchase transactions generate multi-line GL journal entries enforcing perpetual inventory valuation and Input Tax Credit (ITC) asset routing.',
      coaGLMapping: [
        'Dr. Inventory Asset (1020) / Purchase Expense (5010)',
        'Dr. Input CGST Asset (1030) / Input SGST Asset (1031) / Input IGST Asset (1032)',
        'Cr. Accounts Payable Vendor Subledger (2010)'
      ],
      controlFlow: [
        'Purchase Bill Form -> GSTR-2B Validation -> Stock Ledger Incrementor -> COA Multi-line Journal Generator -> Vendor Payable Ledger.'
      ],
      auditTrail: 'Vendor bill numbers, UTR transaction hashes, and GSTR-2B mismatch flags are archived for GST audit readiness.'
    }
  },

  'chart-of-accounts': {
    id: 'chart-of-accounts',
    title: 'Chart of Accounts (COA)',
    category: 'FINANCE & GL',
    icon: BookOpen,
    businessUser: {
      whatIsIt: 'The Chart of Accounts is the master list of all financial buckets in your business (Assets, Liabilities, Income, Expenses, Equity). Think of it like your digital filing cabinet where every rupee spent, earned, or owed gets recorded cleanly.',
      processesAndSteps: [
        {
          title: 'Adding & Configuring Accounts',
          steps: [
            'Click "+ Add New Account" button at top right.',
            'Select the Account Type (e.g. Expense, Asset, Liability, Revenue).',
            'Enter a clean Account Name (e.g. "Internet & WiFi Expense" or "Office Rent").',
            'Specify Opening Balance if migrating from another software.',
            'Click "Save Account" to register it in your Chart of Accounts.'
          ]
        }
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
    advancedGuide: {
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
    businessUser: {
      whatIsIt: 'This section displays your real-time financial statements (Profit & Loss, Balance Sheet, Trial Balance, General Ledger, Cash Flow). Everything is calculated live from your double-entry vouchers.',
      processesAndSteps: [
        {
          title: 'Generating & Exporting Reports',
          steps: [
            'Select the report tab (e.g. General Ledger, Profit & Loss, Trial Balance).',
            'Use the Date Range filter to view specific months or financial years.',
            'Click "+ New Manual Journal" if you need to post an adjustment entry.',
            'Click "Export PDF" or "Export Excel" to download reports for your accountant or GST file.'
          ]
        }
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
    advancedGuide: {
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
    businessUser: {
      whatIsIt: 'The Parties directory stores all your Customers, Vendors (Suppliers), and Dual-Role partners. Every party gets an automatic subledger linked to your Chart of Accounts.',
      processesAndSteps: [
        {
          title: 'Managing Parties & Dual Roles',
          steps: [
            'Click "+ Add New Party" button.',
            'Enter Party Name, Email Address, and GSTIN (if registered).',
            'Choose Party Type: "Customer", "Vendor", or "Both (Customer & Vendor)".',
            'Set Payment Terms (e.g. Net 30, Due on Receipt) and Opening Balance.',
            'Click "Save Party".'
          ]
        }
      ],
      rulesAndLimits: [
        'If a party buys from you AND sells to you, select "Both (Customer & Vendor)".',
        'When posting vouchers for a "Both" party, you can toggle between their Customer (Receivable) and Vendor (Payable) account with 1 click!'
      ],
      proTips: [
        'Always provide a valid email address so VyaparSetu can automatically email payment receipts and invoice acknowledgments.'
      ]
    },
    advancedGuide: {
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
    businessUser: {
      whatIsIt: 'The Items directory manages all products, goods, and services that you sell or purchase. Stock levels update automatically whenever invoices or bills are created.',
      processesAndSteps: [
        {
          title: 'Item & Inventory Setup',
          steps: [
            'Click "+ Add Item" button.',
            'Enter Item Name, SKU/HSN Code, and Unit of Measure (Pcs, Kg, Box).',
            'Specify Selling Price, Purchase Price, and GST Tax Rate (e.g. 18%).',
            'Enter Opening Stock Quantity.',
            'Click "Save Item".'
          ]
        }
      ],
      rulesAndLimits: [
        'Items with opening stock automatically post Opening Inventory asset balance.',
        'Stock quantity decreases on Sales Invoices and increases on Purchase Bills.'
      ],
      proTips: [
        'Keep HSN/SAC codes updated for seamless GST return filing.'
      ]
    },
    advancedGuide: {
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
    businessUser: {
      whatIsIt: 'Create and manage tax invoices for your customers. VyaparSetu automatically calculates GST, posts double-entry vouchers, and emails receipt acknowledgments.',
      processesAndSteps: [
        {
          title: 'Creating Sales Invoices',
          steps: [
            'Click "+ Create Sales Invoice".',
            'Select Customer from dropdown (or add a new customer).',
            'Pick items, set quantities and discounts.',
            'Verify GST calculation (CGST + SGST or IGST).',
            'Click "Post Invoice".'
          ]
        }
      ],
      rulesAndLimits: [
        'Posted invoices automatically update Customer Receivable balance and Inventory stock.',
        'Tax rates are automatically determined based on Customer State vs Company State.'
      ],
      proTips: [
        'Use Smart Express Voucher mode if you received direct bank/cash payment for the sale.'
      ]
    },
    advancedGuide: {
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

  'payments': {
    id: 'payments',
    title: 'Payments & Bank Reconciliation',
    category: 'FINANCE & BANKING',
    icon: Landmark,
    businessUser: {
      whatIsIt: 'Manage bank payments, customer receipts, petty cash, and bank reconciliation statements (BRS).',
      processesAndSteps: [
        {
          title: 'Posting Payments & Reconciliation',
          steps: [
            'Click "+ New Manual Journal" or "Open Smart AI Accountant".',
            'Select action: Pay Vendor, Receive Customer, Withdraw Cash, or Deposit Cash.',
            'Pick Bank Account and Party Name.',
            'Enter Amount and click "Post Voucher".'
          ]
        }
      ],
      rulesAndLimits: [
        'Pure Cash / Petty cash transactions are excluded from Bank Reconciliation (BRS) so your bank statement stays 100% accurate.',
        'Vouchers preview exact financial impact before posting.'
      ],
      proTips: [
        'Use "Smart AI Accountant" to type natural prompts like "Paid 2000 cash for tea" or "Withdraw 5000 from HDFC cheque 45922".'
      ]
    },
    advancedGuide: {
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

export default function HelpSupportModal({ onClose, onPopout }: Props) {
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
    return 'purchases'; // Default fallback
  }, [location.pathname]);

  const [selectedScreen, setSelectedScreen] = useState<string>(currentScreenKey);
  const [modeDepth, setModeDepth] = useState<ModeDepth>('basic');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive AI Support Assistant Chat state
  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your VyaparSetu AI Support Assistant. Ask me any specific question about Purchase Bills, GST ITC, Bank Payments, or Accounting rules!',
      time: 'Just now'
    }
  ]);

  const activeContent = HELP_DATABASE[selectedScreen] || HELP_DATABASE['purchases'];
  const ActiveIcon = activeContent.icon;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return Object.values(HELP_DATABASE);
    const q = searchQuery.toLowerCase();
    return Object.values(HELP_DATABASE).filter(h => 
      h.title.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q) ||
      h.businessUser.whatIsIt.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // AI Agent Answer Resolver with High-Precision Intent Matching
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
      botResponse = `Regarding your query "${q}": In VyaparSetu, all transactions in the ${activeContent.title} module adhere strictly to Double-Entry GST accounting rules. You can use the action buttons at the top of the screen or type a specific keyword like "edit invoice", "claim ITC", or "wrong bill" for detailed steps. You can also reach our support desk at Toll-Free 1800-8927-2738.`;
    }

    setChatHistory(prev => [...prev, userMsg, { sender: 'agent', text: botResponse, time: timeStr }]);
    setAiQuestion('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 1060, height: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fade-in 0.2s' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={24}/>
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>VyaparSetu Help &amp; Support Knowledge Base</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Official Screen Workflows &amp; Business Process Documentation</div>
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
                🟢 Business User Guide
              </button>
              <button
                type="button"
                onClick={() => setModeDepth('deep')}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: modeDepth === 'deep' ? '#6C47FF' : 'transparent', color: modeDepth === 'deep' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🎓 Advanced Accounting &amp; Process Guide
              </button>
            </div>

            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}>✕</button>
          </div>
        </div>

        {/* Modal Main Body Grid (Sidebar + Content) */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          
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
              Select Module Guide:
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
                      border: `1.5px solid ${isSelected ? '#10B981' : 'transparent'}`,
                      background: isSelected ? 'rgba(16,185,129,0.08)' : 'transparent',
                      color: isSelected ? '#10B981' : 'var(--text-primary)',
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

            {/* ════════════════════════════════════════════════════════════════
               VYAPARSETU AI SUPPORT ASSISTANT BOT (LEFT SIDEBAR LOCATION)
               ════════════════════════════════════════════════════════════════ */}
            <div style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.06) 0%, rgba(16,185,129,0.06) 100%)', border: '1.5px solid var(--brand-primary)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bot size={18} style={{ color: 'var(--brand-primary)' }}/>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>AI Support Agent</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: 4 }}>● Live</span>
                  {onPopout && (
                    <button
                      type="button"
                      onClick={onPopout}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--brand-primary)', background: 'var(--brand-primary)', color: '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Popout chat into a floating corner widget"
                    >
                      ↗️ Popout
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Message Stream */}
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-card)', borderRadius: 8, padding: 8, border: '1px solid var(--border-subtle)' }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{msg.sender === 'user' ? 'You' : 'Agent'} · {msg.time}</div>
                    <div style={{ background: msg.sender === 'user' ? 'var(--brand-primary)' : 'var(--bg-elevated)', color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, maxWidth: '90%', border: msg.sender === 'agent' ? '1px solid var(--border-default)' : 'none', lineHeight: 1.4 }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Suggestions */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleAskAi('i have posted wrong invoice, what i need to do')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', cursor: 'pointer' }}>
                  🚨 Posted wrong invoice?
                </button>
                <button type="button" onClick={() => handleAskAi('How to record debit note for returned goods?')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--brand-primary)', cursor: 'pointer' }}>
                  💡 Debit Note?
                </button>
                <button type="button" onClick={() => handleAskAi('How to claim ITC for GST on purchase bills?')} style={{ fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--brand-primary)', cursor: 'pointer' }}>
                  💡 Claim ITC?
                </button>
              </div>

              {/* Prompt Input Form */}
              <form onSubmit={e => { e.preventDefault(); handleAskAi(); }} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Ask AI Support Agent..."
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1.5px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}
                />
                <button type="submit" style={{ padding: '7px 12px', borderRadius: 6, background: 'linear-gradient(135deg, #6C47FF 0%, #3B82F6 100%)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Send size={12}/> Send
                </button>
              </form>
            </div>
          </div>

          {/* Right Topic Details & Support Agent Body */}
          <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg-card)' }}>
            
            {/* Topic Header Card */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActiveIcon size={24}/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeContent.category} MODULE</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{activeContent.title} Guide</h2>
              </div>
            </div>

            {/* Mode Content Render */}
            {modeDepth === 'basic' ? (
              /* ════════════════════════════════════════════════════════════════
                 BUSINESS USER GUIDE
                 ════════════════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Module Overview */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 18 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10B981', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💡 Module Overview &amp; Purpose:
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    {activeContent.businessUser.whatIsIt}
                  </p>
                </div>

                {/* Workflow Processes & Steps */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    📌 Official Process Steps &amp; Workflows:
                  </h4>
                  {activeContent.businessUser.processesAndSteps.map((proc, pIdx) => (
                    <div key={pIdx} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 14, border: '1px solid var(--border-default)' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginBottom: 8 }}>{proc.title}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {proc.steps.map((step, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sIdx + 1}</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rules & System Safety */}
                <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 12, padding: 18, border: '1.5px solid rgba(239,68,68,0.2)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#F87171', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={18}/> Rules &amp; Safety Guidelines for Business Users:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.businessUser.rulesAndLimits.map((rule, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tips */}
                <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 12, padding: 18, border: '1.5px solid rgba(59,130,246,0.2)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18}/> Business Best Practices:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.businessUser.proTips.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ) : (
              /* ════════════════════════════════════════════════════════════════
                 ADVANCED ACCOUNTING & PROCESS GUIDE
                 ════════════════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ background: 'rgba(108,71,255,0.08)', borderRadius: 12, padding: 18, border: '1.5px solid var(--brand-primary)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-primary)', margin: '0 0 6px 0' }}>
                    ⚙️ Technical Architecture &amp; System Flow:
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontFamily: 'monospace' }}>
                    {activeContent.advancedGuide.technicalArch}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                    📊 Chart of Accounts GL Mapping Rules:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeContent.advancedGuide.coaGLMapping.map((item, idx) => (
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
                    {activeContent.advancedGuide.controlFlow.map((item, idx) => (
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
                    {activeContent.advancedGuide.auditTrail}
                  </p>
                </div>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
               CONTACT VYAPARSETU SUPPORT & HELPDESK CARD
               ════════════════════════════════════════════════════════════════ */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, border: '1.5px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} style={{ color: '#10B981' }}/> Contact VyaparSetu Official Support &amp; Helpdesk:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Toll-Free Hotline</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginTop: 2 }}>1800-8927-2738</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>(1800-VYAPAR-SETU)</div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Email Support</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2 }}>support@vyaparsetu.in</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>helpdesk@vyaparsetu.in</div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Support Hours</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>Mon – Sat (9 AM – 8 PM)</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Dedicated Enterprise Account Manager</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
