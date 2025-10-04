import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlternateAuditor } from '../../../hooks/useAlternateAuditor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  FileText, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Download
} from 'lucide-react';

interface AlternateSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  alternateName: string;
  alternateFirm: string;
  alternateEmail: string;
  alternatePhone: string;
  rpbNumber: string;
  rpbType: 'ICAEW' | 'ICAS' | 'CAI' | 'ACCA';
  specializations: string[];
  reciprocalArrangement: boolean;
  annualFee?: number;
  engagementLetter: File | null;
  piCertificate: File | null;
  piExpiryDate: string;
}

const RPB_TYPES = [
  { value: 'ICAEW', label: 'ICAEW - Institute of Chartered Accountants in England and Wales' },
  { value: 'ICAS', label: 'ICAS - Institute of Chartered Accountants of Scotland' },
  { value: 'CAI', label: 'CAI - Chartered Accountants Ireland' },
  { value: 'ACCA', label: 'ACCA - Association of Chartered Certified Accountants' }
];

const SPECIALIZATION_OPTIONS = [
  'Audit & Assurance',
  'Tax Advisory',
  'Corporate Finance',
  'Insolvency',
  'Forensic Accounting',
  'Risk Management',
  'Compliance',
  'Financial Reporting',
  'SME Advisory',
  'Not-for-Profit'
];

