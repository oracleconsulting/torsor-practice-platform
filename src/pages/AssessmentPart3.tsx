import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Target, AlertTriangle, Loader2 } from 'lucide-react';
import { Part3AssessmentForm } from '@/components/assessment/Part3AssessmentForm';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { motion } from 'framer-motion';

export const AssessmentPart3 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, loading: progressLoading } = useAssessmentProgress();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!progressLoading && !progress?.validationComplete) {
      navigate('/dashboard');
    }
  }, [progress, progressLoading, navigate]);

  if (progressLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-oracle-purple" />
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-oracle-dark via-oracle-purple/10 to-oracle-dark">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="bg-white/95 backdrop-blur shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 bg-oracle-gold/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-oracle-gold" />
                </div>
                <CardTitle className="text-3xl font-bold text-oracle-navy mb-2">
                  Part 3: Hidden Value Audit
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Discover the invisible barriers and untapped assets in your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-oracle-purple/5 p-6 rounded-lg">
                  <h3 className="font-semibold text-oracle-navy mb-3 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-oracle-purple" />
                    What You'll Discover
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-oracle-gold mr-2">•</span>
                      <span>The 20+ hidden value drivers that determine whether your business can scale, sell, or sustain itself</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-oracle-gold mr-2">•</span>
                      <span>Invisible barriers costing you £50k+ annually that you don't even know exist</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-oracle-gold mr-2">•</span>
                      <span>Untapped assets that could increase your business value by 30-50%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-oracle-gold mr-2">•</span>
                      <span>Critical vulnerabilities that could derail your growth or exit plans</span>
                    </li>
                  </ul>
                </div>

                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Important:</strong> This assessment reveals gaps your current advisers aren't even looking for. 
                    Be prepared for some surprising insights about your business.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    This final assessment takes approximately 15-20 minutes and includes 6 asset discovery sections.
                  </p>
                  <Button
                    onClick={() => setShowIntro(false)}
                    size="lg"
                    className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold px-8"
                  >
                    Begin Hidden Value Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-oracle-navy mb-2">Hidden Value Audit</h1>
            <p className="text-gray-600">Uncover the invisible barriers and untapped assets in your business</p>
          </div>
          <Part3AssessmentForm />
        </div>
      </div>
    </div>
  );
};

export default AssessmentPart3; 