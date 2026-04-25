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
  qty: number;
  rate: number;
  discount: number;
}

export interface PurchaseDraftData {
  source: 'manual' | 'ocr';
  vendorName: string;
  vendorGstin: string;
  invoiceNo: string;
  invoiceDate: string;
  purpose: PurchasePurpose;
  items: PurchaseLineItem[];
  // Validation flags (specifically for OCR mock simulation)
  needsChecking?: {
    vendorName?: boolean;
    invoiceNo?: boolean;
    totalAmount?: boolean;
  };
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
};
