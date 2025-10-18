import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface QuickCPDLoggerProps {
  memberId: string;
  onSuccess?: () => void;
  onComplete?: () => void;
}

export const QuickCPDLogger: React.FC<QuickCPDLoggerProps> = ({ memberId, onSuccess, onComplete }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleQuickLog = async () => {
    if (!formData.title || !formData.hours) {
      toast({
        title: 'Missing Information',
        description: 'Please enter activity title and hours',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create CPD activity
      const { error } = await (supabase as any)
        .from('cpd_activities')
        .insert({
          practice_member_id: memberId,
          title: formData.title,
          type: 'other',
          hours_claimed: parseFloat(formData.hours),
          activity_date: formData.date,
          description: formData.notes || null,
          status: 'approved'
        });

      if (error) throw error;

      toast({
        title: 'CPD Activity Logged! 🎉',
        description: `${formData.hours} hours recorded`
      });

      // Reset form
      setFormData({
        title: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      if (onSuccess) onSuccess();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error logging CPD:', error);
      toast({
        title: 'Error',
        description: 'Failed to log CPD activity',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BookOpen className="w-5 h-5" />
          Quick CPD Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm text-white font-medium">Activity Title</label>
          <Input 
            placeholder="e.g., Excel Advanced Training"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Hours & Date (side by side) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Hours
            </label>
            <Input 
              type="number"
              step="0.5"
              min="0"
              placeholder="2.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-white font-medium flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Date
            </label>
            <Input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* Notes (optional) */}
        <div>
          <label className="text-sm text-white font-medium">Quick Notes (optional)</label>
          <Textarea 
            placeholder="Key takeaways..."
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white resize-none"
          />
        </div>

        {/* Log Button */}
        <Button 
          onClick={handleQuickLog}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={!formData.title || !formData.hours || loading}
        >
          {loading ? 'Logging...' : 'Log CPD Activity'}
        </Button>

        {/* AI will suggest skills after logging */}
        <p className="text-xs text-gray-100 font-medium text-center">
          We'll auto-suggest related skills after logging
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickCPDLogger;

