/**
 * PDF Export Button Component
 * Triggers PDF generation and download for BI reports
 */

import { useState } from 'react';
import { 
  FileDown, 
  Loader2, 
  Check, 
  AlertCircle,
  ChevronDown,
  FileText,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface PDFExportButtonProps {
  periodId: string;
  periodLabel: string;
  clientName?: string;
  engagementId?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showOptions?: boolean;
}

interface ExportOptions {
  includeComparisons: boolean;
  includeBudget: boolean;
  includeBalanceSheet: boolean;
  includeForecasts: boolean;
  includeScenarios: boolean;
  reportType: 'standard' | 'executive' | 'detailed';
}

type ExportStatus = 'idle' | 'generating' | 'success' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: ExportOptions = {
  includeComparisons: true,
  includeBudget: true,
  includeBalanceSheet: false,
  includeForecasts: true,
  includeScenarios: true,
  reportType: 'standard'
};

const REPORT_TYPES = [
  { 
    id: 'executive', 
    label: 'Executive Summary', 
    description: '2-page overview for busy owners',
    icon: Briefcase 
  },
  { 
    id: 'standard', 
    label: 'Standard Report', 
    description: 'Full BI report with all sections',
    icon: FileText 
  },
  { 
    id: 'detailed', 
    label: 'Detailed Analysis', 
    description: 'In-depth report with all breakdowns',
    icon: BarChart3 
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PDFExportButton({ 
  periodId, 
  periodLabel,
  engagementId,
  variant = 'primary',
  size = 'md',
  showOptions = false
}: PDFExportButtonProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Generate PDF
  const handleExport = async (selectedReportType?: string) => {
    setStatus('generating');
    setErrorMessage(null);
    setShowDropdown(false);
    
    const exportOptions = selectedReportType 
      ? { ...options, reportType: selectedReportType as ExportOptions['reportType'] }
      : options;
    
    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-bi-pdf', {
        body: {
          periodId,
          engagementId,
          options: exportOptions
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Open PDF in new tab
        window.open(data.url, '_blank');
        setStatus('success');
        
        // Reset to idle after showing success
        setTimeout(() => setStatus('idle'), 3000);
      } else if (data?.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || `BI-Report-${periodLabel.replace(/\s/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'PDF generation failed');
      
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 5000);
    }
  };
  
  // Quick export with default options
  const handleQuickExport = () => {
    handleExport();
  };
  
  // Style variants
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100',
    ghost: 'text-blue-600 hover:bg-blue-50 disabled:text-blue-300'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const buttonClass = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  const iconClass = iconSizes[size];
  
  // Render status icon
  const renderIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className={`${iconClass} animate-spin`} />;
      case 'success':
        return <Check className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      default:
        return <FileDown className={iconClass} />;
    }
  };
  
  // Render button text
  const renderText = () => {
    switch (status) {
      case 'generating':
        return 'Generating...';
      case 'success':
        return 'Downloaded!';
      case 'error':
        return 'Failed';
      default:
        return 'Export PDF';
    }
  };
  
  // Simple button without options
  if (!showOptions) {
    return (
      <button
        onClick={handleQuickExport}
        disabled={status === 'generating'}
        className={buttonClass}
        title={`Export ${periodLabel} as PDF`}
      >
        {renderIcon()}
        {renderText()}
      </button>
    );
  }
  
  // Button with dropdown options
  return (
    <div className="relative">
      <div className="flex">
        {/* Main button */}
        <button
          onClick={handleQuickExport}
          disabled={status === 'generating'}
          className={`${buttonClass} rounded-r-none`}
        >
          {renderIcon()}
          {renderText()}
        </button>
        
        {/* Dropdown toggle */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={status === 'generating'}
          className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-l-none border-l border-l-blue-500/30 px-2`}
        >
          <ChevronDown className={`${iconClass} ${showDropdown ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>
      
      {/* Dropdown menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)} 
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Report Type
              </p>
            </div>
            
            <div className="p-2">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = options.reportType === type.id;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleExport(type.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Options toggles */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Include Sections
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeComparisons}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeComparisons: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Budget & period comparisons
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeForecasts}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeForecasts: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Cash forecasts
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeScenarios}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeScenarios: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Scenario analysis
                </label>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Export failed</p>
              <p className="text-xs mt-1 text-red-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFExportButton;

