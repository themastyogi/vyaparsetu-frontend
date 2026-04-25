import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function OcrProcessingStep({ wizard }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    // Simulate realistic OCR delay (2.5 seconds)
    const timer = setTimeout(() => {
      wizard.updateData({
        vendorName: 'Sharma Traders (OCR)',
        vendorGstin: '27AADCS1234F1Z9',
        invoiceNo: 'INV-7742',
        invoiceDate: '2026-04-24',
        purpose: 'stock',
        items: [
          { id: 'item-1', name: 'Premium Widget', qty: 10, rate: 1200, discount: 0 },
          { id: 'item-2', name: 'Basic Widget', qty: 25, rate: 450, discount: 0 }
        ],
        // Simulate partial data error (OCR couldn't confidently read InvoiceNo)
        needsChecking: {
          invoiceNo: true,
        }
      });
      wizard.goToStep('basic_details');
    }, 2500);

    return () => clearTimeout(timer);
  }, [wizard]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <Loader2 size={48} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{t('purchase.processing_bill', 'Processing your bill...')}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
        {t('purchase.processing_sub', 'We are extracting vendor and item details automatically.')}
      </p>
    </div>
  );
}
