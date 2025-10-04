import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, ClipboardList, Map, Users, TrendingUp, Calendar, 
  Settings, ChevronRight, Menu, X, Target, Zap, DollarSign,
  BookOpen, Eye, Clock, AlertCircle, Loader2, Sparkles,
  Building, Mountain, Rocket, CheckCircle, ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useOracleData } from '@/hooks/useOracleData';
import { supabase } from '@/lib/supabase/client';
import { apiService } from '@/services/apiService';
import { AssessmentReview } from '@/components/dashboard/AssessmentReview';
import { AssessmentReviewEnhanced } from '@/components/dashboard/AssessmentReviewEnhanced';
import { toast } from 'sonner';

// Oracle Dashboard Component
const OracleDashboard = () => {
  const [activeSection, setActiveSection] = useState('command');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [weekProgress, setWeekProgress] = useState({});
  const navigate = useNavigate();
  
  // Get real data from hook
  const displayData = useOracleData();
  const { loading, error, refreshData } = displayData;

  const navigationItems = [
    { 
      id: 'command', 
      label: 'Command Centre', 
      icon: Zap,
      enabled: true
    },
    { 
      id: 'assessments', 
      label: 'Assessments', 
      icon: ClipboardList,
      enabled: true,
      badge: displayData.part3Complete ? 'Complete' : 
              displayData.part2Complete ? 'Part 3 Available' :
              displayData.part1Complete ? 'Part 2 Available' : 'Start'
    },
    { 
      id: 'journey', 
      label: 'My Journey', 
      icon: Mountain,
      enabled: displayData.roadmapGenerated
    },
    { 
      id: 'roadmap', 
      label: '12-Week Plan', 
      icon: Calendar,
      enabled: displayData.roadmapGenerated
    },
    { 
      id: 'board', 
      label: 'AI Board', 
      icon: Users,
      enabled: displayData.boardGenerated
    },
    { 
      id: 'value', 
      label: 'Value Analysis', 
      icon: TrendingUp,
      enabled: displayData.part3Complete
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: BookOpen,
      enabled: true
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      enabled: true
    }
  ];

  // Navigate to assessment based on current progress
  const navigateToAssessment = () => {
    if (!displayData.part1Complete) {
      navigate('/assessment/part1');
    } else if (!displayData.part2Complete) {
      navigate('/assessment/part2');
    } else if (!displayData.part3Complete) {
      navigate('/assessment/part3');
    } else {
      navigate('/assessment/review');
    }
  };

  const handleRefresh = async () => {
    toast.loading('Refreshing data...');
    await refreshData();
    toast.success('Data refreshed!');
  };

  // Function to generate value analysis
  const generateValueAnalysis = async () => {
    try {
      // Check if Part 3 is actually complete
      if (!displayData.part3Complete) {
        toast.error('Please complete Part 3 assessment first');
        navigate('/assessment/part3');
        return;
      }

      // Get Part 3 responses from the correct location
      const part3Responses = displayData.rawData?.part2?.part3_data || 
                            displayData.rawData?.part2?.responses?.part3_data ||
                            displayData.part3Data ||
                            {};
      
      if (!part3Responses || Object.keys(part3Responses).length === 0) {
        toast.error('Part 3 data not found. Please complete the assessment.');
        return;
      }

      toast.loading('Analyzing your hidden value...');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to continue');
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      const response = await fetch(`${apiUrl}/api/generate-value-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          group_id: displayData.groupId,
          user_id: displayData.user?.id,
          part3_responses: part3Responses
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate analysis');
      }
      
      const result = await response.json();
      toast.success('Value analysis complete! £' + (result.summary?.total_value_gap || 0).toLocaleString() + ' in hidden value discovered!');
      
      // Refresh data to show the new analysis
      await refreshData();
      
      // Navigate to value analysis page
      setTimeout(() => {
        setActiveSection('value');
      }, 1000);
      
    } catch (error) {
      console.error('Error generating value analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate value analysis';
      toast.error(errorMessage);
    }
  };

  // Function to generate detailed roadmap
  const generateRoadmap = async () => {
    try {
      toast.loading('Generating roadmap...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          group_id: displayData.groupId,
          user_id: displayData.user?.id,
          part2_responses: displayData.rawData?.part2
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate roadmap');
      
      const result = await response.json();
      console.log('Roadmap generated:', result);
      toast.success('Roadmap generated successfully');
      
      // Refresh data to show the new roadmap
      await refreshData();
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast.error('Failed to generate roadmap');
    }
  };

  // Function to regenerate roadmap with personalized tasks (Admin only)
  const regenerateRoadmap = async () => {
    try {
      // Check if user is admin
      if (displayData.user?.email !== 'james@ivcaccounting.co.uk') {
        toast.error('Admin access required for regenerating roadmap');
        return;
      }
      
      console.log('Regenerating roadmap...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to continue');
        return;
      }
      
      // Use the ACTUAL existing route with group_id in the path
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/api/regenerate-roadmap/${displayData.groupId}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      if (!response.ok) {
        const errorData = JSON.parse(text);
        toast.error(errorData.detail || 'Failed to regenerate roadmap');
        return;
      }

      const result = JSON.parse(text);
      toast.success('Roadmap regenerated successfully!');
      await refreshData();
      
    } catch (error) {
      console.error('Regenerate error:', error);
      toast.error('Failed to regenerate roadmap');
    }
  };

  // Function to regenerate roadmap for testing (bypasses admin access)
  const regenerateRoadmapForTesting = async () => {
    try {
      console.log('Regenerating roadmap for testing...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to continue');
        return;
      }
      
      // Use the ACTUAL existing route with group_id in the path
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/api/regenerate-roadmap/${displayData.groupId}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      if (!response.ok) {
        const errorData = JSON.parse(text);
        toast.error(errorData.detail || 'Failed to regenerate roadmap');
        return;
      }

      const result = JSON.parse(text);
      toast.success('Roadmap regenerated successfully! (Testing)');
      await refreshData();
      
    } catch (error) {
      console.error('Regenerate error:', error);
      toast.error('Failed to regenerate roadmap');
    }
  };

  // Debug helper to find the object rendering issue
  useEffect(() => {
    // Log the structure of tasks to find the problematic render
    if (displayData?.threeMonthSprint?.weeks) {
      displayData.threeMonthSprint.weeks.forEach((week, idx) => {
        console.log(`Week ${idx + 1} tasks:`, week.tasks);
        if (week.tasks && week.tasks.length > 0) {
          console.log('First task structure:', week.tasks[0]);
        }
      });
    }
  }, [displayData]);

  // Add a debug function to check API connectivity
  const debugApiConnection = async () => {
    console.log('Testing API connection...');
    
    // Test basic connectivity
    const healthResult = await apiService.testConnection();
    console.log('Health check:', healthResult);
    
    // Check available routes
    const routesResult = await apiService.debugRoutes();
    console.log('Available routes:', routesResult);
    
    if (healthResult.error || routesResult.error) {
      toast.error('API connection issues detected. Check console for details.');
    }
  };

  const regenerateValueAnalysis = async () => {
    try {
      console.log('Regenerating value analysis...');
      
      // Check if user is admin
      if (displayData.user?.email !== 'james@ivcaccounting.co.uk') {
        toast.error('Admin access required for regenerating value analysis');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to continue');
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      toast.loading('Regenerating value analysis...');
      
      const response = await fetch(`${apiUrl}/api/regenerate-value-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          group_id: displayData.groupId,
          user_id: displayData.user?.id,
          force_regenerate: true
        })
      });
      
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);
      
      if (!response.ok) {
        const errorData = JSON.parse(text);
        toast.error(errorData.detail || 'Failed to regenerate value analysis');
        return;
      }
      
      const result = JSON.parse(text);
      
      if (result.status === 'success') {
        toast.success(result.message || 'Part 3 data cleared successfully!');
        
        // Show business stage info
        if (result.business_stage) {
          toast.info(`Business stage detected: ${result.business_stage}`);
        }
        
        // Refresh data to show updated state
        await refreshData();
        
        // Force a complete cache clear and hard refresh
        setTimeout(() => {
          // Clear all caches and force reload
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          // Clear localStorage
          localStorage.clear();
          sessionStorage.clear();
          // Force hard reload with cache busting
          window.location.href = '/assessment/part3?refresh=' + Date.now();
        }, 1500);
      } else {
        toast.error('Failed to regenerate value analysis');
      }
      
    } catch (error) {
      console.error('Regenerate value analysis error:', error);
      toast.error('Failed to regenerate value analysis');
    }
  };

  const regenerateValueAnalysisForTesting = async () => {
    try {
      console.log('Regenerating value analysis for testing...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to continue');
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      toast.loading('Regenerating value analysis (Testing)...');
      
      const response = await fetch(`${apiUrl}/api/regenerate-value-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          group_id: displayData.groupId,
          user_id: displayData.user?.id,
          force_regenerate: false // Testing mode - no admin check
        })
      });
      
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);
      
      if (!response.ok) {
        const errorData = JSON.parse(text);
        toast.error(errorData.detail || 'Failed to regenerate value analysis');
        return;
      }
      
      const result = JSON.parse(text);
      
      if (result.status === 'success') {
        toast.success(result.message || 'Part 3 data cleared successfully! (Testing)');
        
        // Show business stage info
        if (result.business_stage) {
          toast.info(`Business stage detected: ${result.business_stage} (Testing)`);
        }
        
        // Refresh data to show updated state
        await refreshData();
        
        // Force a hard refresh to clear any cached data
        setTimeout(() => {
          // Clear all caches and force reload
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          // Clear localStorage
          localStorage.clear();
          sessionStorage.clear();
          // Force hard reload with cache busting
          window.location.href = '/assessment/part3?refresh=' + Date.now();
        }, 1500);
      } else {
        toast.error('Failed to regenerate value analysis');
      }
      
    } catch (error) {
      console.error('Regenerate value analysis error:', error);
      toast.error('Failed to regenerate value analysis');
    }
  };

  // Debug API connection on component mount in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugApiConnection();
    }
  }, []);

  // Debug environment variables
  useEffect(() => {
    console.log('Environment variables check:');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('All env vars:', import.meta.env);
  }, []);

  const renderContent = () => {
    // Show loading state
    if (loading && !displayData.user) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    switch(activeSection) {
      case 'command':
        return <CommandCentre 
          displayData={displayData} 
          navigate={navigate} 
          setActiveSection={setActiveSection}
          generateValueAnalysis={generateValueAnalysis}
          generateRoadmap={generateRoadmap}
          regenerateRoadmap={regenerateRoadmap}
          regenerateValueAnalysis={regenerateValueAnalysis}
          regenerateValueAnalysisForTesting={regenerateValueAnalysisForTesting}
        />;
      case 'assessments':
        return <AssessmentReviewEnhanced displayData={displayData} navigate={navigate} />;
              case 'journey':
          return <MyJourneyPage displayData={displayData} setActiveSection={setActiveSection} regenerateRoadmap={regenerateRoadmapForTesting} />;
      case 'roadmap':
        return <TwelveWeekPlan displayData={displayData} weekProgress={weekProgress} setWeekProgress={setWeekProgress} />;
      case 'board':
        return <AIBoardPage displayData={displayData} navigate={navigate} setActiveSection={setActiveSection} />;
      case 'value':
        return <ValueAnalysisPage displayData={displayData} navigate={navigate} />;
      case 'resources':
        return <ResourcesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CommandCentre 
          displayData={displayData} 
          navigate={navigate} 
          setActiveSection={setActiveSection}
          generateValueAnalysis={generateValueAnalysis}
          generateRoadmap={generateRoadmap}
          regenerateRoadmap={regenerateRoadmap}
          regenerateValueAnalysis={regenerateValueAnalysis}
          regenerateValueAnalysisForTesting={regenerateValueAnalysisForTesting}
        />;
    }
  };

  // Debug component for development
  const DataDebugger = ({ data }) => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md overflow-auto max-h-96 z-50">
        <h3 className="font-bold mb-2">Debug Data</h3>
        <pre className="text-xs">
          {JSON.stringify({
            user: data?.user?.email,
            groupId: data?.groupId,
            part1Complete: data?.part1Complete,
            part2Complete: data?.part2Complete,
            part3Complete: data?.part3Complete,
            boardGenerated: data?.boardGenerated,
            board: data?.board,
            boardScores: data?.boardScores,
            currentRevenue: data?.currentRevenue,
            hasRawData: {
              part1: !!data?.rawData?.part1,
              part2: !!data?.rawData?.part2,
              config: !!data?.rawData?.config
            },
            rawConfigBoard: data?.rawData?.config?.board_recommendation,
            rawPart2Roadmap: !!data?.rawData?.part2?.roadmap
          }, null, 2)}
        </pre>
      </div>
    );
  };

  // Comprehensive data inspector component
  const DataInspector = ({ data }) => {
    const [showRaw, setShowRaw] = useState(false);
    
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 left-4 bg-white border-2 border-purple-600 rounded-lg p-4 max-w-2xl max-h-96 overflow-auto z-50 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-purple-600">Data Inspector</h3>
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className="text-sm bg-purple-100 px-2 py-1 rounded hover:bg-purple-200"
          >
            {showRaw ? 'Hide Raw' : 'Show Raw'}
          </button>
        </div>
        
        {!showRaw ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-green-600">✅ Assessment Status</div>
                <div>Part 1: {data.part1Complete ? 'Complete' : 'Incomplete'}</div>
                <div>Part 2: {data.part2Complete ? 'Complete' : 'Incomplete'}</div>
                <div>Part 3: {data.part3Complete ? 'Complete' : 'Incomplete'}</div>
                <div>Validation: {data.validationComplete ? 'Complete' : 'Incomplete'}</div>
              </div>
              <div>
                <div className="font-semibold text-blue-600">📊 Generated Data</div>
                <div>Value Analysis: {data.valueAnalysisGenerated ? 'Generated' : 'Not Generated'}</div>
                <div>Roadmap: {data.roadmapGenerated ? 'Generated' : 'Not Generated'}</div>
                <div>Board: {data.boardGenerated ? 'Generated' : 'Not Generated'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-purple-600">🎯 Board Data</div>
                <div>Members: {data.board.join(', ') || 'None'}</div>
                <div>Scores: {JSON.stringify(data.boardScores)}</div>
                <div>Type: {data.boardType || 'None'}</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">📈 Business Metrics</div>
                <div>Revenue: £{data.currentRevenue} → £{data.targetRevenue}</div>
                <div>Hours: {data.workingHours}h → {data.targetHours}h</div>
                <div>Week: {data.currentWeek}</div>
                <div>Sprint: {data.sprintIteration}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-red-600">🔧 Part 3 Data</div>
              <div>Asset Scores: {Object.keys(data.part3Data?.asset_scores || {}).length} items</div>
              <div>Value Gaps: {Array.isArray(data.part3Data?.value_gaps) ? data.part3Data.value_gaps.length : 0} items</div>
              <div>Risk Register: {Array.isArray(data.part3Data?.risk_register) ? data.part3Data.risk_register.length : 0} items</div>
            </div>
          </div>
        ) : (
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data.rawData, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="w-72 bg-gradient-to-b from-purple-900 to-purple-800 text-white fixed h-full z-50 shadow-2xl"
      >
        <div className="p-6 border-b border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Oracle AI</h1>
              <p className="text-purple-200 text-sm">{displayData.businessName || 'Strategic Dashboard'}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-purple-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.enabled) {
                  if (item.id === 'assessments') {
                    navigateToAssessment();
                  } else {
                    setActiveSection(item.id);
                  }
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                activeSection === item.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : item.enabled
                    ? 'hover:bg-white/10 text-purple-200'
                    : 'text-purple-400 cursor-not-allowed opacity-50'
              }`}
              whileHover={item.enabled ? { scale: 1.02 } : {}}
              whileTap={item.enabled ? { scale: 0.98 } : {}}
              disabled={!item.enabled}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {item.badge}
                </span>
              )}
              {activeSection === item.id && item.enabled && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Data refresh button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-700/50 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh Data</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-8 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{displayData.user?.email}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 overflow-y-auto h-[calc(100vh-73px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Debug components */}
      <DataDebugger data={displayData} />
      <DataInspector data={displayData} />
    </div>
  );
};

