import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  Eye,
  AlertCircle,
  ArrowRight,
  Zap,
  Target,
  RefreshCw,
  Activity
} from 'lucide-react';

interface SecurityData {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastScan: string;
  vulnerabilities: number;
  complianceScore: number;
  securityScore: number;
  nextScan: string;
  activeThreats: number;
  patchedSystems: number;
  encryptionLevel: 'basic' | 'standard' | 'advanced';
}

export const CyberSecurityWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Mock data - replace with real data from context
  const securityData: SecurityData = {
    threatLevel: 'medium',
    lastScan: '2024-01-15T10:30:00Z',
    vulnerabilities: 3,
    complianceScore: 85,
    securityScore: 78,
    nextScan: '2024-01-22T10:30:00Z',
    activeThreats: 1,
    patchedSystems: 95,
    encryptionLevel: 'standard'
  };

  const getThreatLevelConfig = () => {
    switch (securityData.threatLevel) {
      case 'low':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Low Threat',
          description: 'Minimal risk'
        };
      case 'medium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Medium Threat',
          description: 'Monitor closely'
        };
      case 'high':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'High Threat',
          description: 'Immediate action needed'
        };
      case 'critical':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Critical Threat',
          description: 'Emergency response required'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: <Clock className="w-5 h-5" />,
          label: 'Unknown',
          description: 'Assessment required'
        };
    }
  };

  const threatConfig = getThreatLevelConfig();
  const daysUntilScan = Math.ceil((new Date(securityData.nextScan).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="Cyber Security"
        icon={<Lock className="w-5 h-5 text-purple-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={false}
        error=""
        onRefresh={() => {}}
        isNew={true}
        className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
      >
        <div className="space-y-4">
          {/* Threat level indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${threatConfig.bgColor} ${threatConfig.borderColor} border`}>
            {threatConfig.icon}
            <div className="flex-1">
              <div className={`font-semibold ${threatConfig.color}`}>
                {threatConfig.label}
              </div>
              <div className="text-gray-300 text-sm">
                {threatConfig.description}
              </div>
            </div>
          </div>

          {/* Security score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {securityData.securityScore}%
            </div>
            <div className="text-gray-400 text-sm">Security Score</div>
          </div>

          {/* Vulnerabilities */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Vulnerabilities</span>
            <Badge variant={securityData.vulnerabilities > 0 ? "destructive" : "default"} className="text-xs">
              {securityData.vulnerabilities}
            </Badge>
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
      title="Cyber Security Monitoring"
      icon={<Lock className="w-5 h-5 text-purple-400" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={false}
      error=""
      onRefresh={() => {}}
      isNew={true}
      className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
    >
      <div className="space-y-6">
        {/* Security Overview */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Security Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{securityData.securityScore}%</div>
              <div className="text-gray-400 text-sm">Security Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{securityData.complianceScore}%</div>
              <div className="text-gray-400 text-sm">Compliance</div>
            </div>
          </div>
          <Progress value={securityData.securityScore} className="h-3" />
        </div>

        {/* Threat Assessment */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Threat Assessment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Active Threats</span>
              <Badge variant={securityData.activeThreats > 0 ? "destructive" : "default"} className="text-xs">
                {securityData.activeThreats}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Vulnerabilities</span>
              <Badge variant={securityData.vulnerabilities > 0 ? "destructive" : "default"} className="text-xs">
                {securityData.vulnerabilities}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Patched Systems</span>
              <span className="text-green-400 font-medium">{securityData.patchedSystems}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Encryption Level</span>
              <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                {securityData.encryptionLevel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Scan Timeline */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Security Scans</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Last Scan</span>
              <span className="text-white font-medium">{new Date(securityData.lastScan).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Next Scan</span>
              <span className="text-white font-medium">{new Date(securityData.nextScan).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Days Until Scan</span>
              <span className={`font-bold ${daysUntilScan <= 1 ? 'text-red-400' : daysUntilScan <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {daysUntilScan > 0 ? daysUntilScan : 'Due now'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Security Recommendations</h3>
          <div className="space-y-2">
            {securityData.vulnerabilities > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">Patch {securityData.vulnerabilities} identified vulnerabilities</span>
              </div>
            )}
            {securityData.patchedSystems < 100 && (
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Update remaining systems</span>
              </div>
            )}
            {securityData.encryptionLevel === 'basic' && (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Upgrade encryption to advanced level</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Run Scan
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
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <div className="text-purple-300 text-sm font-medium">Cyber Security</div>
              <div className="text-purple-200 text-xs">
                Regular security assessments are essential for protecting client data and maintaining compliance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}; 