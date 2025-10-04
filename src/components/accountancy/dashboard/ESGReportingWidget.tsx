import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Leaf, 
  Users, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  FileText,
  BarChart3,
  Target,
  ArrowRight,
  Calendar,
  Award
} from 'lucide-react';

interface ESGData {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  overallScore: number;
  lastAssessment: string;
  nextReview: string;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'not_assessed';
  certifications: string[];
  improvements: string[];
}

export const ESGReportingWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Mock data - replace with real data from context
  const esgData: ESGData = {
    environmentalScore: 78,
    socialScore: 85,
    governanceScore: 92,
    overallScore: 85,
    lastAssessment: '2024-01-15',
    nextReview: '2024-07-15',
    status: 'good',
    certifications: ['ISO 14001', 'Carbon Trust'],
    improvements: [
      'Reduce paper usage by 30%',
      'Implement remote work policies',
      'Enhance board diversity'
    ]
  };

  const getStatusConfig = () => {
    switch (esgData.status) {
      case 'excellent':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: <Award className="w-5 h-5" />,
          label: 'Excellent',
          description: 'Industry leader'
        };
      case 'good':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Good',
          description: 'Above average'
        };
      case 'fair':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Fair',
          description: 'Needs improvement'
        };
      case 'poor':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Poor',
          description: 'Immediate action needed'
        };
      case 'not_assessed':
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: <Clock className="w-5 h-5" />,
          label: 'Not Assessed',
          description: 'Assessment required'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const daysUntilReview = Math.ceil((new Date(esgData.nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="ESG Reporting"
        icon={<Leaf className="w-5 h-5 text-green-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={false}
        error=""
        onRefresh={() => {}}
        isNew={true}
        className="bg-gradient-to-br from-green-500/5 to-emerald-500/5"
      >
        <div className="space-y-4">
          {/* Status indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
            {statusConfig.icon}
            <div className="flex-1">
              <div className={`font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </div>
              <div className="text-gray-300 text-sm">
                {statusConfig.description}
              </div>
            </div>
          </div>

          {/* Overall score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {esgData.overallScore}%
            </div>
            <div className="text-gray-400 text-sm">Overall ESG Score</div>
          </div>

          {/* ESG breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 text-sm">Environmental</span>
              </div>
              <span className="text-white text-sm">{esgData.environmentalScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 text-sm">Social</span>
              </div>
              <span className="text-white text-sm">{esgData.socialScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300 text-sm">Governance</span>
              </div>
              <span className="text-white text-sm">{esgData.governanceScore}%</span>
            </div>
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
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </WidgetContainer>
    );
  }

  // Expanded view
  return (
    <WidgetContainer
      title="Environmental, Social & Governance"
      icon={<Leaf className="w-5 h-5 text-green-400" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={false}
      error=""
      onRefresh={() => {}}
      isNew={true}
      className="bg-gradient-to-br from-green-500/5 to-emerald-500/5"
    >
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <h3 className="text-white font-semibold mb-3">ESG Performance</h3>
          <div className="text-4xl font-bold text-green-400 mb-2">
            {esgData.overallScore}%
          </div>
          <div className="text-gray-400 text-sm mb-4">Overall ESG Score</div>
          <Progress value={esgData.overallScore} className="h-3" />
        </div>

        {/* ESG Breakdown */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">ESG Breakdown</h3>
          <div className="space-y-4">
            {/* Environmental */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">Environmental</span>
                </div>
                <span className="text-green-400 font-bold">{esgData.environmentalScore}%</span>
              </div>
              <Progress value={esgData.environmentalScore} className="h-2" />
              <div className="text-gray-400 text-xs">
                Carbon footprint, waste management, energy efficiency
              </div>
            </div>

            {/* Social */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">Social</span>
                </div>
                <span className="text-blue-400 font-bold">{esgData.socialScore}%</span>
              </div>
              <Progress value={esgData.socialScore} className="h-2" />
              <div className="text-gray-400 text-xs">
                Employee welfare, diversity, community engagement
              </div>
            </div>

            {/* Governance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Governance</span>
                </div>
                <span className="text-purple-400 font-bold">{esgData.governanceScore}%</span>
              </div>
              <Progress value={esgData.governanceScore} className="h-2" />
              <div className="text-gray-400 text-xs">
                Board structure, ethics, transparency, compliance
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {esgData.certifications.map((cert, index) => (
              <Badge key={index} variant="outline" className="text-green-400 border-green-500/30">
                {cert}
              </Badge>
            ))}
          </div>
          {esgData.certifications.length === 0 && (
            <div className="text-gray-400 text-sm">No certifications yet</div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Assessment Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Last Assessment</span>
              <span className="text-white font-medium">{new Date(esgData.lastAssessment).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Next Review</span>
              <span className="text-white font-medium">{new Date(esgData.nextReview).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Days Until Review</span>
              <span className={`font-bold ${daysUntilReview <= 30 ? 'text-red-400' : daysUntilReview <= 90 ? 'text-yellow-400' : 'text-green-400'}`}>
                {daysUntilReview > 0 ? daysUntilReview : 'Overdue'}
              </span>
            </div>
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Recommended Improvements</h3>
          <div className="space-y-2">
            {esgData.improvements.map((improvement, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{improvement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Assessment
          </Button>
          <Button
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            View Report
          </Button>
        </div>

        {/* Regulatory Notice */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-green-400 mt-0.5" />
            <div>
              <div className="text-green-300 text-sm font-medium">ESG Compliance</div>
              <div className="text-green-200 text-xs">
                ESG reporting is becoming mandatory for larger businesses. Early adoption provides competitive advantage.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}; 