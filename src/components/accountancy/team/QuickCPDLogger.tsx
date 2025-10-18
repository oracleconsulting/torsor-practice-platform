import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BookOpen, Clock, Calendar as CalendarIcon, Target, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface Skill {
  id: string;
  name: string;
  category: string;
  current_level: number;
}

interface QuickCPDLoggerProps {
  memberId: string;
  onSuccess?: () => void;
  onComplete?: (cpdActivityId: string, selectedSkills: string[]) => void;
}

export const QuickCPDLogger: React.FC<QuickCPDLoggerProps> = ({ memberId, onSuccess, onComplete }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    learnings: '' // New mandatory field
  });

  useEffect(() => {
    loadSkills();
  }, [memberId]);

  const loadSkills = async () => {
    try {
      setLoadingSkills(true);
      
      // Get user's skill assessments
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level')
        .eq('team_member_id', memberId);

      if (!assessments || assessments.length === 0) {
        setSkills([]);
        setLoadingSkills(false);
        return;
      }

      // Get skill details
      const skillIds = (assessments as any).map((a: any) => a.skill_id);
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, category_id')
        .in('id', skillIds);

      // Get categories
      const categoryIds = [...new Set((skillsData as any)?.map((s: any) => s.category_id) || [])];
      const { data: categories } = await supabase
        .from('skill_categories')
        .select('id, name')
        .in('id', categoryIds);

      const categoryMap = new Map((categories as any)?.map((c: any) => [c.id, c.name]) || []);

      // Combine data
      const skillsList: Skill[] = ((skillsData as any) || []).map((skill: any) => {
        const assessment = (assessments as any).find((a: any) => a.skill_id === skill.id);
        return {
          id: skill.id,
          name: skill.name,
          category: categoryMap.get(skill.category_id) || 'General',
          current_level: assessment?.current_level || 0
        };
      });

      setSkills(skillsList);
    } catch (error) {
      console.error('Error loading skills:', error);
      setSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleQuickLog = async () => {
    // Validation
    if (!formData.title || !formData.hours) {
      toast({
        title: 'Missing Information',
        description: 'Please enter activity title and hours',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.learnings || formData.learnings.trim().length < 10) {
      toast({
        title: 'Knowledge Capture Required',
        description: 'Please describe what you learned (minimum 10 characters)',
        variant: 'destructive'
      });
      return;
    }

    if (selectedSkills.length === 0) {
      toast({
        title: 'Select Skills',
        description: 'Please select at least one skill this CPD activity relates to',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create CPD activity with learnings
      const { data: cpdActivity, error: cpdError } = await (supabase as any)
        .from('cpd_activities')
        .insert({
          practice_member_id: memberId,
          title: formData.title,
          type: 'other',
          hours_claimed: parseFloat(formData.hours),
          activity_date: formData.date,
          description: formData.notes || null,
          learnings_captured: formData.learnings, // New field
          status: 'completed'
        })
        .select()
        .single();

      if (cpdError) throw cpdError;

      toast({
        title: 'CPD Activity Logged! 🎉',
        description: `${formData.hours} hours recorded for ${selectedSkills.length} skill(s)`
      });

      // Reset form
      setFormData({
        title: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        learnings: ''
      });
      setSelectedSkills([]);

      if (onSuccess) onSuccess();
      if (onComplete) onComplete(cpdActivity.id, selectedSkills);
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
          <label className="text-sm text-white font-medium">Activity Title *</label>
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
              Hours *
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
              Date *
            </label>
            <Input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* What Did You Learn - MANDATORY */}
        <div>
          <label className="text-sm text-white font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            What did you learn? *
          </label>
          <Textarea 
            placeholder="Describe the key knowledge or insights you gained from this activity..."
            rows={3}
            value={formData.learnings}
            onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum 10 characters. This helps track your learning progress.
          </p>
        </div>

        {/* Related Skills Selection - MANDATORY */}
        <div>
          <label className="text-sm text-white font-medium flex items-center gap-1 mb-2">
            <Target className="w-3 h-3" />
            Which skills does this relate to? *
          </label>
          
          {loadingSkills ? (
            <div className="text-sm text-gray-400">Loading your skills...</div>
          ) : skills.length === 0 ? (
            <div className="text-sm text-gray-400">
              Complete your skills assessment first to link CPD activities to skills.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-2">
              {skills.map(skill => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skill.id}`}
                    checked={selectedSkills.includes(skill.id)}
                    onCheckedChange={() => handleToggleSkill(skill.id)}
                    className="border-gray-500"
                  />
                  <Label
                    htmlFor={`skill-${skill.id}`}
                    className="text-sm text-white cursor-pointer flex-1 flex items-center justify-between"
                  >
                    <span>{skill.name}</span>
                    <span className="text-xs text-gray-400">
                      Current: {skill.current_level}/5
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Select all skills this activity helped develop. You'll reassess these after completion.
          </p>
        </div>

        {/* Quick Notes (optional) */}
        <div>
          <label className="text-sm text-white font-medium">Additional Notes (optional)</label>
          <Textarea 
            placeholder="Any additional context..."
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
          disabled={!formData.title || !formData.hours || loading || skills.length === 0}
        >
          {loading ? 'Logging...' : 'Log CPD & Reassess Skills'}
        </Button>

        {/* Helper text */}
        <p className="text-xs text-gray-100 font-medium text-center">
          After logging, you'll be prompted to reassess your skill levels
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickCPDLogger;

