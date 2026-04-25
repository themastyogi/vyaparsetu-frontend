
import { useTranslation } from 'react-i18next';
import { PackageSearch, Receipt, Briefcase, User, ArrowRight } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import type { PurchasePurpose } from '../types';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function PurposeStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;

  const handleSelect = (purpose: PurchasePurpose) => {
    wizard.updateData({ purpose });
    wizard.goToStep('preview');
  };

  const options: { id: PurchasePurpose; icon: React.ReactNode; title: string; desc: string }[] = [
    { id: 'stock', icon: <PackageSearch size={24}/>, title: t('purchase.purp_stock', 'Stock / Inventory'), desc: t('purchase.purp_stock_desc', 'Items you will resell') },
    { id: 'expense', icon: <Receipt size={24}/>, title: t('purchase.purp_expense', 'Business Expense'), desc: t('purchase.purp_exp_desc', 'Office supplies, rent, utilities') },
    { id: 'asset', icon: <Briefcase size={24}/>, title: t('purchase.purp_asset', 'Fixed Asset'), desc: t('purchase.purp_asset_desc', 'Computers, machinery, furniture') },
    { id: 'personal', icon: <User size={24}/>, title: t('purchase.purp_personal', 'Personal / Drawings'), desc: t('purchase.purp_pers_desc', 'Not related to business') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {options.map(opt => {
        const isSelected = data.purpose === opt.id;
        return (
          <div 
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '20px', borderRadius: '12px',
              background: isSelected ? 'rgba(108,71,255,0.05)' : 'var(--bg-card)',
              border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
              {opt.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{opt.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '20px' }}>
        <button className="btn-action btn-action-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => wizard.goToStep('preview')}>
          {t('common.continue', 'Continue')} <ArrowRight size={16}/>
        </button>
      </div>

    </div>
  );
}
