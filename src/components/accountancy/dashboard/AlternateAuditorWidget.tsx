import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlternateAuditor } from '../../../hooks/useAlternateAuditor';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  Plus,
  Edit,
  Phone,
  Mail,
  Building,
  Calendar,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';

export const AlternateAuditorWidget: React.FC = () => {
  const {
    alternateAuditor,
    complianceTimeline,
    loading,
    error,
    daysRemaining,
    complianceStatus,
    isSetupComplete,
    loadAlternateAuditor,
    generateEvidencePack
  } = useAlternateAuditor();

  const [expanded, setExpanded] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Get status color and icon based on exact specifications
  const getStatusConfig = () => {
    switch (complianceStatus) {
      case 'compliant':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Compliant',
          description: 'All requirements met'
        };
      case 'action_required':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Action Required',
          description: 'Review required documents'
        };
      case 'urgent':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Urgent',
          description: 'Immediate action needed'
        };
      case 'not_configured':
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: <Clock className="w-5 h-5" />,
          label: 'Not Configured',
          description: 'Setup required by Dec 1, 2025'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="Alternate Auditor Status"
        icon={<Shield className="w-5 h-5 text-purple-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={loading}
        error={error}
        onRefresh={loadAlternateAuditor}
        isNew={true}
        className="bg-white border border-gray-200"
      >
        {!isSetupComplete ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-[#1a2b4a] font-semibold mb-2">Setup Required</h3>
            <p className="text-gray-700 text-sm mb-4">
              Regulatory deadline: December 1, 2025
            </p>
            <Button
              onClick={() => setShowSetupWizard(true)}
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase"
            >
              <Plus className="w-4 h-4 mr-2" />
              SETUP NOW
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status indicator */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
              {statusConfig.icon}
              <div className="flex-1">
                <div className={`font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </div>
                <div className="text-gray-700 text-sm">
                  {statusConfig.description}
                </div>
                {daysRemaining !== null && (
                  <div className="text-gray-700 text-xs mt-1">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                  </div>
                )}
              </div>
            </div>

            {/* Alternate details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-600" />
                <span className="text-[#1a2b4a] text-sm">{alternateAuditor?.alternateFirm}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Contact:</span>
                <span className="text-[#1a2b4a] text-sm">{alternateAuditor?.alternateName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">RPB:</span>
                <span className="text-[#1a2b4a] text-sm">{alternateAuditor?.rpbType} {alternateAuditor?.rpbNumber}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(true)}
                className="flex-1 text-[#1a2b4a] border-gray-300 hover:bg-gray-50"
              >
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupWizard(true)}
                className="text-[#1a2b4a] border-gray-300 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </WidgetContainer>
    );
  }

  // Expanded view
  return (
    <WidgetContainer
      title="Alternate Auditor Register"
      icon={<Shield className="w-5 h-5 text-[#ff6b35]" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={loading}
      error={error}
      onRefresh={loadAlternateAuditor}
      isNew={true}
      className="bg-[#ff6b35]/5"
    >
      <div className="space-y-6">
        {/* Compliance Timeline */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Compliance Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Deadline</span>
              <span className="text-white font-medium">December 1, 2025</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Status</span>
              <Badge 
                variant="outline" 
                className={`${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
              >
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
            {daysRemaining !== null && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Days Remaining</span>
                <span className={`font-bold ${daysRemaining <= 30 ? 'text-red-400' : daysRemaining <= 90 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {daysRemaining > 0 ? daysRemaining : 'Expired'}
                </span>
              </div>
            )}
            {complianceTimeline?.milestones && (
              <div className="mt-4">
                <h4 className="text-white text-sm font-medium mb-2">Milestones</h4>
                <div className="space-y-2">
                  {complianceTimeline.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className={`text-sm ${milestone.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {milestone.title}
                      </span>
                      {milestone.critical && (
                        <Badge variant="outline" className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                          Critical
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alternate Details */}
        {alternateAuditor && (
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Alternate Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-white font-medium">{alternateAuditor.alternateFirm}</div>
                  <div className="text-gray-400 text-sm">{alternateAuditor.alternateName}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{alternateAuditor.alternateEmail}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{alternateAuditor.alternatePhone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{alternateAuditor.rpbType} {alternateAuditor.rpbNumber}</span>
              </div>

              {alternateAuditor.specializations.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">Specializations:</span>
                  <div className="flex gap-1">
                    {alternateAuditor.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Management */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Document Management</h3>
          <div className="space-y-4">
            {/* Engagement Letter */}
            <div className="border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Engagement Letter</span>
                <Badge variant={alternateAuditor?.engagementLetter ? "default" : "secondary"}>
                  {alternateAuditor?.engagementLetter ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
              {alternateAuditor?.engagementLetter && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">File:</span>
                    <span className="text-white">{alternateAuditor.engagementLetter.fileName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{formatFileSize(alternateAuditor.engagementLetter.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Uploaded:</span>
                    <span className="text-white">{new Date(alternateAuditor.engagementLetter.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PI Certificate */}
            <div className="border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">PI Certificate</span>
                <Badge variant={alternateAuditor?.piCertificate ? "default" : "secondary"}>
                  {alternateAuditor?.piCertificate ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
              {alternateAuditor?.piCertificate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">File:</span>
                    <span className="text-white">{alternateAuditor.piCertificate.fileName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Expiry:</span>
                    <span className={`text-sm ${new Date(alternateAuditor.piCertificate.expiryDate) < new Date() ? 'text-red-400' : 'text-white'}`}>
                      {new Date(alternateAuditor.piCertificate.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{formatFileSize(alternateAuditor.piCertificate.fileSize)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowSetupWizard(true)}
            className="flex-1 bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isSetupComplete ? 'UPDATE DETAILS' : 'SETUP NOW'}
          </Button>
          {isSetupComplete && (
            <Button
              variant="outline"
              onClick={generateEvidencePack}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Pack
            </Button>
          )}
        </div>

        {/* Regulatory Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <div className="text-yellow-300 text-sm font-medium">Regulatory Deadline</div>
              <div className="text-yellow-200 text-xs">
                All sole-practice RIs must nominate an alternate auditor by December 1, 2025 under Audit Regulations 2025
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        {alternateAuditor?.auditTrail && alternateAuditor.auditTrail.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Audit Trail</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alternateAuditor.auditTrail.slice(-3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{entry.description}</span>
                  <span className="text-white">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}; 