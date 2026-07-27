/**
 * useAccounting.ts  v3
 * Central accounting data layer — all data in localStorage, zero hardcoding.
 *
 * New in v3:
 *   • AccountType includes 'Equity'
 *   • Account has `group` (Balance Sheet / P&L categorisation)
 *   • Full 60-account Indian COA (1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Income, 5xxx COGS, 6xxx OpEx, 7xxx Finance)
 *   • getBalanceSheet()   — Assets / Liabilities / Equity with Net Profit
 *   • getProfitAndLoss()  — Revenue → Gross Profit → EBITDA → Net Profit
 *   • getCashFlow()       — Operating / Investing / Financing (indirect method)
 */
import { useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────────
export type AccountType = 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';

/** Group drives how the account appears in financial statements */
export type AccountGroup =
  // Assets
  | 'Current Assets' | 'Fixed Assets' | 'Other Assets'
  // Liabilities
  | 'Current Liabilities' | 'Long-term Liabilities'
  // Equity
  | 'Capital & Reserves'
  // Income
  | 'Revenue' | 'Other Income'
  // Expenses
  | 'Cost of Goods Sold' | 'Operating Expenses' | 'Finance Costs' | 'Depreciation';

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  group: AccountGroup;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
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
  linkedPurchaseInvoiceId?: string;
  status: 'draft' | 'posted';
  createdAt: string;
}

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
  linkedSalesInvoiceId?: string;
  remarks?: string;
  status: 'draft' | 'posted';
  source?: 'manual' | 'email';
  senderEmail?: string;
  receivedAt?: string;
  attachedFileName?: string;
  createdAt: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNo: string;
  date: string;
  type: 'Receipt' | 'Payment'; // Receipt = Customer Payment, Payment = Vendor Payment
  party: string;
  amount: number;
  bankAccount: string; // e.g. 'Bank Account' or 'Cash in Hand'
  reference?: string;   // Cheque no / UTR / Reference
  remarks?: string;
  status: 'posted';
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  companyGstin: string;
  inboundEmail: string;        // Purchase booking email configured by user
  googleConnected?: boolean;   // Official Google OAuth2 Connected Status
  googleConnectedEmail?: string; // Connected Google Account Email
  googleAccessToken?: string;  // OAuth2 Access Token
  googleRefreshToken?: string; // OAuth2 Refresh Token
  gmailAppPassword?: string;   // Google 16-char App Password (legacy fallback)
  imapHost?: string;           // imap.gmail.com
  geminiApiKey?: string;       // Google Gemini AI Agent API Key
  aiCreditsTotal?: number;     // Total AI Credits granted/purchased
  aiCreditsUsed?: number;      // Total AI Credits consumed
  aiCreditHistory?: Array<{ id: string; date: string; amount: number; description: string; type: 'grant' | 'usage' | 'purchase' }>;
  email?: string;              // Official company email
  phone?: string;              // Contact phone number
  address?: string;            // Full street address
  city?: string;               // City
  state?: string;              // State
  pincode?: string;            // Pincode
  autoDraft: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  accountType: 'Current' | 'Savings' | 'Overdraft' | 'Cash Credit';
  openingBalance: number;
  glAccountName: string;
  active: boolean;
}