export const AlternateSetupWizard: React.FC<AlternateSetupWizardProps> = ({
  isOpen,
  onClose
}) => {
  const { createAlternateAuditor, updateAlternateAuditor, alternateAuditor } = useAlternateAuditor();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    alternateName: alternateAuditor?.alternateName || '',
    alternateFirm: alternateAuditor?.alternateFirm || '',
    alternateEmail: alternateAuditor?.alternateEmail || '',
    alternatePhone: alternateAuditor?.alternatePhone || '',
    rpbNumber: alternateAuditor?.rpbNumber || '',
    rpbType: alternateAuditor?.rpbType || 'ICAEW',
    specializations: alternateAuditor?.specializations || [],
    reciprocalArrangement: alternateAuditor?.reciprocalArrangement || false,
    annualFee: alternateAuditor?.annualFee,
    engagementLetter: null,
    piCertificate: null,
    piExpiryDate: alternateAuditor?.piCertificate?.expiryDate || ''
  });

  const totalSteps = 4;

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.alternateName.trim()) newErrors.alternateName = 'Name is required';
        if (!formData.alternateFirm.trim()) newErrors.alternateFirm = 'Firm name is required';
        if (!formData.alternateEmail.trim()) newErrors.alternateEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail)) {
          newErrors.alternateEmail = 'Valid email is required';
        }
        if (!formData.alternatePhone.trim()) newErrors.alternatePhone = 'Phone is required';
        if (!formData.rpbNumber.trim()) newErrors.rpbNumber = 'RPB number is required';
        break;
      
      case 2:
        if (!formData.engagementLetter) newErrors.engagementLetter = 'Engagement letter is required';
        break;
      
      case 3:
        if (!formData.piCertificate) newErrors.piCertificate = 'PI certificate is required';
        if (!formData.piExpiryDate) newErrors.piExpiryDate = 'PI expiry date is required';
        else if (new Date(formData.piExpiryDate) <= new Date()) {
          newErrors.piExpiryDate = 'PI certificate must not be expired';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        complianceDeadline: '2025-12-01', // December 1, 2025
        status: 'compliant' as const
      };

      if (alternateAuditor) {
        await updateAlternateAuditor(alternateAuditor.id, submitData);
      } else {
        await createAlternateAuditor(submitData);
      }

      onClose();
      setCurrentStep(1);
    } catch (error) {
      console.error('Error saving alternate auditor:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (field: 'engagementLetter' | 'piCertificate', file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ [field]: 'Only PDF, JPG, and PNG files are allowed' });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors({ [field]: 'File size must be less than 10MB' });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: file }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Alternate Details';
      case 2: return 'Engagement Letter';
      case 3: return 'PI Certificate';
      case 4: return 'Review & Submit';
      default: return '';
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return 'Enter the details of your nominated alternate auditor';
      case 2: return 'Upload the signed engagement letter';
      case 3: return 'Upload the PI certificate and set expiry date';
      case 4: return 'Review all information before submitting';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            {alternateAuditor ? 'Update Alternate Auditor' : 'Setup Alternate Auditor'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your alternate auditor for regulatory compliance
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Step {currentStep} of {totalSteps}</span>
            <span className="text-gray-400">{getStepTitle(currentStep)}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <p className="text-gray-400 text-sm">{getStepDescription(currentStep)}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step 1: Alternate Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alternateName" className="text-white">Alternate Name *</Label>
                    <Input
                      id="alternateName"
                      value={formData.alternateName}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternateName: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter full name"
                    />
                    {errors.alternateName && (
                      <p className="text-red-400 text-sm">{errors.alternateName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternateFirm" className="text-white">Firm Name *</Label>
                    <Input
                      id="alternateFirm"
                      value={formData.alternateFirm}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternateFirm: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter firm name"
                    />
                    {errors.alternateFirm && (
                      <p className="text-red-400 text-sm">{errors.alternateFirm}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternateEmail" className="text-white">Email Address *</Label>
                    <Input
                      id="alternateEmail"
                      type="email"
                      value={formData.alternateEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternateEmail: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter email address"
                    />
                    {errors.alternateEmail && (
                      <p className="text-red-400 text-sm">{errors.alternateEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone" className="text-white">Phone Number *</Label>
                    <Input
                      id="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter phone number"
                    />
                    {errors.alternatePhone && (
                      <p className="text-red-400 text-sm">{errors.alternatePhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rpbType" className="text-white">RPB Type *</Label>
                    <Select
                      value={formData.rpbType}
                      onValueChange={(value: 'ICAEW' | 'ICAS' | 'CAI' | 'ACCA') => 
                        setFormData(prev => ({ ...prev, rpbType: value }))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select RPB type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {RPB_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rpbNumber" className="text-white">RPB Number *</Label>
                    <Input
                      id="rpbNumber"
                      value={formData.rpbNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, rpbNumber: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter RPB number"
                    />
                    {errors.rpbNumber && (
                      <p className="text-red-400 text-sm">{errors.rpbNumber}</p>
                    )}
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <Label className="text-white">Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <Badge
                        key={spec}
                        variant={formData.specializations.includes(spec) ? "default" : "secondary"}
                        className={`cursor-pointer ${
                          formData.specializations.includes(spec)
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => toggleSpecialization(spec)}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reciprocalArrangement"
                      checked={formData.reciprocalArrangement}
                      onChange={(e) => setFormData(prev => ({ ...prev, reciprocalArrangement: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-purple-600"
                    />
                    <Label htmlFor="reciprocalArrangement" className="text-white text-sm">
                      Reciprocal arrangement in place
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualFee" className="text-white">Annual Fee (Optional)</Label>
                    <Input
                      id="annualFee"
                      type="number"
                      value={formData.annualFee || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, annualFee: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter annual fee"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Engagement Letter */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Upload Engagement Letter</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload the signed engagement letter from your alternate auditor
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      id="engagementLetter"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('engagementLetter', file);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="engagementLetter" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PDF, JPG, PNG up to 10MB</p>
                    </label>
                  </div>

                  {formData.engagementLetter && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm">{formData.engagementLetter.name}</span>
                        </div>
                        <span className="text-green-400 text-sm">
                          {formatFileSize(formData.engagementLetter.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  {errors.engagementLetter && (
                    <p className="text-red-400 text-sm">{errors.engagementLetter}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: PI Certificate */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Upload PI Certificate</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload the Professional Indemnity certificate and set expiry date
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      id="piCertificate"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('piCertificate', file);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="piCertificate" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PDF, JPG, PNG up to 10MB</p>
                    </label>
                  </div>

                  {formData.piCertificate && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm">{formData.piCertificate.name}</span>
                        </div>
                        <span className="text-green-400 text-sm">
                          {formatFileSize(formData.piCertificate.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  {errors.piCertificate && (
                    <p className="text-red-400 text-sm">{errors.piCertificate}</p>
                  )}

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="piExpiryDate" className="text-white">PI Certificate Expiry Date *</Label>
                    <Input
                      id="piExpiryDate"
                      type="date"
                      value={formData.piExpiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, piExpiryDate: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    {errors.piExpiryDate && (
                      <p className="text-red-400 text-sm">{errors.piExpiryDate}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Review & Submit</h3>
                  <p className="text-gray-400 text-sm">
                    Please review all information before submitting
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Alternate Details Summary */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Alternate Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white ml-2">{formData.alternateName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Firm:</span>
                        <span className="text-white ml-2">{formData.alternateFirm}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white ml-2">{formData.alternateEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white ml-2">{formData.alternatePhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">RPB:</span>
                        <span className="text-white ml-2">{formData.rpbType} {formData.rpbNumber}</span>
                      </div>
                      {formData.specializations.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-gray-400">Specializations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.specializations.map((spec) => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Documents</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Engagement Letter:</span>
                        <span className="text-green-400">
                          {formData.engagementLetter ? formData.engagementLetter.name : 'Not uploaded'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">PI Certificate:</span>
                        <span className="text-green-400">
                          {formData.piCertificate ? formData.piCertificate.name : 'Not uploaded'}
                        </span>
                      </div>
                      {formData.piExpiryDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">PI Expiry:</span>
                          <span className="text-white">{new Date(formData.piExpiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance Notice */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-yellow-300 text-sm font-medium">Regulatory Compliance</div>
                        <div className="text-yellow-200 text-xs">
                          By submitting, you confirm that all information is accurate and complete. 
                          This will be used for regulatory compliance reporting.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Saving...' : 'Submit'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-400 text-sm text-center">{errors.submit}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}; 