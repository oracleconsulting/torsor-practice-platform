
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, X, Send, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackWidgetProps {
  type: 'board' | 'roadmap' | 'weekly';
  groupId: string;
  data?: any;
  onClose?: () => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  type, 
  groupId, 
  data,
  onClose 
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please rate your experience",
        description: "Select a rating before submitting feedback",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, just save to localStorage until backend is ready
      const feedbackData = {
        group_id: groupId,
        feedback_type: type,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
        data: data
      };

      const existingFeedback = JSON.parse(localStorage.getItem('oracle_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('oracle_feedback', JSON.stringify(existingFeedback));

      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the experience for everyone.",
      });

      setIsOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const questions = {
    board: {
      title: "How well does this board match your needs?",
      subtitle: "Your feedback helps us improve recommendations"
    },
    roadmap: {
      title: "Is this roadmap realistic for your situation?",
      subtitle: "Let us know if anything needs adjustment"
    },
    weekly: {
      title: "How was your progress this week?",
      subtitle: "Share wins, challenges, or blockers"
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="shadow-xl border-oracle-gold/30 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg text-oracle-navy">
                  {questions[type].title}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {questions[type].subtitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? 'fill-oracle-gold text-oracle-gold' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Quick Feedback Options */}
            {type === 'board' && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant="outline"
                  className="cursor-pointer hover:bg-oracle-gold/10"
                  onClick={() => setFeedback('Missing expertise I need')}
                >
                  Missing expertise
                </Badge>
                <Badge 
                  variant="outline"
                  className="cursor-pointer hover:bg-oracle-gold/10"
                  onClick={() => setFeedback('Perfect match!')}
                >
                  Perfect match
                </Badge>
                <Badge 
                  variant="outline"
                  className="cursor-pointer hover:bg-oracle-gold/10"
                  onClick={() => setFeedback('Too many advisors')}
                >
                  Too many
                </Badge>
              </div>
            )}

            {/* Text Feedback */}
            <Textarea
              placeholder="Any specific feedback? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] resize-none"
            />

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
