import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlternateAuditor } from '../../hooks/useAlternateAuditor';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusIndicator } from '../../components/accountancy/ui/StatusIndicator';
import { CountdownTimer } from '../../components/accountancy/ui/CountdownTimer';
import { DocumentUploader } from '../../components/accountancy/ui/DocumentUploader';
import { WizardStepper } from '../../components/accountancy/ui/WizardStepper';
import { ComplianceCalendar } from '../../components/accountancy/ui/ComplianceCalendar';
import { NotificationSettings } from '../../components/accountancy/ui/NotificationSettings';
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
  ExternalLink,
  Upload,
  Settings,
  Bell,
  History,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  User,
  Check
} from 'lucide-react';

// Wizard step types
interface WizardData {
  step1: {
    alternateName: string;
    alternateFirm: string;
    alternateEmail: string;
    alternatePhone: string;
    rpbNumber: string;
    rpbType: 'ICAEW' | 'ICAS' | 'CAI' | 'ACCA';
  };
  step2: {
    engagementLetter: File | null;
  };
  step3: {
    piCertificate: File | null;
    piExpiryDate: string;
  };
  step4: {
    notifications: {
      email: boolean;
      sms: boolean;
      frequency: 'weekly' | 'monthly' | 'critical_only';
    };
  };
}