// Command Centre Component
const CommandCentre = ({ displayData, navigate, setActiveSection, generateValueAnalysis, generateRoadmap, regenerateRoadmap, regenerateValueAnalysis, regenerateValueAnalysisForTesting }) => {
  // Safe data extraction with defaults
  const safeData = {
    currentRevenue: displayData?.currentRevenue || 0,
    targetRevenue: displayData?.targetRevenue || 1000000,
    workingHours: displayData?.workingHours || 0,
    targetHours: displayData?.targetHours || 30,
    board: Array.isArray(displayData?.board) ? displayData.board : [],
    part3Complete: displayData?.part3Complete || false,
    part3Data: displayData?.part3Data || null
  };

  // Helper functions for safe calculations
  const calculateSafeValueGap = (part3Data) => {
    if (!part3Data || !Array.isArray(part3Data.value_gaps)) return 0;
    return part3Data.value_gaps.reduce((sum, gap) => {
      const gapValue = typeof gap?.gap === 'number' ? gap.gap : 0;
      return sum + gapValue;
    }, 0);
  };

  const countCriticalRisks = (part3Data) => {
    if (!part3Data || !Array.isArray(part3Data.risk_register)) return 0;
    return part3Data.risk_register.filter(r => 
      r?.severity === 'High' || r?.severity === 'Critical'
    ).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Command Centre</h1>
        <p className="text-gray-600">Your business control panel</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Revenue Progress"
          value={`£${safeData.currentRevenue.toLocaleString()}`}
          target={`Target: £${safeData.targetRevenue.toLocaleString()}`}
          progress={(safeData.currentRevenue / safeData.targetRevenue) * 100}
          icon={DollarSign}
          color="purple"
        />
        <MetricCard
          title="Working Hours"
          value={`${safeData.workingHours}h/week`}
          target={`Target: ${safeData.targetHours}h`}
          progress={safeData.workingHours > 0 ? ((safeData.workingHours - safeData.targetHours) / safeData.workingHours) * 100 : 0}
          icon={Clock}
          color="blue"
          inverse
        />
        <MetricCard
          title="AI Board Active"
          value={safeData.board.length}
          target="Advisors"
          progress={100}
          icon={Users}
          color="pink"
        />
        <MetricCard
          title="Sprint Progress"
          value="Week 3"
          target="of 12"
          progress={25}
          icon={Target}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton icon={Calendar} label="View Sprint" onClick={() => setActiveSection('roadmap')} />
          <ActionButton icon={Users} label="Board Meeting" onClick={() => setActiveSection('board')} />
          <ActionButton icon={TrendingUp} label="Track Progress" onClick={() => setActiveSection('journey')} />
          <ActionButton icon={BookOpen} label="Resources" onClick={() => setActiveSection('resources')} />
        </div>
      </div>

              {/* Part 3 Value Analysis Preview */}
        {safeData.part3Complete && safeData.part3Data && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold">Hidden Value Discovered</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Systems Score</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {safeData.part3Data.asset_scores?.systems || 0}%
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Total Value Gap</h4>
                <div className="text-2xl font-bold text-orange-600">
                  £{calculateSafeValueGap(safeData.part3Data).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Critical Risks</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {countCriticalRisks(safeData.part3Data)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons for Missing Data */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">Generate Missing Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.part3Complete && !displayData.valueAnalysisGenerated && (
              <button
                onClick={generateValueAnalysis}
                className="flex items-center gap-3 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Value Analysis</span>
              </button>
            )}
            
            {displayData.part2Complete && !displayData.roadmapGenerated && (
              <button
                onClick={generateRoadmap}
                className="flex items-center gap-3 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Generate Detailed Roadmap</span>
              </button>
            )}
            
            {displayData.part2Complete && displayData.roadmapGenerated && displayData.user?.email === 'james@ivcaccounting.co.uk' && (
              <button
                onClick={regenerateRoadmap}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Regenerate Personalized Tasks (Admin Only)</span>
              </button>
            )}
            
            {displayData.part3Complete && displayData.user?.email === 'james@ivcaccounting.co.uk' && (
              <button
                onClick={regenerateValueAnalysis}
                className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Regenerate Value Analysis (Admin Only)</span>
              </button>
            )}
            
            {/* Testing button - available for all users during development */}
            {displayData.part3Complete && (
              <button
                onClick={regenerateValueAnalysisForTesting}
                className="flex items-center gap-3 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Regenerate Value Analysis (Testing)</span>
              </button>
            )}
            
            {displayData.part2Complete && !displayData.boardGenerated && (
              <button
                onClick={() => setActiveSection('assessments')}
                className="flex items-center gap-3 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Generate AI Board</span>
              </button>
            )}
          </div>
        </div>
    </div>
  );
};

// Assessments Page Component
const AssessmentsPage = ({ displayData, navigate }) => {
  const assessmentParts = [
    { 
      part: 1, 
      title: 'Business Foundation', 
      complete: displayData.part1Complete,
      questions: 35,
      description: 'Core business information and current state',
      route: '/assessment/part1'
    },
    { 
      part: 2, 
      title: 'Strategic Vision', 
      complete: displayData.part2Complete,
      questions: 40,
      description: 'Goals, challenges, and growth aspirations',
      route: '/assessment/part2'
    },
    { 
      part: 3, 
      title: 'Hidden Value Analysis', 
      complete: displayData.part3Complete,
      questions: 25,
      description: 'Uncover hidden assets and opportunities',
      route: '/assessment/part3'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments</h1>
        <p className="text-gray-600">Track your assessment progress and insights</p>
      </div>

      <div className="grid gap-6">
        {assessmentParts.map((assessment) => (
          <motion.div
            key={assessment.part}
            className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">Part {assessment.part}: {assessment.title}</h3>
                  {assessment.complete && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{assessment.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{assessment.questions} questions</span>
                  <span>•</span>
                  <span>~15 minutes</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(assessment.route)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {assessment.complete ? 'Review' : 'Start'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show roadmap generation status */}
      {displayData.part2Complete && !displayData.roadmapGenerated && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-2">Ready for Your Roadmap!</h3>
          <p className="text-gray-600 mb-4">
            Your assessments are complete. Generate your personalized roadmap and AI board.
          </p>
          <button
            onClick={() => navigate('/assessment/confirmation')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg"
          >
            Generate My Roadmap
          </button>
        </div>
      )}
    </div>
  );
};

// My Journey Page Component
const MyJourneyPage = ({ displayData, setActiveSection, regenerateRoadmap }) => {
  const [activeTab, setActiveTab] = useState('vision');
  
  // Extract roadmap from the correct location
  const roadmap = displayData?.rawData?.config?.roadmap || {};
  const hasRoadmap = roadmap && Object.keys(roadmap).length > 0;
  
  if (!hasRoadmap) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Journey Not Available</h2>
          <p className="text-gray-600 mb-6">Complete your assessment first</p>
          <button 
            onClick={() => setActiveSection('assessments')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg"
          >
            Complete Assessment
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'vision', label: '5-Year Vision', icon: Mountain },
    { id: 'shift', label: '6-Month Shift', icon: Rocket },
    { id: 'sprint', label: '3-Month Sprint', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Journey</h1>
            <p className="text-white/80">Transform your business and life</p>
          </div>
          
          {/* Testing-only regenerate button - bypasses admin access */}
          {displayData.roadmapGenerated && (
            <button
              onClick={regenerateRoadmap}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Regenerate (Testing)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-8 shadow-sm">
        {activeTab === 'vision' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">5-Year Vision</h2>
            {roadmap.five_year_vision ? (
              <>
                <p className="text-lg text-gray-700">{roadmap.five_year_vision.vision_narrative}</p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {['year_1', 'year_3', 'year_5'].map(year => {
                    const data = roadmap.five_year_vision[year];
                    if (!data) return null;
                    return (
                      <div key={year} className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-bold text-purple-900 mb-2">{data.headline}</h3>
                        <p className="text-sm text-gray-700">{data.story}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <p>Vision data not available</p>}
          </div>
        )}

        {activeTab === 'shift' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">6-Month Shift</h2>
            {roadmap.six_month_shift ? (
              <div className="space-y-4">
                {Object.entries(roadmap.six_month_shift).filter(([key]) => key.startsWith('month')).map(([key, data]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h3 className="font-bold mb-2">{data.theme}</h3>
                    <p className="text-gray-700 mb-3">{data.focus}</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {data.key_actions?.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : <p>Shift data not available</p>}
          </div>
        )}

        {activeTab === 'sprint' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">3-Month Sprint</h2>
            {roadmap.three_month_sprint?.weeks ? (
              <div className="grid md:grid-cols-2 gap-4">
                {roadmap.three_month_sprint.weeks.slice(0, 4).map((week, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h3 className="font-bold mb-2">Week {week.week}: {week.phase}</h3>
                    <p className="text-sm text-gray-600 mb-2">{week.focus}</p>
                    <ul className="space-y-1">
                      {week.tasks?.slice(0, 2).map((task, taskIdx) => (
                        <li key={taskIdx} className="text-sm">
                          • {task.task} ({task.time})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : <p>Sprint data not available</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// 12-Week Plan Component
const TwelveWeekPlan = ({ displayData, weekProgress, setWeekProgress }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const weeks = displayData.threeMonthSprint.weeks || [];

  // Helper function to safely render task content
  const renderTask = (task: any) => {
    // If task is a string, render it directly
    if (typeof task === 'string') {
      return task;
    }
    
    // If task is an object with complex structure
    if (typeof task === 'object' && task !== null) {
      // Extract the main task description
      const taskTitle = task.task || task.title || task.description || '';
      const taskTime = task.time || task.duration || '';
      const taskWhy = task.why || '';
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{taskTitle}</div>
          {taskWhy && <div className="text-sm text-gray-600">Why: {taskWhy}</div>}
          {taskTime && <div className="text-sm text-gray-500">Time: {taskTime}</div>}
          {task.quick_win && (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              Quick Win
            </span>
          )}
        </div>
      );
    }
    
    // Fallback for unknown formats
    return 'Task details unavailable';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">12-Week Sprint Plan</h1>
        <p className="text-gray-600">Your tactical execution roadmap</p>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => {
          const week = weeks[i] || { weekNumber: i + 1, theme: 'Coming Soon', tasks: [] };
          return (
            <motion.button
              key={i}
              onClick={() => setSelectedWeek(i + 1)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedWeek === i + 1
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">Week {i + 1}</div>
              <div className="font-semibold text-gray-900">{week.theme}</div>
              <div className="text-sm text-gray-600 mt-1">{week.tasks?.length || 0} tasks</div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Week Details */}
      {selectedWeek && weeks[selectedWeek - 1] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-xl font-semibold mb-4">
            Week {selectedWeek}: {weeks[selectedWeek - 1].theme}
          </h3>
          <div className="space-y-3">
            {weeks[selectedWeek - 1].tasks && Array.isArray(weeks[selectedWeek - 1].tasks) ? (
              weeks[selectedWeek - 1].tasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  </div>
                  <div className="flex-1">
                    {renderTask(task)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No tasks for this week</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// AI Board Page Component
const AIBoardPage = ({ displayData, navigate, setActiveSection }) => {
  const [selectedMember, setSelectedMember] = useState(null);

  // Debug what's in the data
  console.log('AIBoardPage - Board data:', {
    board: displayData?.board,
    boardScores: displayData?.boardScores,
    rawScores: displayData?.rawData?.config?.scores
  });

  // Safe data extraction
  const board = Array.isArray(displayData?.board) ? displayData.board : [];
  const boardScores = displayData?.boardScores || {};
  const boardGenerated = displayData?.boardGenerated || false;

  if (!boardGenerated || board.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-lg w-full">
          <Users className="w-16 h-16 text-pink-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Meet Your AI Board</h2>
          <p className="text-gray-600 mb-6">
            Complete your assessment to unlock your personalised AI advisory board.
          </p>
          <button 
            onClick={() => setActiveSection('assessments')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Complete Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your AI Advisory Board</h1>
        <p className="text-gray-600">Expert guidance tailored to your business</p>
      </div>

      {/* Board Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {board.map((member, idx) => {
          // Get the score - check multiple possible locations
          const score = boardScores[member] || 
                       displayData?.rawData?.config?.scores?.[member] || 
                       0;
          
          // Convert to percentage if needed
          const displayScore = score <= 1 ? Math.round(score * 100) : Math.round(score);
          
          return (
            <motion.div
              key={idx}
              className="bg-white rounded-xl shadow-sm p-6 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedMember(member)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  {member.slice(0, 2)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {displayScore}%
                  </div>
                  <div className="text-sm text-gray-500">Match Score</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{member}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {member === 'CMO' && 'Chief Marketing Officer - Growth & Brand Strategy'}
                {member === 'CGO' && 'Chief Growth Officer - Revenue & Scaling'}
                {member === 'CCO' && 'Chief Customer Officer - Experience & Retention'}
              </p>
              <button className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                Schedule Meeting
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Board Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Board Recommendations This Week</h3>
        <div className="space-y-3">
          <RecommendationItem
            member="CMO"
            recommendation="Focus on building your personal brand alongside OracleConsultingAI"
          />
          <RecommendationItem
            member="CGO"
            recommendation="Implement a freemium model to accelerate user acquisition"
          />
          <RecommendationItem
            member="CCO"
            recommendation="Set up automated onboarding to improve first-week retention"
          />
        </div>
      </div>
    </div>
  );
};

// Value Analysis Page Component
const ValueAnalysisPage = ({ displayData, navigate }) => {
  console.log('[ValueAnalysisPage] Debug data:', {
    part3Complete: displayData.part3Complete,
    part3Data: displayData.part3Data,
    hasPart3Data: !!displayData.part3Data,
    valueAnalysisGenerated: displayData.valueAnalysisGenerated
  });

  if (!displayData.part3Complete || !displayData.part3Data) {
    console.log('[ValueAnalysisPage] Showing incomplete message - conditions not met');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unlock Your Hidden Value</h2>
          <p className="text-gray-600 mb-6">Complete Part 3 assessment to discover hidden opportunities</p>
          <button 
            onClick={() => navigate('/assessment/part3')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Start Part 3
          </button>
        </div>
      </div>
    );
  }

  // Check if we have value analysis data
  const hasValueAnalysisData = displayData.part3Data && (
    displayData.part3Data.asset_scores ||
    displayData.part3Data.value_gaps ||
    displayData.part3Data.risk_register ||
    displayData.valueAnalysisGenerated
  );

  if (!hasValueAnalysisData) {
    console.log('[ValueAnalysisPage] No value analysis data found, showing generation button');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Hidden Value Analysis</h2>
          <p className="text-gray-600 mb-6">No value analysis data available yet. This data will be populated after completing Part 3 assessment.</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/assessment/part3')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mr-3"
            >
              Complete Part 3
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard?section=command'}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Generate Value Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safely extract data with fallbacks
  const asset_scores = Array.isArray(displayData.part3Data?.asset_scores) 
    ? displayData.part3Data.asset_scores 
    : [];
  const value_gaps = Array.isArray(displayData.part3Data?.value_gaps) 
    ? displayData.part3Data.value_gaps 
    : [];
  const risk_register = Array.isArray(displayData.part3Data?.risk_register) 
    ? displayData.part3Data.risk_register 
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hidden Value Analysis</h1>
        <p className="text-gray-600">Opportunities and risks in your business</p>
      </div>

      {/* Asset Scores */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Business Asset Scores</h3>
        <div className="space-y-4">
          {Array.isArray(asset_scores) ? (
            asset_scores.map((score, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium capitalize">{score.category?.replace(/_/g, ' ') || `Asset ${idx + 1}`}</span>
                  <span className="font-bold">{score.score || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${score.score || 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                {score.issues && score.issues.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    <strong>Issues:</strong> {score.issues.join(', ')}
                  </div>
                )}
                {score.opportunities && score.opportunities.length > 0 && (
                  <div className="mt-1 text-sm text-green-600">
                    <strong>Opportunities:</strong> {score.opportunities.join(', ')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No asset scores available</div>
          )}
        </div>
      </div>

      {/* Value Gaps */}
      {value_gaps.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Top Value Opportunities</h3>
          <div className="space-y-3">
            {value_gaps.slice(0, 5).map((gap, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/70 rounded-lg">
                <div>
                  <h4 className="font-semibold">{gap.area || 'Unknown Area'}</h4>
                  <p className="text-sm text-gray-600">Potential value unlock</p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  £{(gap.gap || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Value Opportunity</span>
              <span className="text-2xl font-bold text-green-600">
                £{value_gaps.reduce((sum, gap) => sum + (gap.gap || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Register */}
      {risk_register.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Critical Risks to Address</h3>
          <div className="space-y-3">
            {risk_register
              .filter(risk => risk.severity === 'High' || risk.severity === 'Critical')
              .map((risk, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/70 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{risk.title || 'Unknown Risk'}</h4>
                    <p className="text-sm text-gray-600 mt-1">{risk.impact || 'No impact description'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    risk.severity === 'Critical' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty state if no data */}
      {value_gaps.length === 0 && risk_register.length === 0 && Object.keys(asset_scores).length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No value analysis data available yet.</p>
          <p className="text-sm text-gray-500 mt-2">This data will be populated after completing Part 3 assessment.</p>
        </div>
      )}
    </div>
  );
};

// Resources Page Component
const ResourcesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
        <p className="text-gray-600">Guides, templates, and learning materials</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Resources coming soon...</p>
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Settings coming soon...</p>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, target, progress, icon: Icon, color, inverse = false }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    pink: 'bg-pink-100 text-pink-600',
    green: 'bg-green-100 text-green-600'
  };

  const progressColor = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm p-6"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm text-gray-500">{target}</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600 mb-3">{title}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`bg-gradient-to-r ${progressColor[color]} h-2 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${inverse ? 100 - progress : progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </motion.div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick }) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-6 h-6 text-purple-600" />
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </motion.button>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
      active
        ? 'border-purple-600 text-purple-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

const VisionContent = ({ data }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">Your 5-Year Vision</h3>
      <p className="text-gray-700 text-lg mb-6">{data.vision}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Year 1</h4>
          <p className="text-2xl font-bold text-purple-600">£{data.year_1.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{data.year_1.team_size} team members</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Year 3</h4>
          <p className="text-2xl font-bold text-purple-600">£{data.year_3.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{data.year_3.team_size} team members</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Year 5</h4>
          <p className="text-2xl font-bold text-purple-600">£{data.year_5.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{data.year_5.team_size} team members</p>
        </div>
      </div>
    </div>
  </div>
);

const ShiftContent = ({ data }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">6-Month Transformation</h3>
      <p className="text-gray-700 text-lg mb-6">{data.shift}</p>
      
      <div className="space-y-4">
        <div className="border-l-4 border-purple-600 pl-4">
          <h4 className="font-semibold mb-1">Months 1-2</h4>
          <p className="text-gray-600">{data.month_1_2}</p>
        </div>
        <div className="border-l-4 border-purple-600 pl-4">
          <h4 className="font-semibold mb-1">Months 3-4</h4>
          <p className="text-gray-600">{data.month_3_4}</p>
        </div>
        <div className="border-l-4 border-purple-600 pl-4">
          <h4 className="font-semibold mb-1">Months 5-6</h4>
          <p className="text-gray-600">{data.month_5_6}</p>
        </div>
      </div>
    </div>
  </div>
);

const SprintContent = ({ data }) => {
  // Helper function to safely render task content
  const renderTask = (task: any) => {
    // If task is a string, render it directly
    if (typeof task === 'string') {
      return task;
    }
    
    // If task is an object with complex structure
    if (typeof task === 'object' && task !== null) {
      // Extract the main task description
      const taskTitle = task.task || task.title || task.description || '';
      const taskTime = task.time || task.duration || '';
      const taskWhy = task.why || '';
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{taskTitle}</div>
          {taskWhy && <div className="text-sm text-gray-600">Why: {taskWhy}</div>}
          {taskTime && <div className="text-sm text-gray-500">Time: {taskTime}</div>}
          {task.quick_win && (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              Quick Win
            </span>
          )}
        </div>
      );
    }
    
    // Fallback for unknown formats
    return 'Task details unavailable';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">3-Month Sprint: {data.theme}</h3>
        
        <div className="grid gap-4">
          {data.weeks.map((week) => (
            <div key={week.weekNumber} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Week {week.weekNumber}: {week.theme}</h4>
                <span className="text-sm text-gray-500">{week.tasks.length} tasks</span>
              </div>
              <div className="space-y-2">
                {week.tasks && Array.isArray(week.tasks) ? (
                  week.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                      </div>
                      <div className="flex-1">
                        {renderTask(task)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No tasks for this week</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecommendationItem = ({ member, recommendation }) => (
  <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
      {member.slice(0, 2)}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{member} recommends:</p>
      <p className="text-sm text-gray-600">{recommendation}</p>
    </div>
  </div>
);

export default OracleDashboard; 