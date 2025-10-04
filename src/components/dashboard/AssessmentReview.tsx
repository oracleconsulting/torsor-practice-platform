import React from 'react';
import { CheckCircle2, FileText, Target, Building2, DollarSign, Heart, Brain, AlertCircle } from 'lucide-react';

interface AssessmentReviewProps {
  displayData: any;
  navigate: any;
}

export const AssessmentReview: React.FC<AssessmentReviewProps> = ({ displayData }) => {
  const part1Data = displayData?.rawData?.part1?.responses || {};
  const part2Data = displayData?.rawData?.part2?.responses || {};
  const part3Data = displayData?.rawData?.part2?.part3_data || {};

  const formatCurrency = (value: any) => {
    if (!value) return 'Not specified';
    if (typeof value === 'number') return `£${value.toLocaleString()}`;
    return value;
  };

  const formatArray = (arr: any) => {
    if (!arr || !Array.isArray(arr)) return 'None specified';
    if (arr.length === 0) return 'None';
    return arr.join(', ');
  };

  const sections = [
    {
      title: 'Part 1: Life Design',
      icon: Heart,
      color: 'purple',
      data: [
        { label: 'Full Name', value: part1Data.full_name, icon: FileText },
        { label: 'Personal Why', value: part1Data.personal_why, icon: Brain },
        { label: 'Business Sacrifices', value: part1Data.business_sacrifices, icon: AlertCircle },
        { label: 'Danger Zone', value: part1Data.danger_zone, icon: AlertCircle },
        { label: 'Growth Trap', value: part1Data.growth_trap, icon: Target },
        { label: 'Money Truth', value: `Income: ${formatCurrency(part1Data.current_income)}, Desired: ${formatCurrency(part1Data.desired_income)}`, icon: DollarSign }
      ]
    },
    {
      title: 'Part 2: Business Analysis',
      icon: Building2,
      color: 'blue',
      data: [
        { label: 'Company Name', value: part1Data.company_name || displayData?.businessName, icon: Building2 },
        { label: 'Industry', value: part2Data.industry, icon: FileText },
        { label: 'Business Model', value: part2Data.business_model, icon: Target },
        { label: 'Current Revenue', value: formatCurrency(part2Data.current_revenue), icon: DollarSign },
        { label: 'Team Size', value: part2Data.team_size, icon: FileText },
        { label: 'Biggest Challenge', value: part2Data.biggest_challenge, icon: AlertCircle }
      ]
    },
    {
      title: 'Part 3: Hidden Value',
      icon: DollarSign,
      color: 'green',
      data: [
        { label: 'Undocumented Processes', value: formatArray(part3Data.critical_processes_undocumented), icon: FileText },
        { label: 'Customer Concentration', value: `${part3Data.top3_customer_revenue_percentage || 0}%`, icon: Target },
        { label: 'Key Person Dependencies', value: formatArray(part3Data.key_person_dependencies), icon: AlertCircle },
        { label: 'Hidden Trust Signals', value: formatArray(part3Data.hidden_trust_signals), icon: CheckCircle2 },
        { label: 'Untapped Markets', value: formatArray(part3Data.untapped_adjacent_markets), icon: Target }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Assessment Review</h1>
        <p className="text-white/80 text-lg">Review your assessment responses and see how they shape your personalized journey</p>
      </div>

      {/* Success Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 flex items-center gap-4">
        <CheckCircle2 className="w-12 h-12 text-green-600 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-semibold text-green-900">All assessments complete!</h3>
          <p className="text-green-700">Your personalized roadmap is ready</p>
        </div>
      </div>

      {/* Assessment Sections */}
      <div className="grid gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Section Header */}
            <div className={`bg-gradient-to-r ${
              section.color === 'purple' ? 'from-purple-500 to-purple-600' :
              section.color === 'blue' ? 'from-blue-500 to-blue-600' :
              'from-green-500 to-green-600'
            } p-6 text-white`}>
              <div className="flex items-center gap-3">
                <section.icon className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {section.data.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex gap-4">
                    <div className={`p-3 rounded-lg ${
                      section.color === 'purple' ? 'bg-purple-100' :
                      section.color === 'blue' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      <item.icon className={`w-6 h-6 ${
                        section.color === 'purple' ? 'text-purple-600' :
                        section.color === 'blue' ? 'text-blue-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">{item.label}</p>
                      <p className="text-gray-800 mt-1">
                        {item.value || 'Not specified'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button 
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          onClick={() => window.print()}
        >
          Print Summary
        </button>
        <button 
          className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          onClick={() => window.history.back()}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}; 