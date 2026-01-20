import { useState } from 'react';
import { 
  MessageSquare, 
  Save, 
  RefreshCw, 
  Check, 
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react';

interface MetricDefinition {
  code: string;
  name: string;
  unit: 'percent' | 'currency' | 'days' | 'ratio' | 'number';
  description: string;
  conversationScript: string;
  followUpQuestions: string[];
  benchmark?: {
    p25: number;
    p50: number;
    p75: number;
  };
  inputPlaceholder: string;
  inputHelp: string;
}

// Define all collectible metrics with conversation scripts
const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  'Utilisation Rate': {
    code: 'utilisation_rate',
    name: 'Utilisation Rate',
    unit: 'percent',
    description: 'The percentage of total available time spent on billable client work',
    conversationScript: `"One of the key metrics we need to properly assess your efficiency is utilisation rate - what percentage of your team's time is actually billable to clients. This helps us understand if the revenue gap is about capacity or pricing. How do you currently track billable versus non-billable time?"`,
    followUpQuestions: [
      'Do you use timesheet software, or estimate based on project hours?',
      'What would you estimate as your average billable utilisation across the team?',
      'Are there certain roles with higher/lower utilisation than others?'
    ],
    benchmark: { p25: 55, p50: 71, p75: 82 },
    inputPlaceholder: 'e.g., 65',
    inputHelp: 'Average % of time spent on billable work (industry median: 71%)'
  },
  'Hourly Rates': {
    code: 'blended_hourly_rate',
    name: 'Blended Hourly Rate',
    unit: 'currency',
    description: 'The average hourly rate charged across all billable staff',
    conversationScript: `"To understand if your revenue gap is a pricing issue or a volume issue, I need to understand your rate card. What's the typical hourly rate you charge for different levels of seniority? We can work out a blended average."`,
    followUpQuestions: [
      'What do you charge for junior developers/consultants?',
      'What about senior or lead roles?',
      'Do you have different rates for different types of work?',
      'How often do you discount from the rate card?'
    ],
    benchmark: { p25: 75, p50: 95, p75: 125 },
    inputPlaceholder: 'e.g., 85',
    inputHelp: 'Average hourly rate across all staff (industry median: £95/hr)'
  },
  'Project Margins': {
    code: 'avg_project_margin',
    name: 'Average Project Margin',
    unit: 'percent',
    description: 'The typical gross margin on projects after direct costs',
    conversationScript: `"Understanding your project profitability helps us see where value is being captured or lost. After you account for the direct costs of delivery - salaries, contractors, tools - what kind of margin do your projects typically generate?"`,
    followUpQuestions: [
      'Do you track margin at the project level currently?',
      'Are some project types more profitable than others?',
      'What happens to margin when projects overrun?'
    ],
    benchmark: { p25: 35, p50: 45, p75: 55 },
    inputPlaceholder: 'e.g., 40',
    inputHelp: 'Gross margin on projects after direct costs (industry median: 45%)'
  },
  'Client Concentration': {
    code: 'client_concentration_top3',
    name: 'Top 3 Client Concentration',
    unit: 'percent',
    description: 'What percentage of revenue comes from your three largest clients',
    conversationScript: `"Client concentration is a key risk factor for business valuation. If your top three clients represent more than 50% of revenue, that's typically flagged as a risk. Can you estimate what proportion of your revenue comes from your three biggest clients?"`,
    followUpQuestions: [
      'Who are your three largest clients by revenue?',
      'How long have they been clients?',
      'Do you have contracts or is it project-by-project?'
    ],
    benchmark: { p25: 25, p50: 40, p75: 60 },
    inputPlaceholder: 'e.g., 55',
    inputHelp: '% of revenue from top 3 clients (< 50% is healthy)'
  },
  'EBITDA Margin': {
    code: 'ebitda_margin',
    name: 'EBITDA Margin',
    unit: 'percent',
    description: 'Earnings before interest, tax, depreciation and amortisation as a percentage of revenue',
    conversationScript: `"Your EBITDA margin tells us how much of your revenue turns into profit before accounting treatments. This is what acquirers look at. Do you know your EBITDA margin, or can you tell me your operating profit and we'll calculate it?"`,
    followUpQuestions: [
      'What was your operating profit last year?',
      'Do you have any significant depreciation or amortisation?',
      'Are there any one-off costs in that figure we should adjust for?'
    ],
    benchmark: { p25: 10, p50: 18, p75: 25 },
    inputPlaceholder: 'e.g., 15',
    inputHelp: 'EBITDA as % of revenue (industry median: 18%)'
  },
  'Debtor Days': {
    code: 'debtor_days',
    name: 'Debtor Days',
    unit: 'days',
    description: 'Average number of days to collect payment from clients',
    conversationScript: `"Cash flow efficiency matters. How long does it typically take your clients to pay you? Do you track your debtor days, or can you estimate from recent experience?"`,
    followUpQuestions: [
      'Do you have standard payment terms?',
      'Are there clients who consistently pay late?',
      'Do you use milestone billing or bill on completion?'
    ],
    benchmark: { p25: 30, p50: 45, p75: 60 },
    inputPlaceholder: 'e.g., 45',
    inputHelp: 'Average days to collect payment (industry median: 45 days)'
  },
  'Gross Margin': {
    code: 'gross_margin',
    name: 'Gross Profit Margin',
    unit: 'percent',
    description: 'Gross profit as a percentage of revenue',
    conversationScript: `"What's your gross margin - the profit after direct costs of delivery? This tells us how efficiently you're delivering your services."`,
    followUpQuestions: [
      'What do you include in cost of sales?',
      'Is this consistent across different service lines?',
      'Has it changed significantly in the last year?'
    ],
    benchmark: { p25: 45, p50: 55, p75: 65 },
    inputPlaceholder: 'e.g., 50',
    inputHelp: 'Gross profit ÷ revenue × 100 (industry median: 55%)'
  },
  'Net Margin': {
    code: 'net_margin',
    name: 'Net Profit Margin',
    unit: 'percent',
    description: 'Net profit as a percentage of revenue',
    conversationScript: `"After all your costs - staff, rent, marketing, everything - what's your net profit margin? This is the ultimate measure of business efficiency."`,
    followUpQuestions: [
      'Is this before or after owner salary adjustments?',
      'Are there any unusual costs in this figure?',
      'How has this trended over the last few years?'
    ],
    benchmark: { p25: 8, p50: 12, p75: 18 },
    inputPlaceholder: 'e.g., 10',
    inputHelp: 'Net profit ÷ revenue × 100 (industry median: 12%)'
  },
  'Revenue Growth': {
    code: 'revenue_growth',
    name: 'Annual Revenue Growth',
    unit: 'percent',
    description: 'Year-over-year revenue growth percentage',
    conversationScript: `"How has your revenue grown compared to last year? Growth rate helps us understand your trajectory and market position."`,
    followUpQuestions: [
      'Is this growth organic or have you acquired clients/teams?',
      "What's driving the growth or lack of growth?",
      'What do you expect for next year?'
    ],
    benchmark: { p25: 5, p50: 12, p75: 25 },
    inputPlaceholder: 'e.g., 15',
    inputHelp: 'YoY revenue growth (industry median: 12%)'
  }
};

