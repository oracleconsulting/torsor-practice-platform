import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Trash2, 
  Calendar,
  MapPin,
  ArrowLeftRight,
  Search
} from 'lucide-react';
import { outreachService } from '@/services/accountancy/outreachService';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SearchHistoryItem {
  id: string;
  search_type: 'address_match' | 'date_range' | 'date_comparison';
  address?: string;
  date_range?: { start: string; end: string };
  date_ranges?: { range1: { start: string; end: string }; range2: { start: string; end: string } };
  results_count: number;
  created_at: string;
}

interface SearchHistoryPanelProps {
  onLoadSearch?: (searchData: SearchHistoryItem) => void;
}

export const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({ onLoadSearch }) => {
  const { practice } = useAccountancyContext();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (practice?.id) {
      loadHistory();
    }
  }, [practice?.id]);

  const loadHistory = async () => {
    if (!practice?.id) return;
    
    setLoading(true);
    try {
      const data = await outreachService.getSearchHistory(practice.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load search history:', error);
      toast.error('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    try {
      await outreachService.deleteSearchHistory(historyId);
      setHistory(history.filter(item => item.id !== historyId));
      toast.success('Search deleted from history');
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleLoad = (item: SearchHistoryItem) => {
    if (onLoadSearch) {
      onLoadSearch(item);
      toast.success('Search loaded');
    }
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'address_match':
        return <MapPin className="w-4 h-4" />;
      case 'date_range':
        return <Calendar className="w-4 h-4" />;
      case 'date_comparison':
        return <ArrowLeftRight className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case 'address_match':
        return 'Address Match';
      case 'date_range':
        return 'Date Range';
      case 'date_comparison':
        return 'Date Comparison';
      default:
        return 'Search';
    }
  };

  const formatSearchDetails = (item: SearchHistoryItem) => {
    if (item.address) {
      return item.address.length > 50 ? item.address.substring(0, 50) + '...' : item.address;
    }
    if (item.date_range) {
      return `${item.date_range.start} to ${item.date_range.end}`;
    }
    if (item.date_ranges) {
      return `Comparing two periods`;
    }
    return 'No details';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-blue-600" />
          Search History
        </CardTitle>
        <p className="text-sm text-gray-600">
          Recent searches - click to reload
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No search history yet</p>
            <p className="text-xs mt-1">Your searches will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                onClick={() => handleLoad(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getSearchTypeIcon(item.search_type)}
                      <Badge variant="outline" className="text-xs">
                        {getSearchTypeLabel(item.search_type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {formatSearchDetails(item)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.results_count} results
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

