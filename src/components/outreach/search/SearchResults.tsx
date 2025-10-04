import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Building2, Users, FileText } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'prospect' | 'company' | 'pe_acquisition';
  name: string;
  description?: string;
  score?: number;
  location?: string;
  industry?: string;
  company_number?: string;
  status?: string;
  metadata?: Record<string, any>;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  onImport?: (result: SearchResult) => void;
  onView?: (result: SearchResult) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading = false,
  onImport,
  onView,
  className = ""
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-gray-500">
          No results found
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'prospect':
        return Users;
      case 'company':
        return Building2;
      case 'pe_acquisition':
        return FileText;
      default:
        return Building2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prospect':
        return 'Prospect';
      case 'company':
        return 'Company';
      case 'pe_acquisition':
        return 'PE Acquisition';
      default:
        return type;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result) => {
        const Icon = getIcon(result.type);
        
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {getTypeLabel(result.type)}
                    </span>
                    {result.score !== undefined && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${result.score >= 70 ? 'bg-green-100 text-green-800' :
                          result.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        Score: {result.score}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900">{result.name}</h3>
                  
                  {result.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {result.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.industry && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {result.industry}
                      </span>
                    )}
                    {result.location && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        {result.location}
                      </span>
                    )}
                    {result.status && (
                      <span className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded">
                        {result.status}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onView && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(result)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                  {onImport && result.type === 'company' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onImport(result)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 