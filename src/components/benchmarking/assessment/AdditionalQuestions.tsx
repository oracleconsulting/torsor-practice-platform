import React from 'react';
import { Building2, Users, LogOut, FileText, HelpCircle } from 'lucide-react';

interface AdditionalQuestionsProps {
  responses: Record<string, any>;
  onChange: (key: string, value: any) => void;
  tier: 'tier1' | 'tier2' | 'tier3';
  readOnly?: boolean;
}

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

interface QuestionConfig {
  key: string;
  label: string;
  helpText?: string;
  type: 'select' | 'number' | 'text';
  options?: QuestionOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  showIf?: (responses: Record<string, any>) => boolean;
}

const OWNERSHIP_QUESTIONS: QuestionConfig[] = [
  {
    key: 'ownership_structure',
    label: 'What is your current ownership structure?',
    type: 'select',
    options: [
      { value: 'sole_owner', label: 'Sole owner (100%)' },
      { value: 'partnership_equal', label: 'Partnership (50/50)' },
      { value: 'partnership_unequal', label: 'Partnership (unequal split)' },
      { value: 'family', label: 'Family ownership' },
      { value: 'external_investors', label: 'External investors involved' },
    ],
  },
  {
    key: 'shareholders_agreement',
    label: "Do you have a shareholders' agreement?",
    type: 'select',
    options: [
      { value: 'yes_current', label: 'Yes, reviewed in last 2 years' },
      { value: 'yes_outdated', label: 'Yes, but outdated (3+ years old)' },
      { value: 'no', label: 'No' },
      { value: 'dont_know', label: "Don't know" },
    ],
  },
  {
    key: 'personal_guarantees',
    label: 'Are there any personal guarantees on business contracts or debt?',
    helpText: 'This includes bank loans, leases, supplier agreements, etc.',
    type: 'select',
    options: [
      { value: 'significant', label: 'Yes, significant (>£500k exposure)' },
      { value: 'minor', label: 'Yes, minor (<£500k)' },
      { value: 'none', label: 'No' },
      { value: 'dont_know', label: "Don't know" },
    ],
  },
  {
    key: 'funding_model',
    label: 'How is the business funded day-to-day?',
    type: 'select',
    options: [
      { value: 'cash_generative', label: 'Cash generative (self-funding)' },
      { value: 'overdraft', label: 'Bank overdraft facility' },
      { value: 'invoice_finance', label: 'Invoice financing' },
      { value: 'external_debt', label: 'Term loan/external debt' },
      { value: 'investor_capital', label: 'Investor capital' },
    ],
  },
];

const TEAM_QUESTIONS: QuestionConfig[] = [
  {
    key: 'leadership_structure',
    label: 'What does your leadership structure look like?',
    type: 'select',
    options: [
      { value: 'solo', label: 'Just me' },
      { value: 'plus_one', label: 'Me + 1 senior person' },
      { value: 'small_team', label: 'Small leadership team (2-4)' },
      { value: 'full_exec', label: 'Full executive team (5+)' },
    ],
  },
  {
    key: 'bus_factor_person',
    label: 'If you were hit by a bus tomorrow, who would run the business?',
    helpText: 'Be honest - this is critical for valuation.',
    type: 'select',
    options: [
      { value: 'no_one', label: 'No one - it would struggle badly' },
      { value: 'short_term_cover', label: 'Someone could keep it going short-term' },
      { value: 'clear_successor', label: 'Clear successor identified and capable' },
      { value: 'seamless', label: 'Leadership team would continue seamlessly' },
    ],
  },
  {
    key: 'critical_people_count',
    label: 'How many of your team could you NOT afford to lose?',
    helpText: 'People whose departure would materially impact the business.',
    type: 'select',
    options: [
      { value: '5_plus', label: 'More than 5' },
      { value: '3_5', label: '3-5 people' },
      { value: '1_2', label: '1-2 people' },
      { value: 'none', label: 'None - we have good coverage' },
    ],
  },
  {
    key: 'team_retention_risk',
    label: 'What keeps your best people here?',
    type: 'select',
    options: [
      { value: 'founder_loyalty', label: 'Personal loyalty to me (the founder)' },
      { value: 'culture', label: 'Company culture and values' },
      { value: 'growth', label: 'Career growth opportunities' },
      { value: 'compensation', label: 'Competitive compensation' },
      { value: 'ownership', label: 'Equity/ownership stake' },
    ],
  },
];

const EXIT_QUESTIONS: QuestionConfig[] = [
  {
    key: 'exit_thinking',
    label: "What's your current thinking on exit?",
    type: 'select',
    options: [
      { value: 'no_plans', label: 'No plans - building for the long term' },
      { value: 'maybe_5_years', label: 'Maybe in 5+ years' },
      { value: 'active_2_5', label: 'Actively thinking about it (2-5 years)' },
      { value: 'want_2_years', label: 'Want to exit within 2 years' },
      { value: 'exploring_now', label: 'Currently exploring options' },
    ],
  },
  {
    key: 'exit_type_preference',
    label: 'What type of exit appeals to you?',
    showIf: (r) => r.exit_thinking && r.exit_thinking !== 'no_plans',
    type: 'select',
    options: [
      { value: 'trade_sale', label: 'Trade sale (sell to competitor/strategic)' },
      { value: 'pe', label: 'Private equity (partial sale, stay involved)' },
      { value: 'mbo', label: 'Management buyout' },
      { value: 'family', label: 'Family succession' },
      { value: 'dont_know', label: "Don't know yet" },
    ],
  },
  {
    key: 'earnout_appetite',
    label: 'Would you accept an earnout (deferred payment based on performance)?',
    showIf: (r) => r.exit_thinking && r.exit_thinking !== 'no_plans',
    type: 'select',
    options: [
      { value: 'yes_higher_value', label: 'Yes, if the total value is higher' },
      { value: 'prefer_clean', label: 'Prefer clean break but would consider' },
      { value: 'no_certainty', label: 'No - need certainty' },
      { value: 'dont_know', label: "Don't know what this means" },
    ],
  },
  {
    key: 'exit_blockers',
    label: 'What do you think would stop you selling today?',
    showIf: (r) => r.exit_thinking && r.exit_thinking !== 'no_plans',
    type: 'text',
    placeholder: 'e.g., customer concentration, key person risk, documentation...',
  },
];

