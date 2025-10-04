import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DayMetric {
  day: string;
  value: number;
  label: string;
}

interface PerformanceMetricsWidgetProps {
  metrics: DayMetric[];
}

export const PerformanceMetricsWidget: React.FC<PerformanceMetricsWidgetProps> = ({ metrics }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  if (!metrics || metrics.length < 7) {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="w-10 h-10 text-indigo-400 mb-2 animate-bounce" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Complete your first week</h3>
        <p className="text-gray-500 mb-4 text-center">Track your performance for 7 days to unlock insights and trends.</p>
      </Card>
    );
  }

  const average = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);
  const peak = Math.max(...metrics.map(m => m.value));
  const trend = metrics[metrics.length - 1].value - metrics[0].value;
  const bestDay = metrics.reduce((best, m) => (m.value > best.value ? m : best), metrics[0]);

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 dark:text-white font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Weekly Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </Button>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              This Week
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500">Average</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{average}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Peak</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{peak}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Trend</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {trend >= 0 ? '+' : ''}{trend}%
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between h-24 px-2 gap-2">
          {metrics.map((metric, i) => (
            <div key={metric.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div 
                className="w-full bg-gradient-to-t from-indigo-400 to-purple-400 rounded-t relative group"
                initial={{ height: 0 }}
                animate={{ height: `${metric.value}%` }}
                transition={{ delay: 0.1 * i, type: "spring", stiffness: 100 }}
                whileHover={{ 
                  background: "linear-gradient(to top, #818CF8, #C084FC)",
                  transition: { duration: 0.2 }
                }}
              >
                <motion.div
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none"
                  initial={{ y: 5 }}
                  whileHover={{ y: 0 }}
                >
                  {metric.value}%
                </motion.div>
                {metric.value > 80 && (
                  <motion.div
                    className="absolute inset-0 rounded-t"
                    style={{
                      background: 'linear-gradient(to top, rgba(129, 140, 248, 0.3), transparent)',
                      filter: 'blur(8px)'
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                )}
              </motion.div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
        <motion.div
          className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-indigo-700 dark:text-indigo-300">
            <span className="font-medium">Best day:</span> {bestDay.day} with {bestDay.value}% productivity. 
            <span className="text-indigo-600 dark:text-indigo-400"> Schedule important tasks on high-energy days.</span>
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}; 