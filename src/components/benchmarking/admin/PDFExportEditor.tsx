/**
 * PDF Export Editor Modal
 * 
 * Integrated into BenchmarkingAdminView - allows customizing report sections
 * and settings before generating PDF export.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Download, Eye, EyeOff, Settings2, ChevronUp, ChevronDown,
  FileText, BarChart3, Target, TrendingUp, AlertTriangle, 
  DollarSign, CheckCircle, Layers, Layout, RotateCcw,
  Loader2, ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface SectionConfig {
  id: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface PdfSettings {
  pageSize: 'A4' | 'Letter';
  margins: { top: number; right: number; bottom: number; left: number };
  headerFooter: boolean;
  coverPage: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
}

interface Template {
  id: string;
  name: string;
  description: string;
  tier: number;
  sections: SectionConfig[];
  pdf_settings: PdfSettings;
  is_default: boolean;
}

interface PDFExportEditorProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportData: any;
  onExportComplete?: (pdfUrl: string) => void;
}

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

const SECTION_LIBRARY: Record<string, {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'structure' | 'narrative' | 'analysis' | 'action' | 'strategy';
  required: boolean;
  tier2Only?: boolean;
  configOptions?: Array<{
    key: string;
    label: string;
    type: 'checkbox' | 'select';
    options?: Array<{ value: string; label: string }>;
    default: any;
  }>;
}> = {
  cover: {
    id: 'cover',
    name: 'Cover Page',
    description: 'Branded cover with client name and overall percentile',
    icon: FileText,
    category: 'structure',
    required: true,
  },
  executiveSummary: {
    id: 'executiveSummary',
    name: 'Executive Summary',
    description: 'Overview with hero metrics and key findings',
    icon: FileText,
    category: 'narrative',
    required: true,
    configOptions: [
      { key: 'showHeroMetrics', label: 'Show hero metrics row', type: 'checkbox', default: true },
    ],
  },
  hiddenValue: {
    id: 'hiddenValue',
    name: 'Hidden Value',
    description: 'Surplus cash, working capital, property assets',
    icon: DollarSign,
    category: 'analysis',
    required: false,
    configOptions: [
      { key: 'showBreakdown', label: 'Show component breakdown', type: 'checkbox', default: true },
    ],
  },
  keyMetrics: {
    id: 'keyMetrics',
    name: 'Key Metrics',
    description: 'Benchmark comparisons with percentile rankings',
    icon: BarChart3,
    category: 'analysis',
    required: true,
    configOptions: [
      { 
        key: 'layout', 
        label: 'Layout style', 
        type: 'select', 
        options: [
          { value: 'compact', label: 'Compact (2x2 grid)' },
          { value: 'detailed', label: 'Detailed (with bars)' },
          { value: 'full', label: 'Full (all details)' },
        ],
        default: 'detailed',
      },
      { key: 'showPercentileBars', label: 'Show percentile bars', type: 'checkbox', default: true },
      { key: 'showGapIndicators', label: 'Show gap/advantage indicators', type: 'checkbox', default: true },
    ],
  },
  positionNarrative: {
    id: 'positionNarrative',
    name: 'Where You Stand',
    description: 'Analysis of current market position',
    icon: Target,
    category: 'narrative',
    required: true,
  },
  strengthsNarrative: {
    id: 'strengthsNarrative',
    name: 'Your Strengths',
    description: 'Areas of competitive advantage',
    icon: TrendingUp,
    category: 'narrative',
    required: false,
  },
  gapsNarrative: {
    id: 'gapsNarrative',
    name: 'Performance Gaps',
    description: 'Areas requiring improvement',
    icon: AlertTriangle,
    category: 'narrative',
    required: true,
  },
  opportunityNarrative: {
    id: 'opportunityNarrative',
    name: 'The Opportunity',
    description: 'Quantified improvement potential',
    icon: DollarSign,
    category: 'narrative',
    required: true,
  },
  recommendations: {
    id: 'recommendations',
    name: 'Recommendations',
    description: 'Prioritized actions to capture value',
    icon: CheckCircle,
    category: 'action',
    required: true,
    configOptions: [
      {
        key: 'detailLevel',
        label: 'Detail level',
        type: 'select',
        options: [
          { value: 'summary', label: 'Summary (what to do)' },
          { value: 'standard', label: 'Standard' },
          { value: 'full', label: 'Full (how to do it)' },
        ],
        default: 'standard',
      },
      { key: 'showImplementationSteps', label: 'Show implementation steps', type: 'checkbox', default: false },
      { key: 'showStartThisWeek', label: 'Show "Start this week" actions', type: 'checkbox', default: false },
    ],
  },
  scenarioExplorer: {
    id: 'scenarioExplorer',
    name: 'Scenario Explorer',
    description: 'Interactive margin impact context',
    icon: BarChart3,
    category: 'analysis',
    required: false,
    tier2Only: true,
  },
  valuationAnalysis: {
    id: 'valuationAnalysis',
    name: 'Business Valuation',
    description: 'Value bridge from baseline to current',
    icon: DollarSign,
    category: 'analysis',
    required: true,
    configOptions: [
      { key: 'showSurplusCashAdd', label: 'Show surplus cash addition', type: 'checkbox', default: true },
    ],
  },
  valueSuppressors: {
    id: 'valueSuppressors',
    name: 'Value Suppressors',
    description: 'Factors discounting business value',
    icon: AlertTriangle,
    category: 'analysis',
    required: true,
    configOptions: [
      {
        key: 'layout',
        label: 'Layout style',
        type: 'select',
        options: [
          { value: 'cards', label: 'Cards (detailed)' },
          { value: 'table', label: 'Table (compact)' },
        ],
        default: 'cards',
      },
      { key: 'showRecoveryTimelines', label: 'Show recovery timelines', type: 'checkbox', default: true },
      { key: 'showTargetStates', label: 'Show current/target states', type: 'checkbox', default: true },
    ],
  },
  exitReadiness: {
    id: 'exitReadiness',
    name: 'Exit Readiness',
    description: 'Score breakdown and path to 70',
    icon: Target,
    category: 'analysis',
    required: true,
    configOptions: [
      { key: 'showComponentBreakdown', label: 'Show component breakdown', type: 'checkbox', default: true },
      { key: 'showPathTo70', label: 'Show path to 70/100', type: 'checkbox', default: true },
    ],
  },
  twoPaths: {
    id: 'twoPaths',
    name: 'Two Paths',
    description: 'Operational vs strategic improvement paths',
    icon: Layers,
    category: 'strategy',
    required: false,
    tier2Only: true,
  },
  scenarioPlanning: {
    id: 'scenarioPlanning',
    name: 'Scenario Planning',
    description: 'Do Nothing / Diversify / Exit scenarios',
    icon: Layout,
    category: 'strategy',
    required: true,
    configOptions: [
      {
        key: 'layout',
        label: 'Layout style',
        type: 'select',
        options: [
          { value: 'sequential', label: 'Sequential (detailed)' },
          { value: 'table', label: 'Comparison table' },
        ],
        default: 'sequential',
      },
      { key: 'showRequirements', label: 'Show requirements', type: 'checkbox', default: true },
    ],
  },
  serviceRecommendations: {
    id: 'serviceRecommendations',
    name: 'How We Can Help',
    description: 'Recommended services with pricing',
    icon: CheckCircle,
    category: 'action',
    required: false,
    tier2Only: true,
    configOptions: [
      { key: 'showPricing', label: 'Show pricing', type: 'checkbox', default: true },
      { key: 'showValueAtStake', label: 'Show value at stake', type: 'checkbox', default: true },
      { key: 'showOutcomes', label: 'Show expected outcomes', type: 'checkbox', default: true },
    ],
  },
  closingSummary: {
    id: 'closingSummary',
    name: 'Summary & Contact',
    description: 'Closing summary with CTA',
    icon: FileText,
    category: 'structure',
    required: true,
    configOptions: [
      { key: 'showContactCTA', label: 'Show contact CTA', type: 'checkbox', default: true },
      { key: 'showDataSources', label: 'Show data sources', type: 'checkbox', default: false },
    ],
  },
};

const CATEGORY_INFO = {
  structure: { name: 'Structure', color: 'slate', bgClass: 'bg-slate-100', textClass: 'text-slate-700' },
  narrative: { name: 'Narratives', color: 'blue', bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
  analysis: { name: 'Analysis', color: 'emerald', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' },
  action: { name: 'Actions', color: 'amber', bgClass: 'bg-amber-50', textClass: 'text-amber-700' },
  strategy: { name: 'Strategy', color: 'purple', bgClass: 'bg-purple-50', textClass: 'text-purple-700' },
};

// =============================================================================
// DEFAULT CONFIGS
// =============================================================================

const DEFAULT_TIER1_SECTIONS: SectionConfig[] = [
  { id: 'cover', enabled: true, config: {} },
  { id: 'executiveSummary', enabled: true, config: { showHeroMetrics: true } },
  { id: 'hiddenValue', enabled: true, config: {} },
  { id: 'keyMetrics', enabled: true, config: { layout: 'detailed', showPercentileBars: true } },
  { id: 'positionNarrative', enabled: true, config: {} },
  { id: 'strengthsNarrative', enabled: true, config: {} },
  { id: 'gapsNarrative', enabled: true, config: {} },
  { id: 'opportunityNarrative', enabled: true, config: {} },
  { id: 'recommendations', enabled: true, config: { detailLevel: 'summary', showImplementationSteps: false } },
  { id: 'valuationAnalysis', enabled: true, config: {} },
  { id: 'valueSuppressors', enabled: true, config: { layout: 'table' } },
  { id: 'exitReadiness', enabled: true, config: { showPathTo70: false } },
  { id: 'scenarioPlanning', enabled: true, config: { layout: 'table' } },
  { id: 'closingSummary', enabled: true, config: { showContactCTA: true } },
];

const DEFAULT_TIER2_SECTIONS: SectionConfig[] = [
  { id: 'cover', enabled: true, config: {} },
  { id: 'executiveSummary', enabled: true, config: { showHeroMetrics: true } },
  { id: 'hiddenValue', enabled: true, config: { showBreakdown: true } },
  { id: 'keyMetrics', enabled: true, config: { layout: 'full', showPercentileBars: true, showGapIndicators: true } },
  { id: 'positionNarrative', enabled: true, config: {} },
  { id: 'strengthsNarrative', enabled: true, config: {} },
  { id: 'gapsNarrative', enabled: true, config: {} },
  { id: 'opportunityNarrative', enabled: true, config: {} },
  { id: 'recommendations', enabled: true, config: { detailLevel: 'full', showImplementationSteps: true, showStartThisWeek: true } },
  { id: 'scenarioExplorer', enabled: true, config: {} },
  { id: 'valuationAnalysis', enabled: true, config: { showSurplusCashAdd: true } },
  { id: 'valueSuppressors', enabled: true, config: { layout: 'cards', showRecoveryTimelines: true } },
  { id: 'exitReadiness', enabled: true, config: { showComponentBreakdown: true, showPathTo70: true } },
  { id: 'twoPaths', enabled: true, config: {} },
  { id: 'scenarioPlanning', enabled: true, config: { layout: 'sequential', showRequirements: true } },
  { id: 'serviceRecommendations', enabled: true, config: { showPricing: true, showValueAtStake: true, showOutcomes: true } },
  { id: 'closingSummary', enabled: true, config: { showContactCTA: true, showDataSources: true } },
];

const DEFAULT_PDF_SETTINGS: PdfSettings = {
  pageSize: 'A4',
  margins: { top: 12, right: 12, bottom: 12, left: 12 },
  headerFooter: true,
  coverPage: true,
  density: 'comfortable',
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SectionItem: React.FC<{
  section: SectionConfig;
  index: number;
  totalCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ section, index, totalCount, isSelected, onSelect, onToggle, onMoveUp, onMoveDown }) => {
  const def = SECTION_LIBRARY[section.id];
  if (!def) return null;
  
  const Icon = def.icon;
  const cat = CATEGORY_INFO[def.category];
  
  return (
    <div
      className={`group flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : section.enabled
          ? 'border-slate-200 bg-white hover:border-slate-300'
          : 'border-slate-200 bg-slate-50 opacity-60'
      }`}
      onClick={onSelect}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={index === 0}
          className={`p-0.5 rounded text-xs ${index === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={index === totalCount - 1}
          className={`p-0.5 rounded text-xs ${index === totalCount - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      
      {/* Enable/disable toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!def.required) onToggle(); }}
        disabled={def.required}
        className={`p-1 rounded ${def.required ? 'text-slate-300' : section.enabled ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'}`}
      >
        {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      
      {/* Category badge */}
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cat.bgClass} ${cat.textClass}`}>
        {def.category.charAt(0).toUpperCase()}
      </span>
      
      {/* Icon */}
      <Icon className={`w-4 h-4 ${section.enabled ? 'text-slate-600' : 'text-slate-400'}`} />
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm truncate ${section.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
          {def.name}
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex items-center gap-1">
        {def.tier2Only && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">T2</span>
        )}
        {def.required && (
          <span className="text-xs text-slate-400">Required</span>
        )}
        {def.configOptions && section.enabled && (
          <Settings2 className="w-3 h-3 text-slate-400" />
        )}
      </div>
    </div>
  );
};

const SectionConfigPanel: React.FC<{
  section: SectionConfig | null;
  onUpdateConfig: (key: string, value: any) => void;
}> = ({ section, onUpdateConfig }) => {
  if (!section) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm p-4">
        Select a section to configure
      </div>
    );
  }
  
  const def = SECTION_LIBRARY[section.id];
  if (!def) return null;
  
  const Icon = def.icon;
  const cat = CATEGORY_INFO[def.category];
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${cat.bgClass}`}>
          <Icon className={`w-5 h-5 ${cat.textClass}`} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{def.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
          <div className="flex gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded ${cat.bgClass} ${cat.textClass}`}>
              {cat.name}
            </span>
            {def.required && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">Required</span>
            )}
            {def.tier2Only && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600">Tier 2 only</span>
            )}
          </div>
        </div>
      </div>
      
      {def.configOptions && def.configOptions.length > 0 && (
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</h4>
          {def.configOptions.map((opt) => (
            <div key={opt.key}>
              {opt.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.config[opt.key] ?? opt.default}
                    onChange={(e) => onUpdateConfig(opt.key, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{opt.label}</span>
                </label>
              ) : opt.type === 'select' ? (
                <label className="block text-sm">
                  <span className="text-slate-700 font-medium">{opt.label}</span>
                  <select
                    value={section.config[opt.key] ?? opt.default}
                    onChange={(e) => onUpdateConfig(opt.key, e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {opt.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ))}
        </div>
      )}
      
      {(!def.configOptions || def.configOptions.length === 0) && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500 italic">No additional options for this section.</p>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const PDFExportEditor: React.FC<PDFExportEditorProps> = ({
  isOpen,
  onClose,
  reportId,
  reportData,
  onExportComplete,
}) => {
  // State
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_TIER2_SECTIONS);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [selectedTier, setSelectedTier] = useState<1 | 2>(2);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'settings'>('sections');
  
  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase
        .from('benchmarking_report_templates')
        .select('*')
        .order('tier', { ascending: true });
      
      if (data) {
        setTemplates(data);
      }
    };
    
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);
  
  // Load existing report config
  useEffect(() => {
    if (isOpen && reportData?.pdf_config) {
      setSections(reportData.pdf_config.sections || DEFAULT_TIER2_SECTIONS);
      setPdfSettings(reportData.pdf_config.pdfSettings || DEFAULT_PDF_SETTINGS);
      setSelectedTier(reportData.pdf_config.tier || 2);
    }
  }, [isOpen, reportData]);
  
  // Handlers
  const handleTierChange = useCallback((tier: 1 | 2) => {
    setSelectedTier(tier);
    setSections(tier === 1 ? DEFAULT_TIER1_SECTIONS : DEFAULT_TIER2_SECTIONS);
    setSelectedIndex(null);
  }, []);
  
  const handleTemplateChange = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSections(template.sections);
      setPdfSettings(template.pdf_settings);
      setSelectedTier(template.tier as 1 | 2);
      setSelectedTemplateId(templateId);
    }
  }, [templates]);
  
  const handleToggleSection = useCallback((index: number) => {
    setSections(prev => {
      const updated = [...prev];
      const def = SECTION_LIBRARY[updated[index].id];
      if (!def?.required) {
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      }
      return updated;
    });
  }, []);
  
  const handleMoveSection = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    setSections(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
    setSelectedIndex(newIndex);
  }, [sections.length]);
  
  const handleUpdateConfig = useCallback((key: string, value: any) => {
    if (selectedIndex === null) return;
    
    setSections(prev => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        config: { ...updated[selectedIndex].config, [key]: value },
      };
      return updated;
    });
  }, [selectedIndex]);
  
  const handlePreview = useCallback(async () => {
    setIsPreviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-benchmarking-pdf', {
        body: {
          reportId,
          pdfConfig: { sections, pdfSettings, tier: selectedTier },
          returnHtml: true,
        },
      });
      
      if (error) throw error;
      
      // Open HTML in new window for preview
      const previewWindow = window.open('', '_blank');
      if (previewWindow && data.html) {
        previewWindow.document.write(data.html);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsPreviewing(false);
    }
  }, [reportId, sections, pdfSettings, selectedTier]);
  
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Save config to report first
      await supabase
        .from('bm_reports')
        .update({
          pdf_config: { sections, pdfSettings, tier: selectedTier },
          template_id: selectedTemplateId,
        })
        .eq('engagement_id', reportId);
      
      // Generate PDF
      const { data, error } = await supabase.functions.invoke('generate-benchmarking-pdf', {
        body: {
          reportId,
          pdfConfig: { sections, pdfSettings, tier: selectedTier },
          returnHtml: false,
        },
      });
      
      if (error) throw error;
      
      // If we got HTML back (no browser service configured), open for browser print
      if (data.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 500);
        }
      } else if (data instanceof Blob) {
        // Download PDF blob
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportData?.client?.name || 'Client'}-Benchmarking-Report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        onExportComplete?.(url);
      }
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [reportId, sections, pdfSettings, selectedTier, selectedTemplateId, reportData, onClose, onExportComplete]);
  
  // Computed values
  const selectedSection = selectedIndex !== null ? sections[selectedIndex] : null;
  const enabledCount = sections.filter(s => s.enabled).length;
  const estimatedPages = Math.ceil(enabledCount * 0.85);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] max-w-[95vw] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Export PDF Report</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedTier}
                onChange={(e) => handleTierChange(parseInt(e.target.value) as 1 | 2)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value={1}>Tier 1 - Insight (£2,000)</option>
                <option value={2}>Tier 2 - Clarity (£4,500)</option>
              </select>
              {templates.length > 0 && (
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => e.target.value && handleTemplateChange(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="">Custom</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Section list */}
          <div className="w-[400px] border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Report Sections</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {enabledCount} sections enabled · ~{estimatedPages} pages
                  </p>
                </div>
                <button
                  onClick={() => handleTierChange(selectedTier)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                  title="Reset to tier defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {sections.map((section, index) => (
                <SectionItem
                  key={`${section.id}-${index}`}
                  section={section}
                  index={index}
                  totalCount={sections.length}
                  isSelected={selectedIndex === index}
                  onSelect={() => setSelectedIndex(index)}
                  onToggle={() => handleToggleSection(index)}
                  onMoveUp={() => handleMoveSection(index, -1)}
                  onMoveDown={() => handleMoveSection(index, 1)}
                />
              ))}
            </div>
          </div>
          
          {/* Right panel - Config/Settings */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('sections')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Section Config
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                PDF Settings
              </button>
            </div>
            
            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'sections' ? (
                <SectionConfigPanel
                  section={selectedSection}
                  onUpdateConfig={handleUpdateConfig}
                />
              ) : (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Page Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm">
                        <span className="text-slate-600">Page Size</span>
                        <select
                          value={pdfSettings.pageSize}
                          onChange={(e) => setPdfSettings(s => ({ ...s, pageSize: e.target.value as 'A4' | 'Letter' }))}
                          className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        <span className="text-slate-600">Content Density</span>
                        <select
                          value={pdfSettings.density}
                          onChange={(e) => setPdfSettings(s => ({ ...s, density: e.target.value as any }))}
                          className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="compact">Compact (smaller text, less spacing)</option>
                          <option value="comfortable">Comfortable (balanced)</option>
                          <option value="spacious">Spacious (larger text, more breathing room)</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Margins (mm)</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                        <label key={side} className="block text-sm">
                          <span className="text-slate-600 capitalize">{side}</span>
                          <input
                            type="number"
                            min={5}
                            max={30}
                            value={pdfSettings.margins[side]}
                            onChange={(e) => setPdfSettings(s => ({
                              ...s,
                              margins: { ...s.margins, [side]: parseInt(e.target.value) || 12 },
                            }))}
                            className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pdfSettings.headerFooter}
                          onChange={(e) => setPdfSettings(s => ({ ...s, headerFooter: e.target.checked }))}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-slate-700">Include header and footer on each page</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pdfSettings.coverPage}
                          onChange={(e) => setPdfSettings(s => ({ ...s, coverPage: e.target.checked }))}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-slate-700">Include branded cover page</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              <strong>{selectedTier === 1 ? 'Tier 1 - Insight' : 'Tier 2 - Clarity'}</strong>
            </span>
            <span>{enabledCount} sections</span>
            <span>~{estimatedPages} pages</span>
          </div>
          <div>
            Client: <strong>{reportData?.client?.name || 'Unknown'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportEditor;
