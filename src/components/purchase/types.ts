export type WizardStep = 
  | 'entry_options' 
  | 'ocr_camera' 
  | 'ocr_processing' 
  | 'basic_details' 
  | 'items' 
  | 'purpose' 
  | 'preview' 
  | 'status';

export type PurchasePurpose = 'stock' | 'expense' | 'asset' | 'personal';

export interface PurchaseLineItem {
  id: string;
  name: string;
  description?: string;
  hsn?: string;
  uom?: string;       // Unit of Measure (Ream, Month, Job, Pcs, Box, Kg, Mtr, Set)
  qty: number;
  rate: number;
  amount?: number;    // Line Taxable Value (Qty * Rate)
  gstRate: number;
  gstAmount?: number; // Line Tax Amount
  total?: number;     // Line Total Amount
  accountHead?: string; // Chart of Accounts Expense Head (for Service invoices)
  masterItemId?: string; // Linked Item Master ID
  isNewItem?: boolean;
}

export interface PurchaseDraftData {
  source: 'manual' | 'ocr';
  vendorName: string;
  vendorGstin: string;
  invoiceNo: string;
  invoiceDate: string;
  purpose: PurchasePurpose;
  items: PurchaseLineItem[];
  discount: { type: 'percentage' | 'fixed'; value: number };
  charges: Array<{ id: string; name: string; amount: number; isTaxable: boolean; taxRate?: number }>;
  taxMode?: 'intra' | 'inter';
  remarks?: string;
  // Validation flags (specifically for OCR mock simulation)
  needsChecking?: {
    vendorName?: boolean;
    invoiceNo?: boolean;
    totalAmount?: boolean;
  };
  imageUrl?: string;
}

export interface WizardState {
  isOpen: boolean;
  step: WizardStep;
  data: PurchaseDraftData;
  error?: string;
  isProcessing: boolean;
  processingResult?: 'success' | 'error';
}

export const INITIAL_DRAFT_DATA: PurchaseDraftData = {
  source: 'manual',
  vendorName: '',
  vendorGstin: '',
  invoiceNo: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  purpose: 'expense',
  items: [],
  discount: { type: 'fixed', value: 0 },
  charges: [],
  remarks: '',
};
