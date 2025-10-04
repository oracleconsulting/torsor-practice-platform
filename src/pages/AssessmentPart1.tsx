import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAssessmentProgress } from '../hooks/useAssessmentProgress';
import { validatePart1 } from '@/services/assessmentValidation';
import { toast } from 'sonner';
import { AssessmentPart1Container } from '@/components/dashboard/AssessmentPart1Container';
import '@/styles/assessment.css';
import { AssessmentApiService } from '@/services/assessmentApiService';
import { AssessmentDatabaseService } from '@/services/assessmentDatabaseService';

const AssessmentPart1 = () => {
  // Since this component is wrapped in ProtectedRoute in App.tsx,
  // we don't need any authentication checks here.
  // ProtectedRoute handles all the auth logic.
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [partnerEmails, setPartnerEmails] = useState([]);
  const [currentQ, setCurrentQ] = useState(null);
  const [formData, setFormData] = useState({ email: '' });
  const { user, uid } = useAuth();
  const { progress, updateProgress } = useAssessmentProgress();
  const navigate = useNavigate();

  // Initialize formData with user email
  useEffect(() => {
    if (user?.email) {
      setFormData({ email: user.email });
    }
  }, [user]);

  // Auto-save to Supabase every 30 seconds if there are changes
  useEffect(() => {
    if (!uid || !formData.email) return;
    
    const saveTimer = setTimeout(async () => {
      try {
        await AssessmentDatabaseService.updatePart1(uid, formData.email, { responses });
        console.log('Auto-saved Part 1');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000);
    
    return () => clearTimeout(saveTimer);
  }, [responses, uid, formData.email]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate responses
      const validation = validatePart1(responses);
      if (!validation.isValid) {
        toast.error('Please complete all required questions');
        return;
      }
      
      // Save to database using UID as primary identifier
      const result = await AssessmentDatabaseService.savePart1(
        uid,
        formData.email,
        responses
      );
      
      // Update local state with the group_id
      const finalGroupId = result.group_id;
      
      // Clear localStorage after successful save
      localStorage.removeItem('assessmentResponses');
      
      // Update progress
      updateProgress({
        part1Complete: true,
        part1Answers: responses,
        group_id: finalGroupId,
        fitMessage: result.fit_message
      });
      
      toast.success('Assessment completed successfully!');
      
      // Navigate to Part 2
      navigate('/assessment/part2');
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    const updatedAnswers = { ...responses, [questionId]: value };
    setResponses(updatedAnswers);
    
    // Auto-save to Supabase if user is authenticated and has UID
    if (user?.email && uid) {
      try {
        AssessmentDatabaseService.updatePart1(uid, formData.email, { responses: updatedAnswers });
        console.log('Auto-saved answer successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  return (
    <div className="assessment-container">
      <div className="assessment-content">
        <div className="question-container">
          <AssessmentPart1Container />
        </div>
      </div>
    </div>
  );
};

export default AssessmentPart1;