// LLM-generated data collection script (preferred over hardcoded definitions)
interface LLMDataCollectionScript {
  metricNeeded: string;
  whyNeeded: string;
  howToAsk: string;
  industryContext?: string;
  followUpIfUnsure?: string;
  howToRecord?: string;
}

interface DataCollectionPanelProps {
  missingData: string[];
  engagementId: string;
  existingValues?: Record<string, number | string>;
  industryCode?: string;
  // LLM-generated scripts from admin guidance (takes priority over hardcoded)
  llmScripts?: LLMDataCollectionScript[];
  onSave?: (data: Record<string, number | string>) => Promise<void>;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function DataCollectionPanel({
  missingData,
  engagementId: _engagementId,
  existingValues = {},
  industryCode: _industryCode,
  llmScripts = [],
  onSave,
  onRegenerate,
  isLoading = false
}: DataCollectionPanelProps) {
  // Note: engagementId and industryCode are available for future use
  void _engagementId;
  void _industryCode;
  const [collectedData, setCollectedData] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(existingValues).map(([k, v]) => [k, String(v)])
    )
  );
  const [expandedMetric, setExpandedMetric] = useState<string | null>(
    missingData.length > 0 ? missingData[0] : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (metricName: string, value: string) => {
    setCollectedData(prev => ({
      ...prev,
      [metricName]: value
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Convert string values to numbers where appropriate
      const processedData: Record<string, number | string> = {};
      for (const [key, value] of Object.entries(collectedData)) {
        if (value && value.trim() !== '') {
          const numValue = parseFloat(value);
          processedData[key] = isNaN(numValue) ? value : numValue;
        }
      }
      
      await onSave(processedData);
      setSaveMessage({ type: 'success', text: 'Data saved successfully!' });
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save data' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Only count items that are CURRENTLY missing AND have a value collected
  const collectedCount = missingData.filter(metric => {
    const value = collectedData[metric];
    return value && value.trim() !== '';
  }).length;
  const totalMissing = missingData.length;
  const allCollected = collectedCount >= totalMissing;

  // First check LLM-generated scripts, then fallback to hardcoded, then generate dynamic
  const getLLMScript = (metricName: string): LLMDataCollectionScript | null => {
    return llmScripts.find(s => s.metricNeeded === metricName) || null;
  };
  
  const getMetricDefinition = (metricName: string): MetricDefinition | null => {
    // First check hardcoded definitions
    if (METRIC_DEFINITIONS[metricName]) {
      return METRIC_DEFINITIONS[metricName];
    }
    
    // If not found, check if we have an LLM script and create a definition from it
    const llmScript = getLLMScript(metricName);
    if (llmScript) {
      return {
        code: metricName.toLowerCase().replace(/\s+/g, '_'),
        name: metricName,
        unit: 'number', // Default, could be smarter
        description: llmScript.whyNeeded,
        conversationScript: `"${llmScript.howToAsk}"`,
        followUpQuestions: llmScript.followUpIfUnsure ? [llmScript.followUpIfUnsure] : [],
        inputPlaceholder: llmScript.howToRecord || 'Enter value',
        inputHelp: llmScript.industryContext || 'Enter the metric value'
      };
    }
    
    // Generate a generic definition for unknown metrics
    return {
      code: metricName.toLowerCase().replace(/\s+/g, '_'),
      name: metricName,
      unit: 'number',
      description: `Information about ${metricName}`,
      conversationScript: `"Can you tell me about your ${metricName}? This will help us provide a more complete analysis."`,
      followUpQuestions: [
        'Do you track this metric currently?',
        'Can you estimate if you don\'t have exact figures?'
      ],
      inputPlaceholder: 'Enter value',
      inputHelp: `Please provide your ${metricName}`
    };
  };

  const formatBenchmark = (value: number, unit: string) => {
    if (unit === 'currency') return `£${value}`;
    if (unit === 'percent') return `${value}%`;
    if (unit === 'days') return `${value} days`;
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Collect Missing Data</h2>
          <p className="text-sm text-slate-500 mt-1">
            Use these conversation scripts to gather the metrics needed for a complete analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {collectedCount} / {totalMissing} collected
          </span>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(collectedCount / totalMissing) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {saveMessage.text}
        </div>
      )}

      {/* Metric Collection Cards */}
      <div className="space-y-3">
        {missingData.map((metricName) => {
          const definition = getMetricDefinition(metricName);
          const isExpanded = expandedMetric === metricName;
          const hasValue = collectedData[metricName] && collectedData[metricName].trim() !== '';
          
          return (
            <div 
              key={metricName}
              className={`bg-white border rounded-lg overflow-hidden transition-all ${
                hasValue ? 'border-emerald-300' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedMetric(isExpanded ? null : metricName)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {hasValue ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{metricName}</p>
                    {definition && (
                      <p className="text-xs text-slate-500">{definition.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasValue && (
                    <span className="text-sm font-semibold text-emerald-600">
                      {collectedData[metricName]}
                      {definition?.unit === 'percent' && '%'}
                      {definition?.unit === 'currency' && ' £/hr'}
                      {definition?.unit === 'days' && ' days'}
                    </span>
                  )}
                  <svg 
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && definition && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                  {/* Conversation Script */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-xs font-semibold text-blue-700 uppercase">Conversation Script</span>
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                      {definition.conversationScript}
                    </p>
                  </div>

                  {/* Follow-up Questions */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Follow-up Questions</p>
                    <ul className="space-y-1.5">
                      {definition.followUpQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-slate-400">→</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benchmark Context */}
                  {definition.benchmark && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase">Industry Benchmarks</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Bottom 25%</p>
                          <p className="text-sm font-semibold text-rose-600">
                            {formatBenchmark(definition.benchmark.p25, definition.unit)}
                          </p>
                        </div>
                        <div className="flex-1 h-2 bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300 rounded-full" />
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Median</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatBenchmark(definition.benchmark.p50, definition.unit)}
                          </p>
                        </div>
                        <div className="flex-1 h-2 bg-gradient-to-r from-amber-300 to-emerald-300 rounded-full" />
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Top 25%</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatBenchmark(definition.benchmark.p75, definition.unit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Field */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">
                      Client's Value
                    </label>
                    <div className="flex items-center gap-2">
                      {definition.unit === 'currency' && (
                        <span className="text-slate-400">£</span>
                      )}
                      <input
                        type="number"
                        value={collectedData[metricName] || ''}
                        onChange={(e) => handleInputChange(metricName, e.target.value)}
                        placeholder={definition.inputPlaceholder}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {definition.unit === 'percent' && (
                        <span className="text-slate-400">%</span>
                      )}
                      {definition.unit === 'days' && (
                        <span className="text-slate-400">days</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{definition.inputHelp}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Definition Fallback */}
      {missingData.filter(m => !getMetricDefinition(m)).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Some metrics don't have collection scripts yet. Contact support to add them.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={isSaving || collectedCount === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Collected Data
            </>
          )}
        </button>

        {allCollected && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Regenerate with Full Data
              </>
            )}
          </button>
        )}
      </div>

      {!allCollected && (
        <p className="text-sm text-slate-500 text-center">
          Collect all missing data to enable full analysis regeneration
        </p>
      )}
    </div>
  );
}

