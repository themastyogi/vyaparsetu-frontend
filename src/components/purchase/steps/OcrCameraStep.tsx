import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Maximize, Image as ImageIcon } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function OcrCameraStep({ wizard }: Props) {
  const { t } = useTranslation();
  const [flash, setFlash] = useState(false);

  const captureImage = () => {
    // Transition to processing state
    wizard.goToStep('ocr_processing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: '#fff', margin: '-24px', position: 'relative' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', zIndex: 10 }}>
        <button onClick={() => wizard.goToStep('entry_options')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px' }}>
          {t('common.cancel', 'Cancel')}
        </button>
        <button onClick={() => setFlash(!flash)} style={{ background: 'none', border: 'none', color: flash ? '#FBBF24' : '#fff' }}>
          <Zap size={24} />
        </button>
      </div>

      {/* Simulated Camera Viewfinder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ 
          width: '80%', height: '70%', 
          border: '2px solid rgba(255,255,255,0.3)', 
          borderRadius: '12px',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Maximize size={48} color="rgba(255,255,255,0.2)" />
          {/* Corner accents */}
          <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '12px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 12px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '0 0 0 12px' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 0 12px 0' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
          {t('purchase.align_bill', 'Align bill within frame')}
        </div>
      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '30px 20px', background: 'rgba(0,0,0,0.5)' }}>
        <button style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <ImageIcon size={24} />
          <span style={{ fontSize: '10px' }}>{t('purchase.gallery', 'Gallery')}</span>
        </button>

        {/* Capture Shutter */}
        <button 
          onClick={captureImage}
          style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: '#fff', 
            border: '4px solid rgba(255,255,255,0.3)',
            backgroundClip: 'padding-box',
            cursor: 'pointer'
          }}
          aria-label="Capture"
        />

        <div style={{ width: '24px' }}></div> {/* Spacer */}
      </div>

    </div>
  );
}
