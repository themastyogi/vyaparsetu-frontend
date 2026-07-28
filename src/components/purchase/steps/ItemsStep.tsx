import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowRight, Sparkles, X, Tag, Layers } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';
import { useCompany } from '../../../hooks/useCompany';
import { useMaster } from '../../../hooks/useMaster';
import type { PurchaseLineItem } from '../types';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

// Standard Chart of Accounts (COA) Expense Heads for Indian GST Businesses
export const COA_EXPENSE_HEADS = [
  'Consulting & Professional Fees',
  'Freight & Logistics Expenses',
  'IT & SaaS Subscriptions',
  'Legal & Audit Advisory Retainer',
  'Repair & Maintenance Expenses',
  'Advertising & Sales Promotion',
  'Office Supplies & Stationery',
  'Subcontracting & Job Work Charges',
  'General Operating Expenses',
  'Cost of Goods Sold (Raw Material)',
];

export const UOM_OPTIONS = ['Ream', 'Month', 'Job', 'Pcs', 'Box', 'Kg', 'Mtr', 'Set', 'Hours', 'Trip', 'Nos'];

export default function ItemsStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  const { items: masterItems, addMasterItem } = useMaster();
  const company = useCompany();
  
  // Local state for items
  const [items, setItems] = useState<PurchaseLineItem[]>(() => {
    if (data.items.length > 0) {
      return data.items.map(it => ({
        ...it,
        uom: it.uom || 'Pcs',
        accountHead: it.accountHead || suggestAccountHead(it.name || ''),
      }));
    }
    return [{ id: crypto.randomUUID(), name: '', qty: 1, uom: 'Pcs', rate: 0, gstRate: 18 }];
  });

  // Local state for discount & charges
  const [discount, setDiscount] = useState(data.discount || { type: 'fixed', value: 0 });
  const [charges, setCharges] = useState(data.charges || []);

  // Modal state for creating new Master Item
  const [showCreateItemModal, setShowCreateItemModal] = useState<number | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    description: '',
    hsn: '8471',
    unit: 'Ream',
    price: 0,
    gst: 18,
  });

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

  function suggestAccountHead(itemName: string): string {
    const lower = itemName.toLowerCase();
    if (lower.includes('freight') || lower.includes('delivery') || lower.includes('transport') || lower.includes('logistics')) {
      return 'Freight & Logistics Expenses';
    }
    if (lower.includes('service') || lower.includes('consult') || lower.includes('procurement') || lower.includes('advisory')) {
      return 'Consulting & Professional Fees';
    }
    if (lower.includes('software') || lower.includes('saas') || lower.includes('license') || lower.includes('cloud')) {
      return 'IT & SaaS Subscriptions';
    }
    if (lower.includes('paper') || lower.includes('office') || lower.includes('stationery') || lower.includes('ream')) {
      return 'Office Supplies & Stationery';
    }
    return 'General Operating Expenses';
  }

  const updateItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    const newItems = [...items];
    const updated = { ...newItems[index], [field]: value };
    if (field === 'name') {
      updated.accountHead = suggestAccountHead(value);
    }
    newItems[index] = updated;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: '', qty: 1, uom: 'Pcs', rate: 0, gstRate: 18 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const openCreateItemModal = (index: number) => {
    const targetItem = items[index];
    setNewItemForm({
      name: targetItem.name || '',
      description: targetItem.description || '',
      hsn: targetItem.hsn || '8471',
      unit: targetItem.uom || 'Ream',
      price: targetItem.rate || 0,
      gst: targetItem.gstRate || 18,
    });
    setShowCreateItemModal(index);
  };

  const handleSaveNewMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (showCreateItemModal === null) return;
    
    const created = addMasterItem({
      name: newItemForm.name,
      hsn: newItemForm.hsn,
      gst: newItemForm.gst,
      unit: newItemForm.unit,
      price: newItemForm.price,
    });

    const index = showCreateItemModal;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      name: created.name,
      hsn: created.hsn,
      uom: created.unit,
      rate: created.price || newItems[index].rate,
      gstRate: created.gst || newItems[index].gstRate,
      masterItemId: created.id,
      isNewItem: true,
    };
    setItems(newItems);
    setShowCreateItemModal(null);
  };

  // Helper to find similar existing item in Master
  const findMasterMatch = (itemName: string) => {
    if (!itemName || itemName.length < 3) return null;
    const lower = itemName.toLowerCase();
    return masterItems.find(m => {
      const mLower = m.name.toLowerCase();
      return lower.includes(mLower) || mLower.includes(lower) || (lower.slice(0, 5) === mLower.slice(0, 5));
    });
  };

  // --- Calculation Engine ---
  const subtotal = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

  const discountAmount = discount.type === 'percentage' 
    ? (subtotal * (discount.value || 0)) / 100 
    : (discount.value || 0);
  const safeDiscount = Math.min(Math.max(0, discountAmount), subtotal);

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

  const totalTaxableValue = subtotal - safeDiscount + totalTaxableCharges;
  const vendorStateCode = data.vendorGstin ? data.vendorGstin.substring(0, 2) : 'unknown';
  const isInterState = data.taxMode === 'inter' || (data.taxMode !== 'intra' && vendorStateCode !== 'unknown' && vendorStateCode !== company.stateCode);
  const total = totalTaxableValue + totalGst + totalNonTaxableCharges;

  const handleNext = () => {
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
        {items.map((item, index) => {
          const lineTaxable = (item.qty || 0) * (item.rate || 0);
          const lineGst = lineTaxable * ((item.gstRate || 18) / 100);
          const lineTotal = lineTaxable + lineGst;
          const matchedMaster = findMasterMatch(item.name);
          const isLinked = Boolean(matchedMaster || item.masterItemId);
          const isServiceItem = Boolean(item.accountHead);

          return (
            <div key={item.id} style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', 
              borderRadius: '10px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} style={{ color: 'var(--brand-primary)' }}/> {t('purchase.item', 'Item')} {index + 1}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Rule 2 & 3: Hide Create New Item if item is linked OR if it is a Service Item */}
                  {!isLinked && !isServiceItem && (
                    <button
                      type="button"
                      onClick={() => openCreateItemModal(index)}
                      style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12}/> Create New Item
                    </button>
                  )}
                  {/* Rule 3: Remove Delete button for Service Items */}
                  {items.length > 1 && !isServiceItem && (
                    <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} title="Delete Item">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Master Matching Suggestion Banner or Linked Item Status */}
              {matchedMaster ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={13}/> Inventory Item Matched: <strong>{matchedMaster.name}</strong> (HSN: {matchedMaster.hsn || 'N/A'})
                  </span>
                  {item.name.toLowerCase() !== matchedMaster.name.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(index, 'name', matchedMaster.name);
                        if (matchedMaster.unit) updateItem(index, 'uom', matchedMaster.unit);
                        if (matchedMaster.gst) updateItem(index, 'gstRate', matchedMaster.gst);
                        updateItem(index, 'masterItemId', matchedMaster.id);
                      }}
                      style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Link Item
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>No item match found in Inventory Master.</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={item.accountHead ? true : false}
                      onChange={e => {
                        if (e.target.checked) {
                          updateItem(index, 'accountHead', suggestAccountHead(item.name || ''));
                        } else {
                          updateItem(index, 'accountHead', '');
                        }
                      }}
                    /> Is this a Service / Expense Item?
                  </label>
                </div>
              )}

              {/* Item Name Input with Autocomplete */}
              <div className="field-group" style={{ marginBottom: '10px', position: 'relative' }}>
                <label className="field-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ITEM NAME / PRODUCT SPECIFICATION</label>
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
                {activeItemIndex === index && (
                  (() => {
                    const filtered = masterItems.filter(i => i.name.toLowerCase().includes(item.name.toLowerCase()));
                    if (filtered.length === 0) return null;
                    
                    return (
                      <div ref={suggestionsRef} style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '6px', marginTop: '4px', zIndex: 50,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto'
                      }}>
                        {filtered.map((mItem, idx) => (
                          <div 
                            key={idx}
                            style={{
                              padding: '8px 12px', cursor: 'pointer', borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid var(--border-color)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                            onClick={() => {
                              const newItems = [...items];
                              newItems[index] = { 
                                ...newItems[index], 
                                name: mItem.name, 
                                uom: mItem.unit || newItems[index].uom || 'Pcs',
                                rate: mItem.price || newItems[index].rate, 
                                gstRate: mItem.gst || 18,
                                masterItemId: mItem.id,
                                accountHead: '' // Clear expense GL head because it's a matched inventory item!
                              };
                              setItems(newItems);
                              setActiveItemIndex(null);
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{mItem.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 8 }}>HSN: {mItem.hsn}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>₹ {mItem.price} / {mItem.unit}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Description / Sub-details */}
              <div className="field-group" style={{ marginBottom: '10px' }}>
                <label className="field-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>DESCRIPTION / SPECIFICATION (OPTIONAL)</label>
                <input 
                  type="text" className="field-input" placeholder="e.g. 80 GSM, 500 Sheets/Ream or Monthly Support"
                  value={item.description || ''} 
                  onChange={e => updateItem(index, 'description', e.target.value)}
                />
              </div>

              {/* Grid Inputs: Qty, UOM, Rate, GST Rate */}
              <div className="modal-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div className="field-group" style={{ flex: 1, minWidth: 80 }}>
                  <label className="field-label">{t('purchase.qty', 'Qty')}</label>
                  <input 
                    type="number" className="field-input" min="1"
                    value={item.qty || ''} onChange={e => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="field-group" style={{ flex: 1, minWidth: 90 }}>
                  <label className="field-label">UOM (Unit)</label>
                  <select 
                    className="field-input" 
                    value={item.uom || 'Pcs'} 
                    onChange={e => updateItem(index, 'uom', e.target.value)}
                  >
                    {UOM_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group" style={{ flex: 1.2, minWidth: 100 }}>
                  <label className="field-label">{t('purchase.rate', 'Rate (₹)')}</label>
                  <input 
                    type="number" className="field-input" min="0"
                    value={item.rate || ''} onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="field-group" style={{ flex: 1, minWidth: 90 }}>
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

              {/* Chart of Accounts (COA) Expense Head Selector - Rendered ONLY if NOT a matched inventory item AND marked as Service/Expense */}
              {!matchedMaster && item.accountHead && (
                <div className="field-group" style={{ marginBottom: 10 }}>
                  <label className="field-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Layers size={12}/> EXPENSE GL ACCOUNT HEAD (SERVICE / EXPENSE INVOICE)
                  </label>
                  <select 
                    className="field-input" 
                    value={item.accountHead} 
                    onChange={e => updateItem(index, 'accountHead', e.target.value)}
                  >
                    {COA_EXPENSE_HEADS.map(head => (
                      <option key={head} value={head}>{head}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Line Amount Summary Badges */}
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 600 }}>
                <span>Line Taxable: <strong style={{ color: 'var(--text-primary)' }}>₹ {lineTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                <span>GST ({item.gstRate || 18}%): <strong style={{ color: 'var(--brand-primary)' }}>₹ {lineGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                <span>Line Total: <strong style={{ color: '#10B981' }}>₹ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          );
        })}

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

      {/* Modal: Create New Item in Master Inventory */}
      {showCreateItemModal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={18} style={{ color: 'var(--brand-primary)' }}/> Create New Item in Master Inventory
              </h3>
              <button type="button" onClick={() => setShowCreateItemModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>

            <form onSubmit={handleSaveNewMasterItem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field-group">
                <label className="field-label">ITEM NAME</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                />
              </div>

              <div className="modal-row" style={{ display: 'flex', gap: 10 }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">HSN / SAC CODE</label>
                  <input
                    type="text"
                    required
                    className="field-input"
                    value={newItemForm.hsn}
                    onChange={e => setNewItemForm({ ...newItemForm, hsn: e.target.value })}
                  />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">UNIT OF MEASURE (UOM)</label>
                  <select
                    className="field-input"
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  >
                    {UOM_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-row" style={{ display: 'flex', gap: 10 }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">DEFAULT PRICE (₹)</label>
                  <input
                    type="number"
                    required
                    className="field-input"
                    value={newItemForm.price || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label">GST RATE (%)</label>
                  <select
                    className="field-input"
                    value={newItemForm.gst}
                    onChange={e => setNewItemForm({ ...newItemForm, gst: parseFloat(e.target.value) })}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-action btn-action-ghost" onClick={() => setShowCreateItemModal(null)}>Cancel</button>
                <button type="submit" className="btn-action btn-action-primary">Save to Inventory &amp; Link Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
