import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

const MOCK_VENDORS = [
  { name: 'Ravi Enterprises', gstin: '29AABCR1234F1ZS' },
  { name: 'Sahil Traders', gstin: '27AAACS2222B1Z5' },
  { name: 'Metro Retail Co.', gstin: '07AAACM5678K1ZP' },
  { name: 'Alpha Supplies', gstin: '24AAACA7890L1Z3' },
  { name: 'Kumar & Sons', gstin: '09AAACK4567N1Z1' },
  { name: 'Bharat Logistics', gstin: '06AAACB5432F1Z7' },
  { name: 'Sharma Traders (OCR)', gstin: '27AADCS1234F1Z9' },
];

export default function BasicDetailsStep({ wizard }: Props) {
  const { t } = useTranslation();
  const { data } = wizard.state;
  const isOcr = data.source === 'ocr';
  
  // Local state for the form so we don't trigger rerenders on every keystroke in parent
  const [vendorName, setVendorName] = useState(data.vendorName);
  const [vendorGstin, setVendorGstin] = useState(data.vendorGstin);
  const [invoiceNo, setInvoiceNo] = useState(data.invoiceNo);
  const [invoiceDate, setInvoiceDate] = useState(data.invoiceDate);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const filteredVendors = vendorName.trim() ? MOCK_VENDORS.filter(v => v.name.toLowerCase().includes(vendorName.toLowerCase())) : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasOcrWarnings = isOcr && data.needsChecking && Object.keys(data.needsChecking).length > 0;

  const handleNext = () => {
    // Basic validation
    const newErrors: { [key: string]: string } = {};
    if (!vendorName.trim()) newErrors.vendorName = t('purchase.err_req', 'Required field');
    if (!invoiceNo.trim()) newErrors.invoiceNo = t('purchase.err_req', 'Required field');
    if (!invoiceDate) newErrors.invoiceDate = t('purchase.err_req', 'Required field');
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear OCR warnings once user proceeds (they "reviewed" it)
    wizard.updateData({
      vendorName, vendorGstin, invoiceNo, invoiceDate,
      needsChecking: undefined
    });
    wizard.goToStep('items');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* OCR Feedback Banner */}
      {isOcr && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '8px',
          background: hasOcrWarnings ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
          color: hasOcrWarnings ? '#D97706' : '#059669',
          fontSize: '14px', fontWeight: 500
        }}>
          {hasOcrWarnings ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {hasOcrWarnings ? t('purchase.ocr_warn', 'Please check highlighted fields') : t('purchase.ocr_ok', 'Most details look good')}
        </div>
      )}

      {/* Scanned Image Preview */}
      {data.imageUrl && (
        <div style={{
          width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden',
          border: '1px solid var(--border-color)', position: 'relative', flexShrink: 0,
          background: '#000'
        }}>
          <img 
            src={data.imageUrl} 
            alt="Scanned Bill" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>
            {t('purchase.scanned_doc', 'Scanned Document')}
          </div>
        </div>
      )}

      {/* Form Fields using Parties.css field classes */}
      <div className="modal-form" style={{ flex: 1 }}>
        <div className="field-group" style={{ position: 'relative' }} ref={suggestionsRef}>
          <label className="field-label">{t('purchase.vendor_name', 'Vendor Name')} *</label>
          <input 
            type="text" 
            className="field-input" 
            style={{ borderColor: errors.vendorName || data.needsChecking?.vendorName ? 'var(--border-error, #EF4444)' : undefined }}
            value={vendorName} 
            onChange={e => { 
              setVendorName(e.target.value); 
              setErrors(prev => ({...prev, vendorName: ''})); 
              setShowSuggestions(true);
            }}
            onFocus={() => { if (vendorName) setShowSuggestions(true); }}
            placeholder="Search or enter new..."
          />
          {errors.vendorName && <span style={{ color: '#EF4444', fontSize: '11px' }}>{errors.vendorName}</span>}
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && filteredVendors.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '6px', marginTop: '4px', zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
              {filteredVendors.map((v, i) => (
                <div 
                  key={i}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', borderBottom: i === filteredVendors.length - 1 ? 'none' : '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--bg-card)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onClick={() => {
                    setVendorName(v.name);
                    setVendorGstin(v.gstin);
                    setShowSuggestions(false);
                    setErrors(prev => ({...prev, vendorName: ''}));
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{v.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.gstin}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-row">
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">{t('purchase.invoice_no', 'Invoice Number')} *</label>
            <input 
              type="text" 
              className="field-input" 
              style={{ borderColor: errors.invoiceNo || data.needsChecking?.invoiceNo ? '#FBBF24' : undefined }}
              value={invoiceNo} 
              onChange={e => { setInvoiceNo(e.target.value); setErrors(prev => ({...prev, invoiceNo: ''})); }}
            />
            {errors.invoiceNo && <span style={{ color: '#EF4444', fontSize: '11px' }}>{errors.invoiceNo}</span>}
            {data.needsChecking?.invoiceNo && <span style={{ color: '#D97706', fontSize: '11px' }}>{t('purchase.check_value', 'Please verify this value')}</span>}
          </div>

          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">{t('purchase.invoice_date', 'Invoice Date')} *</label>
            <input 
              type="date" 
              className="field-input" 
              value={invoiceDate} 
              onChange={e => { setInvoiceDate(e.target.value); setErrors(prev => ({...prev, invoiceDate: ''})); }}
            />
            {errors.invoiceDate && <span style={{ color: '#EF4444', fontSize: '11px' }}>{errors.invoiceDate}</span>}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">{t('purchase.vendor_gstin', 'Vendor GSTIN')} (Optional)</label>
          <input 
            type="text" 
            className="field-input" 
            value={vendorGstin} 
            onChange={e => setVendorGstin(e.target.value.toUpperCase())}
            placeholder="e.g. 27AADCS..."
            maxLength={15}
          />
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <button className="btn-action btn-action-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleNext}>
          {t('common.continue', 'Continue')} <ArrowRight size={16}/>
        </button>
      </div>

    </div>
  );
}
