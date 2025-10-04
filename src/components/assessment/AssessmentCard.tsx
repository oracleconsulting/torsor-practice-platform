import React from 'react';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface AssessmentCardProps {
  title: string;
  description: string;
  completed: boolean;
  onClick?: () => void;
  buttonText: string;
  disabled?: boolean;
  badge?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  title,
  description,
  completed,
  onClick,
  buttonText,
  disabled = false,
  badge,
  onRefresh,
  isRefreshing = false
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (disabled) return;
    
    // If custom onClick is provided, use it
    if (onClick) {
      onClick();
      return;
    }
    
    // Fixed navigation logic
    if (title.includes("Part 1")) {
      if (completed) {
        navigate('/assessment/part1/review');
      } else {
        navigate('/assessment/part1');
      }
    } else if (title.includes("Part 2")) {
      if (completed) {
        navigate('/assessment/part2/review');
      } else {
        navigate('/assessment/part2');
      }
    } else if (title.includes("Validation")) {
      navigate('/validation-questions');
    } else if (title.includes("Part 3") || title.includes("Hidden Value")) {
      navigate('/assessment/part3');
    } else if (title.includes("Roadmap")) {
      navigate('/dashboard/journey');
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            completed ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <FileText className={`w-5 h-5 ${completed ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {badge && (
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <Button
          onClick={handleClick}
          disabled={disabled}
          variant={completed ? "outline" : "default"}
          className="w-full"
        >
          {buttonText}
        </Button>
        
        {/* Add refresh button for Part 2 when roadmap might be ready */}
        {title.includes("Part 2") && onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="w-full text-xs"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Check Roadmap Status
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}; 