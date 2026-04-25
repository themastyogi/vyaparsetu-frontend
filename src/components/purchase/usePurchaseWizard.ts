import { useState, useCallback, useEffect } from 'react';
import type { WizardState, WizardStep, PurchaseDraftData } from './types';
import { INITIAL_DRAFT_DATA } from './types';

const STORAGE_KEY = 'vyaparsetu_purchase_draft';

export function usePurchaseWizard() {
  const [state, setState] = useState<WizardState>(() => {
    // Attempt to load draft from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isOpen: false,
          step: 'entry_options',
          data: parsed,
          isProcessing: false,
        };
      }
    } catch (e) {
      console.error('Failed to load draft', e);
    }
    return {
      isOpen: false,
      step: 'entry_options',
      data: INITIAL_DRAFT_DATA,
      isProcessing: false,
    };
  });

  // Persist draft on data change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }, [state.data]);

  const openWizard = useCallback(() => {
    setState(s => ({ ...s, isOpen: true, step: 'entry_options' }));
  }, []);

  const closeWizard = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setState(s => ({ ...s, step, error: undefined }));
  }, []);

  const updateData = useCallback((updates: Partial<PurchaseDraftData>) => {
    setState(s => ({
      ...s,
      data: { ...s.data, ...updates }
    }));
  }, []);

  const clearDraft = useCallback(() => {
    setState(s => ({ ...s, data: INITIAL_DRAFT_DATA }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(s => ({ ...s, isProcessing }));
  }, []);

  const setError = useCallback((error?: string) => {
    setState(s => ({ ...s, error }));
  }, []);

  return {
    state,
    openWizard,
    closeWizard,
    goToStep,
    updateData,
    clearDraft,
    setProcessing,
    setError,
  };
}
