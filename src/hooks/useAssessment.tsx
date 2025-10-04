import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabase/client';
import { assessmentQuestions } from "@/data/assessmentQuestions";

// Helper to check if all required questions are answered
function allRequiredQuestionsAnswered(answers: Record<string, any>) {
  return assessmentQuestions.filter(q => q.required).every(q => {
    const answer = answers[q.id];
    if (q.type === 'multi-part' && q.parts) {
      return q.parts.every(part => answer && answer[part.id] && answer[part.id].toString().trim() !== '');
    }
    return answer !== undefined && answer !== null && answer.toString().trim() !== '';
  });
}

export const useAssessment = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Restore assessment state if user returns from email verification
  useEffect(() => {
    if (user && !authLoading) {
      const savedAnswers = localStorage.getItem('assessmentAnswers');
      const savedCompleted = localStorage.getItem('assessmentCompleted');
      
      if (savedAnswers) {
        console.log('Restoring saved assessment answers');
        setAnswers(JSON.parse(savedAnswers));
        localStorage.removeItem('assessmentAnswers');
      }
      
      if (savedCompleted === 'true') {
        console.log('User returned after email verification, completing assessment');
        setCompleted(true);
        localStorage.removeItem('assessmentCompleted');
      }
    }
  }, [user, authLoading]);

  const handleAnswer = (value: any) => {
    const question = assessmentQuestions[currentQuestion];
    setAnswers(prev => ({
      ...prev,
      [question.id]: value
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Only allow completion if all required questions are answered
      if (!allRequiredQuestionsAnswered(answers)) {
        alert('Please answer all required questions before completing the assessment.');
        return;
      }
      // Show email collection if user not authenticated
      if (!user) {
        // Save assessment state before email collection
        localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
        localStorage.setItem('assessmentCompleted', 'true');
        localStorage.setItem('assessmentReturn', '/assessment');
        setCompleted(true);
      } else {
        // Save to database if user is authenticated
        setLoading(true);
        try {
          console.log('Saving assessment for user:', user.email);
          console.log('Assessment answers:', answers);

          // Check if user already has a group_id
          const { data: existingIntake } = await supabase
            .from('client_intake')
            .select('group_id')
            .eq('email', user.email)
            .maybeSingle();

          console.log('Existing intake:', existingIntake);

          const groupId = existingIntake?.group_id || crypto.randomUUID();
          console.log('Using group_id:', groupId);

          const insertData = {
            email: user.email,
            responses: answers,
            group_id: groupId,
            status: 'pending',
            is_primary: !existingIntake // First person is primary
          };

          console.log('Inserting data:', insertData);

          const { error } = await supabase
            .from('client_intake')
            .insert(insertData);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          console.log('Assessment saved successfully');
          
          // Save group_id for Part 2
          localStorage.setItem('assessmentGroupId', groupId);
          setCompleted(true);
        } catch (error) {
          console.error('Error saving assessment:', error);
          // Still set completed to true so user can proceed
          setCompleted(true);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const canProceed = (): boolean => {
    const question = assessmentQuestions[currentQuestion];
    if (!question.required) return true;
    const answer = answers[question.id];
    return !!(answer && (typeof answer === 'string' ? answer.trim() : true));
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setEmail('');
  };

  return {
    user,
    authLoading,
    currentQuestion,
    answers,
    loading,
    completed,
    email,
    emailSent,
    setEmail,
    setEmailSent,
    handleAnswer,
    handleNext,
    handlePrevious,
    canProceed,
    handleTryDifferentEmail
  };
};
