
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Part1ResultProps {
  fitMessage?: string | null;
}

export const Part1Result: React.FC<Part1ResultProps> = ({ fitMessage }) => {
  const isGoodFit = fitMessage?.toLowerCase().includes('good fit') || !fitMessage;

  return (
    <Card className={`mb-6 ${isGoodFit ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isGoodFit ? 'text-green-800' : 'text-orange-800'}`}>
          {isGoodFit ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          Assessment Part 1 Complete
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fitMessage ? (
          <p className={`${isGoodFit ? 'text-green-700' : 'text-orange-700'}`}>
            {fitMessage}
          </p>
        ) : (
          <p className="text-green-700">
            Great! You've completed the first part of your assessment. You're ready to continue to the detailed analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
