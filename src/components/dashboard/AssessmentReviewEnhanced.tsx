import React from 'react';
import { CheckCircle2, FileText, Target, Building2, DollarSign, Heart } from 'lucide-react';

export const AssessmentReviewEnhanced = ({ displayData, navigate }) => {
  const part1 = displayData?.rawData?.part1?.responses || {};
  const part2 = displayData?.rawData?.part2?.responses || {};
  const part3 = displayData?.rawData?.part2?.part3_data || {};

  const sections = [
    {
      title: 'Part 1: Life Design',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
      items: [
        { label: 'Name', value: part1.full_name },
        { label: 'Personal Why', value: part1.personal_why },
        { label: 'Sacrifices', value: part1.business_sacrifices }
      ]
    },
    {
      title: 'Part 2: Business',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      items: [
        { label: 'Company', value: displayData?.businessName },
        { label: 'Revenue', value: `£${(part2.current_revenue || 0).toLocaleString()}` },
        { label: 'Challenge', value: part2.biggest_challenge }
      ]
    },
    {
      title: 'Part 3: Hidden Value',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      items: [
        { label: 'Customer Risk', value: `${part3.top3_customer_revenue_percentage || 0}%` },
        { label: 'Dependencies', value: part3.key_person_dependencies?.length || 0 },
        { label: 'Undocumented', value: part3.critical_processes_undocumented?.length || 0 }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Assessment Review</h1>
        <p className="text-white/80">Your complete assessment summary</p>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 flex items-center gap-4">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <div>
          <h3 className="text-xl font-semibold text-green-900">All assessments complete!</h3>
          <p className="text-green-700">Your roadmap is ready</p>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${section.color} p-4 text-white flex items-center gap-3`}>
              <section.icon className="w-6 h-6" />
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>
            <div className="p-6 grid md:grid-cols-3 gap-4">
              {section.items.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="font-semibold text-gray-900">{item.value || 'Not specified'}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 