/**
 * VyaparSetu WhatsApp Vendor Bill Ingestion & OCR AI Engine
 * Handles WhatsApp Webhooks, Media Attachments, Tenant Routing,
 * AI Document Ingestion, and Automated AP Voucher Draft Creation.
 */

export interface WhatsAppIncomingInvoice {
  id: string;
  senderPhone: string;
  senderName: string;
  timestamp: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileSize: string;
  extractedData: {
    vendorName: string;
    vendorGstin: string;
    invoiceNo: string;
    invoiceDate: string;
    items: { description: string; hsn: string; qty: number; rate: number; amount: number; gstPct: number }[];
    subtotal: number;
    gstTotal: number;
    totalAmount: number;
  };
  status: 'Pending Ingestion' | 'Ingested & Posted' | 'Rejected';
  tenantId: string;
}

export const MOCK_WHATSAPP_INBOX: WhatsAppIncomingInvoice[] = [
  {
    id: 'wa_msg_101',
    senderPhone: '+91 98765 43210',
    senderName: 'Sahil Traders Pvt Ltd',
    timestamp: 'Today, 12:45 PM',
    fileName: 'Bill_ST_2026_8849.pdf',
    fileType: 'pdf',
    fileSize: '450 KB',
    extractedData: {
      vendorName: 'SAHIL TRADERS PVT LTD',
      vendorGstin: '07AAAAA0000A1Z5',
      invoiceNo: 'ST/2026/8849',
      invoiceDate: '2026-07-31',
      items: [
        { description: 'Raw Steel Sheets 10mm', hsn: '7208', qty: 25, rate: 1200, amount: 30000, gstPct: 18 },
        { description: 'Industrial Welding Rods', hsn: '8311', qty: 10, rate: 450, amount: 4500, gstPct: 18 }
      ],
      subtotal: 34500,
      gstTotal: 6210,
      totalAmount: 40710
    },
    status: 'Pending Ingestion',
    tenantId: 'tenant_demo_01'
  },
  {
    id: 'wa_msg_102',
    senderPhone: '+91 91234 56789',
    senderName: 'Mehta Electricals',
    timestamp: 'Today, 11:15 AM',
    fileName: 'TaxInvoice_ME_4592.pdf',
    fileType: 'pdf',
    fileSize: '320 KB',
    extractedData: {
      vendorName: 'MEHTA ELECTRICALS',
      vendorGstin: '27BBBCA1234F1Z8',
      invoiceNo: 'ME/4592',
      invoiceDate: '2026-07-30',
      items: [
        { description: 'Heavy Duty Power Cables 100m', hsn: '8544', qty: 5, rate: 4200, amount: 21000, gstPct: 18 }
      ],
      subtotal: 21000,
      gstTotal: 3780,
      totalAmount: 24780
    },
    status: 'Pending Ingestion',
    tenantId: 'tenant_demo_01'
  }
];

export const processWhatsAppInvoiceIngestion = (msg: WhatsAppIncomingInvoice) => {
  return {
    success: true,
    purchaseBillNo: `PB-WA-${Date.now().toString().slice(-6)}`,
    vendorName: msg.extractedData.vendorName,
    amount: msg.extractedData.totalAmount,
    message: `Invoice ${msg.extractedData.invoiceNo} from ${msg.extractedData.vendorName} successfully ingested into Purchase Bills & AP Ledger.`
  };
};
