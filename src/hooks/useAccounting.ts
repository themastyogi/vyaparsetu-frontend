/**
 * useAccounting.ts
 * Central accounting data layer — all data in localStorage, zero hardcoding.
 * Provides: Chart of Accounts, Sales Invoices, Purchase Invoices, Debit Notes,
 *           Journal Entries (auto-generated), General Ledger, Trial Balance.
 */
import { useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────────
export type AccountType = 'Asset' | 'Liability' | 'Income' | 'Expense';

export interface Account {
  code: string;
  name: string;
  type: AccountType;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;      // qty * rate
  gstRate: number;     // percentage e.g. 5
  gstAmount: number;   // amount * gstRate/100
  total: number;       // amount + gstAmount
}

export interface SalesInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  netTotal: number;
  remarks?: string;
  status: 'draft' | 'posted';
  createdAt: string;
}

export interface DebitNoteItem {
  id: string;
  reason: string;      // Moisture / Reject / B Grade / Custom
  qty?: number;
  rate?: number;
  amount: number;      // if qty/rate provided: qty*rate, else manual
  gstRate: number;
  gstAmount: number;
  total: number;
}

export type DebitNoteType = 'Sales' | 'Purchase';

export interface DebitNote {
  id: string;
  type: DebitNoteType;
  dnNo: string;
  date: string;
  relatedInvoiceId: string;
  relatedInvoiceNo: string;
  party: string;             // customer (Sales) or vendor (Purchase)
  items: DebitNoteItem[];
  subtotal: number;
  totalGst: number;
  netTotal: number;
  remarks?: string;
  linkedPurchaseDnId?: string;   // if vendor debit note raised simultaneously
  status: 'posted';
  createdAt: string;
}

export interface JournalLine {
  account: string;   // account name
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  entryType: string;           // e.g. "Sales Invoice", "Purchase Debit Note"
  relatedId: string;           // invoice/debit-note id
  relatedNo: string;           // human-readable ref number
  party: string;
  lines: JournalLine[];
  createdAt: string;
}

export interface GLAccount {
  account: string;
  accountCode: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  balance: number;   // totalDebit - totalCredit
}