export interface BankReconciliationRecord {
  id: string;
  bankAccountId: string;
  jeId: string;
  date: string;
  refNo: string;
  entryType: string;
  party: string;
  debit: number;
  credit: number;
  isCleared: boolean;
  clearedDate?: string;
  notes?: string;
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
  accountGroup: AccountGroup;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface TrialBalanceRow {
  account: string;
  accountCode: string;
  accountType: AccountType;
  accountGroup: AccountGroup;
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

export interface PartyLedgerResult {
  openingBalance: number;
  rows: PartyLedgerRow[];
  closingBalance: number;
}

export interface AgeingRow {
  party: string;
  current: number;
  days31: number;
  days61: number;
  days90: number;
  total: number;
  oldestDate: string;
}

export interface MarginRow {
  salesInvoiceId: string;
  invoiceNo: string;
  date: string;
  customer: string;
  saleSubtotal: number;
  saleDnDeducted: number;
  netRevenue: number;
  purchaseCost: number;
  purchaseDnRecovered: number;
  netCost: number;
  grossMargin: number;
  marginPct: number;
  linkedPurchaseInvoiceNo?: string;
}

// ── Financial Statement types ─────────────────────────────────────
export interface BSRow { code: string; name: string; group: AccountGroup; balance: number; }
export interface BSSection { group: AccountGroup; rows: BSRow[]; subtotal: number; }
export interface BalanceSheet {
  assetSections: BSSection[];
  totalAssets: number;
  liabilitySections: BSSection[];
  totalLiabilities: number;
  equitySections: BSSection[];
  netProfit: number;
  totalEquity: number;
  totalLiabilitiesEquity: number;
  balanced: boolean;
  asOf: string;
}

export interface PLRow { code: string; name: string; group: AccountGroup; amount: number; }
export interface ProfitAndLoss {
  revenue: PLRow[];
  totalRevenue: number;
  cogs: PLRow[];
  totalCOGS: number;
  grossProfit: number;
  grossMarginPct: number;
  opEx: PLRow[];
  totalOpEx: number;
  ebitda: number;
  otherIncome: PLRow[];
  totalOtherIncome: number;
  financeAndDepr: PLRow[];
  totalFinanceDepr: number;
  netProfit: number;
  netMarginPct: number;
  fromDate: string;
  toDate: string;
}

export interface CashFlowSection {
  label: string;
  items: { label: string; amount: number }[];
  total: number;
}
export interface CashFlow {
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  netChange: number;
  openingCash: number;
  closingCash: number;
}

// ────────────────────────────────────────────────────────────────
//  Default Chart of Accounts (comprehensive Indian business COA)
// ────────────────────────────────────────────────────────────────
export const DEFAULT_COA: Account[] = [
  // ── Current Assets ──────────────────────────────────────────
  { code: '1001', name: 'Cash in Hand',              type: 'Asset',     group: 'Current Assets' },
  { code: '1002', name: 'HDFC Bank - A/C 8234',       type: 'Asset',     group: 'Current Assets' },
  { code: '1003', name: 'ICICI Bank - A/C 7411',      type: 'Asset',     group: 'Current Assets' },
  { code: '1010', name: 'Accounts Receivable',       type: 'Asset',     group: 'Current Assets' },
  { code: '1020', name: 'Advance to Suppliers',      type: 'Asset',     group: 'Current Assets' },
  { code: '1030', name: 'Inventory / Stock',         type: 'Asset',     group: 'Current Assets' },
  { code: '1040', name: 'Prepaid Expenses',          type: 'Asset',     group: 'Current Assets' },
  { code: '1050', name: 'Input GST 5%',              type: 'Asset',     group: 'Current Assets' },
  { code: '1051', name: 'Input GST 12%',             type: 'Asset',     group: 'Current Assets' },
  { code: '1052', name: 'Input GST 18%',             type: 'Asset',     group: 'Current Assets' },
  { code: '1060', name: 'TDS Receivable',            type: 'Asset',     group: 'Current Assets' },
  { code: '1070', name: 'Security Deposits',         type: 'Asset',     group: 'Current Assets' },
  // ── Fixed Assets ─────────────────────────────────────────────
  { code: '1100', name: 'Land & Building',           type: 'Asset',     group: 'Fixed Assets' },
  { code: '1110', name: 'Plant & Machinery',         type: 'Asset',     group: 'Fixed Assets' },
  { code: '1120', name: 'Furniture & Fixtures',      type: 'Asset',     group: 'Fixed Assets' },
  { code: '1130', name: 'Computers & Equipment',     type: 'Asset',     group: 'Fixed Assets' },
  { code: '1140', name: 'Vehicles',                  type: 'Asset',     group: 'Fixed Assets' },
  { code: '1150', name: 'Accum. Depreciation',       type: 'Asset',     group: 'Fixed Assets' },
  // ── Other Assets ─────────────────────────────────────────────
  { code: '1200', name: 'Loans & Advances (LT)',     type: 'Asset',     group: 'Other Assets' },
  { code: '1210', name: 'Other Assets',              type: 'Asset',     group: 'Other Assets' },

  // ── Current Liabilities ───────────────────────────────────────
  { code: '2001', name: 'Accounts Payable',          type: 'Liability', group: 'Current Liabilities' },
  { code: '2010', name: 'Output GST 5%',             type: 'Liability', group: 'Current Liabilities' },
  { code: '2011', name: 'Output GST 12%',            type: 'Liability', group: 'Current Liabilities' },
  { code: '2012', name: 'Output GST 18%',            type: 'Liability', group: 'Current Liabilities' },
  { code: '2020', name: 'TDS Payable',               type: 'Liability', group: 'Current Liabilities' },
  { code: '2030', name: 'Advance from Customers',    type: 'Liability', group: 'Current Liabilities' },
  { code: '2040', name: 'Salary Payable',            type: 'Liability', group: 'Current Liabilities' },
  { code: '2050', name: 'Other Current Liabilities', type: 'Liability', group: 'Current Liabilities' },
  // ── Long-term Liabilities ─────────────────────────────────────
  { code: '2100', name: 'Bank Loan',                 type: 'Liability', group: 'Long-term Liabilities' },
  { code: '2110', name: 'Term Loan',                 type: 'Liability', group: 'Long-term Liabilities' },
  { code: '2120', name: 'Loan from Partners',        type: 'Liability', group: 'Long-term Liabilities' },

  // ── Equity / Capital ──────────────────────────────────────────
  { code: '3001', name: "Owner's Capital",           type: 'Equity',    group: 'Capital & Reserves' },
  { code: '3010', name: 'Retained Earnings',         type: 'Equity',    group: 'Capital & Reserves' },
  { code: '3020', name: 'Drawings',                  type: 'Equity',    group: 'Capital & Reserves' },
  { code: '3030', name: 'Partner Capital A',         type: 'Equity',    group: 'Capital & Reserves' },
  { code: '3031', name: 'Partner Capital B',         type: 'Equity',    group: 'Capital & Reserves' },

  // ── Revenue ───────────────────────────────────────────────────
  { code: '4001', name: 'Sales',                     type: 'Income',    group: 'Revenue' },
  { code: '4010', name: 'Sales Returns',             type: 'Income',    group: 'Revenue' },
  // ── Other Income ──────────────────────────────────────────────
  { code: '4100', name: 'Other Income',              type: 'Income',    group: 'Other Income' },
  { code: '4110', name: 'Interest Income',           type: 'Income',    group: 'Other Income' },
  { code: '4120', name: 'Commission Income',         type: 'Income',    group: 'Other Income' },
  { code: '4130', name: 'Discount Received',         type: 'Income',    group: 'Other Income' },

  // ── Cost of Goods Sold ────────────────────────────────────────
  { code: '5001', name: 'Purchases',                 type: 'Expense',   group: 'Cost of Goods Sold' },
  { code: '5010', name: 'Purchase Returns',          type: 'Expense',   group: 'Cost of Goods Sold' },
  { code: '5020', name: 'Freight Inward',            type: 'Expense',   group: 'Cost of Goods Sold' },
  { code: '5030', name: 'Custom Duty & Levies',      type: 'Expense',   group: 'Cost of Goods Sold' },
  { code: '5040', name: 'Labour / Job Work',         type: 'Expense',   group: 'Cost of Goods Sold' },

  // ── Operating Expenses ────────────────────────────────────────
  { code: '6001', name: 'Salaries & Wages',          type: 'Expense',   group: 'Operating Expenses' },
  { code: '6010', name: 'Rent',                      type: 'Expense',   group: 'Operating Expenses' },
  { code: '6020', name: 'Electricity & Utilities',   type: 'Expense',   group: 'Operating Expenses' },
  { code: '6030', name: 'Phone & Internet',          type: 'Expense',   group: 'Operating Expenses' },
  { code: '6040', name: 'Office Supplies',           type: 'Expense',   group: 'Operating Expenses' },
  { code: '6050', name: 'Printing & Stationery',     type: 'Expense',   group: 'Operating Expenses' },
  { code: '6060', name: 'Travel & Conveyance',       type: 'Expense',   group: 'Operating Expenses' },
  { code: '6070', name: 'Vehicles Expenses',         type: 'Expense',   group: 'Operating Expenses' },
  { code: '6080', name: 'Repairs & Maintenance',     type: 'Expense',   group: 'Operating Expenses' },
  { code: '6090', name: 'Insurance',                 type: 'Expense',   group: 'Operating Expenses' },
  { code: '6100', name: 'Advertisement & Marketing', type: 'Expense',   group: 'Operating Expenses' },
  { code: '6110', name: 'Audit & Legal Fees',        type: 'Expense',   group: 'Operating Expenses' },
  { code: '6120', name: 'Discount Allowed',          type: 'Expense',   group: 'Operating Expenses' },
  { code: '6130', name: 'Miscellaneous Expenses',    type: 'Expense',   group: 'Operating Expenses' },

  // ── Finance Costs & Depreciation ─────────────────────────────
  { code: '7001', name: 'Bank Charges',              type: 'Expense',   group: 'Finance Costs' },
  { code: '7010', name: 'Interest Expense',          type: 'Expense',   group: 'Finance Costs' },
  { code: '7020', name: 'Depreciation',              type: 'Expense',   group: 'Depreciation' },
];

// ── Seed purchase invoices ────────────────────────────────────────
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

// ── Storage helpers ───────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ── GST account name helper ───────────────────────────────────────
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

// ── Migrate old accounts (add group field if missing) ─────────────
function migrateCOA(accounts: any[]): Account[] {
  const groupMap: Record<string, AccountGroup> = {
    'Accounts Receivable': 'Current Assets', 'Cash & Bank': 'Current Assets',
    'Input GST 5%': 'Current Assets', 'Input GST 12%': 'Current Assets', 'Input GST 18%': 'Current Assets',
    'Sales': 'Revenue', 'Sales Returns': 'Revenue',
    'Output GST 5%': 'Current Liabilities', 'Output GST 12%': 'Current Liabilities', 'Output GST 18%': 'Current Liabilities',
    'Purchases': 'Cost of Goods Sold', 'Purchase Returns': 'Cost of Goods Sold',
    'Accounts Payable': 'Current Liabilities',
    'Freight & Charges': 'Cost of Goods Sold', 'Other Income': 'Other Income',
  };
  return accounts.map(a => ({
    code: a.code,
    name: a.name,
    type: (a.type === 'Equity' ? 'Equity' : a.type) as AccountType,
    group: (a.group ?? groupMap[a.name] ?? (
      a.type === 'Asset' ? 'Current Assets' :
      a.type === 'Liability' ? 'Current Liabilities' :
      a.type === 'Income' ? 'Revenue' :
      a.type === 'Equity' ? 'Capital & Reserves' :
      'Operating Expenses'
    )) as AccountGroup,
  }));
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'VyaparSetu Enterprises',
  companyGstin: '29AABCV1234F1Z5',
  inboundEmail: 'themastyogi@gmail.com',
  email: 'themastyogi@gmail.com',
  phone: '+91 98765 43210',
  address: 'Plot 42, Industrial Area, Phase II',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  autoDraft: true,
  aiCreditsTotal: 300,
  aiCreditsUsed: 55,
  aiCreditHistory: [
    { id: 'cred-1', date: '2026-07-01', amount: 100, description: 'Monthly SaaS Included AI Credits', type: 'grant' },
    { id: 'cred-2', date: '2026-07-15', amount: 200, description: 'Super Admin SaaS Allocation', type: 'grant' },
    { id: 'cred-3', date: '2026-07-26', amount: 55, description: '55 PDF Invoice Document Scans', type: 'usage' },
  ],
};

const SEED_PAYMENTS: PaymentVoucher[] = [
  {
    id: 'pay-seed-1', voucherNo: 'REC-2026-001', date: '2026-07-21',
    type: 'Receipt', party: 'Ravi Enterprises', amount: 50000,
    bankAccount: 'Bank Account', reference: 'UTR9823412',
    remarks: 'Advance customer collection', status: 'posted', createdAt: '2026-07-21T10:00:00Z'
  }
];

const SEED_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'ba-hdfc-1',
    bankName: 'HDFC Bank',
    accountNo: '50100234918234',
    ifsc: 'HDFC0001234',
    branch: 'Koramangala, Bangalore',
    accountType: 'Current',
    openingBalance: 250000,
    glAccountName: 'HDFC Bank - A/C 8234',
    active: true,
  },
  {
    id: 'ba-icici-1',
    bankName: 'ICICI Bank',
    accountNo: '00110592837411',
    ifsc: 'ICIC0000011',
    branch: 'MG Road, Bangalore',
    accountType: 'Current',
    openingBalance: 120000,
    glAccountName: 'ICICI Bank - A/C 7411',
    active: true,
  }
];

