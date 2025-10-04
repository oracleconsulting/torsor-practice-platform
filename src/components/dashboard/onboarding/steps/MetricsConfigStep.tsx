import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, TrendingUp, Target, Activity, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MetricsConfigStepProps {
  onComplete: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

interface MetricConfig {
  id: string;
  label: string;
  icon: any;
  value: string;
  unit: string;
  description: string;
}

export const MetricsConfigStep: React.FC<MetricsConfigStepProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<MetricConfig[]>([
    {
      id: 'revenue_target',
      label: 'Monthly Revenue Target',
      icon: DollarSign,
      value: '',
      unit: '£',
      description: 'Your target monthly revenue'
    },
    {
      id: 'growth_target',
      label: 'Growth Target',
      icon: TrendingUp,
      value: '',
      unit: '%',
      description: 'Desired monthly growth rate'
    },
    {
      id: 'energy_threshold',
      label: 'Energy Alert Level',
      icon: Activity,
      value: '30',
      unit: '%',
      description: 'Alert when energy drops below this'
    },
    {
      id: 'focus_hours',
      label: 'Daily Focus Hours',
      icon: Target,
      value: '3',
      unit: 'hrs',
      description: 'Deep work hours per day'
    }
  ]);

  const handleMetricChange = (id: string, value: string) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === id ? { ...metric, value } : metric
    ));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!metrics[0].value || !metrics[1].value) {
      toast.error('Please set your revenue and growth targets');
      return;
    }

    setIsSaving(true);

    try {
      // Save metric preferences
      const metricsData = {
        revenue_target: parseInt(metrics[0].value),
        growth_target: parseFloat(metrics[1].value),
        energy_threshold: parseInt(metrics[2].value),
        focus_hours: parseInt(metrics[3].value)
      };

      const { error } = await supabase
        .from('dashboard_setup')
        .update({
          target_revenue: metricsData.revenue_target,
          notification_settings: {
            email: true,
            dashboard: true,
            board_messages: true,
            task_reminders: true,
            weekly_summary: true,
            energy_alerts: true,
            energy_threshold: metricsData.energy_threshold
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Metrics configured successfully!');
      onComplete();
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast.error('Failed to save metrics configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-gray-300 text-lg">
          Let's configure your key metrics to track business health and progress.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={metric.id} className="text-white font-semibold mb-1 block">
                    {metric.label}
                  </Label>
                  <p className="text-gray-400 text-sm mb-3">{metric.description}</p>
                  <div className="flex items-center gap-2">
                    {metric.unit === '£' && (
                      <span className="text-gray-400">{metric.unit}</span>
                    )}
                    <Input
                      id={metric.id}
                      type="number"
                      value={metric.value}
                      onChange={(e) => handleMetricChange(metric.id, e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-500"
                      placeholder="0"
                    />
                    {metric.unit !== '£' && (
                      <span className="text-gray-400">{metric.unit}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
      >
        <h3 className="text-white font-semibold mb-2">Why track these metrics?</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Revenue and growth targets keep you focused on what matters</li>
          <li>• Energy alerts prevent burnout and maintain peak performance</li>
          <li>• Focus hours ensure you're making progress on strategic work</li>
          <li>• All metrics update automatically as you use the dashboard</li>
        </ul>
      </motion.div>

      <div className="flex justify-between">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        )}
        
        <div className="flex-1 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !metrics[0].value || !metrics[1].value}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 