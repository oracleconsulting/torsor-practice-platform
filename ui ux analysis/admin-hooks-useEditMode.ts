import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SectionId, MAReportConfig } from '../types/bi-dashboard';

const DEFAULT_SECTION_ORDER: SectionId[] = [
  'tuesday_question',
  'true_cash',
  'cash_forecast',
  'insights',
  'profitability',
  'kpis',
];

const DEFAULT_VISIBILITY: Record<SectionId, boolean> = {
  tuesday_question: true,
  true_cash: true,
  cash_forecast: true,
  insights: true,
  profitability: true,
  kpis: true,
  revenue_trend: true,
  documents: true,
};

interface UseEditModeReturn {
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  sectionOrder: SectionId[];
  setSectionOrder: (order: SectionId[]) => void;
  sectionsVisible: Record<SectionId, boolean>;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  hasChanges: boolean;
  saving: boolean;
  saveConfig: () => Promise<void>;
  reorderSection: (fromIndex: number, toIndex: number) => void;
}

export function useEditMode(
  periodId: string, 
  initialConfig: MAReportConfig | null
): UseEditModeReturn {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionOrder, setSectionOrderState] = useState<SectionId[]>(
    (initialConfig?.section_order as SectionId[]) || DEFAULT_SECTION_ORDER
  );
  const [sectionsVisible, setSectionsVisible] = useState<Record<SectionId, boolean>>(
    (initialConfig?.sections_visible as Record<SectionId, boolean>) || DEFAULT_VISIBILITY
  );
  const [hasChanges, setHasChanges] = useState(false);

  const setSectionOrder = useCallback((order: SectionId[]) => {
    setSectionOrderState(order);
    setHasChanges(true);
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: SectionId) => {
    setSectionsVisible(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
    setHasChanges(true);
  }, []);

  const reorderSection = useCallback((fromIndex: number, toIndex: number) => {
    setSectionOrderState(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return newOrder;
    });
    setHasChanges(true);
  }, []);

  const saveConfig = useCallback(async () => {
    if (!periodId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ma_report_config')
        .upsert({
          period_id: periodId,
          section_order: sectionOrder,
          sections_visible: sectionsVisible,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'period_id',
        });
      
      if (error) throw error;
      setHasChanges(false);
    } catch (error) {
      console.error('[useEditMode] Error saving config:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [periodId, sectionOrder, sectionsVisible]);

  return {
    editMode,
    setEditMode,
    sectionOrder,
    setSectionOrder,
    sectionsVisible,
    toggleSectionVisibility,
    hasChanges,
    saving,
    saveConfig,
    reorderSection,
  };
}


