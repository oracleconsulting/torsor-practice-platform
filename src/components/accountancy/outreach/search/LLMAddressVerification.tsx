import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface CompanySearchResult {
  company_number: string;
  company_name: string;
  registered_office_address: any;
}

interface AddressVerification {
  company_number: string;
  trading_address: string | null;
  contact_address: string | null;
  confidence_score: number;
  sources?: string[];
  notes?: string;
  verified_at?: string;
}

interface LLMAddressVerificationProps {
  companies: CompanySearchResult[];
  onVerificationComplete?: (verifications: AddressVerification[]) => void;
}

export const LLMAddressVerification: React.FC<LLMAddressVerificationProps> = ({ 
  companies,
  onVerificationComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<AddressVerification[]>([]);
  const [progress, setProgress] = useState(0);

  const handleBatchVerification = async () => {
    if (companies.length === 0) {
      toast.error('No companies to verify');
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      toast.info(`Starting verification for ${companies.length} companies using AI...`);
      
      const companyData = companies.map(c => ({
        company_name: c.company_name,
        company_number: c.company_number,
        registered_office_address: c.registered_office_address
      }));

      // Simulate progress (in real implementation, this would be updated via websocket)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const results = await outreachService.batchVerifyAddresses(companyData);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setVerifications(results);
      
      if (onVerificationComplete) {
        onVerificationComplete(results);
      }

      const verifiedCount = results.filter(r => r.trading_address || r.contact_address).length;
      toast.success(
        `Verification complete! Found trading/contact addresses for ${verifiedCount} of ${companies.length} companies`
      );
    } catch (error: any) {
      console.error('Batch verification failed:', error);
      toast.error('Verification failed. Please try again or verify individually.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">High Confidence</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
    return <Badge className="bg-red-600">Low Confidence</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Address Verification
          </CardTitle>
          <p className="text-sm text-gray-600">
            Use GPT-5 / Perplexity to find real trading and contact addresses (not registered offices)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>{companies.length}</strong> companies ready for verification
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  AI will search public records, websites, and business directories to confirm actual business addresses
                </p>
              </div>
              <Button 
                onClick={handleBatchVerification} 
                disabled={loading || companies.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Verify All Addresses
              </Button>
            </div>

            {loading && (
              <div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Verifying addresses... {progress}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {verifications.map((verification) => {
                const company = companies.find(c => c.company_number === verification.company_number);
                if (!company) return null;

                return (
                  <div key={verification.company_number} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-600" />
                          {company.company_name}
                        </h4>
                        <p className="text-xs text-gray-500">#{verification.company_number}</p>
                      </div>
                      {getConfidenceBadge(verification.confidence_score)}
                    </div>

                    <div className="space-y-2 mt-3">
                      {verification.trading_address ? (
                        <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-green-800">Trading Address Found</p>
                            <p className="text-xs text-green-700 mt-1">{verification.trading_address}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-yellow-800">No Trading Address Found</p>
                            <p className="text-xs text-yellow-700 mt-1">Using registered office only</p>
                          </div>
                        </div>
                      )}

                      {verification.contact_address && (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800">Contact Address</p>
                            <p className="text-xs text-blue-700 mt-1">{verification.contact_address}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className={`text-xs font-medium ${getConfidenceColor(verification.confidence_score)}`}>
                          Confidence: {verification.confidence_score}%
                        </span>
                        {verification.sources && verification.sources.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Sources: {verification.sources.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

