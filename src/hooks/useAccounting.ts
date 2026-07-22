/**
 * useAccounting.ts
 * Central accounting data layer — all data in localStorage, zero hardcoding.
 * Provides: Chart of Accounts, Sales Invoices, Purchase Invoices, Debit Notes,
 *           Journal Entries (auto-generated), General Ledger, Trial Balance.
 * v2 additions:
 *   • PurchaseInvoice type + full CRUD with JE auto-generation
 *   • Sales ↔ Purchase invoice linking (bidirectional)
 *   • getPartyLedger() — running balance per party
 *   • getAgeing() — 0-30/31-60/61-90/90+ day buckets
 *   • getMarginReport() — per SI: revenue, cost, DN, margin
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
  linkedPurchaseInvoiceId?: string;   // ← NEW: link to purchase invoice
  status: 'draft' | 'posted';
  createdAt: string;
}

// ── Purchase Invoice ─────────────────────────────────────────────
export interface PurchaseInvoiceItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  vendorName: string;
  vendorGstin?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  gstTotal: number;
  netTotal: number;
  linkedSalesInvoiceId?: string;      // ← link to sales invoice
  remarks?: string;
  status: 'posted';
  createdAt: string;
}

export interface DebitNoteItem {
  id: string;
  reason: string;
  qty?: number;
  rate?: number;
  amount: number;
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
  party: string;
  items: DebitNoteItem[];
  subtotal: number;
  totalGst: number;
  netTotal: number;
  remarks?: string;
  linkedPurchaseDnId?: string;
  status: 'posted';
  createdAt: string;
}

export interface JournalLine {
  account: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  entryType: string;
  relatedId: string;
  relatedNo: string;
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
  balance: number;
}

export interface TrialBalanceRow {
  account: string;
  accountCode: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

// ── Report types ─────────────────────────────────────────────────
export interface PartyLedgerRow {
  date: string;
  entryType: string;
  refNo: string;
  debit: number;
  credit: number;
  runningBalance: number;
  jeId: string;
}

export interface AgeingRow {
  party: string;
  current: number;   // 0-30 days
  days31: number;    // 31-60
  days61: number;    // 61-90
  days90: number;    // 90+
  total: number;
  oldestDate: string;
}

export interface MarginRow {
  salesInvoiceId: string;
  invoiceNo: string;
  date: string;
  customer: string;
  saleSubtotal: number;      // taxable sale value
  saleDnDeducted: number;    // sales DN subtotals raised against this SI
  netRevenue: number;        // saleSubtotal - saleDnDeducted
  purchaseCost: number;      // linked PI subtotal (0 if not linked)
  purchaseDnRecovered: number; // purchase DN subtotals linked
  netCost: number;           // purchaseCost - purchaseDnRecovered
  grossMargin: number;       // netRevenue - netCost
  marginPct: number;         // grossMargin / saleSubtotal * 100
  linkedPurchaseInvoiceNo?: string;
}

// ────────────────────────────────────────────────────────────────
//  Default Chart of Accounts
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

// ── Seed purchase invoices (migrate from old mock data on first load) ──
const SEED_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'pi-seed-1', invoiceNo: 'INV-2026-042', date: '2026-04-20',
    vendorName: 'Sharma Traders', vendorGstin: '',
    items: [{ id: 'pii-1', description: 'Goods', qty: 1, rate: 45000, amount: 45000, gstRate: 5, gstAmount: 2250, total: 47250 }],
    subtotal: 45000, gstTotal: 2250, netTotal: 47250,
    status: 'posted', createdAt: '2026-04-20T00:00:00Z',
  },
  {
    id: 'pi-seed-2', invoiceNo: 'TSI-APR-05', date: '2026-04-18',
    vendorName: 'Tech Solutions India', vendorGstin: '',
    items: [{ id: 'pii-2', description: 'Services', qty: 1, rate: 89000, amount: 89000, gstRate: 18, gstAmount: 16020, total: 105020 }],
    subtotal: 89000, gstTotal: 16020, netTotal: 105020,
    status: 'posted', createdAt: '2026-04-18T00:00:00Z',
  },
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
//  GST account name helper
// ────────────────────────────────────────────────────────────────
function gstAccountName(rate: number, side: 'Input' | 'Output'): string {
  return `${side} GST ${rate}%`;
}

// ────────────────────────────────────────────────────────────────
//  Journal Entry builders
// ────────────────────────────────────────────────────────────────
function buildSalesInvoiceJE(inv: SalesInvoice): JournalEntry {
  const lines: JournalLine[] = [];
  lines.push({ account: 'Accounts Receivable', debit: inv.netTotal, credit: 0 });
  const salesByRate = new Map<number, number>();
  const gstByRate   = new Map<number, number>();
  for (const item of inv.items) {
    salesByRate.set(item.gstRate, (salesByRate.get(item.gstRate) ?? 0) + item.amount);
    gstByRate.set(item.gstRate,   (gstByRate.get(item.gstRate)   ?? 0) + item.gstAmount);
  }
  salesByRate.forEach(amt => lines.push({ account: 'Sales', debit: 0, credit: amt }));
  gstByRate.forEach((amt, rate) => lines.push({ account: gstAccountName(rate, 'Output'), debit: 0, credit: amt }));
  return { id: uid(), date: inv.date, entryType: 'Sales Invoice', relatedId: inv.id, relatedNo: inv.invoiceNo, party: inv.customer, lines, createdAt: new Date().toISOString() };
}

function buildSalesDNJE(dn: DebitNote): JournalEntry {
  const lines: JournalLine[] = [];
  const gstByRate = new Map<number, number>();
  let subtotal = 0;
  for (const item of dn.items) {
    gstByRate.set(item.gstRate, (gstByRate.get(item.gstRate) ?? 0) + item.gstAmount);
    subtotal += item.amount;
  }
  lines.push({ account: 'Sales Returns', debit: subtotal, credit: 0 });
  gstByRate.forEach((amt, rate) => lines.push({ account: gstAccountName(rate, 'Output'), debit: amt, credit: 0 }));
  lines.push({ account: 'Accounts Receivable', debit: 0, credit: dn.netTotal });
  return { id: uid(), date: dn.date, entryType: 'Sales Debit Note', relatedId: dn.id, relatedNo: dn.dnNo, party: dn.party, lines, createdAt: new Date().toISOString() };
}

function buildPurchaseInvoiceJE(p: PurchaseInvoice): JournalEntry {
  const lines: JournalLine[] = [];
  // Group by GST rate
  const purchByRate = new Map<number, number>();
  const gstByRate   = new Map<number, number>();
  for (const item of p.items) {
    purchByRate.set(item.gstRate, (purchByRate.get(item.gstRate) ?? 0) + item.amount);
    gstByRate.set(item.gstRate,   (gstByRate.get(item.gstRate)   ?? 0) + item.gstAmount);
  }
  purchByRate.forEach(amt => lines.push({ account: 'Purchases', debit: amt, credit: 0 }));
  gstByRate.forEach((amt, rate) => lines.push({ account: gstAccountName(rate, 'Input'), debit: amt, credit: 0 }));
  lines.push({ account: 'Accounts Payable', debit: 0, credit: p.netTotal });
  return { id: uid(), date: p.date, entryType: 'Purchase Invoice', relatedId: p.id, relatedNo: p.invoiceNo, party: p.vendorName, lines, createdAt: new Date().toISOString() };
}

function buildPurchaseDNJE(dn: DebitNote): JournalEntry {
  const lines: JournalLine[] = [];
  const gstByRate = new Map<number, number>();
  let subtotal = 0;
  for (const item of dn.items) {
    gstByRate.set(item.gstRate, (gstByRate.get(item.gstRate) ?? 0) + item.gstAmount);
    subtotal += item.amount;
  }
  lines.push({ account: 'Accounts Payable', debit: dn.netTotal, credit: 0 });
  lines.push({ account: 'Purchase Returns', debit: 0, credit: subtotal });
  gstByRate.forEach((amt, rate) => lines.push({ account: gstAccountName(rate, 'Input'), debit: 0, credit: amt }));
  return { id: uid(), date: dn.date, entryType: 'Purchase Debit Note', relatedId: dn.id, relatedNo: dn.dnNo, party: dn.party, lines, createdAt: new Date().toISOString() };
}

// ────────────────────────────────────────────────────────────────
//  Hook
// ────────────────────────────────────────────────────────────────
export function useAccounting() {
  const [coa, setCoaState] = useState<Account[]>(() => {
    const stored = load<Account[]>('vs_coa', []);
    if (stored.length === 0) { save('vs_coa', DEFAULT_COA); return DEFAULT_COA; }
    return stored;
  });

  const [salesInvoices, setSIState]     = useState<SalesInvoice[]>(() => load('vs_sales', []));
  const [purchaseInvoices, setPIState]  = useState<PurchaseInvoice[]>(() => {
    const stored = load<PurchaseInvoice[]>('vs_purchases', []);
    // Seed mock data on first load
    if (stored.length === 0) {
      save('vs_purchases', SEED_PURCHASES);
      return SEED_PURCHASES;
    }
    return stored;
  });
  const [debitNotes, setDNState]        = useState<DebitNote[]>(() => load('vs_debit_notes', []));
  const [journalEntries, setJEState]    = useState<JournalEntry[]>(() => load('vs_journal', []));

  // ── COA CRUD ──────────────────────────────────────────────────
  const saveCoa = useCallback((accounts: Account[]) => {
    setCoaState(accounts); save('vs_coa', accounts);
  }, []);

  const addAccount = useCallback((acct: Omit<Account, 'id'>) => {
    setCoaState(prev => { const next = [...prev, acct]; save('vs_coa', next); return next; });
  }, []);

  const updateAccount = useCallback((code: string, updates: Partial<Account>) => {
    setCoaState(prev => { const next = prev.map(a => a.code === code ? { ...a, ...updates } : a); save('vs_coa', next); return next; });
  }, []);

  const deleteAccount = useCallback((code: string) => {
    setCoaState(prev => { const next = prev.filter(a => a.code !== code); save('vs_coa', next); return next; });
  }, []);

  // ── Journal Entry helpers ─────────────────────────────────────
  const appendJE = useCallback((je: JournalEntry) => {
    setJEState(prev => { const next = [je, ...prev]; save('vs_journal', next); return next; });
  }, []);

  const appendJEs = useCallback((jes: JournalEntry[]) => {
    setJEState(prev => { const next = [...jes, ...prev]; save('vs_journal', next); return next; });
  }, []);

  // ── Sales Invoice CRUD ────────────────────────────────────────
  const postSalesInvoice = useCallback((data: Omit<SalesInvoice, 'id' | 'status' | 'createdAt'>): SalesInvoice => {
    const inv: SalesInvoice = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setSIState(prev => { const next = [inv, ...prev]; save('vs_sales', next); return next; });
    appendJE(buildSalesInvoiceJE(inv));
    return inv;
  }, [appendJE]);

  const deleteSalesInvoice = useCallback((id: string) => {
    setSIState(prev => { const next = prev.filter(s => s.id !== id); save('vs_sales', next); return next; });
    setJEState(prev => { const next = prev.filter(je => !(je.relatedId === id && je.entryType === 'Sales Invoice')); save('vs_journal', next); return next; });
  }, []);

  // ── Purchase Invoice CRUD ─────────────────────────────────────
  const postPurchaseInvoice = useCallback((data: Omit<PurchaseInvoice, 'id' | 'status' | 'createdAt'>): PurchaseInvoice => {
    const inv: PurchaseInvoice = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setPIState(prev => { const next = [inv, ...prev]; save('vs_purchases', next); return next; });
    // Auto-generate JE (idempotent — check first)
    setJEState(prev => {
      const alreadyPosted = prev.some(j => j.relatedId === inv.id && j.entryType === 'Purchase Invoice');
      if (alreadyPosted) return prev;
      const je = buildPurchaseInvoiceJE(inv);
      const next = [je, ...prev]; save('vs_journal', next); return next;
    });
    return inv;
  }, []);

  const deletePurchaseInvoice = useCallback((id: string) => {
    setPIState(prev => { const next = prev.filter(p => p.id !== id); save('vs_purchases', next); return next; });
    setJEState(prev => { const next = prev.filter(je => !(je.relatedId === id && je.entryType === 'Purchase Invoice')); save('vs_journal', next); return next; });
  }, []);

  // ── Sales ↔ Purchase Linking ──────────────────────────────────
  const linkSalesToPurchase = useCallback((salesId: string, purchaseId: string | null) => {
    setSIState(prev => {
      const next = prev.map(s => s.id === salesId ? { ...s, linkedPurchaseInvoiceId: purchaseId ?? undefined } : s);
      save('vs_sales', next); return next;
    });
    setPIState(prev => {
      // Unlink any old SI that pointed to this PI
      let next = prev.map(p => p.linkedSalesInvoiceId === salesId ? { ...p, linkedSalesInvoiceId: undefined } : p);
      if (purchaseId) {
        next = next.map(p => p.id === purchaseId ? { ...p, linkedSalesInvoiceId: salesId } : p);
      }
      save('vs_purchases', next); return next;
    });
  }, []);

  // ── Debit Note ────────────────────────────────────────────────
  const postDebitNote = useCallback((data: Omit<DebitNote, 'id' | 'status' | 'createdAt'>): DebitNote => {
    const dn: DebitNote = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setDNState(prev => { const next = [dn, ...prev]; save('vs_debit_notes', next); return next; });
    const je = dn.type === 'Sales' ? buildSalesDNJE(dn) : buildPurchaseDNJE(dn);
    appendJE(je);
    return dn;
  }, [appendJE]);

  const postDebitNotePair = useCallback((
    salesDN: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'>,
    purchaseDN?: Omit<DebitNote, 'id' | 'status' | 'createdAt' | 'linkedPurchaseDnId'>,
  ): { salesDn: DebitNote; purchaseDn?: DebitNote } => {
    const salesId    = uid();
    const purchaseId = purchaseDN ? uid() : undefined;
    const salesDnFull: DebitNote    = { ...salesDN, id: salesId, status: 'posted', linkedPurchaseDnId: purchaseId, createdAt: new Date().toISOString() };
    const purchaseDnFull: DebitNote | undefined = purchaseDN
      ? { ...purchaseDN, id: purchaseId!, status: 'posted', createdAt: new Date().toISOString() }
      : undefined;
    setDNState(prev => {
      const next = purchaseDnFull ? [salesDnFull, purchaseDnFull, ...prev] : [salesDnFull, ...prev];
      save('vs_debit_notes', next); return next;
    });
    const jes: JournalEntry[] = [buildSalesDNJE(salesDnFull)];
    if (purchaseDnFull) jes.push(buildPurchaseDNJE(purchaseDnFull));
    appendJEs(jes);
    return { salesDn: salesDnFull, purchaseDn: purchaseDnFull };
  }, [appendJEs]);

  /** Keep for backward compat with wizard */
  const postPurchaseInvoiceJE = useCallback((p: {
    id: string; invoiceNo: string; date: string; vendorName: string;
    subtotal: number; gstTotal: number; netTotal: number; gstRate?: number;
  }) => {
    setJEState(prev => {
      const alreadyPosted = prev.some(j => j.relatedId === p.id && j.entryType === 'Purchase Invoice');
      if (alreadyPosted) return prev;
      const rate = p.gstRate ?? 5;
      const fakePi: PurchaseInvoice = {
        id: p.id, invoiceNo: p.invoiceNo, date: p.date, vendorName: p.vendorName,
        items: [{ id: 'x', description: 'Purchase', qty: 1, rate: p.subtotal, amount: p.subtotal, gstRate: rate, gstAmount: p.gstTotal, total: p.netTotal }],
        subtotal: p.subtotal, gstTotal: p.gstTotal, netTotal: p.netTotal,
        status: 'posted', createdAt: new Date().toISOString(),
      };
      const je = buildPurchaseInvoiceJE(fakePi);
      const next = [je, ...prev]; save('vs_journal', next); return next;
    });
  }, []);

  // ── General Ledger ────────────────────────────────────────────
  const getGeneralLedger = useCallback((): GLAccount[] => {
    const currentCoa = load<Account[]>('vs_coa', DEFAULT_COA);
    const currentJEs = load<JournalEntry[]>('vs_journal', []);
    return currentCoa.map(acct => {
      let totalDebit = 0, totalCredit = 0;
      for (const je of currentJEs)
        for (const line of je.lines)
          if (line.account === acct.name) { totalDebit += line.debit; totalCredit += line.credit; }
      return { account: acct.name, accountCode: acct.code, accountType: acct.type, totalDebit, totalCredit, balance: totalDebit - totalCredit };
    }).filter(a => a.totalDebit > 0 || a.totalCredit > 0);
  }, []);

  const getAccountLedger = useCallback((accountName: string) => {
    const currentJEs = load<JournalEntry[]>('vs_journal', []);
    const rows: Array<JournalEntry & { line: JournalLine; runningBalance: number }> = [];
    let running = 0;
    const sorted = [...currentJEs].sort((a, b) => a.date.localeCompare(b.date));
    for (const je of sorted)
      for (const line of je.lines)
        if (line.account === accountName) { running += line.debit - line.credit; rows.push({ ...je, line, runningBalance: running }); }
    return rows;
  }, []);

  // ── Trial Balance ─────────────────────────────────────────────
  const getTrialBalance = useCallback((): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean } => {
    const gl = getGeneralLedger();
    const rows: TrialBalanceRow[] = gl.map(a => ({
      account: a.account, accountCode: a.accountCode, accountType: a.accountType,
      debit: a.balance > 0 ? a.balance : 0, credit: a.balance < 0 ? -a.balance : 0,
    }));
    const totalDebit  = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [getGeneralLedger]);

  // ── Party Ledger ──────────────────────────────────────────────
  const getPartyLedger = useCallback((partyName: string, fromDate?: string, toDate?: string): PartyLedgerRow[] => {
    const currentJEs = load<JournalEntry[]>('vs_journal', []);
    const rows: PartyLedgerRow[] = [];
    let running = 0;
    const sorted = [...currentJEs]
      .filter(je => je.party.toLowerCase() === partyName.toLowerCase())
      .filter(je => (!fromDate || je.date >= fromDate) && (!toDate || je.date <= toDate))
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const je of sorted) {
      // Net debit / credit for this party in this JE
      let debit = 0, credit = 0;
      for (const line of je.lines) { debit += line.debit; credit += line.credit; }
      running += debit - credit;
      rows.push({ date: je.date, entryType: je.entryType, refNo: je.relatedNo, debit, credit, runningBalance: running, jeId: je.id });
    }
    return rows;
  }, []);

  // ── Ageing Report ─────────────────────────────────────────────
  const getAgeing = useCallback((type: 'customer' | 'vendor', asOf?: string): AgeingRow[] => {
    const today = asOf ? new Date(asOf) : new Date();
    const daysDiff = (dateStr: string) => Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000);

    if (type === 'customer') {
      const sis  = load<SalesInvoice[]>('vs_sales', []);
      const dns  = load<DebitNote[]>('vs_debit_notes', []);
      const map  = new Map<string, AgeingRow>();
      for (const si of sis) {
        if (!map.has(si.customer))
          map.set(si.customer, { party: si.customer, current: 0, days31: 0, days61: 0, days90: 0, total: 0, oldestDate: si.date });
        const row    = map.get(si.customer)!;
        // Outstanding = net total minus sales DNs raised
        const dnAmt  = dns.filter(d => d.type === 'Sales' && d.relatedInvoiceId === si.id).reduce((s, d) => s + d.netTotal, 0);
        const outstanding = Math.max(0, si.netTotal - dnAmt);
        const age = daysDiff(si.date);
        if (age <= 30)      row.current += outstanding;
        else if (age <= 60) row.days31  += outstanding;
        else if (age <= 90) row.days61  += outstanding;
        else                row.days90  += outstanding;
        row.total += outstanding;
        if (si.date < row.oldestDate) row.oldestDate = si.date;
      }
      return Array.from(map.values()).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    } else {
      const pis  = load<PurchaseInvoice[]>('vs_purchases', []);
      const dns  = load<DebitNote[]>('vs_debit_notes', []);
      const map  = new Map<string, AgeingRow>();
      for (const pi of pis) {
        if (!map.has(pi.vendorName))
          map.set(pi.vendorName, { party: pi.vendorName, current: 0, days31: 0, days61: 0, days90: 0, total: 0, oldestDate: pi.date });
        const row    = map.get(pi.vendorName)!;
        const dnAmt  = dns.filter(d => d.type === 'Purchase' && d.relatedInvoiceId === pi.id).reduce((s, d) => s + d.netTotal, 0);
        const outstanding = Math.max(0, pi.netTotal - dnAmt);
        const age = daysDiff(pi.date);
        if (age <= 30)      row.current += outstanding;
        else if (age <= 60) row.days31  += outstanding;
        else if (age <= 90) row.days61  += outstanding;
        else                row.days90  += outstanding;
        row.total += outstanding;
        if (pi.date < row.oldestDate) row.oldestDate = pi.date;
      }
      return Array.from(map.values()).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    }
  }, []);

  // ── Margin Report ─────────────────────────────────────────────
  const getMarginReport = useCallback((): MarginRow[] => {
    const sis  = load<SalesInvoice[]>('vs_sales', []);
    const pis  = load<PurchaseInvoice[]>('vs_purchases', []);
    const dns  = load<DebitNote[]>('vs_debit_notes', []);
    return sis.map(si => {
      // Sales DNs raised against this SI
      const salesDNs     = dns.filter(d => d.type === 'Sales'    && d.relatedInvoiceId === si.id);
      const saleDnAmt    = salesDNs.reduce((s, d) => s + d.subtotal, 0);
      const netRevenue   = si.subtotal - saleDnAmt;
      // Linked Purchase Invoice
      const linkedPI     = pis.find(p => p.id === si.linkedPurchaseInvoiceId || p.linkedSalesInvoiceId === si.id);
      const purchaseCost = linkedPI ? linkedPI.subtotal : 0;
      // Purchase DNs for the linked PI
      const purchDNs     = linkedPI ? dns.filter(d => d.type === 'Purchase' && d.relatedInvoiceId === linkedPI.id) : [];
      const purchDnAmt   = purchDNs.reduce((s, d) => s + d.subtotal, 0);
      const netCost      = purchaseCost - purchDnAmt;
      const grossMargin  = netRevenue - netCost;
      const marginPct    = si.subtotal > 0 ? (grossMargin / si.subtotal) * 100 : 0;
      return {
        salesInvoiceId: si.id, invoiceNo: si.invoiceNo, date: si.date, customer: si.customer,
        saleSubtotal: si.subtotal, saleDnDeducted: saleDnAmt, netRevenue,
        purchaseCost, purchaseDnRecovered: purchDnAmt, netCost,
        grossMargin, marginPct: parseFloat(marginPct.toFixed(2)),
        linkedPurchaseInvoiceNo: linkedPI?.invoiceNo,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  // ── Auto-number helpers ───────────────────────────────────────
  const nextSalesInvoiceNo = useCallback((): string => {
    const sis = load<SalesInvoice[]>('vs_sales', []);
    const y = new Date().getFullYear(), m = String(new Date().getMonth() + 1).padStart(2, '0');
    const seq = sis.filter(s => s.invoiceNo.startsWith(`SI-${y}-${m}`)).length + 1;
    return `SI-${y}-${m}-${String(seq).padStart(3, '0')}`;
  }, []);

  const nextPurchaseInvoiceNo = useCallback((): string => {
    const pis = load<PurchaseInvoice[]>('vs_purchases', []);
    const y = new Date().getFullYear(), m = String(new Date().getMonth() + 1).padStart(2, '0');
    const seq = pis.filter(p => p.invoiceNo.startsWith(`PI-${y}-${m}`)).length + 1;
    return `PI-${y}-${m}-${String(seq).padStart(3, '0')}`;
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
    coa, salesInvoices, purchaseInvoices, debitNotes, journalEntries,
    // COA
    saveCoa, addAccount, updateAccount, deleteAccount,
    // Transactions
    postSalesInvoice, deleteSalesInvoice,
    postPurchaseInvoice, deletePurchaseInvoice,
    postDebitNote, postDebitNotePair,
    postPurchaseInvoiceJE,  // backward compat
    linkSalesToPurchase,
    // Reports
    getGeneralLedger, getAccountLedger, getTrialBalance,
    getPartyLedger, getAgeing, getMarginReport,
    // Helpers
    nextSalesInvoiceNo, nextPurchaseInvoiceNo, nextDnNo,
    // Constants
    DEFAULT_COA,
  };
}
