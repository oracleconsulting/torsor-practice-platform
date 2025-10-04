import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Clock, Target, Zap, 
  ChevronRight, ArrowUpRight, Sparkles, Activity,
  Brain, Heart, Shield, Award, Globe, Rocket,
  Calendar, Users, BarChart, AlertCircle, CheckCircle
} from 'lucide-react';

const CommandCenterPage = ({ displayData, loading, navigate, setActiveSection }) => {
  const [activeMetric, setActiveMetric] = useState(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  
  // NO HARDCODED VALUES - Only use actual data
  const actualRevenue = displayData?.roiAnalysis?.current_annual_revenue || 
                       displayData?.userMetrics?.current_revenue || 
                       (displayData?.part1Answers?.current_monthly_revenue ? 
                        displayData.part1Answers.current_monthly_revenue * 12 : null);
  
  const targetRevenue = displayData?.userMetrics?.annual_revenue_target || 
                       displayData?.validationResponses?.annual_revenue_target ||
                       displayData?.validationResponses?.user_metric_annual_revenue_target;
  
  const workingHours = displayData?.userMetrics?.working_hours_per_week || 
                      displayData?.validationResponses?.working_hours_per_week ||
                      displayData?.validationResponses?.user_metric_working_hours_per_week;
  
  const targetHours = displayData?.userMetrics?.target_working_hours || 
                     displayData?.validationResponses?.target_working_hours ||
                     displayData?.validationResponses?.user_metric_target_working_hours;
  
  const billableRate = displayData?.userMetrics?.billable_rate_gbp || 
                      displayData?.validationResponses?.billable_rate_gbp ||
                      displayData?.validationResponses?.user_metric_billable_rate_gbp;
  
  // Extract roadmap data - NO GENERIC TASKS
  const roadmap = displayData?.roadmap;
  const threeMonthSprint = roadmap?.three_month_sprint || roadmap?.three_month_roadmap;
  const weekNumber = displayData?.weekNumber || 1;
  const currentWeekData = threeMonthSprint?.weeks?.[weekNumber - 1] || 
                         threeMonthSprint?.week_plans?.[`week_${weekNumber}`];
  
  // Extract vision data
  const fiveYearVision = roadmap?.five_year_vision || roadmap?.five_year_possibility;
  const sixMonthShift = roadmap?.six_month_shift || roadmap?.six_month_stretch;
  
  // Part 3 data if available
  const part3Data = displayData?.part3Data || displayData?.value_analysis_data;
  const hiddenAssets = part3Data?.hidden_assets || part3Data?.untapped_value;
  
  // Board data
  const board = displayData?.board || displayData?.boardData;
  const boardMembers = Array.isArray(board) ? board : 
                      (board?.members || board?.primary || []);
  
  // Calculate metrics only if we have data
  const revenueGrowthPotential = (targetRevenue && actualRevenue) ? 
                                targetRevenue - actualRevenue : null;
  const hoursToReclaim = (workingHours && targetHours) ? 
                        workingHours - targetHours : null;
  const sprintProgress = Math.round((weekNumber / 12) * 100);
  
  // Animate values on mount
  useEffect(() => {
    const animateValue = (key, endValue) => {
      if (endValue === null || endValue === undefined) return;
      
      let startValue = 0;
      const duration = 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (endValue - startValue) * easeOutQuart;
        
        setAnimatedValues(prev => ({ ...prev, [key]: Math.round(currentValue) }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };
    
    // Animate each metric
    if (actualRevenue) animateValue('revenue', actualRevenue);
    if (targetRevenue) animateValue('target', targetRevenue);
    if (workingHours) animateValue('hours', workingHours);
    animateValue('progress', sprintProgress);
  }, [actualRevenue, targetRevenue, workingHours, sprintProgress]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your command center...</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!displayData || !roadmap) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Data Loading</h2>
          <p className="text-gray-600 mb-4">
            We're retrieving your personalized dashboard data. This should only take a moment.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 via-white to-purple-50 min-h-screen">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-3xl p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Command Centre</h1>
          <p className="text-xl opacity-90">
            Week {weekNumber} of 12 • {currentWeekData?.theme || 'Your Transformation Sprint'}
          </p>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </motion.div>
      
      {/* Current Week Tasks - REAL DATA */}
      {currentWeekData && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Week {weekNumber}: {currentWeekData.theme}
            </h2>
            <span className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {currentWeekData.focus || 'Strategic Focus'}
            </span>
          </div>
          
          <div className="space-y-4">
            {currentWeekData.tasks?.map((task, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                    <span className="text-purple-700 font-bold">{idx + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {typeof task === 'string' ? task : task.task}
                    </h3>
                    
                    {task.time && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{task.time}</span>
                      </div>
                    )}
                    
                    {task.output && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <strong>Output:</strong> {task.output}
                      </p>
                    )}
                    
                    {task.why && (
                      <p className="text-sm text-purple-600 mt-2">
                        <strong>Why this matters:</strong> {task.why}
                      </p>
                    )}
                  </div>
                  
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                     style={{ width: '0%' }}></div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setActiveSection('roadmap')}
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
            >
              View all tasks
              <ArrowUpRight className="w-4 h-4" />
            </button>
            
            <div className="text-sm text-gray-600">
              {sprintProgress}% Sprint Complete
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Metrics Grid - REAL DATA ONLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Potential */}
        {actualRevenue !== null && targetRevenue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer"
            onClick={() => setActiveMetric('revenue')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                Potential
              </span>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              £{animatedValues.target?.toLocaleString() || '---'}
            </h3>
            <p className="text-sm text-gray-600">Annual Revenue Target</p>
            
            {revenueGrowthPotential && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Growth Potential</span>
                  <span className="font-semibold text-green-600">
                    +£{revenueGrowthPotential.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Hours to Reclaim */}
        {workingHours !== null && targetHours !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer"
            onClick={() => setActiveMetric('hours')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Time Freedom
              </span>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {animatedValues.hours || workingHours} hrs/week
            </h3>
            <p className="text-sm text-gray-600">Current Working Hours</p>
            
            {hoursToReclaim && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Hours to Reclaim</span>
                  <span className="font-semibold text-blue-600">
                    -{hoursToReclaim} hrs
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Sprint Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              Progress
            </span>
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {animatedValues.progress || 0}%
          </h3>
          <p className="text-sm text-gray-600">Sprint Progress</p>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${sprintProgress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* AI Board Status */}
        {boardMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer"
            onClick={() => setActiveSection('board')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                Active
              </span>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {boardMembers.length}
            </h3>
            <p className="text-sm text-gray-600">AI Advisors</p>
            
            <div className="mt-4 flex -space-x-2">
              {boardMembers.slice(0, 4).map((member, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">
                    {typeof member === 'string' ? member.charAt(0) : member.role?.charAt(0)}
                  </span>
                </div>
              ))}
              {boardMembers.length > 4 && (
                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{boardMembers.length - 4}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Vision Cards - REAL DATA */}
      {(fiveYearVision || sixMonthShift) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fiveYearVision && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-8 h-8" />
                <h3 className="text-xl font-bold">5-Year Vision</h3>
              </div>
              <p className="text-white/90 leading-relaxed">
                {typeof fiveYearVision === 'string' ? 
                  fiveYearVision : 
                  (fiveYearVision.vision || fiveYearVision.description || 'Your long-term vision')}
              </p>
            </motion.div>
          )}
          
          {sixMonthShift && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8" />
                <h3 className="text-xl font-bold">6-Month Shift</h3>
              </div>
              <p className="text-white/90 leading-relaxed">
                {typeof sixMonthShift === 'string' ? 
                  sixMonthShift : 
                  (sixMonthShift.shift || sixMonthShift.description || 'Your medium-term goals')}
              </p>
            </motion.div>
          )}
        </div>
      )}
      
      {/* Part 3 Hidden Assets if available */}
      {hiddenAssets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">Hidden Value Discovered</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(hiddenAssets).slice(0, 3).map(([key, value], idx) => (
              <div key={idx} className="bg-white/70 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-600">{String(value)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex flex-wrap gap-4"
      >
        <button
                      onClick={() => setActiveSection('board')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
        >
          Ask Your AI Board
        </button>
        
        <button
                      onClick={() => setActiveSection('roadmap')}
          className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold border-2 border-purple-200 hover:border-purple-600 transition-all hover:scale-105"
        >
          View Full Sprint Plan
        </button>
        
        {!displayData?.part3Complete && (
          <button
            onClick={() => setActiveSection('assessments')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
          >
            Unlock Hidden Value
          </button>
        )}
      </motion.div>
    </div>
  );
};

export { CommandCenterPage }; 