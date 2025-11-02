/**
 * CPD Discovery Admin Component
 * Quick interface to trigger AI discovery
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  GraduationCap, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { 
  discoverResourcesForAllSkills,
  discoverResourcesForSkill,
  getDiscoveryStats,
  type DiscoveryResult
} from '@/lib/api/cpd-discovery';
import { checkPerplexityStatus } from '@/lib/ai/perplexity-service';
import { toast } from 'sonner';

export const CPDDiscoveryPanel: React.FC = () => {
  const [discovering, setDiscovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);

  // Check API status on mount
  React.useEffect(() => {
    checkStatus();
    loadStats();
  }, []);

  const checkStatus = async () => {
    const status = await checkPerplexityStatus();
    setApiStatus(status);
  };

  const loadStats = async () => {
    const discoveryStats = await getDiscoveryStats();
    setStats(discoveryStats);
  };

  const handleQuickDiscovery = async (count: number) => {
    if (discovering) return;

    setDiscovering(true);
    setProgress(0);
    setResult(null);

    try {
      toast.info(`🔍 Starting discovery for ${count} skills...`, {
        description: 'This will take 1-2 minutes. Watch the console for progress!'
      });

      // Simulate progress (actual progress tracked in console)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 1000);

      const discoveryResult = await discoverResourcesForAllSkills(count);

      console.log('[Discovery Panel] ✅ Discovery complete, result:', discoveryResult);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(discoveryResult);

      // Reload stats
      await loadStats();

      if (discoveryResult.totalResources > 0) {
        toast.success(`✅ Discovery complete!`, {
          description: `Created ${discoveryResult.totalResources} resources for ${discoveryResult.processed} skills`
        });
      } else {
        toast.warning('⚠️ No resources discovered', {
          description: 'Check console for details'
        });
      }
      
      // Log any errors
      if (discoveryResult.errors.length > 0) {
        console.error('[Discovery Panel] ⚠️ Errors during discovery:', discoveryResult.errors);
        toast.warning(`Discovery completed with ${discoveryResult.errors.length} errors`, {
          description: 'Check console for details'
        });
      }
    } catch (error: any) {
      console.error('[Discovery Panel] Error:', error);
      toast.error('Discovery failed', {
        description: error.message
      });
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI CPD Discovery
            </CardTitle>
            <CardDescription className="text-gray-300">
              Automatically discover and add CPD resources using Perplexity AI via OpenRouter
            </CardDescription>
          </div>
          
          {apiStatus && (
            <Badge 
              className={
                apiStatus.working 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }
            >
              {apiStatus.working ? '✅ API Ready' : '❌ API Error'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Status Alert */}
        {apiStatus && !apiStatus.configured && (
          <Alert className="bg-red-900/20 border-red-500">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>OpenRouter API not configured!</strong><br />
              Add <code>VITE_OPENROUTER_API_KEY</code> to your environment variables.
            </AlertDescription>
          </Alert>
        )}

        {apiStatus && apiStatus.configured && !apiStatus.working && (
          <Alert className="bg-yellow-900/20 border-yellow-500">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              <strong>API configured but not responding</strong><br />
              {apiStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="pt-6">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-3xl font-bold text-white">{stats.totalKnowledgeDocs}</p>
                  <p className="text-sm text-gray-300">Knowledge Docs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="pt-6">
                <div className="text-center">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-3xl font-bold text-white">{stats.totalExternalCourses}</p>
                  <p className="text-sm text-gray-300">External Courses</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-3xl font-bold text-white">{stats.skillsCovered}</p>
                  <p className="text-sm text-gray-300">Skills Covered</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                  <p className="text-3xl font-bold text-white">
                    {stats.categoriesRepresented.length}
                  </p>
                  <p className="text-sm text-gray-300">Categories</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discovery Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Quick Discovery</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleQuickDiscovery(3)}
              disabled={discovering || !apiStatus?.working}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {discovering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Quick Test (3 skills)
                </>
              )}
            </Button>

            <Button
              onClick={() => handleQuickDiscovery(10)}
              disabled={discovering || !apiStatus?.working}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {discovering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Standard (10 skills)
                </>
              )}
            </Button>

            <Button
              onClick={() => handleQuickDiscovery(25)}
              disabled={discovering || !apiStatus?.working}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {discovering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Full Batch (25 skills)
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-gray-400">
            💡 Tip: Start with "Quick Test" to see how it works. Each skill takes about 10-20 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        {discovering && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Discovery Progress</span>
              <span className="text-sm text-gray-300">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-400">
              Check browser console for detailed progress logs
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <Alert className="bg-green-900/20 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <strong>Discovery Complete!</strong><br />
              Processed: {result.processed} skills<br />
              Created: {result.totalResources} resources 
              ({result.totalResources - result.errors.length} successful)
              
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <strong className="text-yellow-400">Errors:</strong>
                  <ul className="text-xs mt-1">
                    {result.errors.slice(0, 3).map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 3 && (
                      <li>• ... and {result.errors.length - 3} more (check console)</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Info Box */}
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="pt-6">
            <h4 className="text-white font-semibold mb-2">How it Works</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Searches web for latest UK accounting CPD content</li>
              <li>• Finds knowledge documents (guides, updates, best practices)</li>
              <li>• Discovers external courses (ICAEW, ACCA, providers)</li>
              <li>• Auto-creates in database with proper categorization</li>
              <li>• Triggers notifications for relevant team members</li>
              <li>• Updates recommendations with linked resources</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                <strong>Cost:</strong> ~£0.01 per skill (~1 penny) via OpenRouter<br />
                <strong>Time:</strong> ~10-20 seconds per skill<br />
                <strong>Rate Limit:</strong> 2-second delay between discoveries
              </p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CPDDiscoveryPanel;

