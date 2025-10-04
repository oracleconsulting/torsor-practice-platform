
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  ArrowRight,
  Loader2,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase
} from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import DynamicHeader from '@/components/layout/DynamicHeader';

interface ConfidenceScore {
  field: string;
  score: number;
  status: 'high' | 'medium' | 'low';
}

export const IntakeConfirmation = () => {
  const { progress, updateProgress } = useAssessmentProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [interpretedData, setInterpretedData] = useState<any>(null);
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScore[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInterpretedData();
  }, [progress.group_id]);

  const fetchInterpretedData = async () => {
    if (!progress.group_id) {
      navigate('/dashboard');
      return;
    }
    
    try {
      // Simulate API call for now - extract from existing assessment data
      const businessName = progress.part1Answers?.business_name || progress.part2Answers?.business_name || 'Your Business';
      const industry = progress.part2Answers?.business_classification || 'Not specified';
      const revenue = progress.part2Answers?.current_revenue_band || 'Not specified';
      const teamSize = progress.part2Answers?.team_reality || 'Not specified';
      const location = progress.part2Answers?.location || 'Not specified';
      const mainChallenge = progress.part2Answers?.biggest_pain_category || 'Not specified';

      const interpreted = {
        businessName,
        industry,
        currentRevenue: revenue,
        teamSize,
        location,
        mainChallenge
      };

      setInterpretedData(interpreted);
      setEditedValues(interpreted);
      
      // Mock confidence scores based on data completeness
      const scores: ConfidenceScore[] = [
        {
          field: 'Industry',
          score: industry !== 'Not specified' ? 0.9 : 0.3,
          status: industry !== 'Not specified' ? 'high' : 'low'
        },
        {
          field: 'Revenue',
          score: revenue !== 'Not specified' ? 0.85 : 0.3,
          status: revenue !== 'Not specified' ? 'high' : 'low'
        },
        {
          field: 'TeamSize',
          score: teamSize !== 'Not specified' ? 0.8 : 0.3,
          status: teamSize !== 'Not specified' ? 'high' : 'low'
        },
        {
          field: 'Location',
          score: location !== 'Not specified' ? 0.7 : 0.3,
          status: location !== 'Not specified' ? 'medium' : 'low'
        }
      ];
      setConfidenceScores(scores);
    } catch (error) {
      console.error('Error fetching interpreted data:', error);
      toast({
        title: "Error",
        description: "Failed to load your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = (field: string) => {
    setEditingField(null);
  };

  const handleConfirmAndProceed = async () => {
    setProcessing(true);
    
    try {
      // Update progress with confirmed data
      updateProgress({
        part2Complete: true,
        confirmedData: editedValues
      });

      toast({
        title: "Information confirmed!",
        description: "Generating your personalized roadmap...",
      });

      // Proceed to dashboard where generation will continue
      navigate('/dashboard');
    } catch (error) {
      console.error('Error confirming data:', error);
      toast({
        title: "Error",
        description: "Failed to confirm your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConfidenceIcon = (status: string) => {
    return status === 'high' ? CheckCircle : AlertCircle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-oracle-cream">
        <DynamicHeader />
        <div className="flex items-center justify-center min-h-screen pt-16 md:pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-oracle-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oracle-cream">
      <DynamicHeader />
      <div className="max-w-4xl mx-auto px-6 py-8 pt-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-oracle-navy mb-4">
              Let's Confirm We Understood You Correctly
            </h1>
            <p className="text-lg text-gray-600">
              Before we create your personalized roadmap, please verify this information
            </p>
          </div>

          {/* Overall Confidence Score */}
          <Card className="border-oracle-gold/30 bg-oracle-gold/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-oracle-navy">
                    Overall Understanding Confidence
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on your responses, we're {Math.round(confidenceScores.reduce((acc, s) => acc + s.score, 0) / confidenceScores.length * 100)}% confident in our interpretation
                  </p>
                </div>
                <div className="text-3xl font-bold text-oracle-gold">
                  {Math.round(confidenceScores.reduce((acc, s) => acc + s.score, 0) / confidenceScores.length * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interpreted Data Fields */}
          <div className="grid gap-4">
            {[
              { 
                field: 'businessName', 
                label: 'Business Name', 
                icon: Briefcase,
                value: interpretedData?.businessName 
              },
              { 
                field: 'industry', 
                label: 'Industry', 
                icon: TrendingUp,
                value: interpretedData?.industry 
              },
              { 
                field: 'currentRevenue', 
                label: 'Current Revenue', 
                icon: DollarSign,
                value: interpretedData?.currentRevenue 
              },
              { 
                field: 'teamSize', 
                label: 'Team Size', 
                icon: Users,
                value: interpretedData?.teamSize 
              },
              { 
                field: 'location', 
                label: 'Location', 
                icon: MapPin,
                value: interpretedData?.location 
              },
              { 
                field: 'mainChallenge', 
                label: 'Main Challenge', 
                icon: Target,
                value: interpretedData?.mainChallenge 
              }
            ].map((item, index) => {
              const confidence = confidenceScores.find(s => 
                s.field.toLowerCase() === item.label.toLowerCase().replace(' ', '')
              );
              const Icon = item.icon;
              const ConfIcon = confidence ? getConfidenceIcon(confidence.status) : CheckCircle;

              return (
                <motion.div
                  key={item.field}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border ${confidence?.status === 'low' ? 'border-red-200' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="w-5 h-5 text-oracle-navy" />
                          <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-600">
                              {item.label}
                            </Label>
                            {editingField === item.field ? (
                              <Input
                                value={editedValues[item.field] || ''}
                                onChange={(e) => setEditedValues({
                                  ...editedValues,
                                  [item.field]: e.target.value
                                })}
                                onBlur={() => handleFieldSave(item.field)}
                                className="mt-1"
                                autoFocus
                              />
                            ) : (
                              <p className="text-lg font-semibold text-oracle-navy">
                                {editedValues[item.field] || item.value || 'Not specified'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {confidence && (
                            <ConfIcon className={`w-5 h-5 ${getConfidenceColor(confidence.status)}`} />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFieldEdit(item.field)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Clarification Questions */}
          {confidenceScores.some(s => s.status === 'low') && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Additional Clarification Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  We need a bit more clarity on some items to provide the best recommendations. Please edit any fields above that need correction.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-oracle-navy text-oracle-navy"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={handleConfirmAndProceed}
              disabled={processing}
              className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm & Generate My Roadmap
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
