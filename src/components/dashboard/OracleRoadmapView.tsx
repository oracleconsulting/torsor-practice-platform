import React, { useState } from 'react';
import { useOracleData } from '@/hooks/useOracleData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  Calendar
} from 'lucide-react';

const OracleRoadmapView = () => {
  const { data, loading, error } = useOracleData();
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3]);

  if (loading || error || !data?.roadmap) {
    return null;
  }

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => 
      prev.includes(weekNumber) 
        ? prev.filter(w => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE RELIEF': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'QUICK WIN': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FOUNDATION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STRATEGIC': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'GROWTH': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your 12-Week Transformation Roadmap
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {data.commitmentHours} per week
        </p>
      </div>

      {/* ROI Summary */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Expected Return on Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Annual Value</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {data.roadmap.roi_analysis.total_annual_value}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Target (90 days)</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {data.roadmap.summary.targetRevenue90Days}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Savings</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {data.roadmap.summary.currentHours - data.roadmap.summary.targetHours90Days} hrs/week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Sprint Cards */}
      <div className="space-y-4">
        {Array.isArray(data.roadmap.weeks) && data.roadmap.weeks.map((week: any) => (
          <Card key={week.week_number} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleWeek(week.week_number)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
                    {week.week_number}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{week.theme}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {week.focus}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(week.priority_level)}>
                    {week.priority_level}
                  </Badge>
                  {expandedWeeks.includes(week.week_number) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedWeeks.includes(week.week_number) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Time budget: {week.time_budget}</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Actions this week:</h4>
                    <ul className="space-y-2">
                      {week.actions.map((action: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-gray-400" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Expected outcome: {week.expected_outcome}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default OracleRoadmapView;