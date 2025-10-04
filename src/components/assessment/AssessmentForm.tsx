import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { assessmentQuestions } from "@/data/assessmentQuestions";
import { AssessmentProgress } from "@/components/assessment/AssessmentProgress";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";

interface AssessmentFormProps {
  currentQuestion: number;
  answers: Record<string, any>;
  loading: boolean;
  onAnswer: (value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: () => boolean;
  onBackToHome: () => void;
}

export const AssessmentForm = ({
  currentQuestion,
  answers,
  loading,
  onAnswer,
  onNext,
  onPrevious,
  canProceed,
  onBackToHome
}: AssessmentFormProps) => {
  const question = assessmentQuestions[currentQuestion];

  return (
    <div className="assessment-container">
      <div className="assessment-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBackToHome}
            className="flex items-center text-oracle-navy hover:text-oracle-gold transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          <div className="text-oracle-navy/70">
            Question {currentQuestion + 1} of {assessmentQuestions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <AssessmentProgress 
          currentQuestion={currentQuestion} 
          totalQuestions={assessmentQuestions.length} 
        />

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{question.title}</h2>
          {question.context && (
            <p className="text-gray-600 mb-6">{question.context}</p>
          )}
          <QuestionRenderer
            question={question}
            answer={answers[question.id]}
            onAnswer={onAnswer}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={onPrevious}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-oracle-navy hover:text-oracle-gold transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed || loading}
            className="px-4 py-2 bg-oracle-navy text-white rounded hover:bg-oracle-navy/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                {currentQuestion === assessmentQuestions.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4 inline ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
