import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Heart, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users,
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  Meh,
  ArrowRight,
  Activity,
  Target,
  Calendar
} from 'lucide-react';

interface WellnessData {
  overallScore: number;
  stressLevel: 'low' | 'medium' | 'high';
  burnoutRisk: number;
  workLifeBalance: number;
  teamSatisfaction: number;
  lastSurvey: string;
  nextSurvey: string;
  teamSize: number;
  activeMembers: number;
  recommendations: string[];
}

export const TeamWellnessWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Mock data - replace with real data from context
  const wellnessData: WellnessData = {
    overallScore: 72,
    stressLevel: 'medium',
    burnoutRisk: 35,
    workLifeBalance: 68,
    teamSatisfaction: 75,
    lastSurvey: '2024-01-15',
    nextSurvey: '2024-02-15',
    teamSize: 8,
    activeMembers: 7,
    recommendations: [
      'Implement flexible working hours',
      'Add mental health support resources',
      'Reduce overtime expectations'
    ]
  };

  const getWellnessConfig = () => {
    if (wellnessData.overallScore >= 80) {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: <Smile className="w-5 h-5" />,
        label: 'Excellent',
        description: 'Team is thriving'
      };
    } else if (wellnessData.overallScore >= 60) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        icon: <Meh className="w-5 h-5" />,
        label: 'Good',
        description: 'Room for improvement'
      };
    } else if (wellnessData.overallScore >= 40) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: <Frown className="w-5 h-5" />,
        label: 'Concerning',
        description: 'Action needed'
      };
    } else {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: <Frown className="w-5 h-5" />,
        label: 'Critical',
        description: 'Immediate intervention'
      };
    }
  };

  const wellnessConfig = getWellnessConfig();
  const daysUntilSurvey = Math.ceil((new Date(wellnessData.nextSurvey).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="Team Wellness"
        icon={<Heart className="w-5 h-5 text-pink-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={false}
        error=""
        onRefresh={() => {}}
        isNew={true}
        className="bg-gradient-to-br from-pink-500/5 to-rose-500/5"
      >
        <div className="space-y-4">
          {/* Wellness indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${wellnessConfig.bgColor} ${wellnessConfig.borderColor} border`}>
            {wellnessConfig.icon}
            <div className="flex-1">
              <div className={`font-semibold ${wellnessConfig.color}`}>
                {wellnessConfig.label}
              </div>
              <div className="text-gray-300 text-sm">
                {wellnessConfig.description}
              </div>
            </div>
          </div>

          {/* Overall score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-1">
              {wellnessData.overallScore}%
            </div>
            <div className="text-gray-400 text-sm">Wellness Score</div>
          </div>

          {/* Team activity */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Active Members</span>
            <span className="text-white font-medium">{wellnessData.activeMembers}/{wellnessData.teamSize}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="flex-1 text-white border-white/20 hover:bg-white/10"
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Activity className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </WidgetContainer>
    );
  }

  // Expanded view
  return (
    <WidgetContainer
      title="Team Wellness & Wellbeing"
      icon={<Heart className="w-5 h-5 text-pink-400" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={false}
      error=""
      onRefresh={() => {}}
      isNew={true}
      className="bg-gradient-to-br from-pink-500/5 to-rose-500/5"
    >
      <div className="space-y-6">
        {/* Wellness Overview */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Wellness Overview</h3>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-pink-400 mb-2">
              {wellnessData.overallScore}%
            </div>
            <div className="text-gray-400 text-sm mb-4">Overall Wellness Score</div>
            <Progress value={wellnessData.overallScore} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{wellnessData.teamSize}</div>
              <div className="text-gray-400 text-sm">Team Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{wellnessData.activeMembers}</div>
              <div className="text-gray-400 text-sm">Active Members</div>
            </div>
          </div>
        </div>

        {/* Wellness Metrics */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Wellness Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Work-Life Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={wellnessData.workLifeBalance} className="w-20 h-2" />
                <span className="text-white text-sm">{wellnessData.workLifeBalance}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Team Satisfaction</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={wellnessData.teamSatisfaction} className="w-20 h-2" />
                <span className="text-white text-sm">{wellnessData.teamSatisfaction}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Burnout Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={wellnessData.burnoutRisk} className="w-20 h-2" />
                <span className={`text-sm ${wellnessData.burnoutRisk > 50 ? 'text-red-400' : wellnessData.burnoutRisk > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {wellnessData.burnoutRisk}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stress Level */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Stress Level</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Current Level</span>
            <Badge 
              variant="outline" 
              className={`${
                wellnessData.stressLevel === 'low' ? 'text-green-400 border-green-500/30' :
                wellnessData.stressLevel === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                'text-red-400 border-red-500/30'
              }`}
            >
              {wellnessData.stressLevel.charAt(0).toUpperCase() + wellnessData.stressLevel.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Survey Timeline */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Wellness Surveys</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Last Survey</span>
              <span className="text-white font-medium">{new Date(wellnessData.lastSurvey).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Next Survey</span>
              <span className="text-white font-medium">{new Date(wellnessData.nextSurvey).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Days Until Survey</span>
              <span className={`font-bold ${daysUntilSurvey <= 7 ? 'text-red-400' : daysUntilSurvey <= 14 ? 'text-yellow-400' : 'text-green-400'}`}>
                {daysUntilSurvey > 0 ? daysUntilSurvey : 'Due now'}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Wellness Recommendations</h3>
          <div className="space-y-2">
            {wellnessData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-pink-400" />
                <span className="text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Launch Survey
          </Button>
          <Button
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            View Report
          </Button>
        </div>

        {/* Wellness Notice */}
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
            <div>
              <div className="text-pink-300 text-sm font-medium">Team Wellness</div>
              <div className="text-pink-200 text-xs">
                A healthy team is more productive and provides better client service. Regular wellness checks help maintain team morale.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}; 