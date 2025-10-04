
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Calendar, MessageSquare, FileText } from 'lucide-react';

interface QuickActionsProps {
  userTier: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userTier }) => {
  return (
    <Card className="bg-white border-gray-200 mb-6">
      <CardHeader>
        <CardTitle className="text-oracle-navy flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="border-purple-500/50 text-purple-600 hover:bg-purple-50"
            disabled
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Review
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-500/50 text-blue-600 hover:bg-blue-50"
            disabled
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask Board
          </Button>
          <Button 
            variant="outline" 
            className="border-green-500/50 text-green-600 hover:bg-green-50"
            disabled
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-500/50 text-orange-600 hover:bg-orange-50"
            disabled
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Win
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
