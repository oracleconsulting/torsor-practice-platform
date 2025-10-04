
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Target, Construction, Lightbulb, RotateCcw, 
  Star, Send, CheckCircle 
} from 'lucide-react';
import { sprintTrackingService } from '@/services/sprintTrackingService';
import { useToast } from '@/hooks/use-toast';

interface SprintFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

interface FeedbackForm {
  title: string;
  description: string;
  impact_score: number;
}

export const SprintFeedbackModal = ({ open, onClose, groupId }: SprintFeedbackModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('wins');
  const [forms, setForms] = useState<{ [key: string]: FeedbackForm }>({
    wins: { title: '', description: '', impact_score: 3 },
    challenges: { title: '', description: '', impact_score: 3 },
    learnings: { title: '', description: '', impact_score: 3 },
    pivots: { title: '', description: '', impact_score: 3 }
  });
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (type: string, field: keyof FeedbackForm, value: string | number) => {
    setForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (type: string) => {
    if (!forms[type].title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your feedback.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const feedbackType = type === 'wins' ? 'win' : 
                          type === 'challenges' ? 'challenge' :
                          type === 'learnings' ? 'learning' : 'pivot';

      await sprintTrackingService.addFeedback(groupId, feedbackType, forms[type]);

      toast({
        title: "Feedback saved!",
        description: "Your feedback has been recorded successfully.",
      });

      // Reset form
      setForms(prev => ({
        ...prev,
        [type]: { title: '', description: '', impact_score: 3 }
      }));

    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (type: string) => {
    const score = forms[type].impact_score;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(num => (
          <Star
            key={num}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              num <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => updateForm(type, 'impact_score', num)}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {score === 1 ? 'Low' : score <= 3 ? 'Medium' : 'High'} Impact
        </span>
      </div>
    );
  };

  const tabs = [
    {
      id: 'wins',
      label: 'Wins',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Construction,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 'learnings',
      label: 'Learnings',
      icon: Lightbulb,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'pivots',
      label: 'Pivots',
      icon: RotateCcw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-oracle-navy">
            Quick Feedback Capture
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1 text-xs"
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <div className={`p-6 rounded-lg ${tab.bgColor} ${tab.borderColor} border-2`}>
                <div className="flex items-center gap-2 mb-4">
                  <tab.icon className={`h-6 w-6 ${tab.color}`} />
                  <h3 className="text-lg font-semibold text-oracle-navy">
                    Record a {tab.label.slice(0, -1)}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-oracle-navy mb-2">
                      Title *
                    </label>
                    <Input
                      value={forms[tab.id].title}
                      onChange={(e) => updateForm(tab.id, 'title', e.target.value)}
                      placeholder={`What was the main ${tab.id.slice(0, -1)}?`}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-oracle-navy mb-2">
                      Description
                    </label>
                    <Textarea
                      value={forms[tab.id].description}
                      onChange={(e) => updateForm(tab.id, 'description', e.target.value)}
                      placeholder="Provide more details..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-oracle-navy mb-2">
                      Impact Rating
                    </label>
                    {renderStars(tab.id)}
                  </div>

                  <Button
                    onClick={() => handleSubmit(tab.id)}
                    disabled={submitting || !forms[tab.id].title.trim()}
                    className="w-full"
                  >
                    {submitting ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save {tab.label.slice(0, -1)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
