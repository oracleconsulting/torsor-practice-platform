import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Calendar, DollarSign, TrendingUp, ChevronRight,
  User, Rocket, Mountain, Map, Building2, Star, Clock,
  CheckCircle, ArrowRight, Sparkles, Heart, Home, Plane
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface MyJourneyPageProps {
  displayData: any;
  loading: boolean;
  error: string | null;
  user: any;
  profile: any;
  isAdminViewing: boolean;
  assessmentProgress: any;
  weekProgress: Record<number, any>;
  toggleTask: (weekNum: number, taskIdx: number) => void;
  updateWeekNotes: (weekNum: number, field: 'notes' | 'blockers' | 'wins', value: string) => void;
  setWeekProgress: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  userContext: any;
  navigate: any;
  setActiveSection: (section: string) => void;
  activeSection: string;
  theme: any;
  userEnergy: number;
  businessHealth: number;
  getGreeting: () => string;
  renderValue: (value: any) => React.ReactNode;
}

export const MyJourneyPage: React.FC<MyJourneyPageProps> = ({
  displayData,
  loading,
  navigate,
  setActiveSection,
  assessmentProgress
}) => {
  const [activeTab, setActiveTab] = useState('vision');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Access roadmap data correctly based on roadmaps table structure
  const roadmap = displayData?.roadmap || {};
  const fitMessage = displayData?.fitMessage || assessmentProgress?.fitMessage || '';
  
  // Handle data from roadmaps table structure - NO HARDCODED FALLBACKS
  const fiveYearVision = roadmap.five_year_vision || 
                        roadmap.five_year_possibility || 
                        (typeof roadmap === 'object' && roadmap.your_story?.five_year_vision) || 
                        null; // NO FALLBACK OBJECTS

  const sixMonthShift = roadmap.six_month_shift || 
                       roadmap.six_month_stretch || 
                       (typeof roadmap === 'object' && roadmap.your_story?.six_month_shift) || 
                       null; // NO FALLBACK OBJECTS

  const threeMonthSprint = roadmap.three_month_sprint || 
                          roadmap.immediate_value || 
                          (typeof roadmap === 'object' && roadmap.your_story?.three_month_sprint) || 
                          null; // NO FALLBACK OBJECTS
  
  // Extract rich vision content
  const visionNarrative = roadmap?.five_year_vision?.vision_narrative ||
                         roadmap?.five_year_possibility?.vision_narrative ||
                         roadmap?.your_story?.vision_narrative ||
                         (typeof fiveYearVision === 'string' ? fiveYearVision : fiveYearVision?.vision);
  
  // Check if we have any roadmap data
  const hasRoadmapData = !!(fiveYearVision || sixMonthShift || threeMonthSprint);
  
  // Fix ROI extraction to handle roadmaps table structure
  const roiAnalysis = roadmap.roi_analysis || {};
  const roiValue = displayData?.roiNumeric || 
                  roiAnalysis.total_annual_value_numeric || 
                  roiAnalysis.total_value || 
                  parseFloat(roiAnalysis.total_annual_value?.replace(/[£$,]/g, '') || '0') || 
                  0;

  const currentRevenue = displayData?.currentRevenue || 
                        roadmap.business_details?.current_revenue || 
                        0;
  
  // Show the actual fit message without modification
  const formattedFitMessage = fitMessage;
  
  // Debug data structure
  console.log('MyJourneyPage - Debug data structure:', {
    roadmap: !!roadmap,
    roadmapKeys: roadmap ? Object.keys(roadmap) : [],
    fiveYearVision,
    sixMonthShift,
    threeMonthSprint,
    hasRoadmapData,
    roiValue,
    currentRevenue,
    dataKeys: Object.keys(displayData || {})
  });
  
  // Check if roadmap data exists
  if (!hasRoadmapData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Journey Not Available</h2>
          <p className="text-gray-600 mb-6">
            Complete your assessment to unlock your personalized journey roadmap.
          </p>
          <button 
            onClick={() => setActiveSection('assessments')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium"
          >
            Complete Assessment
          </button>
        </div>
      </div>
    );
  }
  
  // Extract revenue data using the actual data we found
  const targetRevenue = fiveYearVision?.year_3?.annual_revenue || 1000000;
  const revenueProgress = (currentRevenue / targetRevenue) * 100;

  const tabs = [
    { id: 'vision', label: '5-Year Vision', icon: Mountain },
    { id: 'shift', label: '6-Month Shift', icon: Rocket },
    { id: 'sprint', label: '3-Month Sprint', icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Your Journey</h1>
        <p className="text-white/80 text-lg">Your personalized roadmap to transformation</p>
      </div>

      {/* Journey Progress Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Journey Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Revenue Progress</span>
              <span className="text-sm font-medium text-purple-600">
                £{Math.round(currentRevenue / 1000)}k → £{Math.round(targetRevenue / 1000)}k
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Work-Life Balance */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Work-Life Balance</span>
              <span className="text-sm font-medium text-green-600">
                85h → 45h/week
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                style={{ width: '30%' }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'vision' && <FiveYearVisionTab data={fiveYearVision} fitMessage={formattedFitMessage} visionNarrative={visionNarrative} />}
        {activeTab === 'shift' && <SixMonthShiftTab data={sixMonthShift} />}
        {activeTab === 'sprint' && <ThreeMonthSprintTab data={threeMonthSprint} onViewPlan={() => setActiveSection('roadmap')} />}
      </motion.div>
    </div>
  );
};

// 5-Year Vision Tab Component
const FiveYearVisionTab = ({ data, fitMessage, visionNarrative }: any) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Fit Message Card - No Duplicates */}
      {fitMessage && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Your Fit Assessment</h3>
              <p className="text-gray-700 leading-relaxed">{fitMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* North Star */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-gray-800">Your North Star</h3>
        </div>
        {visionNarrative ? (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{visionNarrative}</p>
          </div>
        ) : (
          <p className="text-gray-500 italic">Complete your assessment to see your personalized vision</p>
        )}
      </Card>

      {/* Life Goals - Only show if data exists */}
      {data.life_goals && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Life Goals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.life_goals.map((goal: any, idx: number) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">{goal.title || 'Goal'}</p>
                <p className="text-xs text-gray-500">{goal.description || ''}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Year Milestones */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Yearly Milestones</h3>
        {[1, 3, 5].map((year) => {
          const yearData = data[`year_${year}`] || {};
          const isExpanded = expandedYear === year;

          return (
            <Card 
              key={year}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedYear(isExpanded ? null : year)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                      Y{year}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Year {year}: {yearData.title || `Year ${year} Vision`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Revenue: £{yearData.annual_revenue ? Math.round(yearData.annual_revenue / 1000) : year * 500}k
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="space-y-3">
                      {yearData.headline && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Headline</h5>
                          <p className="text-gray-600">{yearData.headline}</p>
                        </div>
                      )}
                      {yearData.measurable && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Measurable Goal</h5>
                          <p className="text-gray-600">{yearData.measurable}</p>
                        </div>
                      )}
                      {yearData.description && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Description</h5>
                          <p className="text-gray-600">{yearData.description}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// 6-Month Shift Tab Component
const SixMonthShiftTab = ({ data }: any) => {
  return (
    <div className="space-y-6">
      {/* Shift Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">6-Month Shift Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Shift Focus</h4>
            <p className="text-gray-600">{data.shift_focus?.headline || 'Transform your business operations'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Key Changes</h4>
            <ul className="text-gray-600 space-y-1">
              {data.key_changes?.slice(0, 3).map((change: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Success Metrics */}
      {data.success_metrics && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Success Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(data.success_metrics).map(([key, value]: [string, any], idx: number) => (
              <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{value}</p>
                <p className="text-sm text-gray-600 mt-1">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// 3-Month Sprint Tab Component
const ThreeMonthSprintTab = ({ data, onViewPlan }: any) => {
  return (
    <div className="space-y-6">
      {/* Sprint Overview */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">3-Month Sprint Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Sprint Theme</h4>
            <p className="text-gray-600">{data.sprint_theme || 'Business Transformation'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Biggest Risk</h4>
            <p className="text-gray-600">{data.biggest_risk || 'Trying to do too much too fast'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Success Metrics</h4>
            <p className="text-gray-600">{data.success_metrics?.week_12 || 'Transformation achieved'}</p>
          </div>
        </div>
      </Card>

      {/* Weekly Preview */}
      {data.weeks && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Weekly Breakdown</h3>
            <Button onClick={onViewPlan} className="bg-green-600 hover:bg-green-700">
              View Full Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.weeks.slice(0, 6).map((week: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{week.week || idx + 1}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{week.theme || `Week ${week.week || idx + 1}`}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{week.focus}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    week.priority_level === 'IMMEDIATE RELIEF' ? 'bg-red-100 text-red-700' :
                    week.priority_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {week.priority_level || 'MEDIUM'}
                  </span>
                  <span className="text-xs text-gray-500">{week.time_budget || '15 hours'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}; 