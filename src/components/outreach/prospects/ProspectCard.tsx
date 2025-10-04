import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Eye, Building2, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProspectCardProps {
  prospect: {
    id: string;
    name: string;
    company: string;
    position?: string;
    industry?: string;
    score?: number;
    created_at: string;
    personalization_data?: {
      opening_hook?: string;
      pe_context?: string;
      research_insights?: string[];
    };
    status: 'new' | 'researched' | 'contacted' | 'responded' | 'converted';
  };
  onGenerateOutreach?: (prospectId: string) => void;
  onViewDetails?: (prospectId: string) => void;
}

const ProspectCard: React.FC<ProspectCardProps> = ({
  prospect,
  onGenerateOutreach,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      researched: 'bg-purple-100 text-purple-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-green-100 text-green-800',
      converted: 'bg-indigo-100 text-indigo-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{prospect.name}</h3>
            <p className="text-sm text-gray-600">
              {prospect.position} at {prospect.company}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prospect.status)}`}>
            {prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Industry & Score */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Building2 className="h-4 w-4 mr-1" />
              {prospect.industry || 'Industry not specified'}
            </div>
            {prospect.score !== undefined && (
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                <span className="font-medium text-green-600">{prospect.score}% Match</span>
              </div>
            )}
          </div>

          {/* Research Insights */}
          {prospect.personalization_data?.research_insights && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                🔍 Research Insights
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {prospect.personalization_data.research_insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PE Context */}
          {prospect.personalization_data?.pe_context && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                💼 PE Context
              </h4>
              <p className="text-sm text-gray-600">
                {prospect.personalization_data.pe_context}
              </p>
            </div>
          )}

          {/* Personalization Preview */}
          {prospect.personalization_data?.opening_hook && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                💬 Personalized Approach
              </h4>
              <p className="text-sm text-gray-600 italic">
                "{prospect.personalization_data.opening_hook}"
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onGenerateOutreach?.(prospect.id)}
              >
                <Mail className="h-4 w-4 mr-1" />
                Generate Outreach
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails?.(prospect.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
            <span className="text-xs text-gray-500">
              Added {formatDistanceToNow(new Date(prospect.created_at))} ago
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProspectCard; 