export const AlternateAuditorPage: React.FC = () => {
  const {
    alternateAuditor,
    complianceTimeline,
    loading,
    error,
    daysRemaining,
    complianceStatus,
    isSetupComplete,
    loadAlternateAuditor,
    createAlternateAuditor,
    updateAlternateAuditor,
    uploadDocument,
    generateEvidencePack
  } = useAlternateAuditor();

  const { subscriptionTier } = useAccountancyContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    step1: {
      alternateName: '',
      alternateFirm: '',
      alternateEmail: '',
      alternatePhone: '',
      rpbNumber: '',
      rpbType: 'ICAEW'
    },
    step2: { engagementLetter: null },
    step3: { piCertificate: null, piExpiryDate: '' },
    step4: {
      notifications: {
        email: true,
        sms: false,
        frequency: 'weekly'
      }
    }
  });

  const wizardSteps = [
    'Alternate Details',
    'Engagement Letter',
    'PI Certificate',
    'Notifications',
    'Review & Confirm'
  ];

  // Get status configuration
  const getStatusConfig = () => {
    switch (complianceStatus) {
      case 'compliant':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: <CheckCircle className="w-6 h-6" />,
          label: 'Compliant',
          description: 'All requirements met'
        };
      case 'action_required':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'Action Required',
          description: 'Review required documents'
        };
      case 'urgent':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: <AlertCircle className="w-6 h-6" />,
          label: 'Urgent',
          description: 'Immediate action needed'
        };
      case 'not_configured':
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: <Clock className="w-6 h-6" />,
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

  // Wizard navigation
  const nextStep = () => {
    if (wizardStep < wizardSteps.length) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleWizardSubmit = async () => {
    try {
      // Create alternate auditor with all data
      const alternateData = {
        ...wizardData.step1,
        specializations: [],
        reciprocalArrangement: false,
        status: 'action_required' as const
      };

      const newAlternate = await createAlternateAuditor(alternateData);

      // Upload documents if provided
      if (wizardData.step2.engagementLetter) {
        await uploadDocument(wizardData.step2.engagementLetter, 'engagement_letter');
      }

      if (wizardData.step3.piCertificate) {
        await uploadDocument(wizardData.step3.piCertificate, 'pi_certificate');
      }

      setShowSetupWizard(false);
      setWizardStep(1);
      setActiveTab('overview');
    } catch (error) {
      console.error('Error setting up alternate auditor:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0f] via-purple-900 to-pink-900">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-white font-bold text-lg">Loading Alternate Auditor Register...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0f] via-purple-900 to-pink-900">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <div className="text-white font-bold text-lg mb-2">Error</div>
          <div className="text-gray-300 mb-4">{error}</div>
          <Button onClick={loadAlternateAuditor} className="bg-purple-600 hover:bg-purple-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-purple-900 to-pink-900">
      <div className="alternate-auditor-container" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Alternate Auditor Register</h1>
                <p className="text-purple-100">Compliance with Audit Regulations 2025</p>
              </div>
              <Badge variant="outline" className="ml-auto bg-white/20 text-white border-white/30">
                {subscriptionTier} Tier
              </Badge>
            </div>

            {/* Status Banner */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
              {statusConfig.icon}
              <div className="flex-1">
                <div className={`text-xl font-bold ${statusConfig.color}`}>
                  {statusConfig.label}
                </div>
                <div className="text-purple-100">
                  {statusConfig.description}
                </div>
              </div>
              {daysRemaining !== null && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {daysRemaining > 0 ? daysRemaining : '0'}
                  </div>
                  <div className="text-purple-100 text-sm">
                    {daysRemaining > 0 ? 'days remaining' : 'days expired'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="setup" className="text-white data-[state=active]:bg-purple-600">
                Setup Wizard
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-white data-[state=active]:bg-purple-600">
                Documents
              </TabsTrigger>
              <TabsTrigger value="compliance" className="text-white data-[state=active]:bg-purple-600">
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Timeline */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Compliance Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Deadline</span>
                        <span className="text-white font-medium">December 1, 2025</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-white font-medium">
                          {isSetupComplete ? '100%' : '0%'}
                        </span>
                      </div>
                      <Progress 
                        value={isSetupComplete ? 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    
                    {complianceTimeline?.milestones && (
                      <ComplianceCalendar milestones={complianceTimeline.milestones} />
                    )}
                  </CardContent>
                </Card>

                {/* Alternate Details */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Alternate Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alternateAuditor ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-white font-medium">{alternateAuditor.alternateFirm}</div>
                            <div className="text-gray-400 text-sm">{alternateAuditor.alternateName}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-white text-sm">{alternateAuditor.alternateEmail}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="text-white text-sm">{alternateAuditor.alternatePhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-white text-sm">{alternateAuditor.rpbType} {alternateAuditor.rpbNumber}</span>
                        </div>

                        {alternateAuditor.specializations.length > 0 && (
                          <div>
                            <span className="text-gray-400 text-sm">Specializations:</span>
                            <div className="flex gap-1 mt-1">
                              {alternateAuditor.specializations.map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">No Alternate Auditor Configured</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Setup your alternate auditor to comply with regulations
                        </p>
                        <Button
                          onClick={() => setActiveTab('setup')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Setup Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setActiveTab('setup')}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isSetupComplete ? 'Update Details' : 'Setup Alternate'}
                    </Button>
                    {isSetupComplete && (
                      <Button
                        variant="outline"
                        onClick={generateEvidencePack}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Evidence Pack
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('documents')}
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Setup Wizard Tab */}
            <TabsContent value="setup" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Setup Wizard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showSetupWizard ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Settings className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-white text-xl font-semibold mb-4">Alternate Auditor Setup</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Complete the 5-minute setup wizard to configure your alternate auditor and ensure compliance with Audit Regulations 2025.
                      </p>
                      <Button
                        onClick={() => setShowSetupWizard(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Start Setup Wizard
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Wizard Stepper */}
                      <WizardStepper 
                        steps={wizardSteps} 
                        currentStep={wizardStep} 
                        onStepChange={setWizardStep}
                        className="justify-center mb-8"
                      />

                      {/* Step Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={wizardStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Step 1: Alternate Details */}
                          {wizardStep === 1 && (
                            <div className="space-y-4">
                              <h3 className="text-white text-lg font-semibold mb-4">Alternate Auditor Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="name" className="text-white">Full Name</Label>
                                  <Input
                                    id="name"
                                    value={wizardData.step1.alternateName}
                                    onChange={(e) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, alternateName: e.target.value }
                                    })}
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="Enter full name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="firm" className="text-white">Firm Name</Label>
                                  <Input
                                    id="firm"
                                    value={wizardData.step1.alternateFirm}
                                    onChange={(e) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, alternateFirm: e.target.value }
                                    })}
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="Enter firm name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="email" className="text-white">Email Address</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={wizardData.step1.alternateEmail}
                                    onChange={(e) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, alternateEmail: e.target.value }
                                    })}
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="Enter email address"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                                  <Input
                                    id="phone"
                                    value={wizardData.step1.alternatePhone}
                                    onChange={(e) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, alternatePhone: e.target.value }
                                    })}
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="Enter phone number"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="rpb" className="text-white">RPB Type</Label>
                                  <Select
                                    value={wizardData.step1.rpbType}
                                    onValueChange={(value) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, rpbType: value as any }
                                    })}
                                  >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ICAEW">ICAEW</SelectItem>
                                      <SelectItem value="ICAS">ICAS</SelectItem>
                                      <SelectItem value="CAI">CAI</SelectItem>
                                      <SelectItem value="ACCA">ACCA</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="rpbNumber" className="text-white">RPB Number</Label>
                                  <Input
                                    id="rpbNumber"
                                    value={wizardData.step1.rpbNumber}
                                    onChange={(e) => setWizardData({
                                      ...wizardData,
                                      step1: { ...wizardData.step1, rpbNumber: e.target.value }
                                    })}
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="Enter RPB registration number"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Engagement Letter */}
                          {wizardStep === 2 && (
                            <div className="space-y-4">
                              <h3 className="text-white text-lg font-semibold mb-4">Engagement Letter</h3>
                              <p className="text-gray-300 mb-4">
                                Upload the signed engagement letter with your alternate auditor.
                              </p>
                              <DocumentUploader
                                label="Engagement Letter (PDF, JPG, PNG)"
                                onUpload={(file) => setWizardData({
                                  ...wizardData,
                                  step2: { engagementLetter: file }
                                })}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                            </div>
                          )}

                          {/* Step 3: PI Certificate */}
                          {wizardStep === 3 && (
                            <div className="space-y-4">
                              <h3 className="text-white text-lg font-semibold mb-4">Professional Indemnity Certificate</h3>
                              <p className="text-gray-300 mb-4">
                                Upload the PI certificate and specify the expiry date.
                              </p>
                              <DocumentUploader
                                label="PI Certificate (PDF, JPG, PNG)"
                                onUpload={(file) => setWizardData({
                                  ...wizardData,
                                  step3: { ...wizardData.step3, piCertificate: file }
                                })}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              <div>
                                <Label htmlFor="expiry" className="text-white">Certificate Expiry Date</Label>
                                <Input
                                  id="expiry"
                                  type="date"
                                  value={wizardData.step3.piExpiryDate}
                                  onChange={(e) => setWizardData({
                                    ...wizardData,
                                    step3: { ...wizardData.step3, piExpiryDate: e.target.value }
                                  })}
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* Step 4: Notifications */}
                          {wizardStep === 4 && (
                            <div className="space-y-4">
                              <h3 className="text-white text-lg font-semibold mb-4">Notification Preferences</h3>
                              <p className="text-gray-300 mb-4">
                                Configure how you'd like to receive compliance reminders and updates.
                              </p>
                              <NotificationSettings
                                value={wizardData.step4.notifications}
                                onChange={(notifications) => setWizardData({
                                  ...wizardData,
                                  step4: { notifications }
                                })}
                              />
                            </div>
                          )}

                          {/* Step 5: Review & Confirm */}
                          {wizardStep === 5 && (
                            <div className="space-y-4">
                              <h3 className="text-white text-lg font-semibold mb-4">Review & Confirm</h3>
                              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                <h4 className="text-white font-medium">Alternate Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <span className="text-gray-400">Name:</span>
                                  <span className="text-white">{wizardData.step1.alternateName}</span>
                                  <span className="text-gray-400">Firm:</span>
                                  <span className="text-white">{wizardData.step1.alternateFirm}</span>
                                  <span className="text-gray-400">Email:</span>
                                  <span className="text-white">{wizardData.step1.alternateEmail}</span>
                                  <span className="text-gray-400">RPB:</span>
                                  <span className="text-white">{wizardData.step1.rpbType} {wizardData.step1.rpbNumber}</span>
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                <h4 className="text-white font-medium">Documents</h4>
                                <div className="text-sm">
                                  <span className="text-gray-400">Engagement Letter: </span>
                                  <span className="text-white">
                                    {wizardData.step2.engagementLetter ? '✓ Uploaded' : '✗ Missing'}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-400">PI Certificate: </span>
                                  <span className="text-white">
                                    {wizardData.step3.piCertificate ? '✓ Uploaded' : '✗ Missing'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Wizard Navigation */}
                      <div className="flex justify-between pt-6">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          disabled={wizardStep === 1}
                          className="text-white border-white/20 hover:bg-white/10"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowSetupWizard(false)}
                            className="text-white border-white/20 hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          
                          {wizardStep < wizardSteps.length ? (
                            <Button
                              onClick={nextStep}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <Button
                              onClick={handleWizardSubmit}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Complete Setup
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Engagement Letter */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Engagement Letter</h3>
                      <Badge variant={alternateAuditor?.engagementLetter ? "default" : "secondary"}>
                        {alternateAuditor?.engagementLetter ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    {alternateAuditor?.engagementLetter ? (
                      <div className="space-y-3">
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
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Upload className="w-4 h-4 mr-1" />
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No engagement letter uploaded</p>
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* PI Certificate */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">PI Certificate</h3>
                      <Badge variant={alternateAuditor?.piCertificate ? "default" : "secondary"}>
                        {alternateAuditor?.piCertificate ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    {alternateAuditor?.piCertificate ? (
                      <div className="space-y-3">
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
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                            <Upload className="w-4 h-4 mr-1" />
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No PI certificate uploaded</p>
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audit Trail */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alternateAuditor?.auditTrail && alternateAuditor.auditTrail.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {alternateAuditor.auditTrail.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <div className="text-white text-sm">{entry.description}</div>
                              <div className="text-gray-400 text-xs">{entry.userId}</div>
                            </div>
                            <div className="text-gray-400 text-xs">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No audit trail available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Email Notifications</span>
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                          Enabled
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">SMS Notifications</span>
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          Critical Only
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Frequency</span>
                        <span className="text-white text-sm">Weekly</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-white border-white/20 hover:bg-white/10">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Notifications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Regulatory Notice */}
              <Card className="bg-yellow-500/10 border border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-yellow-300 text-lg font-semibold mb-2">Regulatory Deadline</div>
                      <div className="text-yellow-200 text-sm mb-3">
                        All sole-practice RIs must nominate an alternate auditor by December 1, 2025 under Audit Regulations 2025. 
                        Failure to comply may result in regulatory action including fines and suspension of registration.
                      </div>
                      <div className="text-yellow-200 text-sm">
                        <strong>Key Requirements:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Named alternate auditor with valid RPB registration</li>
                          <li>Signed engagement letter</li>
                          <li>Valid PI certificate covering the period</li>
                          <li>Evidence lodged with relevant RPB</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 