export interface TrialBalanceRow {
  account: string;
  accountCode: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

// ────────────────────────────────────────────────────────────────
//  Default Chart of Accounts (seeded once, user can add/edit)
// ────────────────────────────────────────────────────────────────
const DEFAULT_COA: Account[] = [
  { code: '1000', name: 'Accounts Receivable', type: 'Asset' },
  { code: '1100', name: 'Cash & Bank',          type: 'Asset' },
  { code: '1200', name: 'Input GST 5%',         type: 'Asset' },
  { code: '1210', name: 'Input GST 12%',        type: 'Asset' },
  { code: '1220', name: 'Input GST 18%',        type: 'Asset' },
  { code: '2000', name: 'Sales',                type: 'Income' },
  { code: '2100', name: 'Sales Returns',        type: 'Income' },
  { code: '2200', name: 'Output GST 5%',        type: 'Liability' },
  { code: '2210', name: 'Output GST 12%',       type: 'Liability' },
  { code: '2220', name: 'Output GST 18%',       type: 'Liability' },
  { code: '3000', name: 'Purchases',            type: 'Expense' },
  { code: '3100', name: 'Purchase Returns',     type: 'Expense' },
  { code: '4000', name: 'Accounts Payable',     type: 'Liability' },
  { code: '5000', name: 'Freight & Charges',    type: 'Expense' },
  { code: '6000', name: 'Other Income',         type: 'Income' },
];

// ────────────────────────────────────────────────────────────────
//  Storage helpers
// ────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ────────────────────────────────────────────────────────────────
//  GST account name helper (dynamic, from COA)
// ────────────────────────────────────────────────────────────────
function gstAccountName(rate: number, side: 'Input' | 'Output'): string {
  return `${side} GST ${rate}%`;
}

// ────────────────────────────────────────────────────────────────
//  Journal Entry builders (pure functions, no hardcoding)
// ────────────────────────────────────────────────────────────────
function buildSalesInvoiceJE(inv: SalesInvoice): JournalEntry {
  const lines: JournalLine[] = [];
  // Dr: Accounts Receivable (full net total)
  lines.push({ account: 'Accounts Receivable', debit: inv.netTotal, credit: 0 });
  // Cr: Sales (subtotal, split by GST rate if needed)
  const salesByRate = new Map<number, number>();
  for (const item of inv.items) {
    salesByRate.set(item.gstRate, (salesByRate.get(item.gstRate) ?? 0) + item.amount);
  }
  const gstByRate = new Map<number, number>();
  for (const item of inv.items) {
    gstByRate.set(item.gstRate, (gstByRate.get(item.gstRate) ?? 0) + item.gstAmount);
  }
  salesByRate.forEach((amt) => {
    lines.push({ account: 'Sales', debit: 0, credit: amt });
  });
  gstByRate.forEach((amt, rate) => {
    lines.push({ account: gstAccountName(rate, 'Output'), debit: 0, credit: amt });
  });
  return {
    id: uid(), date: inv.date, entryType: 'Sales Invoice',
    relatedId: inv.id, relatedNo: inv.invoiceNo, party: inv.customer,
    lines, createdAt: new Date().toISOString(),
  };
}

function buildSalesDNJE(dn: DebitNote): JournalEntry {
  const lines: JournalLine[] = [];
  const gstByRate = new Map<number, number>();
  let subtotal = 0;
  for (const item of dn.items) {
    gstByRate.set(item.gstRate, (gstByRate.get(item.gstRate) ?? 0) + item.gstAmount);
    subtotal += item.amount;
  }
  // Dr: Sales Returns (subtotal)
  lines.push({ account: 'Sales Returns', debit: subtotal, credit: 0 });
  // Dr: Output GST (reversed)
  gstByRate.forEach((amt, rate) => {
    lines.push({ account: gstAccountName(rate, 'Output'), debit: amt, credit: 0 });
  });
  // Cr: Accounts Receivable (net total)
  lines.push({ account: 'Accounts Receivable', debit: 0, credit: dn.netTotal });
  return {
    id: uid(), date: dn.date, entryType: 'Sales Debit Note',
    relatedId: dn.id, relatedNo: dn.dnNo, party: dn.party,
    lines, createdAt: new Date().toISOString(),
  };
}

function buildPurchaseInvoiceJE(p: {
  id: string; invoiceNo: string; date: string; vendorName: string;
  subtotal: number; gstTotal: number; netTotal: number; gstRate?: number;
}): JournalEntry {
  const rate = p.gstRate ?? 5;
  const lines: JournalLine[] = [
    { account: 'Purchases', debit: p.subtotal, credit: 0 },
    { account: gstAccountName(rate, 'Input'), debit: p.gstTotal, credit: 0 },
    { account: 'Accounts Payable', debit: 0, credit: p.netTotal },
  ];
  return {
    id: uid(), date: p.date, entryType: 'Purchase Invoice',
    relatedId: p.id, relatedNo: p.invoiceNo, party: p.vendorName,
    lines, createdAt: new Date().toISOString(),
  };
}

function buildPurchaseDNJE(dn: DebitNote): JournalEntry {
  const lines: JournalLine[] = [];
  const gstByRate = new Map<number, number>();
  let subtotal = 0;
  for (const item of dn.items) {
    gstByRate.set(item.gstRate, (gstByRate.get(item.gstRate) ?? 0) + item.gstAmount);
    subtotal += item.amount;
  }
  // Dr: Accounts Payable (net total)
  lines.push({ account: 'Accounts Payable', debit: dn.netTotal, credit: 0 });
  // Cr: Purchase Returns
  lines.push({ account: 'Purchase Returns', debit: 0, credit: subtotal });
  // Cr: Input GST (reversed)
  gstByRate.forEach((amt, rate) => {
    lines.push({ account: gstAccountName(rate, 'Input'), debit: 0, credit: amt });
  });
  return {
    id: uid(), date: dn.date, entryType: 'Purchase Debit Note',
    relatedId: dn.id, relatedNo: dn.dnNo, party: dn.party,
    lines, createdAt: new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────
//  Hook
// ────────────────────────────────────────────────────────────────
export function useAccounting() {
  const [coa, setCoaState]       = useState<Account[]>(() => {
    const stored = load<Account[]>('vs_coa', []);
    if (stored.length === 0) { save('vs_coa', DEFAULT_COA); return DEFAULT_COA; }
    return stored;
  });
  const [salesInvoices, setSIState]   = useState<SalesInvoice[]>(() => load('vs_sales', []));
  const [debitNotes, setDNState]       = useState<DebitNote[]>(() => load('vs_debit_notes', []));
  const [journalEntries, setJEState]   = useState<JournalEntry[]>(() => load('vs_journal', []));

  // ── COA CRUD ─────────────────────────────────────────────────
  const saveCoa = useCallback((accounts: Account[]) => {
    setCoaState(accounts);
    save('vs_coa', accounts);
  }, []);

  const addAccount = useCallback((acct: Omit<Account, 'id'>) => {
    setCoaState(prev => {
      const next = [...prev, acct];
      save('vs_coa', next);
      return next;
    });
  }, []);

  const updateAccount = useCallback((code: string, updates: Partial<Account>) => {
    setCoaState(prev => {
      const next = prev.map(a => a.code === code ? { ...a, ...updates } : a);
      save('vs_coa', next);
      return next;
    });
  }, []);

  const deleteAccount = useCallback((code: string) => {
    setCoaState(prev => {
      const next = prev.filter(a => a.code !== code);
      save('vs_coa', next);
      return next;
    });
  }, []);

  // ── POST Journal Entries ────────────────────────────────────
  const appendJE = useCallback((je: JournalEntry) => {
    setJEState(prev => {
      const next = [je, ...prev];
      save('vs_journal', next);
      return next;
    });
  }, []);

  const appendJEs = useCallback((jes: JournalEntry[]) => {
    setJEState(prev => {
      const next = [...jes, ...prev];
      save('vs_journal', next);
      return next;
    });
  }, []);

  // ── Sales Invoice CRUD ──────────────────────────────────────
  const postSalesInvoice = useCallback((data: Omit<SalesInvoice, 'id' | 'status' | 'createdAt'>): SalesInvoice => {
    const inv: SalesInvoice = {
      ...data,
      id: uid(),
      status: 'posted',
      createdAt: new Date().toISOString(),
    };
    setSIState(prev => {
      const next = [inv, ...prev];
      save('vs_sales', next);
      return next;
    });
    appendJE(buildSalesInvoiceJE(inv));
    return inv;
  }, [appendJE]);

  const deleteSalesInvoice = useCallback((id: string) => {
    setSIState(prev => {
      const next = prev.filter(s => s.id !== id);
      save('vs_sales', next);
      return next;
    });
    setJEState(prev => {
      const next = prev.filter(je => !(je.relatedId === id && je.entryType === 'Sales Invoice'));
      save('vs_journal', next);
      return next;
    });
  }, []);

  // ── Debit Note ─────────────────────────────────────────────
  const postDebitNote = useCallback((
    data: Omit<DebitNote, 'id' | 'status' | 'createdAt'>,
  ): DebitNote => {
    const dn: DebitNote = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setDNState(prev => {
      const next = [dn, ...prev];
      save('vs_debit_notes', next);
      return next;
    });
    const je = dn.type === 'Sales' ? buildSalesDNJE(dn) : buildPurchaseDNJE(dn);
    appendJE(je);
    return dn;
  }, [appendJE]);

  /**
   * Post a sales debit note AND (optionally) a purchase debit note in one call.
   * Returns both created objects.
   */
  const postDebitNotePair = useCallback((
    salesDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'>,
    purchaseDN?: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'>,
  ): { salesDn: DebitNote; purchaseDn?: DebitNote } => {
    const salesId = uid();
    const purchaseId = purchaseDN ? uid() : undefined;

    const salesDnFull: DebitNote = {
      ...salesDN, id: salesId, status: 'posted',
      linkedPurchaseDnId: purchaseId,
      createdAt: new Date().toISOString(),
    };
    const purchaseDnFull: DebitNote | undefined = purchaseDN
      ? { ...purchaseDN, id: purchaseId!, status: 'posted', createdAt: new Date().toISOString() }
      : undefined;

    setDNState(prev => {
      const next = purchaseDnFull
        ? [salesDnFull, purchaseDnFull, ...prev]
        : [salesDnFull, ...prev];
      save('vs_debit_notes', next);
      return next;
    });

    const jes: JournalEntry[] = [buildSalesDNJE(salesDnFull)];
    if (purchaseDnFull) jes.push(buildPurchaseDNJE(purchaseDnFull));
    appendJEs(jes);

    return { salesDn: salesDnFull, purchaseDn: purchaseDnFull };
  }, [appendJEs]);

  /**
   * Post a journal entry for an existing Purchase Invoice (from the Purchases module).
   * Idempotent — checks if JE already exists.
   */
  const postPurchaseInvoiceJE = useCallback((p: {
    id: string; invoiceNo: string; date: string; vendorName: string;
    subtotal: number; gstTotal: number; netTotal: number; gstRate?: number;
  }) => {
    setJEState(prev => {
      const alreadyPosted = prev.some(j => j.relatedId === p.id && j.entryType === 'Purchase Invoice');
      if (alreadyPosted) return prev;
      const je = buildPurchaseInvoiceJE(p);
      const next = [je, ...prev];
      save('vs_journal', next);
      return next;
    });
  }, []);

  // ── General Ledger ──────────────────────────────────────────
  const getGeneralLedger = useCallback((): GLAccount[] => {
    const currentCoa = load<Account[]>('vs_coa', DEFAULT_COA);
    const currentJEs = load<JournalEntry[]>('vs_journal', []);

    return currentCoa.map(acct => {
      let totalDebit = 0;
      let totalCredit = 0;
      for (const je of currentJEs) {
        for (const line of je.lines) {
          if (line.account === acct.name) {
            totalDebit  += line.debit;
            totalCredit += line.credit;
          }
        }
      }
      return {
        account: acct.name,
        accountCode: acct.code,
        accountType: acct.type,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
      };
    }).filter(a => a.totalDebit > 0 || a.totalCredit > 0); // only show active accounts
  }, []);

  /** All JE lines for a specific account (for GL drilldown) */
  const getAccountLedger = useCallback((accountName: string): Array<JournalEntry & { line: JournalLine; runningBalance: number }> => {
    const currentJEs = load<JournalEntry[]>('vs_journal', []);
    const rows: Array<JournalEntry & { line: JournalLine; runningBalance: number }> = [];
    let running = 0;
    const sorted = [...currentJEs].sort((a, b) => a.date.localeCompare(b.date));
    for (const je of sorted) {
      for (const line of je.lines) {
        if (line.account === accountName) {
          running += line.debit - line.credit;
          rows.push({ ...je, line, runningBalance: running });
        }
      }
    }
    return rows;
  }, []);

  // ── Trial Balance ───────────────────────────────────────────
  const getTrialBalance = useCallback((): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean } => {
    const gl = getGeneralLedger();
    const rows: TrialBalanceRow[] = gl.map(a => ({
      account: a.account,
      accountCode: a.accountCode,
      accountType: a.accountType,
      debit:  a.balance > 0 ? a.balance : 0,
      credit: a.balance < 0 ? -a.balance : 0,
    }));
    const totalDebit  = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [getGeneralLedger]);

  // ── Auto-number helpers ─────────────────────────────────────
  const nextSalesInvoiceNo = useCallback((): string => {
    const sis = load<SalesInvoice[]>('vs_sales', []);
    const y   = new Date().getFullYear();
    const m   = String(new Date().getMonth() + 1).padStart(2, '0');
    const seq = sis.filter(s => s.invoiceNo.startsWith(`SI-${y}-${m}`)).length + 1;
    return `SI-${y}-${m}-${String(seq).padStart(3, '0')}`;
  }, []);

  const nextDnNo = useCallback((type: 'Sales' | 'Purchase'): string => {
    const dns = load<DebitNote[]>('vs_debit_notes', []);
    const prefix = type === 'Sales' ? 'SDN' : 'PDN';
    const y = new Date().getFullYear();
    const seq = dns.filter(d => d.dnNo.startsWith(`${prefix}-${y}`)).length + 1;
    return `${prefix}-${y}-${String(seq).padStart(3, '0')}`;
  }, []);

  return {
    // Data
    coa, salesInvoices, debitNotes, journalEntries,
    // COA
    saveCoa, addAccount, updateAccount, deleteAccount,
    // Transactions
    postSalesInvoice, deleteSalesInvoice,
    postDebitNote, postDebitNotePair, postPurchaseInvoiceJE,
    // Reports
    getGeneralLedger, getAccountLedger, getTrialBalance,
    // Helpers
    nextSalesInvoiceNo, nextDnNo,
    // Constants
    DEFAULT_COA,
  };
}
