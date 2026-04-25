import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import type { PurchaseLineItem } from '../types';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function ItemsStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  
  // Local state for items
  const [items, setItems] = useState<PurchaseLineItem[]>(data.items.length > 0 ? data.items : [
    { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, discount: 0 }
  ]);

  const updateItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, discount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0) - (item.discount || 0)), 0);
  const estimatedGst = subtotal * 0.18; // Simple mock 18%
  const total = subtotal + estimatedGst;

  const handleNext = () => {
    // Filter out empty items
    const validItems = items.filter(i => i.name.trim() !== '' && i.qty > 0 && i.rate > 0);
    if (validItems.length === 0) {
      alert(t('purchase.err_no_items', 'Please add at least one valid item'));
      return;
    }
    wizard.updateData({ items: validItems });
    wizard.goToStep('purpose');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Items List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {items.map((item, index) => (
          <div key={item.id} style={{ 
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', 
            borderRadius: '8px', padding: '16px', marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('purchase.item', 'Item')} {index + 1}
              </span>
              {items.length > 1 && (
                <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="field-group" style={{ marginBottom: '12px' }}>
              <input 
                type="text" className="field-input" placeholder={t('purchase.item_name_ph', 'Item name or description')}
                value={item.name} onChange={e => updateItem(index, 'name', e.target.value)}
              />
            </div>

            <div className="modal-row">
              <div className="field-group" style={{ flex: 1 }}>
                <label className="field-label">{t('purchase.qty', 'Quantity')}</label>
                <input 
                  type="number" className="field-input" min="1"
                  value={item.qty || ''} onChange={e => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="field-group" style={{ flex: 1 }}>
                <label className="field-label">{t('purchase.rate', 'Rate')}</label>
                <input 
                  type="number" className="field-input" min="0"
                  value={item.rate || ''} onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addItem}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            background: 'none', border: '1px dashed var(--border-strong)', 
            color: 'var(--brand-primary)', width: '100%', padding: '12px',
            borderRadius: '8px', justifyContent: 'center', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer'
          }}>
          <Plus size={16}/> {t('purchase.add_item', 'Add Item')}
        </button>
      </div>

      {/* Sticky Footer Summary */}
      <div style={{ 
        background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)', 
        padding: '16px 20px', margin: '0 -24px -24px -24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <span>{t('purchase.subtotal', 'Subtotal')}</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          <span>{t('purchase.gst_est', 'GST (Est.)')}</span>
          <span>₹ {estimatedGst.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          <span>{t('purchase.total', 'Total')}</span>
          <span>₹ {total.toLocaleString('en-IN')}</span>
        </div>

        <button className="btn-action btn-action-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleNext}>
          {t('common.next', 'Next')} <ArrowRight size={16}/>
        </button>
      </div>

    </div>
  );
}
