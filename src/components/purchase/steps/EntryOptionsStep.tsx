
import { useTranslation } from 'react-i18next';
import { Camera, FileText } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function EntryOptionsStep({ wizard }: Props) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      
      <button 
        className="btn-action btn-action-primary" 
        style={{ width: '100%', maxWidth: '300px', padding: '16px', justifyContent: 'center', fontSize: '15px' }}
        onClick={() => {
          wizard.updateData({ source: 'ocr' });
          wizard.goToStep('ocr_camera');
        }}
      >
        <Camera size={20}/> {t('purchase.scan_bill_btn', 'Scan Bill (OCR)')}
      </button>

      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('common.or', 'or')}</div>

      <button 
        className="btn-action btn-action-secondary" 
        style={{ width: '100%', maxWidth: '300px', padding: '16px', justifyContent: 'center', fontSize: '15px' }}
        onClick={() => {
          wizard.updateData({ source: 'manual' });
          wizard.goToStep('basic_details');
        }}
      >
        <FileText size={20}/> {t('purchase.add_manual_btn', 'Enter Manually')}
      </button>

    </div>
  );
}
