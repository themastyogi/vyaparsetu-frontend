import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useCompany } from '../../../hooks/useCompany';
import type { PurchaseLineItem } from '../types';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

const MOCK_ITEMS = [
  { name: 'A4 Paper Ream', price: 450 },
  { name: 'Office Chair – Mesh', price: 8500 },
  { name: 'Accounting Software', price: 5999 },
  { name: 'Printer Ink Cartridge', price: 1200 },
  { name: 'Rice Basmati 5kg', price: 380 },
  { name: 'Transport Charges', price: 2500 },
  { name: 'Stapler Machine', price: 650 },
  { name: 'Premium Widget', price: 1200 },
  { name: 'Basic Widget', price: 450 },
];

export default function ItemsStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  const company = useCompany();
  
  // Local state for items
  const [items, setItems] = useState<PurchaseLineItem[]>(data.items.length > 0 ? data.items : [
    { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, gstRate: 18 }
  ]);

  // Local state for discount & charges
  const [discount, setDiscount] = useState(data.discount || { type: 'fixed', value: 0 });
  const [charges, setCharges] = useState(data.charges || []);

  // Autocomplete state
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setActiveItemIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: '', qty: 1, rate: 0, gstRate: 18 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // --- Calculation Engine ---
  
  // 1. Subtotal
  const subtotal = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

  // 2. Discount Amount
  const discountAmount = discount.type === 'percentage' 
    ? (subtotal * (discount.value || 0)) / 100 
    : (discount.value || 0);
  const safeDiscount = Math.min(Math.max(0, discountAmount), subtotal);

  // 3. Discount Distribution & Item-Level GST
  let totalGst = 0;
  if (subtotal > 0) {
    items.forEach(item => {
      const itemVal = (item.qty || 0) * (item.rate || 0);
      const itemRatio = itemVal / subtotal;
      const itemDiscount = safeDiscount * itemRatio;
      const itemTaxable = itemVal - itemDiscount;
      const itemGst = itemTaxable * ((item.gstRate || 0) / 100);
      totalGst += itemGst;
    });
  }

  // 4. Charges Handling
  let totalTaxableCharges = 0;
  let totalNonTaxableCharges = 0;
  charges.forEach(c => {
    const amt = c.amount || 0;
    if (c.isTaxable) {
      totalTaxableCharges += amt;
      totalGst += amt * ((c.taxRate || 18) / 100);
    } else {
      totalNonTaxableCharges += amt;
    }
  });

  // 5. Taxable Value
  const totalTaxableValue = subtotal - safeDiscount + totalTaxableCharges;

  // 6. GST Type Determination
  const vendorStateCode = data.vendorGstin ? data.vendorGstin.substring(0, 2) : 'unknown';
  // If vendor GSTIN is unknown, default to intra-state (CGST/SGST)
  const isInterState = vendorStateCode !== 'unknown' && vendorStateCode !== company.stateCode;

  // 7. Final Total
  const total = totalTaxableValue + totalGst + totalNonTaxableCharges;

  const handleNext = () => {
    // Filter out empty items
    const validItems = items.filter(i => i.name.trim() !== '' && i.qty > 0 && i.rate > 0);
    if (validItems.length === 0) {
      alert(t('purchase.err_no_items', 'Please add at least one valid item'));
      return;
    }
    wizard.updateData({ items: validItems, discount, charges });
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

            <div className="field-group" style={{ marginBottom: '12px', position: 'relative' }}>
              <input 
                type="text" className="field-input" placeholder={t('purchase.item_name_ph', 'Item name or description')}
                value={item.name} 
                onChange={e => {
                  updateItem(index, 'name', e.target.value);
                  setActiveItemIndex(index);
                }}
                onFocus={() => { if (item.name) setActiveItemIndex(index); }}
              />
              
              {/* Autocomplete Dropdown */}
              {activeItemIndex === index && item.name.trim() && (
                (() => {
                  const filtered = MOCK_ITEMS.filter(i => i.name.toLowerCase().includes(item.name.toLowerCase()));
                  if (filtered.length === 0) return null;
                  
                  return (
                    <div ref={suggestionsRef} style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', marginTop: '4px', zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden'
                    }}>
                      {filtered.map((mockItem, idx) => (
                        <div 
                          key={idx}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                          onClick={() => {
                            const newItems = [...items];
                            newItems[index] = { ...newItems[index], name: mockItem.name, rate: mockItem.price };
                            setItems(newItems);
                            setActiveItemIndex(null);
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{mockItem.name}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>₹ {mockItem.price}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            <div className="modal-row">
              <div className="field-group" style={{ flex: 1 }}>
                <label className="field-label">{t('purchase.qty', 'Qty')}</label>
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
              <div className="field-group" style={{ flex: 1 }}>
                <label className="field-label">{t('purchase.gst_rate', 'GST Rate')}</label>
                <select 
                  className="field-input" 
                  value={item.gstRate || 0} 
                  onChange={e => updateItem(index, 'gstRate', parseFloat(e.target.value))}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
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

      {/* Additional Charges Section */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <button 
          onClick={() => setCharges([...charges, { id: crypto.randomUUID(), name: '', amount: 0, isTaxable: false, taxRate: 18 }])}
          style={{ 
            background: 'none', border: 'none', color: 'var(--brand-primary)', 
            fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0
          }}>
          + Add Charges (Freight, Handling, etc.)
        </button>
        {charges.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
            <input 
              type="text" className="field-input" placeholder="Name" value={c.name} style={{ flex: 2 }}
              onChange={e => {
                const next = [...charges]; next[i].name = e.target.value; setCharges(next);
              }}
            />
            <input 
              type="number" className="field-input" placeholder="Amount" value={c.amount || ''} style={{ flex: 1 }}
              onChange={e => {
                const next = [...charges]; next[i].amount = parseFloat(e.target.value) || 0; setCharges(next);
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', gap: '4px' }}>
              <input 
                type="checkbox" checked={c.isTaxable} 
                onChange={e => {
                  const next = [...charges]; next[i].isTaxable = e.target.checked; setCharges(next);
                }} 
              /> Taxable
            </label>
            <button onClick={() => setCharges(charges.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Sticky Footer Summary */}
      <div style={{ 
        background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)', 
        padding: '16px 20px', margin: '0 -24px -24px -24px'
      }}>
        {/* Discount Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Discount</span>
          <div style={{ display: 'flex', gap: '8px', width: '120px' }}>
            <select 
              className="field-input" style={{ padding: '4px', fontSize: '12px' }}
              value={discount.type} onChange={e => setDiscount({ ...discount, type: e.target.value as 'percentage' | 'fixed' })}
            >
              <option value="fixed">₹</option>
              <option value="percentage">%</option>
            </select>
            <input 
              type="number" className="field-input" style={{ padding: '4px', fontSize: '12px' }}
              value={discount.value || ''} onChange={e => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <span>{t('purchase.taxable_value', 'Taxable Value')}</span>
          <span>₹ {totalTaxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        
        {isInterState ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>IGST</span>
            <span>₹ {totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>CGST</span>
              <span>₹ {(totalGst / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <span>SGST</span>
              <span>₹ {(totalGst / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </>
        )}
        
        {totalNonTaxableCharges > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span>Non-Taxable Charges</span>
            <span>₹ {totalNonTaxableCharges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          <span>{t('purchase.total', 'Total')}</span>
          <span>₹ {total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        <button className="btn-action btn-action-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleNext}>
          {t('common.next', 'Next')} <ArrowRight size={16}/>
        </button>
      </div>

    </div>
  );
}
