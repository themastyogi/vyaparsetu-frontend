import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function StatusStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { error } = wizard.state;

  const isSuccess = !error;

  useEffect(() => {
    if (isSuccess) {
      // Clear draft on success
      wizard.clearDraft();
    }
  }, [isSuccess, wizard]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '0 20px' }}>
      
      {isSuccess ? (
        <>
          <div className="success-ico">
            <CheckCircle size={64} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('purchase.success_title', 'Bill Saved Successfully')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            {t('purchase.success_sub', 'The system is now processing your bill in the background. Stock and GST will be updated automatically.')}
          </p>
        </>
      ) : (
        <>
          <div>
            <XCircle size={64} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('purchase.error_title', 'Something went wrong')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {error || t('purchase.error_sub', 'We could not save your bill. Please try again.')}
          </p>
        </>
      )}

      <div style={{ marginTop: '30px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isSuccess ? (
          <>
            <button className="btn-action btn-action-primary" style={{ justifyContent: 'center' }} onClick={() => {
              wizard.clearDraft();
              wizard.goToStep('entry_options');
            }}>
              {t('purchase.add_another', 'Add Another Bill')}
            </button>
            <button className="btn-action btn-action-secondary" style={{ justifyContent: 'center' }} onClick={() => wizard.closeWizard()}>
              {t('purchase.go_home', 'Go to Purchase List')}
            </button>
          </>
        ) : (
          <>
            <button className="btn-action btn-action-primary" style={{ justifyContent: 'center' }} onClick={() => wizard.goToStep('preview')}>
              {t('common.retry', 'Retry')}
            </button>
            <button className="btn-action btn-action-secondary" style={{ justifyContent: 'center' }} onClick={() => wizard.closeWizard()}>
              {t('common.cancel', 'Cancel')}
            </button>
          </>
        )}
      </div>

    </div>
  );
}
