
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ApiConnectionIssue: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="bg-orange-50 border-orange-200 mb-6">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Processing Your Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4">
          Your assessment has been submitted successfully. Our AI is currently processing your responses to generate your personalized board recommendations and roadmap.
        </p>
        <p className="text-orange-600 text-sm mb-4">
          This usually takes 2-3 minutes. Please refresh the page to check for updates.
        </p>
        <Button 
          onClick={handleRefresh}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </CardContent>
    </Card>
  );
};