// ────────────────────────────────────────────────────────────────
//  Hook
// ────────────────────────────────────────────────────────────────
export function useAccounting() {
  const [coa, setCoaState] = useState<Account[]>(() => {
    const stored = load<any[]>('vs_coa', []);
    if (stored.length === 0) { save('vs_coa', DEFAULT_COA); return DEFAULT_COA; }
    return migrateCOA(stored);
  });

  const [companySettings, setCompanySettingsState] = useState<CompanySettings>(() => load('vs_company_settings', DEFAULT_COMPANY_SETTINGS));
  const [bankAccounts, setBankAccountsState]       = useState<BankAccount[]>(() => {
    const stored = load<BankAccount[]>('vs_bank_accounts', []);
    if (stored.length === 0) { save('vs_bank_accounts', SEED_BANK_ACCOUNTS); return SEED_BANK_ACCOUNTS; }
    return stored;
  });
  const [reconciliationRecords, setReconciliationState] = useState<BankReconciliationRecord[]>(() =>
    load<BankReconciliationRecord[]>('vs_brs_records', [])
  );
  const [salesInvoices, setSIState]    = useState<SalesInvoice[]>(() => load('vs_sales', []));
  const [purchaseInvoices, setPIState] = useState<PurchaseInvoice[]>(() => {
    const stored = load<PurchaseInvoice[]>('vs_purchases', []);
    // Clean out any legacy sample draft bills from localStorage!
    const cleaned = stored.filter(p => p.status !== 'draft' || (!p.id.includes('pi-draft') && !p.id.includes('sample')));
    if (stored.length !== cleaned.length) {
      save('vs_purchases', cleaned);
    }
    if (cleaned.length === 0) {
      save('vs_purchases', SEED_PURCHASES);
      return SEED_PURCHASES;
    }
    return cleaned;
  });
  const [debitNotes, setDNState]       = useState<DebitNote[]>(() => load('vs_debit_notes', []));
  const [payments, setPaymentsState]   = useState<PaymentVoucher[]>(() => {
    const stored = load<PaymentVoucher[]>('vs_payments', []);
    if (stored.length === 0) { save('vs_payments', SEED_PAYMENTS); return SEED_PAYMENTS; }
    return stored;
  });
  const [journalEntries, setJEState]   = useState<JournalEntry[]>(() => load('vs_journal', []));

  // ── COA CRUD ──────────────────────────────────────────────────
  const saveCoa = useCallback((accounts: Account[]) => {
    setCoaState(accounts); save('vs_coa', accounts);
  }, []);
  const addAccount = useCallback((acct: Account) => {
    setCoaState(prev => { const next = [...prev, acct]; save('vs_coa', next); return next; });
  }, []);
  const updateAccount = useCallback((code: string, updates: Partial<Account>) => {
    setCoaState(prev => { const next = prev.map(a => a.code === code ? { ...a, ...updates } : a); save('vs_coa', next); return next; });
  }, []);
  const deleteAccount = useCallback((code: string) => {
    setCoaState(prev => { const next = prev.filter(a => a.code !== code); save('vs_coa', next); return next; });
  }, []);
  const resetCOA = useCallback(() => { setCoaState(DEFAULT_COA); save('vs_coa', DEFAULT_COA); }, []);

  // ── JE helpers ────────────────────────────────────────────────
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

  // ── Company Settings ──────────────────────────────────────────
  const updateCompanySettings = useCallback((updates: Partial<CompanySettings>) => {
    setCompanySettingsState(prev => {
      const next = { ...prev, ...updates };
      save('vs_company_settings', next);
      return next;
    });
  }, []);

  const consumeAiCredit = useCallback((description: string) => {
    setCompanySettingsState(prev => {
      const currentUsed = prev.aiCreditsUsed ?? 55;
      const newUsed = currentUsed + 1;
      const history = prev.aiCreditHistory || [];
      const newHistory = [
        {
          id: 'use_' + Date.now().toString(36),
          date: new Date().toISOString().split('T')[0],
          amount: 1,
          description: `AI PDF Scan: ${description}`,
          type: 'usage' as const,
        },
        ...history,
      ];
      const next = {
        ...prev,
        aiCreditsUsed: newUsed,
        aiCreditHistory: newHistory,
      };
      save('vs_company_settings', next);
      return next;
    });
  }, []);

  // ── Bank Accounts CRUD ────────────────────────────────────────
  const addBankAccount = useCallback((acct: Omit<BankAccount, 'id'>) => {
    const full: BankAccount = { ...acct, id: 'ba_' + Date.now().toString(36) };
    setBankAccountsState(prev => {
      const next = [...prev, full];
      save('vs_bank_accounts', next);
      return next;
    });
    setCoaState(prev => {
      if (prev.some(a => a.name.toLowerCase() === full.glAccountName.toLowerCase())) return prev;
      const newCode = String(1000 + prev.length + 1);
      const nextCoa: Account[] = [...prev, { code: newCode, name: full.glAccountName, type: 'Asset', group: 'Current Assets' }];
      save('vs_coa', nextCoa);
      return nextCoa;
    });
  }, []);

  const updateBankAccount = useCallback((id: string, updates: Partial<BankAccount>) => {
    setBankAccountsState(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      save('vs_bank_accounts', next);
      return next;
    });
  }, []);

  const deleteBankAccount = useCallback((id: string) => {
    setBankAccountsState(prev => {
      const next = prev.filter(b => b.id !== id);
      save('vs_bank_accounts', next);
      return next;
    });
  }, []);

  // ── BRS Clearance Toggle ──────────────────────────────────────
  const toggleBRSClearance = useCallback((jeId: string, bankAccountId: string, details?: Partial<BankReconciliationRecord>) => {
    setReconciliationState(prev => {
      const existing = prev.find(r => r.jeId === jeId && r.bankAccountId === bankAccountId);
      let next: BankReconciliationRecord[];
      if (existing) {
        next = prev.map(r => r.id === existing.id ? { ...r, isCleared: !r.isCleared, clearedDate: !r.isCleared ? new Date().toISOString().split('T')[0] : undefined } : r);
      } else {
        const created: BankReconciliationRecord = {
          id: 'brs_' + Date.now().toString(36),
          bankAccountId,
          jeId,
          date: details?.date || new Date().toISOString().split('T')[0],
          refNo: details?.refNo || 'JE-' + jeId.slice(-4),
          entryType: details?.entryType || 'Bank Transaction',
          party: details?.party || 'General',
          debit: details?.debit || 0,
          credit: details?.credit || 0,
          isCleared: true,
          clearedDate: new Date().toISOString().split('T')[0],
        };
        next = [...prev, created];
      }
      save('vs_brs_records', next);
      return next;
    });
  }, []);

  // ── Purchase Invoice CRUD ─────────────────────────────────────
  const saveDraftPurchaseInvoice = useCallback((data: Omit<PurchaseInvoice, 'id' | 'createdAt'> & { id?: string }): PurchaseInvoice => {
    const draftId = data.id || uid();
    const inv: PurchaseInvoice = {
      ...data,
      id: draftId,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setPIState(prev => {
      const exists = prev.some(p => p.id === draftId);
      const next = exists ? prev.map(p => p.id === draftId ? inv : p) : [inv, ...prev];
      save('vs_purchases', next);
      return next;
    });
    return inv;
  }, []);

  const postDraftPurchaseInvoice = useCallback((id: string): PurchaseInvoice | undefined => {
    let postedInv: PurchaseInvoice | undefined;
    setPIState(prev => {
      const target = prev.find(p => p.id === id);
      if (!target) return prev;
      postedInv = { ...target, status: 'posted' };
      const next = prev.map(p => p.id === id ? postedInv! : p);
      save('vs_purchases', next);
      return next;
    });
    if (postedInv) {
      const invToPost = postedInv;
      setJEState(prev => {
        const already = prev.some(j => j.relatedId === id && j.entryType === 'Purchase Invoice');
        if (already) return prev;
        const je = buildPurchaseInvoiceJE(invToPost);
        const next = [je, ...prev]; save('vs_journal', next); return next;
      });
    }
    return postedInv;
  }, []);

  const postPurchaseInvoice = useCallback((data: Omit<PurchaseInvoice, 'id' | 'status' | 'createdAt'>): PurchaseInvoice => {
    const inv: PurchaseInvoice = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setPIState(prev => { const next = [inv, ...prev]; save('vs_purchases', next); return next; });
    setJEState(prev => {
      const already = prev.some(j => j.relatedId === inv.id && j.entryType === 'Purchase Invoice');
      if (already) return prev;
      const je = buildPurchaseInvoiceJE(inv);
      const next = [je, ...prev]; save('vs_journal', next); return next;
    });
    return inv;
  }, []);

  const deletePurchaseInvoice = useCallback((id: string) => {
    setPIState(prev => { const next = prev.filter(p => p.id !== id); save('vs_purchases', next); return next; });
    setJEState(prev => { const next = prev.filter(je => !(je.relatedId === id && je.entryType === 'Purchase Invoice')); save('vs_journal', next); return next; });
  }, []);

  const clearAllDrafts = useCallback(() => {
    setPIState(prev => {
      const next = prev.filter(p => p.status !== 'draft');
      save('vs_purchases', next);
      return next;
    });
  }, []);

  // ── Payment Vouchers (Customer Receipt / Vendor Payment) ────────
  const recordPayment = useCallback((data: Omit<PaymentVoucher, 'id' | 'status' | 'createdAt'>): PaymentVoucher => {
    const voucher: PaymentVoucher = { ...data, id: uid(), status: 'posted', createdAt: new Date().toISOString() };
    setPaymentsState(prev => { const next = [voucher, ...prev]; save('vs_payments', next); return next; });
    
    // Create Journal Entry
    // Receipt (Customer Collection): Dr Bank/Cash Account, Cr Accounts Receivable (party)
    // Payment (Vendor Disbursement): Dr Accounts Payable (party), Cr Bank/Cash Account
    const lines: JournalLine[] = [];
    if (voucher.type === 'Receipt') {
      lines.push({ account: voucher.bankAccount || 'Bank Account', debit: voucher.amount, credit: 0 });
      lines.push({ account: 'Accounts Receivable', debit: 0, credit: voucher.amount });
    } else {
      lines.push({ account: 'Accounts Payable', debit: voucher.amount, credit: 0 });
      lines.push({ account: voucher.bankAccount || 'Bank Account', debit: 0, credit: voucher.amount });
    }
    const je: JournalEntry = {
      id: uid(),
      date: voucher.date,
      entryType: voucher.type === 'Receipt' ? 'Customer Receipt' : 'Vendor Payment',
      relatedId: voucher.id,
      relatedNo: voucher.voucherNo,
      party: voucher.party,
      lines,
      createdAt: new Date().toISOString(),
    };
    appendJE(je);
    return voucher;
  }, [appendJE]);

  const deletePayment = useCallback((id: string) => {
    setPaymentsState(prev => { const next = prev.filter(p => p.id !== id); save('vs_payments', next); return next; });
    setJEState(prev => { const next = prev.filter(je => !(je.relatedId === id && (je.entryType === 'Customer Receipt' || je.entryType === 'Vendor Payment'))); save('vs_journal', next); return next; });
  }, []);

  // ── Sales ↔ Purchase Linking ──────────────────────────────────
  const linkSalesToPurchase = useCallback((salesId: string, purchaseId: string | null) => {
    setSIState(prev => {
      const next = prev.map(s => s.id === salesId ? { ...s, linkedPurchaseInvoiceId: purchaseId ?? undefined } : s);
      save('vs_sales', next); return next;
    });
    setPIState(prev => {
      let next = prev.map(p => p.linkedSalesInvoiceId === salesId ? { ...p, linkedSalesInvoiceId: undefined } : p);
      if (purchaseId) next = next.map(p => p.id === purchaseId ? { ...p, linkedSalesInvoiceId: salesId } : p);
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
    const salesId = uid(), purchaseId = purchaseDN ? uid() : undefined;
    const salesDnFull: DebitNote    = { ...salesDN, id: salesId, status: 'posted', linkedPurchaseDnId: purchaseId, createdAt: new Date().toISOString() };
    const purchaseDnFull: DebitNote | undefined = purchaseDN ? { ...purchaseDN, id: purchaseId!, status: 'posted', createdAt: new Date().toISOString() } : undefined;
    setDNState(prev => {
      const next = purchaseDnFull ? [salesDnFull, purchaseDnFull, ...prev] : [salesDnFull, ...prev];
      save('vs_debit_notes', next); return next;
    });
    const jes: JournalEntry[] = [buildSalesDNJE(salesDnFull)];
    if (purchaseDnFull) jes.push(buildPurchaseDNJE(purchaseDnFull));
    appendJEs(jes);
    return { salesDn: salesDnFull, purchaseDn: purchaseDnFull };
  }, [appendJEs]);

  const postPurchaseInvoiceJE = useCallback((p: {
    id: string; invoiceNo: string; date: string; vendorName: string;
    subtotal: number; gstTotal: number; netTotal: number; gstRate?: number;
  }) => {
    setJEState(prev => {
      const already = prev.some(j => j.relatedId === p.id && j.entryType === 'Purchase Invoice');
      if (already) return prev;
      const rate = p.gstRate ?? 5;
      const fakePi: PurchaseInvoice = {
        id: p.id, invoiceNo: p.invoiceNo, date: p.date, vendorName: p.vendorName,
        items: [{ id: 'x', description: 'Purchase', qty: 1, rate: p.subtotal, amount: p.subtotal, gstRate: rate, gstAmount: p.gstTotal, total: p.netTotal }],
        subtotal: p.subtotal, gstTotal: p.gstTotal, netTotal: p.netTotal, status: 'posted', createdAt: new Date().toISOString(),
      };
      const je = buildPurchaseInvoiceJE(fakePi);
      const next = [je, ...prev]; save('vs_journal', next); return next;
    });
  }, []);

  // ── General Ledger ────────────────────────────────────────────
  const getGeneralLedger = useCallback((): GLAccount[] => {
    const currentCoa = load<any[]>('vs_coa', DEFAULT_COA);
    const migratedCoa = migrateCOA(currentCoa.length === 0 ? DEFAULT_COA : currentCoa);
    const currentJEs  = load<JournalEntry[]>('vs_journal', []);
    return migratedCoa.map(acct => {
      let totalDebit = 0, totalCredit = 0;
      for (const je of currentJEs)
        for (const line of je.lines)
          if (line.account === acct.name) { totalDebit += line.debit; totalCredit += line.credit; }
      return {
        account: acct.name, accountCode: acct.code, accountType: acct.type,
        accountGroup: acct.group, totalDebit, totalCredit, balance: totalDebit - totalCredit,
      };
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
      accountGroup: a.accountGroup,
      debit:  a.balance > 0 ? a.balance : 0,
      credit: a.balance < 0 ? -a.balance : 0,
    }));
    const totalDebit  = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [getGeneralLedger]);

  // ── Party Ledger ──────────────────────────────────────────────
  const getPartyLedger = useCallback((partyName: string, fromDate?: string, toDate?: string): PartyLedgerResult => {
    const sis  = load<SalesInvoice[]>('vs_sales', []);
    const pis  = load<PurchaseInvoice[]>('vs_purchases', []);
    const dns  = load<DebitNote[]>('vs_debit_notes', []);
    const name = partyName.toLowerCase();
    type RawEntry = { date: string; entryType: string; refNo: string; debit: number; credit: number; jeId: string };
    const entries: RawEntry[] = [];
    sis.filter(si => si.customer.toLowerCase() === name)
      .forEach(si => entries.push({ date: si.date, entryType: 'Sales Invoice', refNo: si.invoiceNo, debit: si.netTotal, credit: 0, jeId: si.id }));
    dns.filter(dn => dn.party.toLowerCase() === name).forEach(dn => {
      if (dn.type === 'Sales')
        entries.push({ date: dn.date, entryType: 'Sales Debit Note', refNo: dn.dnNo, debit: 0, credit: dn.netTotal, jeId: dn.id });
      else
        entries.push({ date: dn.date, entryType: 'Purchase Debit Note', refNo: dn.dnNo, debit: dn.netTotal, credit: 0, jeId: dn.id });
    });
    pis.filter(pi => pi.vendorName.toLowerCase() === name)
      .forEach(pi => entries.push({ date: pi.date, entryType: 'Purchase Invoice', refNo: pi.invoiceNo, debit: 0, credit: pi.netTotal, jeId: pi.id }));
    
    // Sort all entries chronologically
    const allSorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.refNo.localeCompare(b.refNo));

    let openingBalance = 0;
    if (fromDate) {
      for (const e of allSorted) {
        if (e.date < fromDate) {
          openingBalance += e.debit - e.credit;
        }
      }
    }

    const rangeEntries = allSorted.filter(e => (!fromDate || e.date >= fromDate) && (!toDate || e.date <= toDate));
    let running = openingBalance;
    const rows: PartyLedgerRow[] = rangeEntries.map(e => {
      running += e.debit - e.credit;
      return { ...e, runningBalance: running };
    });

    return { openingBalance, rows, closingBalance: running };
  }, []);

  // ── Ageing ────────────────────────────────────────────────────
  const getAgeing = useCallback((type: 'customer' | 'vendor', asOf?: string): AgeingRow[] => {
    const today = asOf ? new Date(asOf) : new Date();
    const daysDiff = (dateStr: string) => Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000);
    if (type === 'customer') {
      const sis = load<SalesInvoice[]>('vs_sales', []);
      const dns = load<DebitNote[]>('vs_debit_notes', []);
      const map = new Map<string, AgeingRow>();
      for (const si of sis) {
        if (!map.has(si.customer)) map.set(si.customer, { party: si.customer, current: 0, days31: 0, days61: 0, days90: 0, total: 0, oldestDate: si.date });
        const row = map.get(si.customer)!;
        const dnAmt = dns.filter(d => d.type === 'Sales' && d.relatedInvoiceId === si.id).reduce((s, d) => s + d.netTotal, 0);
        const outstanding = Math.max(0, si.netTotal - dnAmt);
        const age = daysDiff(si.date);
        if (age <= 30) row.current += outstanding;
        else if (age <= 60) row.days31 += outstanding;
        else if (age <= 90) row.days61 += outstanding;
        else row.days90 += outstanding;
        row.total += outstanding;
        if (si.date < row.oldestDate) row.oldestDate = si.date;
      }
      return Array.from(map.values()).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    } else {
      const pis = load<PurchaseInvoice[]>('vs_purchases', []);
      const dns = load<DebitNote[]>('vs_debit_notes', []);
      const map = new Map<string, AgeingRow>();
      for (const pi of pis) {
        if (!map.has(pi.vendorName)) map.set(pi.vendorName, { party: pi.vendorName, current: 0, days31: 0, days61: 0, days90: 0, total: 0, oldestDate: pi.date });
        const row = map.get(pi.vendorName)!;
        const dnAmt = dns.filter(d => d.type === 'Purchase' && d.relatedInvoiceId === pi.id).reduce((s, d) => s + d.netTotal, 0);
        const outstanding = Math.max(0, pi.netTotal - dnAmt);
        const age = daysDiff(pi.date);
        if (age <= 30) row.current += outstanding;
        else if (age <= 60) row.days31 += outstanding;
        else if (age <= 90) row.days61 += outstanding;
        else row.days90 += outstanding;
        row.total += outstanding;
        if (pi.date < row.oldestDate) row.oldestDate = pi.date;
      }
      return Array.from(map.values()).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    }
  }, []);

  // ── Margin Report ─────────────────────────────────────────────
  const getMarginReport = useCallback((): MarginRow[] => {
    const sis = load<SalesInvoice[]>('vs_sales', []);
    const pis = load<PurchaseInvoice[]>('vs_purchases', []);
    const dns = load<DebitNote[]>('vs_debit_notes', []);
    return sis.map(si => {
      const salesDNs    = dns.filter(d => d.type === 'Sales' && d.relatedInvoiceId === si.id);
      const saleDnAmt   = salesDNs.reduce((s, d) => s + d.subtotal, 0);
      const netRevenue  = si.subtotal - saleDnAmt;
      const linkedPI    = pis.find(p => p.id === si.linkedPurchaseInvoiceId || p.linkedSalesInvoiceId === si.id);
      const purchaseCost = linkedPI ? linkedPI.subtotal : 0;
      const purchDNs    = linkedPI ? dns.filter(d => d.type === 'Purchase' && d.relatedInvoiceId === linkedPI.id) : [];
      const purchDnAmt  = purchDNs.reduce((s, d) => s + d.subtotal, 0);
      const netCost     = purchaseCost - purchDnAmt;
      const grossMargin = netRevenue - netCost;
      const marginPct   = si.subtotal > 0 ? (grossMargin / si.subtotal) * 100 : 0;
      return {
        salesInvoiceId: si.id, invoiceNo: si.invoiceNo, date: si.date, customer: si.customer,
        saleSubtotal: si.subtotal, saleDnDeducted: saleDnAmt, netRevenue,
        purchaseCost, purchaseDnRecovered: purchDnAmt, netCost,
        grossMargin, marginPct: parseFloat(marginPct.toFixed(2)),
        linkedPurchaseInvoiceNo: linkedPI?.invoiceNo,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  // ── Balance Sheet ─────────────────────────────────────────────
  const getBalanceSheet = useCallback((asOf?: string): BalanceSheet => {
    const gl = getGeneralLedger();
    const today = asOf ?? new Date().toISOString().split('T')[0];

    // Helper: get net balance for GL account (positive = Dr, negative = Cr)
    const glMap = new Map(gl.map(a => [a.account, a]));

    // Build P&L to get net profit
    const pl = _computePL(gl);

    const buildSection = (type: AccountType, group: AccountGroup): BSSection => {
      const coaAccounts = load<any[]>('vs_coa', DEFAULT_COA).map(a => migrateCOA([a])[0]);
      const rows: BSRow[] = coaAccounts
        .filter(a => a.type === type && a.group === group)
        .map(a => {
          const g = glMap.get(a.name);
          // For assets: Dr balance is positive; for liabilities/equity: Cr balance is positive
          const raw = g ? g.balance : 0;
          // Assets: balance > 0 means Dr (good); Liability/Equity: balance < 0 means Cr (good)
          const display = type === 'Asset' ? raw : -raw;
          return { code: a.code, name: a.name, group: a.group, balance: display };
        })
        .filter(r => r.balance !== 0);
      const subtotal = rows.reduce((s, r) => s + r.balance, 0);
      return { group, rows, subtotal };
    };

    const assetGroups: AccountGroup[]     = ['Current Assets', 'Fixed Assets', 'Other Assets'];
    const liabilityGroups: AccountGroup[] = ['Current Liabilities', 'Long-term Liabilities'];
    const equityGroups: AccountGroup[]    = ['Capital & Reserves'];

    const assetSections     = assetGroups.map(g => buildSection('Asset', g)).filter(s => s.rows.length > 0 || true);
    const liabilitySections = liabilityGroups.map(g => buildSection('Liability', g)).filter(s => s.rows.length > 0 || true);
    const equitySections    = equityGroups.map(g => buildSection('Equity', g)).filter(s => s.rows.length > 0 || true);

    const totalAssets      = assetSections.reduce((s, sec) => s + sec.subtotal, 0);
    const totalLiabilities = liabilitySections.reduce((s, sec) => s + sec.subtotal, 0);
    const totalEquity      = equitySections.reduce((s, sec) => s + sec.subtotal, 0);
    const netProfit        = pl.netProfit;
    const totalLiabilitiesEquity = totalLiabilities + totalEquity + netProfit;

    return {
      assetSections, totalAssets,
      liabilitySections, totalLiabilities,
      equitySections, netProfit, totalEquity, totalLiabilitiesEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesEquity) < 1,
      asOf: today,
    };
  }, [getGeneralLedger]);

  // ── P&L helper (used internally + exported) ───────────────────
  function _computePL(gl: GLAccount[]): ProfitAndLoss {
    const today = new Date().toISOString().split('T')[0];
    // For Income accounts: Cr balance (negative in our sign convention) = income earned
    // For Expense accounts: Dr balance (positive in our sign convention) = expense incurred
    const getAmount = (a: GLAccount): number => {
      if (a.accountType === 'Income')  return -a.balance; // Cr normal → positive income
      if (a.accountType === 'Expense') return  a.balance; // Dr normal → positive expense
      return 0;
    };

    const revenue   = gl.filter(a => a.accountType === 'Income' && a.accountGroup === 'Revenue')
                        .map(a => ({ code: a.accountCode, name: a.account, group: a.accountGroup as AccountGroup, amount: getAmount(a) }));
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);

    const cogs      = gl.filter(a => a.accountType === 'Expense' && a.accountGroup === 'Cost of Goods Sold')
                        .map(a => ({ code: a.accountCode, name: a.account, group: a.accountGroup as AccountGroup, amount: getAmount(a) }));
    const totalCOGS = cogs.reduce((s, r) => s + r.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const opEx      = gl.filter(a => a.accountType === 'Expense' && a.accountGroup === 'Operating Expenses')
                        .map(a => ({ code: a.accountCode, name: a.account, group: a.accountGroup as AccountGroup, amount: getAmount(a) }));
    const totalOpEx = opEx.reduce((s, r) => s + r.amount, 0);
    const ebitda    = grossProfit - totalOpEx;

    const otherIncome = gl.filter(a => a.accountType === 'Income' && a.accountGroup === 'Other Income')
                          .map(a => ({ code: a.accountCode, name: a.account, group: a.accountGroup as AccountGroup, amount: getAmount(a) }));
    const totalOtherIncome = otherIncome.reduce((s, r) => s + r.amount, 0);

    const financeAndDepr = gl.filter(a => a.accountType === 'Expense' && (a.accountGroup === 'Finance Costs' || a.accountGroup === 'Depreciation'))
                             .map(a => ({ code: a.accountCode, name: a.account, group: a.accountGroup as AccountGroup, amount: getAmount(a) }));
    const totalFinanceDepr = financeAndDepr.reduce((s, r) => s + r.amount, 0);

    const netProfit = ebitda + totalOtherIncome - totalFinanceDepr;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue, totalRevenue, cogs, totalCOGS, grossProfit, grossMarginPct,
      opEx, totalOpEx, ebitda, otherIncome, totalOtherIncome,
      financeAndDepr, totalFinanceDepr, netProfit, netMarginPct,
      fromDate: '—', toDate: today,
    };
  }

  const getProfitAndLoss = useCallback((fromDate?: string, toDate?: string): ProfitAndLoss => {
    const gl = getGeneralLedger();
    // TODO: date-filtered JEs for period P&L (currently all-time)
    const pl = _computePL(gl);
    return { ...pl, fromDate: fromDate ?? '(All dates)', toDate: toDate ?? new Date().toISOString().split('T')[0] };
  }, [getGeneralLedger]);

  // ── Cash Flow (indirect method) ───────────────────────────────
  const getCashFlow = useCallback((): CashFlow => {
    const gl     = getGeneralLedger();
    const pl     = _computePL(gl);
    const glMap  = new Map(gl.map(a => [a.account, a]));

    const glBal = (name: string) => glMap.get(name)?.balance ?? 0;

    // Operating Activities
    const netProfit = pl.netProfit;
    const deprAmt   = gl.filter(a => a.accountGroup === 'Depreciation').reduce((s, a) => s + a.balance, 0);
    const arChange  = -(glBal('Accounts Receivable'));  // increase in AR = cash outflow
    const apChange  =  glBal('Accounts Payable');       // increase in AP = cash inflow (we haven't paid yet) — but AP Cr = negative in our balance
    const invChange = -(glBal('Inventory / Stock'));

    const operating: CashFlowSection = {
      label: 'Operating Activities',
      items: [
        { label: 'Net Profit / (Loss)',           amount: netProfit },
        { label: 'Add: Depreciation',             amount: deprAmt   },
        { label: 'Decrease / (Increase) in Trade Receivables', amount: arChange },
        { label: 'Increase / (Decrease) in Trade Payables',    amount: -apChange },
        { label: 'Decrease / (Increase) in Inventory',         amount: invChange },
      ].filter(i => i.amount !== 0),
      total: 0,
    };
    operating.total = operating.items.reduce((s, i) => s + i.amount, 0);

    // Investing Activities (Fixed Asset changes)
    const fixedAssets = gl.filter(a => a.accountGroup === 'Fixed Assets' && a.account !== 'Accum. Depreciation');
    const investing: CashFlowSection = {
      label: 'Investing Activities',
      items: fixedAssets.map(a => ({ label: `Purchase of ${a.account}`, amount: -a.balance })).filter(i => i.amount !== 0),
      total: 0,
    };
    investing.total = investing.items.reduce((s, i) => s + i.amount, 0);

    // Financing Activities (Loans + Capital + Drawings)
    const financing: CashFlowSection = {
      label: 'Financing Activities',
      items: [
        ...gl.filter(a => a.accountGroup === 'Long-term Liabilities').map(a => ({ label: `Proceeds from ${a.account}`, amount: -a.balance })),
        ...gl.filter(a => a.accountGroup === 'Capital & Reserves').map(a => ({ label: a.account, amount: -a.balance })),
      ].filter(i => i.amount !== 0),
      total: 0,
    };
    financing.total = financing.items.reduce((s, i) => s + i.amount, 0);

    const cashAndBankAccounts = gl.filter(a =>
      a.accountGroup === 'Current Assets' &&
      (a.account.toLowerCase().includes('bank') || a.account.toLowerCase().includes('cash'))
    );
    const cashBal = cashAndBankAccounts.reduce((s, a) => s + a.balance, 0);
    const netChange  = operating.total + investing.total + financing.total;
    const openingCash = cashBal - netChange;

    return { operating, investing, financing, netChange, openingCash, closingCash: cashBal };
  }, [getGeneralLedger]);

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

  const nextPaymentVoucherNo = useCallback((type: 'Receipt' | 'Payment'): string => {
    const pmts = load<PaymentVoucher[]>('vs_payments', []);
    const prefix = type === 'Receipt' ? 'REC' : 'PAY';
    const y = new Date().getFullYear();
    const seq = pmts.filter(p => p.voucherNo.startsWith(`${prefix}-${y}`)).length + 1;
    return `${prefix}-${y}-${String(seq).padStart(3, '0')}`;
  }, []);

  // ── Bank Reconciliation Statement (BRS) Helper ─────────────────
  const getBankReconciliationSummary = useCallback((bankAccountId: string, statementAsOf?: string, statementBalance: number = 0) => {
    const banks = load<BankAccount[]>('vs_bank_accounts', SEED_BANK_ACCOUNTS);
    const targetBank = banks.find(b => b.id === bankAccountId);
    const bankGlName = targetBank?.glAccountName || 'HDFC Bank - A/C 8234';

    const currentJEs = load<JournalEntry[]>('vs_journal', []);
    const brsRecords = load<BankReconciliationRecord[]>('vs_brs_records', []);

    type BRSItem = {
      jeId: string;
      date: string;
      refNo: string;
      entryType: string;
      party: string;
      debit: number;
      credit: number;
      isCleared: boolean;
      clearedDate?: string;
    };

    const items: BRSItem[] = [];
    let bookBalance = targetBank ? targetBank.openingBalance : 0;

    for (const je of currentJEs) {
      if (statementAsOf && je.date > statementAsOf) continue;
      for (const line of je.lines) {
        if (line.account.toLowerCase() === bankGlName.toLowerCase() || line.account.toLowerCase().includes('bank')) {
          bookBalance += line.debit - line.credit;
          const rec = brsRecords.find(r => r.jeId === je.id && r.bankAccountId === bankAccountId);
          items.push({
            jeId: je.id,
            date: je.date,
            refNo: je.relatedNo,
            entryType: je.entryType,
            party: je.party,
            debit: line.debit,
            credit: line.credit,
            isCleared: rec ? rec.isCleared : false,
            clearedDate: rec?.clearedDate,
          });
        }
      }
    }

    const unclearedDeposits = items.filter(i => !i.isCleared && i.debit > 0).reduce((s, i) => s + i.debit, 0);
    const unclearedCheques = items.filter(i => !i.isCleared && i.credit > 0).reduce((s, i) => s + i.credit, 0);

    const calculatedBankBalance = bookBalance - unclearedDeposits + unclearedCheques;
    const difference = calculatedBankBalance - statementBalance;

    return {
      targetBank,
      bookBalance,
      unclearedDeposits,
      unclearedCheques,
      calculatedBankBalance,
      statementBalance,
      difference,
      isReconciled: Math.abs(difference) < 0.01,
      items,
    };
  }, []);

  // ── Smart Payment Advisor ─────────────────────────────────────
  const getSmartPaymentSuggestions = useCallback(() => {
    const gl = getGeneralLedger();
    const bankBal = gl.filter(a =>
      a.accountGroup === 'Current Assets' &&
      (a.account.toLowerCase().includes('bank') || a.account.toLowerCase().includes('cash'))
    ).reduce((s, a) => s + a.balance, 0);
    const availableFunds = Math.max(0, bankBal);

    const pis = load<PurchaseInvoice[]>('vs_purchases', []).filter(p => p.status === 'posted');
    const dns = load<DebitNote[]>('vs_debit_notes', []).filter(d => d.type === 'Purchase');
    const pmts = load<PaymentVoucher[]>('vs_payments', []).filter(p => p.type === 'Payment');
    const parties = load<any[]>('vs_parties', []);
    const today = new Date();

    type Suggestion = {
      vendorName: string;
      invoiceNo: string;
      invoiceDate: string;
      dueDate: string;
      netTotal: number;
      paidAmount: number;
      dnDeduction: number;
      pendingAmount: number;
      paymentTerms: string;
      priority: 'High' | 'Medium' | 'Low';
      daysOverdue: number;
      urgencyScore: number;
      recommendedPayment: number;
      reason: string;
    };

    const suggestions: Suggestion[] = [];

    for (const pi of pis) {
      const party = parties.find(p => p.name.toLowerCase() === pi.vendorName.toLowerCase());
      const termsStr = party?.paymentTerms ?? 'Net 30';
      const priority = party?.priority ?? 'Medium';

      let termsDays = 30;
      if (termsStr.includes('15')) termsDays = 15;
      else if (termsStr.includes('45')) termsDays = 45;
      else if (termsStr.includes('60')) termsDays = 60;
      else if (termsStr.toLowerCase().includes('receipt')) termsDays = 0;

      const invDateObj = new Date(pi.date);
      const dueDateObj = new Date(invDateObj.getTime() + termsDays * 86400000);
      const dueDateStr = dueDateObj.toISOString().split('T')[0];
      const daysOverdue = Math.floor((today.getTime() - dueDateObj.getTime()) / 86400000);

      // Debit notes for this invoice
      const dnTotal = dns.filter(d => d.relatedInvoiceId === pi.id).reduce((s, d) => s + d.netTotal, 0);
      // Payments for this vendor
      const vendorPmtsTotal = pmts.filter(p => p.party.toLowerCase() === pi.vendorName.toLowerCase()).reduce((s, p) => s + p.amount, 0);
      
      const pending = Math.max(0, pi.netTotal - dnTotal - vendorPmtsTotal);
      if (pending <= 0) continue;

      let score = 0;
      if (daysOverdue > 0) score += 1000 + daysOverdue * 10;
      else score += (30 - Math.abs(daysOverdue));

      if (priority === 'High') score += 500;
      else if (priority === 'Medium') score += 200;

      let reason = '';
      if (daysOverdue > 0) reason = `Overdue by ${daysOverdue} days!`;
      else if (daysOverdue === 0) reason = `Due today!`;
      else reason = `Due in ${Math.abs(daysOverdue)} days`;

      if (priority === 'High') reason += ` · High Priority Vendor`;

      suggestions.push({
        vendorName: pi.vendorName,
        invoiceNo: pi.invoiceNo,
        invoiceDate: pi.date,
        dueDate: dueDateStr,
        netTotal: pi.netTotal,
        paidAmount: vendorPmtsTotal,
        dnDeduction: dnTotal,
        pendingAmount: pending,
        paymentTerms: termsStr,
        priority,
        daysOverdue,
        urgencyScore: score,
        recommendedPayment: 0,
        reason,
      });
    }

    suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Allocate available funds to top suggestions
    let remainingFund = availableFunds;
    let totalRecommended = 0;

    for (const s of suggestions) {
      if (remainingFund <= 0) {
        s.recommendedPayment = 0;
      } else if (remainingFund >= s.pendingAmount) {
        s.recommendedPayment = s.pendingAmount;
        remainingFund -= s.pendingAmount;
        totalRecommended += s.pendingAmount;
      } else {
        s.recommendedPayment = remainingFund;
        totalRecommended += remainingFund;
        remainingFund = 0;
      }
    }

    return {
      availableFunds,
      totalPendingPayables: suggestions.reduce((s, i) => s + i.pendingAmount, 0),
      totalRecommended,
      unallocatedFunds: remainingFund,
      suggestions,
    };
  }, [getGeneralLedger]);

  return {
    // Data & Settings
    coa, companySettings, updateCompanySettings, consumeAiCredit, bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount,
    salesInvoices, purchaseInvoices, debitNotes, payments, journalEntries, reconciliationRecords, toggleBRSClearance,
    // COA
    saveCoa, addAccount, updateAccount, deleteAccount, resetCOA,
    // Transactions
    postSalesInvoice, deleteSalesInvoice,
    saveDraftPurchaseInvoice, postDraftPurchaseInvoice, postPurchaseInvoice, deletePurchaseInvoice, clearAllDrafts,
    postDebitNote, postDebitNotePair, postPurchaseInvoiceJE, linkSalesToPurchase,
    recordPayment, deletePayment,
    // Reports & BRS
    getGeneralLedger, getAccountLedger, getTrialBalance,
    getPartyLedger, getAgeing, getMarginReport,
    getBalanceSheet, getProfitAndLoss, getCashFlow,
    getSmartPaymentSuggestions, getBankReconciliationSummary,
    // Helpers
    nextSalesInvoiceNo, nextPurchaseInvoiceNo, nextDnNo, nextPaymentVoucherNo,
    DEFAULT_COA,
  };
}

