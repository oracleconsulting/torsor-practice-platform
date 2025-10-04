import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText,
  Users,
  Settings,
  ArrowRight,
  Calendar,
  AlertCircle,
  Target,
  RefreshCw
} from 'lucide-react';

interface ContinuityData {
  planStatus: 'complete' | 'in_progress' | 'outdated' | 'not_started';
  lastReview: string;
  nextReview: string;
  riskScore: number;
  recoveryTime: number;
  criticalFunctions: string[];
  teamReadiness: number;
  systemBackup: number;
  communicationPlan: number;
}

export const ContinuityPlanWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Mock data - replace with real data from context
  const continuityData: ContinuityData = {
    planStatus: 'in_progress',
    lastReview: '2024-01-15',
    nextReview: '2024-04-15',
    riskScore: 35,
    recoveryTime: 4,
    criticalFunctions: ['Client Services', 'Data Processing', 'Communication'],
    teamReadiness: 75,
    systemBackup: 90,
    communicationPlan: 60
  };

  const getStatusConfig = () => {
    switch (continuityData.planStatus) {
      case 'complete':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Complete',
          description: 'Fully operational'
        };
      case 'in_progress':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          icon: <RefreshCw className="w-5 h-5" />,
          label: 'In Progress',
          description: 'Implementation ongoing'
        };
      case 'outdated':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Outdated',
          description: 'Review required'
        };
      case 'not_started':
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: <Clock className="w-5 h-5" />,
          label: 'Not Started',
          description: 'Setup required'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const daysUntilReview = Math.ceil((new Date(continuityData.nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="Continuity Plan"
        icon={<Shield className="w-5 h-5 text-orange-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={false}
        error=""
        onRefresh={() => {}}
        isNew={true}
        className="bg-gradient-to-br from-orange-500/5 to-red-500/5"
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

          {/* Risk score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {continuityData.riskScore}%
            </div>
            <div className="text-gray-400 text-sm">Risk Score</div>
          </div>

          {/* Recovery time */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Recovery Time</span>
            <span className="text-white font-medium">{continuityData.recoveryTime} hours</span>
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
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </WidgetContainer>
    );
  }

  // Expanded view
  return (
    <WidgetContainer
      title="Business Continuity Plan"
      icon={<Shield className="w-5 h-5 text-orange-400" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={false}
      error=""
      onRefresh={() => {}}
      isNew={true}
      className="bg-gradient-to-br from-orange-500/5 to-red-500/5"
    >
      <div className="space-y-6">
        {/* Risk Assessment */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Risk Assessment</h3>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-orange-400 mb-2">
              {continuityData.riskScore}%
            </div>
            <div className="text-gray-400 text-sm">Overall Risk Score</div>
            <Progress value={100 - continuityData.riskScore} className="h-3 mt-2" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Recovery Time Objective</span>
            <span className="text-white font-medium">{continuityData.recoveryTime} hours</span>
          </div>
        </div>

        {/* Critical Functions */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Critical Functions</h3>
          <div className="space-y-2">
            {continuityData.criticalFunctions.map((func, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-white text-sm">{func}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Assessment */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Readiness Assessment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Team Readiness</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={continuityData.teamReadiness} className="w-20 h-2" />
                <span className="text-white text-sm">{continuityData.teamReadiness}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">System Backup</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={continuityData.systemBackup} className="w-20 h-2" />
                <span className="text-white text-sm">{continuityData.systemBackup}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Communication Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={continuityData.communicationPlan} className="w-20 h-2" />
                <span className="text-white text-sm">{continuityData.communicationPlan}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Review Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Last Review</span>
              <span className="text-white font-medium">{new Date(continuityData.lastReview).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Next Review</span>
              <span className="text-white font-medium">{new Date(continuityData.nextReview).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Days Until Review</span>
              <span className={`font-bold ${daysUntilReview <= 30 ? 'text-red-400' : daysUntilReview <= 90 ? 'text-yellow-400' : 'text-green-400'}`}>
                {daysUntilReview > 0 ? daysUntilReview : 'Overdue'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Plan
          </Button>
          <Button
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Test Plan
          </Button>
        </div>

        {/* Regulatory Notice */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
            <div>
              <div className="text-orange-300 text-sm font-medium">Business Continuity</div>
              <div className="text-orange-200 text-xs">
                A robust continuity plan is essential for maintaining client services during disruptions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}; 