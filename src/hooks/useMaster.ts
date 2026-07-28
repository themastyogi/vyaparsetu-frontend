/**
 * useMaster.ts
 * Shared master data hook — reads Parties and Items from localStorage
 * (or falls back to the sample data in Parties.tsx / Items.tsx).
 * Provides lookup helpers for dropdowns across all modules.
 */

export interface MasterParty {
  id: string;
  name: string;
  type: string;        // 'customer' | 'vendor' | 'both'
  gstin: string;
  state: string;
  email?: string;
  paymentTerms?: string; // e.g. 'Net 15', 'Net 30', 'Due on Receipt'
  priority?: 'High' | 'Medium' | 'Low';
}

export interface MasterItem {
  id: string;
  name: string;
  hsn: string;
  gst: number;
  unit: string;
  price: number;
}

// ── Fallback/seed data (matches Parties.tsx SAMPLE and Items.tsx ITEMS) ──
const SEED_PARTIES: MasterParty[] = [
  { id: 'p1', name: 'Ravi Enterprises',  type: 'customer', gstin: '29AABCR1234F1ZS', state: 'Karnataka',   email: 'billing@ravienterprises.com', paymentTerms: 'Net 30', priority: 'High' },
  { id: 'p2', name: 'Sahil Traders',     type: 'vendor',   gstin: '27AAACS2222B1Z5', state: 'Maharashtra', email: 'accounts@sahiltraders.in',    paymentTerms: 'Net 15', priority: 'High' },
  { id: 'p3', name: 'Metro Retail Co.',  type: 'both',     gstin: '07AAACM5678K1ZP', state: 'Delhi',       email: 'info@metroretail.com',       paymentTerms: 'Net 30', priority: 'Medium' },
  { id: 'p4', name: 'Alpha Supplies',    type: 'vendor',   gstin: '24AAACA7890L1Z3', state: 'Gujarat',     email: 'sales@alphasupplies.com',    paymentTerms: 'Due on Receipt', priority: 'High' },
  { id: 'p5', name: 'Kumar & Sons',      type: 'vendor',   gstin: '09AAACK4567N1Z1', state: 'UP',          email: 'contact@kumarsons.in',       paymentTerms: 'Net 45', priority: 'Low' },
  { id: 'p6', name: 'Priya Medical Hub', type: 'customer', gstin: '33AAACP1111M1ZQ', state: 'Tamil Nadu',  email: 'orders@priyamedical.org',    paymentTerms: 'Net 15', priority: 'Medium' },
  { id: 'p7', name: 'Bharat Logistics',  type: 'both',     gstin: '06AAACB5432F1Z7', state: 'Haryana',     email: 'billing@bharatlogistics.in', paymentTerms: 'Net 30', priority: 'Medium' },
];

const SEED_ITEMS: MasterItem[] = [
  { id: 'i1', name: 'A4 Paper Ream',        hsn: '48021000', gst: 12, unit: 'Box',  price: 450  },
  { id: 'i2', name: 'Office Chair – Mesh',  hsn: '94013000', gst: 18, unit: 'Pcs',  price: 8500 },
  { id: 'i3', name: 'Accounting Software',  hsn: '998314',   gst: 18, unit: 'Sub',  price: 5999 },
  { id: 'i4', name: 'Printer Ink Cartridge',hsn: '84439920', gst: 18, unit: 'Pcs',  price: 1200 },
  { id: 'i5', name: 'Rice Basmati 5kg',     hsn: '10063000', gst: 5,  unit: 'Bag',  price: 380  },
  { id: 'i6', name: 'Transport Charges',    hsn: '996511',   gst: 5,  unit: 'Trip', price: 2500 },
  { id: 'i7', name: 'Stapler Machine',      hsn: '96130000', gst: 18, unit: 'Pcs',  price: 650  },
];

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  // Seed into storage so other modules can also find them
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function useMaster() {
  const parties = loadOrSeed<MasterParty>('vs_parties', SEED_PARTIES);
  const items   = loadOrSeed<MasterItem>('vs_items',   SEED_ITEMS);

  const customers = parties.filter(p => p.type === 'customer' || p.type === 'both');
  const vendors   = parties.filter(p => p.type === 'vendor'   || p.type === 'both');

  const getPartyByName = (name: string) =>
    parties.find(p => p.name.toLowerCase() === name.toLowerCase());

  const getItemByName = (name: string) =>
    items.find(i => i.name.toLowerCase() === name.toLowerCase());

  const addMasterItem = (newItem: Omit<MasterItem, 'id'>) => {
    const item: MasterItem = {
      id: 'i_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      ...newItem,
    };
    const updated = [item, ...items];
    localStorage.setItem('vs_items', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return item;
  };

  return { parties, customers, vendors, items, getPartyByName, getItemByName, addMasterItem };
}