const CONTRACT_QUESTIONS: QuestionConfig[] = [
  {
    key: 'average_contract_length',
    label: "What's the average length of your client contracts?",
    type: 'select',
    options: [
      { value: 'no_contracts', label: 'No contracts - work is ad-hoc' },
      { value: 'less_1_year', label: 'Less than 1 year' },
      { value: '1_2_years', label: '1-2 years' },
      { value: '3_plus_years', label: '3+ years' },
    ],
  },
  {
    key: 'recurring_revenue_pct',
    label: 'What percentage of revenue is recurring/contracted?',
    helpText: 'Revenue that renews automatically without re-selling.',
    type: 'number',
    min: 0,
    max: 100,
    placeholder: '0-100',
  },
  {
    key: 'largest_contracts_renewal',
    label: 'When do your largest contracts come up for renewal?',
    type: 'select',
    options: [
      { value: 'within_6mo', label: 'Within 6 months' },
      { value: '6_12mo', label: '6-12 months' },
      { value: '12_24mo', label: '12-24 months' },
      { value: '24_plus_mo', label: '24+ months' },
    ],
  },
  {
    key: 'contract_notice_period',
    label: 'What notice period do your major clients have to give?',
    type: 'select',
    options: [
      { value: 'none', label: 'None - can leave anytime' },
      { value: '30_days', label: '30 days' },
      { value: '90_days', label: '90 days' },
      { value: '6_months', label: '6 months' },
      { value: '12_months', label: '12 months+' },
    ],
  },
];

function QuestionField({
  config,
  value,
  onChange,
  readOnly,
}: {
  config: QuestionConfig;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}) {
  const baseInputClasses = `w-full p-2.5 border rounded-lg transition-colors ${
    readOnly 
      ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
      : 'bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
  }`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {config.label}
        </label>
        {config.helpText && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {config.helpText}
            </div>
          </div>
        )}
      </div>

      {config.type === 'select' && config.options && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={baseInputClasses}
        >
          <option value="">Select...</option>
          {config.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {config.type === 'number' && (
        <input
          type="number"
          min={config.min}
          max={config.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          disabled={readOnly}
          placeholder={config.placeholder}
          className={baseInputClasses}
        />
      )}

      {config.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder={config.placeholder}
          className={baseInputClasses}
        />
      )}
    </div>
  );
}

function QuestionSection({
  icon: Icon,
  title,
  iconColor,
  questions,
  responses,
  onChange,
  readOnly,
}: {
  icon: typeof Building2;
  title: string;
  iconColor: string;
  questions: QuestionConfig[];
  responses: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
}) {
  const visibleQuestions = questions.filter(
    (q) => !q.showIf || q.showIf(responses)
  );

  if (visibleQuestions.length === 0) return null;

  return (
    <section className="border rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-5">
        {visibleQuestions.map((q) => (
          <QuestionField
            key={q.key}
            config={q}
            value={responses[q.key]}
            onChange={(value) => onChange(q.key, value)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </section>
  );
}

export function AdditionalQuestions({
  responses,
  onChange,
  tier,
  readOnly,
}: AdditionalQuestionsProps) {
  // Tier 1 gets minimal questions
  if (tier === 'tier1') {
    return (
      <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
        Detailed valuation questions are available in the{' '}
        <span className="font-medium text-emerald-600">Value Analysis</span> tier.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuestionSection
        icon={Building2}
        title="Ownership Structure"
        iconColor="text-blue-600"
        questions={OWNERSHIP_QUESTIONS}
        responses={responses}
        onChange={onChange}
        readOnly={readOnly}
      />

      <QuestionSection
        icon={Users}
        title="Leadership & Team"
        iconColor="text-purple-600"
        questions={TEAM_QUESTIONS}
        responses={responses}
        onChange={onChange}
        readOnly={readOnly}
      />

      {/* Exit questions shown for tier3 or if they've indicated exit interest */}
      {(tier === 'tier3' || responses.exit_thinking) && (
        <QuestionSection
          icon={LogOut}
          title="Exit Intentions"
          iconColor="text-emerald-600"
          questions={EXIT_QUESTIONS}
          responses={responses}
          onChange={onChange}
          readOnly={readOnly}
        />
      )}

      <QuestionSection
        icon={FileText}
        title="Contract Portfolio"
        iconColor="text-amber-600"
        questions={CONTRACT_QUESTIONS}
        responses={responses}
        onChange={onChange}
        readOnly={readOnly}
      />
    </div>
  );
}

// Export question configurations for use in value suppressor calculation
export {
  OWNERSHIP_QUESTIONS,
  TEAM_QUESTIONS,
  EXIT_QUESTIONS,
  CONTRACT_QUESTIONS,
};

