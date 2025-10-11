/**
 * CPD-Skills Integration Bridge Component
 * PROMPT 5 Implementation
 * 
 * Visual bridge showing CPD activities → Skill improvements
 * Includes spider charts, ROI metrics, and predictive modeling
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import {
  getSkillImprovementHistory,
  getMemberROIData,
  getCPDSkillMappings,
  type SkillImprovementTracking,
  type ROIDashboardData,
  type CPDSkillMapping
} from '@/lib/api/cpd-skills-bridge';

interface CPDSkillsBridgeProps {
  memberId: string;
  cpdActivityId?: string; // If viewing specific CPD activity
  showPredictive?: boolean;
}

const CPDSkillsBridge: React.FC<CPDSkillsBridgeProps> = ({
  memberId,
  cpdActivityId,
  showPredictive = true
}) => {
  const [improvementHistory, setImprovementHistory] = useState<SkillImprovementTracking[]>([]);
  const [roiData, setRoiData] = useState<ROIDashboardData | null>(null);
  const [skillMappings, setSkillMappings] = useState<CPDSkillMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'timeline' | 'spider' | 'roi'>('timeline');

  useEffect(() => {
    loadData();
  }, [memberId, cpdActivityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [history, roi] = await Promise.all([
        getSkillImprovementHistory(memberId),
        getMemberROIData(memberId)
      ]);

      setImprovementHistory(history);
      setRoiData(roi);

      if (cpdActivityId) {
        const mappings = await getCPDSkillMappings(cpdActivityId);
        setSkillMappings(mappings);
      }
    } catch (error) {
      console.error('Error loading CPD-Skills bridge data:', error);
      // Set empty data to prevent crashes
      setImprovementHistory([]);
      setRoiData({
        totalCpdHours: 0,
        totalSkillImprovement: 0,
        improvementPerHour: 0,
        totalCost: 0,
        costPerLevelIncrease: 0,
        teamCapabilityScore: 0,
        teamCapabilityChange: 0,
        topPerformingActivities: [],
        skillProgress: []
      });
      setSkillMappings([]);
    } finally {
      setLoading(false);
    }
  };

  // Spider Chart Component (Simplified - would use recharts or similar in production)
  const SpiderChart = ({ data }: { data: Array<{ skill: string; before: number; after: number }> }) => (
    <div className="relative w-full h-96 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 400 400">
        {/* Pentagon background */}
        <polygon
          points="200,50 350,150 300,325 100,325 50,150"
          fill="rgba(99, 102, 241, 0.1)"
          stroke="rgba(99, 102, 241, 0.3)"
          strokeWidth="2"
        />
        
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => (
          <polygon
            key={idx}
            points={`${200},${50 + (100 * (1 - scale))} ${350 - (150 * (1 - scale))},${150} ${300 - (100 * (1 - scale))},${325 - (125 * (1 - scale))} ${100 + (100 * (1 - scale))},${325 - (125 * (1 - scale))} ${50 + (150 * (1 - scale))},${150}`}
            fill="none"
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Skill labels */}
        {data.slice(0, 5).map((item, idx) => {
          const angle = (idx * 72 - 90) * (Math.PI / 180);
          const x = 200 + 180 * Math.cos(angle);
          const y = 200 + 180 * Math.sin(angle);
          
          return (
            <text
              key={idx}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {item.skill}
            </text>
          );
        })}

        {/* Before polygon (red) */}
        <polygon
          points={data.slice(0, 5).map((item, idx) => {
            const angle = (idx * 72 - 90) * (Math.PI / 180);
            const radius = 25 + (item.before / 5) * 125;
            const x = 200 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')}
          fill="rgba(239, 68, 68, 0.2)"
          stroke="rgb(239, 68, 68)"
          strokeWidth="2"
        />

        {/* After polygon (green) */}
        <polygon
          points={data.slice(0, 5).map((item, idx) => {
            const angle = (idx * 72 - 90) * (Math.PI / 180);
            const radius = 25 + (item.after / 5) * 125;
            const x = 200 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')}
          fill="rgba(34, 197, 94, 0.2)"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
        />
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Before</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>After</span>
        </div>
      </div>
    </div>
  );

  // Render improvement timeline
  const renderTimeline = () => (
    <div className="space-y-4">
      {improvementHistory.slice(0, 10).map((improvement, idx) => (
        <Card key={improvement.id} className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={improvement.change_amount > 0 ? 'default' : 'secondary'}>
                    {improvement.change_amount > 0 ? '+' : ''}{improvement.change_amount} level
                    {Math.abs(improvement.change_amount) !== 1 ? 's' : ''}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(improvement.changed_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Before</div>
                    <div className="text-lg font-bold">{improvement.level_before}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">After</div>
                    <div className="text-lg font-bold text-green-400">{improvement.level_after}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{improvement.change_reason.replace('_', ' ')}</Badge>
                  {improvement.investment_hours && (
                    <span className="text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {improvement.investment_hours}h
                    </span>
                  )}
                  {improvement.investment_cost && (
                    <span className="text-muted-foreground">
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      £{improvement.investment_cost}
                    </span>
                  )}
                  {improvement.roi_score && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                      ROI: {improvement.roi_score.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render ROI dashboard
  const renderROI = () => {
    if (!roiData) {
      return <div className="text-center text-muted-foreground py-8">No ROI data available yet</div>;
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <div className="text-2xl font-bold">{roiData.total_cpd_activities}</div>
                  <div className="text-xs text-muted-foreground">CPD Activities</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <div className="text-2xl font-bold">{roiData.skills_targeted}</div>
                  <div className="text-xs text-muted-foreground">Skills Targeted</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <div className="text-2xl font-bold">{roiData.total_cpd_hours.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Total Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <div className="flex-1">
                  <div className="text-2xl font-bold">
                    {roiData.avg_effectiveness_percentage?.toFixed(0) || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Effectiveness</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Metrics */}
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-purple-700">
          <CardHeader>
            <CardTitle>Return on Investment</CardTitle>
            <CardDescription>Your CPD investment efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Cost per Skill Level</div>
                <div className="text-3xl font-bold text-purple-400">
                  £{roiData.cost_per_skill_level?.toFixed(0) || 0}
                </div>
                <Progress 
                  value={Math.min(100, (1000 / (roiData.cost_per_skill_level || 1)) * 100)} 
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {roiData.cost_per_skill_level < 500 ? 'Excellent efficiency' : 
                   roiData.cost_per_skill_level < 1000 ? 'Good efficiency' : 
                   'Room for improvement'}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Hours per Skill Level</div>
                <div className="text-3xl font-bold text-blue-400">
                  {roiData.hours_per_skill_level?.toFixed(1) || 0}h
                </div>
                <Progress 
                  value={Math.min(100, (20 / (roiData.hours_per_skill_level || 1)) * 100)} 
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {roiData.hours_per_skill_level < 10 ? 'Very efficient' : 
                   roiData.hours_per_skill_level < 20 ? 'Efficient' : 
                   'Takes longer than average'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Average Skill Level</div>
                  <div className="text-2xl font-bold">{roiData.current_avg_skill_level?.toFixed(1) || 0} / 5</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Improvement Achieved</div>
                  <div className="text-2xl font-bold text-green-400">
                    +{roiData.avg_improvement_achieved?.toFixed(1) || 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Breakdown */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Investment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Investment</span>
                <span className="text-xl font-bold">£{roiData.total_cpd_cost?.toFixed(2) || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average per Activity</span>
                <span className="font-semibold">
                  £{(roiData.total_cpd_cost / Math.max(1, roiData.total_cpd_activities))?.toFixed(2) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hours Invested</span>
                <span className="font-semibold">{roiData.total_cpd_hours?.toFixed(1) || 0} hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare spider chart data from recent improvements
  const spiderData = improvementHistory
    .slice(0, 5)
    .map(improvement => ({
      skill: `Skill ${improvement.skill_id.slice(0, 4)}`, // Would map to actual skill names
      before: improvement.level_before,
      after: improvement.level_after
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            CPD ↔ Skills Integration Bridge
          </CardTitle>
          <CardDescription className="text-base">
            Track how your CPD activities translate into tangible skill improvements
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="spider">
            <Target className="w-4 h-4 mr-2" />
            Spider Chart
          </TabsTrigger>
          <TabsTrigger value="roi">
            <DollarSign className="w-4 h-4 mr-2" />
            ROI Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          {improvementHistory.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  No skill improvements tracked yet. Complete CPD activities and reassess your skills!
                </div>
              </CardContent>
            </Card>
          ) : (
            renderTimeline()
          )}
        </TabsContent>

        <TabsContent value="spider" className="space-y-6">
          {spiderData.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  Need at least 5 skill assessments to generate spider chart
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Before & After Skill Comparison</CardTitle>
                <CardDescription>
                  Visual representation of your skill improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpiderChart data={spiderData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          {renderROI()}
        </TabsContent>
      </Tabs>

      {/* Predictive Modeling */}
      {showPredictive && roiData && (
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Predictive Improvement Modeling
            </CardTitle>
            <CardDescription>
              Based on your current CPD efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-card rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">If you invest 10 more hours:</div>
                <div className="text-2xl font-bold text-emerald-400">
                  +{((10 / (roiData.hours_per_skill_level || 10))).toFixed(1)} skill levels
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">To reach target (4.5 avg):</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(((4.5 - (roiData.current_avg_skill_level || 0)) * (roiData.hours_per_skill_level || 10))).toFixed(0)}h needed
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Estimated cost:</div>
                <div className="text-2xl font-bold text-purple-400">
                  £{(((4.5 - (roiData.current_avg_skill_level || 0)) * (roiData.cost_per_skill_level || 500))).toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CPDSkillsBridge;

