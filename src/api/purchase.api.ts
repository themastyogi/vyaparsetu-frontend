import type { PurchaseDraftData, PurchasePurpose } from '../components/purchase/types';

// These functions will later map to the actual NestJS endpoints:
// POST /api/v1/purchase/drafts/manual or /ocr
// POST /api/v1/purchase/invoices/post

export const purchaseApi = {
  createDraft: async (data: PurchaseDraftData) => {
    console.log('API call: createDraft', data);
    // return axios.post('/api/purchase/drafts', data);
    return new Promise(resolve => setTimeout(() => resolve({ id: 'draft_123', ...data }), 500));
  },
  
  validateDraft: async (draftId: string, data: Partial<PurchaseDraftData>) => {
    console.log('API call: validateDraft', draftId, data);
    // return axios.put(`/api/purchase/drafts/${draftId}/validate`, data);
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 300));
  },

  postInvoice: async (draftId: string, finalPurpose: PurchasePurpose) => {
    console.log('API call: postInvoice', draftId, finalPurpose);
    // return axios.post(`/api/purchase/invoices/post`, { draftId, purpose: finalPurpose });
    return new Promise(resolve => setTimeout(() => resolve({ invoiceId: 'inv_abc123' }), 800));
  }
};
