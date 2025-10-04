
import { Progress } from "@/components/ui/progress";

interface AssessmentProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export const AssessmentProgress = ({ currentQuestion, totalQuestions }: AssessmentProgressProps) => {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="mb-8">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-oracle-navy/70 mt-2">
        {Math.round(progress)}% complete
      </p>
    </div>
  );
};
