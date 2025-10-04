
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Eye, RotateCcw, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RoadmapHistoryItem {
  id: string;
  group_id: string;
  roadmap_data: any;
  created_at: string;
  version_name?: string;
}

export const RoadmapHistory = () => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<RoadmapHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapHistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // TODO: Call backend API to fetch roadmap history
      // This will need: GET /api/roadmap-history?group_id=xxx
      
      // Mock data for now
      const mockHistory: RoadmapHistoryItem[] = [
        {
          id: '1',
          group_id: 'mock-group',
          roadmap_data: { title: 'Q4 2024 Growth Strategy', milestones: [] },
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          version_name: 'Initial Assessment'
        },
        {
          id: '2',
          group_id: 'mock-group',
          roadmap_data: { title: 'Revised Growth Strategy', milestones: [] },
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          version_name: 'Post-Funding Strategy'
        }
      ];
      
      setHistoryItems(mockHistory);
    } catch (error) {
      console.error('Error loading roadmap history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (historyItem: RoadmapHistoryItem) => {
    try {
      // TODO: Call backend API to restore roadmap from history
      // This should update the current roadmap and add current to history
      console.log('Restoring roadmap:', historyItem.id);
      
      // Refresh the current roadmap view
      window.location.reload();
    } catch (error) {
      console.error('Error restoring roadmap:', error);
    }
  };

  const handleDelete = async (historyItem: RoadmapHistoryItem) => {
    try {
      // TODO: Call backend API to delete history item
      console.log('Deleting roadmap history:', historyItem.id);
      
      // Remove from local state
      setHistoryItems(prev => prev.filter(item => item.id !== historyItem.id));
    } catch (error) {
      console.error('Error deleting roadmap history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oracle-navy"></div>
        <span className="ml-2">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-6 w-6 text-oracle-navy" />
        <h1 className="text-2xl font-bold text-oracle-navy">Roadmap History</h1>
      </div>

      {historyItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
            <p className="text-gray-600">
              Your previous roadmap versions will appear here when you update your assessment answers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item, index) => (
            <Card key={item.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-oracle-gold" />
                    <div>
                      <CardTitle className="text-lg">
                        {item.version_name || `Version ${historyItems.length - index}`}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Created {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRoadmap(item)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-teal-600 border-teal-200 hover:bg-teal-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore Roadmap Version</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will replace your current roadmap with this historical version. 
                            Your current roadmap will be saved to history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRestore(item)}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            Restore Version
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Historical Version</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this roadmap version. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Version
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    {item.roadmap_data?.title || 'Strategic Business Roadmap'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {item.roadmap_data?.milestones?.length || 0} milestones
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal - TODO: Implement detailed roadmap preview */}
      {selectedRoadmap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Roadmap Preview</h3>
              <Button
                variant="outline"
                onClick={() => setSelectedRoadmap(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Created: {formatDate(selectedRoadmap.created_at)}
              </p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(selectedRoadmap.roadmap_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
