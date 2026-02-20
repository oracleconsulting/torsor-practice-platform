import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Edit, 
  RefreshCw, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StageReviewProps {
  stage: {
    id: string;
    stage_type: string;
    status: string;
    generated_content: any;
    approved_content: any;
  };
  onApprove: (stageId: string, editedContent?: any, reason?: string) => void;
  onRegenerate: (stageId: string) => void;
}

export function StageReview({ stage, onApprove, onRegenerate }: StageReviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(stage.generated_content);
  const [editReason, setEditReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  const hasEdits = JSON.stringify(editedContent) !== JSON.stringify(stage.generated_content);

  const stageTitles: Record<string, string> = {
    'fit_assessment': 'Fit Assessment',
    'five_year_vision': '5-Year Vision',
    'six_month_shift': '6-Month Shift',
    'sprint_plan': '12-Week Sprint',
    'value_analysis': 'Value Analysis'
  };

  const statusColors: Record<string, string> = {
    'generating': 'bg-blue-100 text-blue-800',
    'generated': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'published': 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{stageTitles[stage.stage_type] || stage.stage_type}</h3>
          <Badge className={statusColors[stage.status] || 'bg-gray-100 text-gray-800'}>
            {stage.status}
          </Badge>
          {hasEdits && (
            <Badge variant="outline" className="text-orange-600">
              Edited
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRegenerate(stage.id)}
          >
            <RefreshCw size={16} className="mr-1" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="space-y-4">
          {/* Generated Content Preview */}
          {!isEditing ? (
            <div className="bg-gray-50 rounded p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(stage.generated_content, null, 2)}
              </pre>
            </div>
          ) : (
            /* Editing Mode */
            <div className="space-y-4">
              <Textarea
                value={JSON.stringify(editedContent, null, 2)}
                onChange={(e) => {
                  try {
                    setEditedContent(JSON.parse(e.target.value));
                  } catch {
                    // Allow invalid JSON while typing
                  }
                }}
                rows={20}
                className="font-mono text-sm"
              />
              
              {hasEdits && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Why did you make this change? (helps improve future outputs)
                  </label>
                  <Textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g., 'Client doesn't need marketing - business is 100% referral'"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isEditing && (
              <Button 
                variant="outline"
                onClick={() => {
                  setEditedContent(stage.generated_content);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            )}
            <Button 
              onClick={() => onApprove(stage.id, hasEdits ? editedContent : undefined, editReason)}
              disabled={stage.status === 'approved' || stage.status === 'published'}
            >
              <CheckCircle size={16} className="mr-1" />
              {hasEdits ? 'Save & Approve' : 'Approve'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


