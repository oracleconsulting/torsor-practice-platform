import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cyberSecurityService, CyberSecurityAssessment } from '@/services/accountancy/cyberSecurityService';

const CyberSecuritySurveyPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessment, setAssessment] = useState<Partial<CyberSecurityAssessment>>({
    assessment_date: new Date(),
    overall_confidence_score: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateAssessment = (field: keyof CyberSecurityAssessment, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await cyberSecurityService.submitAssessment(assessment as CyberSecurityAssessment);
      
      toast({
        title: "Assessment Submitted",
        description: "Your cybersecurity assessment has been successfully submitted.",
      });
      
      // Calculate and show security score
      const securityScore = cyberSecurityService.calculateSecurityScore(assessment as CyberSecurityAssessment);
      const recommendations = cyberSecurityService.getSecurityRecommendations(assessment as CyberSecurityAssessment);
      
      toast({
        title: `Security Score: ${securityScore}/100`,
        description: `You have ${recommendations.length} recommendations to improve your security posture.`,
      });
      
      // Reset form or redirect
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            value={assessment.company_name || ''}
            onChange={(e) => updateAssessment('company_name', e.target.value)}
            placeholder="Enter your company name"
          />
        </div>
        <div>
          <Label htmlFor="assessment_date">Assessment Date</Label>
          <Input
            id="assessment_date"
            type="date"
            value={assessment.assessment_date?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateAssessment('assessment_date', new Date(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Policy & Governance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="security_policy">Do you have a formal security policy?</Label>
          <Switch
            id="security_policy"
            checked={assessment.has_security_policy || false}
            onCheckedChange={(checked) => updateAssessment('has_security_policy', checked)}
          />
        </div>
        {assessment.has_security_policy && (
          <div>
            <Label htmlFor="policy_date">When was the policy last updated?</Label>
            <Input
              id="policy_date"
              type="date"
              value={assessment.policy_last_updated || ''}
              onChange={(e) => updateAssessment('policy_last_updated', e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Label htmlFor="incident_plan">Do you have an incident response plan?</Label>
          <Switch
            id="incident_plan"
            checked={assessment.has_incident_response_plan || false}
            onCheckedChange={(checked) => updateAssessment('has_incident_response_plan', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Access Control & Data Protection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="mfa">Do you use Multi-Factor Authentication (MFA)?</Label>
          <Switch
            id="mfa"
            checked={assessment.uses_mfa || false}
            onCheckedChange={(checked) => updateAssessment('uses_mfa', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password_policy">Is password policy enforced?</Label>
          <Switch
            id="password_policy"
            checked={assessment.password_policy_enforced || false}
            onCheckedChange={(checked) => updateAssessment('password_policy_enforced', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="access_reviews">Are access reviews conducted regularly?</Label>
          <Switch
            id="access_reviews"
            checked={assessment.access_reviews_conducted || false}
            onCheckedChange={(checked) => updateAssessment('access_reviews_conducted', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="encryption_rest">Is data encrypted at rest?</Label>
          <Switch
            id="encryption_rest"
            checked={assessment.data_encrypted_at_rest || false}
            onCheckedChange={(checked) => updateAssessment('data_encrypted_at_rest', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="encryption_transit">Is data encrypted in transit?</Label>
          <Switch
            id="encryption_transit"
            checked={assessment.data_encrypted_in_transit || false}
            onCheckedChange={(checked) => updateAssessment('data_encrypted_in_transit', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Training & Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="security_training">Is security training provided to employees?</Label>
          <Switch
            id="security_training"
            checked={assessment.security_training_provided || false}
            onCheckedChange={(checked) => updateAssessment('security_training_provided', checked)}
          />
        </div>
        {assessment.security_training_provided && (
          <div>
            <Label htmlFor="training_frequency">Training frequency</Label>
            <Select
              value={assessment.training_frequency || ''}
              onValueChange={(value) => updateAssessment('training_frequency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annually">Annually</SelectItem>
                <SelectItem value="semi-annually">Semi-annually</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Label htmlFor="vulnerability_scans">Are vulnerability scans performed?</Label>
          <Switch
            id="vulnerability_scans"
            checked={assessment.vulnerability_scans_performed || false}
            onCheckedChange={(checked) => updateAssessment('vulnerability_scans_performed', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="penetration_tests">Are penetration tests conducted?</Label>
          <Switch
            id="penetration_tests"
            checked={assessment.penetration_tests_conducted || false}
            onCheckedChange={(checked) => updateAssessment('penetration_tests_conducted', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="third_party_risk">Is third-party risk assessed?</Label>
          <Switch
            id="third_party_risk"
            checked={assessment.third_party_risk_assessed || false}
            onCheckedChange={(checked) => updateAssessment('third_party_risk_assessed', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Final Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="confidence_score">Overall Security Confidence (1-5)</Label>
          <Select
            value={assessment.overall_confidence_score?.toString() || '3'}
            onValueChange={(value) => updateAssessment('overall_confidence_score', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select confidence level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Very Low</SelectItem>
              <SelectItem value="2">2 - Low</SelectItem>
              <SelectItem value="3">3 - Medium</SelectItem>
              <SelectItem value="4">4 - High</SelectItem>
              <SelectItem value="5">5 - Very High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="comments">Additional Comments</Label>
          <Textarea
            id="comments"
            value={assessment.additional_comments || ''}
            onChange={(e) => updateAssessment('additional_comments', e.target.value)}
            placeholder="Any additional comments or concerns..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cyber Security Survey</h1>
        <p className="text-gray-400">Complete this assessment to evaluate your cybersecurity posture</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CyberSecuritySurveyPage; 