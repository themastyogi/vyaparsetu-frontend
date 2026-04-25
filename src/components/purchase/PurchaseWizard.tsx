
import { useTranslation } from 'react-i18next';
import { usePurchaseWizard } from './usePurchaseWizard';

// Step Component Imports
import EntryOptionsStep from './steps/EntryOptionsStep';
import OcrCameraStep from './steps/OcrCameraStep';
import OcrProcessingStep from './steps/OcrProcessingStep';
import BasicDetailsStep from './steps/BasicDetailsStep';
import ItemsStep from './steps/ItemsStep';
import PurposeStep from './steps/PurposeStep';
import PreviewStep from './steps/PreviewStep';
import StatusStep from './steps/StatusStep';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function PurchaseWizard({ wizard }: Props) {
  const { state, closeWizard } = wizard;
  const { t } = useTranslation();

  if (!state.isOpen) return null;

  return (
    <div className="modal-overlay purchase-module" onClick={closeWizard}>
      <div 
        className="modal animate-fade-in-up" 
        onClick={e => e.stopPropagation()} 
        style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh', maxHeight: '800px' }}
      >
        {/* Header shared across steps */}
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 0 }}>
          <h3 className="modal-title">
            {state.step === 'entry_options' ? t('purchase.add_bill', 'Add Purchase Bill') :
             state.step === 'ocr_camera' || state.step === 'ocr_processing' ? t('purchase.scan_bill', 'Scan Bill') :
             state.step === 'basic_details' ? t('purchase.details', 'Invoice Details') :
             state.step === 'items' ? t('purchase.items', 'Line Items') :
             state.step === 'purpose' ? t('purchase.purpose', 'Select Purpose') :
             state.step === 'preview' ? t('purchase.preview', 'Review & Save') :
             t('purchase.status', 'Status')}
          </h3>
          <button className="modal-close" onClick={closeWizard}>✕</button>
        </div>

        {/* Step Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {state.step === 'entry_options' && <EntryOptionsStep wizard={wizard} />}
          {state.step === 'ocr_camera' && <OcrCameraStep wizard={wizard} />}
          {state.step === 'ocr_processing' && <OcrProcessingStep wizard={wizard} />}
          {state.step === 'basic_details' && <BasicDetailsStep wizard={wizard} />}
          {state.step === 'items' && <ItemsStep wizard={wizard} />}
          {state.step === 'purpose' && <PurposeStep wizard={wizard} />}
          {state.step === 'preview' && <PreviewStep wizard={wizard} />}
          {state.step === 'status' && <StatusStep wizard={wizard} />}
        </div>
      </div>
    </div>
  );
}
