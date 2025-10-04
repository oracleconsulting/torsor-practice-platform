import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Target, Clock, ChevronDown, ChevronUp, Calendar,
  CheckCircle, Circle, Zap, TrendingUp, Award, Rocket,
  ArrowRight, Star, Flag, Filter, BarChart, Brain
} from 'lucide-react';

const TwelveWeekPlanPage = ({ displayData, loading, weekProgress = {}, setWeekProgress }) => {
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // timeline or kanban
  
  // Extract REAL roadmap data - NO DEFAULTS
  const roadmap = displayData?.roadmap;
  const threeMonthSprint = roadmap?.three_month_sprint || 
                          roadmap?.three_month_roadmap ||
                          roadmap?.sprint_data;
  
  const sprintTheme = threeMonthSprint?.theme || 
                     threeMonthSprint?.sprint_theme ||
                     threeMonthSprint?.overarching_theme;
  
  const sprintGoals = threeMonthSprint?.goals || 
                     threeMonthSprint?.sprint_goals ||
                     threeMonthSprint?.objectives;
  
  const weeks = threeMonthSprint?.weeks || 
               threeMonthSprint?.week_plans ||
               (threeMonthSprint?.weekly_breakdown ? Object.values(threeMonthSprint.weekly_breakdown) : null);
  
  const currentWeek = displayData?.weekNumber || 1;
  
  // Vision data
  const fiveYearVision = roadmap?.five_year_vision || roadmap?.five_year_possibility;
  const sixMonthShift = roadmap?.six_month_shift || roadmap?.six_month_stretch;
  
  // Success metrics from roadmap
  const successMetrics = threeMonthSprint?.success_metrics || 
                        threeMonthSprint?.key_metrics ||
                        roadmap?.roi_analysis;
  
  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!weeks) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    weeks.forEach((week, weekIdx) => {
      const weekTasks = week.tasks || week.action_items || [];
      totalTasks += weekTasks.length;
      
      const weekProgressData = weekProgress[weekIdx + 1] || {};
      completedTasks += Object.values(weekProgressData.tasks || {}).filter(Boolean).length;
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  const overallProgress = calculateOverallProgress();
  
  // Toggle task completion
  const toggleTask = (weekNum, taskIdx) => {
    const currentProgress = weekProgress[weekNum] || { tasks: {}, notes: '', blockers: '', wins: '' };
    setWeekProgress({
      ...weekProgress,
      [weekNum]: {
        ...currentProgress,
        tasks: {
          ...currentProgress.tasks,
          [taskIdx]: !currentProgress.tasks[taskIdx]
        }
      }
    });
  };
  
  // Update week notes
  const updateWeekNotes = (weekNum, field, value) => {
    const currentProgress = weekProgress[weekNum] || { tasks: {}, notes: '', blockers: '', wins: '' };
    setWeekProgress({
      ...weekProgress,
      [weekNum]: {
        ...currentProgress,
        [field]: value
      }
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your transformation roadmap...</p>
        </div>
      </div>
    );
  }
  
  if (!weeks || weeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Roadmap Data Loading</h2>
          <p className="text-gray-600">Your personalized 12-week plan is being prepared...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 via-white to-green-50 min-h-screen">
      {/* Header with Sprint Theme */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your 12-Week Sprint Plan</h1>
            {sprintTheme && (
              <p className="text-lg text-gray-600 mt-1">
                Sprint Theme: <span className="font-semibold text-green-600">{sprintTheme}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-3xl font-bold text-green-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Week {currentWeek} of 12</span>
            <span>{12 - currentWeek} weeks remaining</span>
          </div>
        </div>
        
        {/* Sprint Goals */}
        {sprintGoals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(Array.isArray(sprintGoals) ? sprintGoals : Object.values(sprintGoals)).map((goal, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    idx === 0 ? 'bg-purple-100' : idx === 1 ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {idx === 0 ? <Target className="w-5 h-5 text-purple-600" /> :
                     idx === 1 ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                     <Zap className="w-5 h-5 text-blue-600" />}
                  </div>
                  <span className="font-semibold text-gray-800">Goal {idx + 1}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {typeof goal === 'string' ? goal : (goal.description || goal.goal || goal)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Success Milestones */}
        {successMetrics && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border border-purple-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              Success Milestones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Week 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <span className="font-bold text-purple-600">4</span>
                </div>
                <h4 className="font-semibold mb-1">Week 4</h4>
                <p className="text-sm text-gray-600">Foundation Complete</p>
              </div>
              
              {/* Week 8 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <span className="font-bold text-blue-600">8</span>
                </div>
                <h4 className="font-semibold mb-1">Week 8</h4>
                <p className="text-sm text-gray-600">Systems Running Smoothly</p>
              </div>
              
              {/* Week 12 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <span className="font-bold text-green-600">12</span>
                </div>
                <h4 className="font-semibold mb-1">Week 12</h4>
                <p className="text-sm text-gray-600">Transformation Achieved</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'timeline' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'kanban' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Kanban View
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
            <option value="current">Current Week</option>
          </select>
        </div>
      </div>
      
      {/* Weekly Breakdown */}
      <div className="space-y-6">
        {weeks.map((week, weekIdx) => {
          const weekNum = weekIdx + 1;
          const isExpanded = expandedWeek === weekNum;
          const isCurrentWeek = weekNum === currentWeek;
          const weekProgressData = weekProgress[weekNum] || { tasks: {}, notes: '', blockers: '', wins: '' };
          const weekTasks = week.tasks || week.action_items || [];
          const completedTasks = Object.values(weekProgressData.tasks).filter(Boolean).length;
          const weekCompletion = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0;
          
          // Apply filters
          if (filter === 'complete' && weekCompletion < 100) return null;
          if (filter === 'incomplete' && weekCompletion === 100) return null;
          if (filter === 'current' && !isCurrentWeek) return null;
          
          return (
            <motion.div
              key={weekNum}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIdx * 0.05 }}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                isCurrentWeek ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* Week Header */}
              <div
                className={`p-6 cursor-pointer transition-all ${
                  isCurrentWeek ? 'bg-gradient-to-r from-green-50 to-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      isCurrentWeek ? 'bg-green-600 text-white' : 
                      weekCompletion === 100 ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {weekNum}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Week {weekNum}: {week.theme || week.week_theme || `Week ${weekNum}`}
                        {isCurrentWeek && (
                          <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                            Current
                          </span>
                        )}
                      </h3>
                      {week.focus && (
                        <p className="text-sm text-gray-600 mt-1">{week.focus}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Progress</div>
                      <div className="text-2xl font-bold text-gray-900">{weekCompletion}%</div>
                    </div>
                    
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${weekCompletion}%` }}
                      />
                    </div>
                    
                    {isExpanded ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
              
              {/* Week Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-6 space-y-6">
                      {/* Tasks */}
                      <div className="space-y-3">
                        {weekTasks.map((task, taskIdx) => {
                          const isCompleted = weekProgressData.tasks[taskIdx];
                          const taskData = typeof task === 'string' ? { task } : task;
                          
                          return (
                            <motion.div
                              key={taskIdx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: taskIdx * 0.05 }}
                              className={`group relative p-4 rounded-xl border transition-all ${
                                isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <button
                                  onClick={() => toggleTask(weekNum, taskIdx)}
                                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isCompleted 
                                      ? 'bg-green-600 border-green-600' 
                                      : 'border-gray-300 hover:border-green-500'
                                  }`}
                                >
                                  {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                                </button>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className={`font-semibold transition-all ${
                                      isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                                    }`}>
                                      {taskData.title || taskData.task}
                                    </h4>
                                    {taskData.description && (
                                      <p className="text-sm text-gray-600 mt-1">{taskData.description}</p>
                                    )}
                                    {taskData.priority && (
                                      <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                                        taskData.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        taskData.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {taskData.priority}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {taskData.time && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <Clock className="w-4 h-4" />
                                      <span>{taskData.time}</span>
                                    </div>
                                  )}
                                  
                                  {taskData.output && (
                                    <div className="bg-white rounded-lg p-3 mt-2">
                                      <p className="text-sm text-gray-700">
                                        <strong className="text-gray-900">Expected Output:</strong> {taskData.output}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {taskData.why && (
                                    <div className="mt-2">
                                      <p className="text-sm text-green-700">
                                        <strong>Impact:</strong> {taskData.why}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {taskData.tool && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <Brain className="w-4 h-4 text-purple-600" />
                                      <span className="text-sm text-purple-700">
                                        <strong>Tool:</strong> {taskData.tool}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Week Reflection */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Flag className="w-5 h-5 text-purple-600" />
                          Week {weekNum} Reflection
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Wins & Achievements
                            </label>
                            <textarea
                              value={weekProgressData.wins}
                              onChange={(e) => updateWeekNotes(weekNum, 'wins', e.target.value)}
                              placeholder="What went well?"
                              className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Challenges & Blockers
                            </label>
                            <textarea
                              value={weekProgressData.blockers}
                              onChange={(e) => updateWeekNotes(weekNum, 'blockers', e.target.value)}
                              placeholder="What was difficult?"
                              className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes & Learnings
                            </label>
                            <textarea
                              value={weekProgressData.notes}
                              onChange={(e) => updateWeekNotes(weekNum, 'notes', e.target.value)}
                              placeholder="Key insights..."
                              className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      {/* Vision Connection */}
      {(fiveYearVision || sixMonthShift) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Rocket className="w-8 h-8" />
            How This Sprint Connects to Your Vision
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fiveYearVision && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h4 className="font-semibold text-lg mb-3">5-Year Destination</h4>
                <p className="text-white/90">
                  {typeof fiveYearVision === 'string' ? fiveYearVision : fiveYearVision.vision}
                </p>
              </div>
            )}
            
            {sixMonthShift && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h4 className="font-semibold text-lg mb-3">6-Month Milestone</h4>
                <p className="text-white/90">
                  {typeof sixMonthShift === 'string' ? sixMonthShift : sixMonthShift.shift}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export { TwelveWeekPlanPage }; 