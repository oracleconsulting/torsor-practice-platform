// ============================================================================
// ANALYSIS COMMENT SYSTEM
// ============================================================================
// Allows admins to add comments/corrections on specific sections of generated
// discovery analyses. Comments feed into the practice learning library.
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  MessageSquare,
  Plus,
  X,
  Check,
  AlertTriangle,
  Edit2,
  Trash2,
  Save,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type SectionType = 
  | 'page1_destination'
  | 'page2_gaps'
  | 'page2_gap_item'
  | 'page3_journey'
  | 'page3_phase'
  | 'page4_investment'
  | 'page4_cost_of_staying'
  | 'page4_returns'
  | 'page5_next_steps'
  | 'page5_first_step'
  | 'recommendation'
  | 'general';

export type CommentType = 
  | 'correction'
  | 'suggestion'
  | 'removal'
  | 'tone'
  | 'factual_error'
  | 'better_alternative'
  | 'praise';

export type LearningCategory =
  | 'tone_style'
  | 'service_appropriateness'
  | 'client_stage_detection'
  | 'financial_analysis'
  | 'recommendation_logic'
  | 'personalization'
  | 'industry_specific'
  | 'objection_handling'
  | 'value_proposition'
  | 'general';

export interface AnalysisComment {
  id: string;
  engagement_id: string;
  report_id?: string;
  practice_id: string;
  section_type: SectionType;
  section_index?: number;
  section_identifier?: string;
  original_content: any;
  comment_type: CommentType;
  comment_text: string;
  suggested_replacement?: string;
  extracted_learning?: string;
  learning_category?: LearningCategory;
  status: 'pending' | 'approved' | 'applied' | 'rejected' | 'archived';
  created_by?: string;
  created_at: string;
}

export interface PracticeLearning {
  id: string;
  practice_id: string;
  learning_type: string;
  title: string;
  learning_rule: string;
  learning_rationale?: string;
  before_example?: string;
  after_example?: string;
  confidence_score: number;
  times_validated: number;
}

// ============================================================================
// COMMENT TYPE OPTIONS
// ============================================================================

const COMMENT_TYPE_OPTIONS: { value: CommentType; label: string; icon: string; description: string }[] = [
  { value: 'correction', label: 'Correction', icon: '✏️', description: 'This is wrong, should be X' },
  { value: 'suggestion', label: 'Suggestion', icon: '💡', description: 'Consider adding/changing X' },
  { value: 'removal', label: 'Remove', icon: '🗑️', description: 'Remove this entirely' },
  { value: 'tone', label: 'Tone Issue', icon: '🎯', description: 'Tone/wording needs adjustment' },
  { value: 'factual_error', label: 'Factual Error', icon: '⚠️', description: 'Factual mistake' },
  { value: 'better_alternative', label: 'Better Alternative', icon: '🔄', description: 'There\'s a better recommendation' },
  { value: 'praise', label: 'Good Example', icon: '⭐', description: 'This is good, learn from it' },
];

const LEARNING_CATEGORY_OPTIONS: { value: LearningCategory; label: string }[] = [
  { value: 'tone_style', label: 'Tone & Writing Style' },
  { value: 'service_appropriateness', label: 'Service Appropriateness' },
  { value: 'client_stage_detection', label: 'Client Stage Detection' },
  { value: 'financial_analysis', label: 'Financial Analysis' },
  { value: 'recommendation_logic', label: 'Recommendation Logic' },
  { value: 'personalization', label: 'Personalisation' },
  { value: 'industry_specific', label: 'Industry Specific' },
  { value: 'objection_handling', label: 'Objection Handling' },
  { value: 'value_proposition', label: 'Value Proposition' },
  { value: 'general', label: 'General' },
];

const SECTION_LABELS: Record<SectionType, string> = {
  page1_destination: 'Page 1: Your Vision',
  page2_gaps: 'Page 2: The Gaps',
  page2_gap_item: 'Gap Item',
  page3_journey: 'Page 3: The Journey',
  page3_phase: 'Journey Phase',
  page4_investment: 'Page 4: Investment',
  page4_cost_of_staying: 'Cost of Staying',
  page4_returns: 'Returns Analysis',
  page5_next_steps: 'Page 5: Next Steps',
  page5_first_step: 'First Step',
  recommendation: 'Recommendation',
  general: 'General',
};

// ============================================================================
// SECTION COMMENT BOX COMPONENT
// ============================================================================

interface SectionCommentBoxProps {
  engagementId: string;
  reportId?: string;
  practiceId: string;
  sectionType: SectionType;
  sectionIndex?: number;
  sectionIdentifier?: string;
  originalContent: any;
  existingComments: AnalysisComment[];
  onCommentAdded: () => void;
}

export function SectionCommentBox({
  engagementId,
  reportId,
  practiceId,
  sectionType,
  sectionIndex,
  sectionIdentifier,
  originalContent,
  existingComments,
  onCommentAdded
}: SectionCommentBoxProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [commentType, setCommentType] = useState<CommentType>('correction');
  const [commentText, setCommentText] = useState('');
  const [suggestedReplacement, setSuggestedReplacement] = useState('');
  const [extractedLearning, setExtractedLearning] = useState('');
  const [learningCategory, setLearningCategory] = useState<LearningCategory | ''>('');

  // Filter comments for this specific section
  const sectionComments = existingComments.filter(c => 
    c.section_type === sectionType &&
    (sectionIndex === undefined || c.section_index === sectionIndex) &&
    (sectionIdentifier === undefined || c.section_identifier === sectionIdentifier)
  );

  const handleSaveComment = async () => {
    if (!commentText.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('discovery_analysis_comments')
        .insert({
          engagement_id: engagementId,
          report_id: reportId,
          practice_id: practiceId,
          section_type: sectionType,
          section_index: sectionIndex,
          section_identifier: sectionIdentifier,
          original_content: originalContent,
          comment_type: commentType,
          comment_text: commentText,
          suggested_replacement: suggestedReplacement || null,
          extracted_learning: extractedLearning || null,
          learning_category: learningCategory || null,
          status: 'pending',
          created_by: user?.id
        });

      if (error) throw error;

      // Reset form
      setCommentType('correction');
      setCommentText('');
      setSuggestedReplacement('');
      setExtractedLearning('');
      setLearningCategory('');
      setShowForm(false);
      
      onCommentAdded();
    } catch (error: any) {
      console.error('Error saving comment:', error);
      alert(`Error saving comment: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      const { error } = await supabase
        .from('discovery_analysis_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      onCommentAdded();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
    }
  };

  const hasComments = sectionComments.length > 0;
  const hasPendingComments = sectionComments.some(c => c.status === 'pending');

  return (
    <div className="mt-2">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 text-xs transition-colors ${
          hasComments 
            ? hasPendingComments 
              ? 'text-amber-600 hover:text-amber-700' 
              : 'text-blue-600 hover:text-blue-700'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {hasComments ? (
          <span>{sectionComments.length} comment{sectionComments.length !== 1 ? 's' : ''}</span>
        ) : (
          <span>Add feedback</span>
        )}
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          {/* Existing Comments */}
          {sectionComments.length > 0 && (
            <div className="space-y-2 mb-3">
              {sectionComments.map((comment) => (
                <div 
                  key={comment.id}
                  className={`p-2 rounded text-sm ${
                    comment.status === 'approved' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                      : comment.status === 'applied'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600">
                          {COMMENT_TYPE_OPTIONS.find(o => o.value === comment.comment_type)?.icon}{' '}
                          {COMMENT_TYPE_OPTIONS.find(o => o.value === comment.comment_type)?.label}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          comment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          comment.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                          comment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {comment.status}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{comment.comment_text}</p>
                      {comment.suggested_replacement && (
                        <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded text-emerald-800 dark:text-emerald-300 text-xs">
                          <strong>Should be:</strong> {comment.suggested_replacement}
                        </div>
                      )}
                      {comment.extracted_learning && (
                        <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-300 text-xs flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span><strong>Learning:</strong> {comment.extracted_learning}</span>
                        </div>
                      )}
                    </div>
                    {comment.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Button/Form */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3 w-3" />
              Add feedback
            </button>
          ) : (
            <div className="space-y-3">
              {/* Comment Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Type of Feedback
                </label>
                <div className="flex flex-wrap gap-1">
                  {COMMENT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCommentType(option.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        commentType === option.value
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                      }`}
                      title={option.description}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Text */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Your Feedback
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What's wrong or what would you change?"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 resize-none"
                  rows={2}
                />
              </div>

              {/* Suggested Replacement */}
              {(commentType === 'correction' || commentType === 'better_alternative' || commentType === 'tone') && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    What it should say instead (optional)
                  </label>
                  <textarea
                    value={suggestedReplacement}
                    onChange={(e) => setSuggestedReplacement(e.target.value)}
                    placeholder="The corrected/improved version..."
                    className="w-full px-2 py-1.5 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Learning Extraction */}
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Extract Learning (builds practice wisdom)
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-amber-600 dark:text-amber-400 mb-1">
                      What should the AI learn from this?
                    </label>
                    <textarea
                      value={extractedLearning}
                      onChange={(e) => setExtractedLearning(e.target.value)}
                      placeholder="e.g., 'Never recommend Fractional COO for clients who work under 40 hours'"
                      className="w-full px-2 py-1.5 text-sm border border-amber-200 rounded-lg dark:bg-slate-700 dark:border-amber-700 resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {extractedLearning && (
                    <div>
                      <label className="block text-xs text-amber-600 dark:text-amber-400 mb-1">
                        Category
                      </label>
                      <select
                        value={learningCategory}
                        onChange={(e) => setLearningCategory(e.target.value as LearningCategory)}
                        className="w-full px-2 py-1.5 text-sm border border-amber-200 rounded-lg dark:bg-slate-700 dark:border-amber-700"
                      >
                        <option value="">Select category...</option>
                        {LEARNING_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setCommentText('');
                    setSuggestedReplacement('');
                    setExtractedLearning('');
                    setLearningCategory('');
                  }}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComment}
                  disabled={saving || !commentText.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {saving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      Save Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEARNING REVIEW PANEL
// ============================================================================

interface LearningReviewPanelProps {
  practiceId: string;
  engagementId?: string;
  onRefresh: () => void;
}

export function LearningReviewPanel({ practiceId, engagementId, onRefresh }: LearningReviewPanelProps) {
  const { user } = useAuth();
  const [pendingComments, setPendingComments] = useState<AnalysisComment[]>([]);
  const [learnings, setLearnings] = useState<PracticeLearning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pending' | 'library'>('pending');

  useEffect(() => {
    fetchData();
  }, [practiceId, engagementId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending comments
      let query = supabase
        .from('discovery_analysis_comments')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data: commentsData, error: commentsError } = await query;
      if (commentsError) throw commentsError;
      setPendingComments(commentsData || []);

      // Fetch learning library
      const { data: learningsData, error: learningsError } = await supabase
        .from('practice_learning_library')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (learningsError) throw learningsError;
      setLearnings(learningsData || []);
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComment = async (comment: AnalysisComment) => {
    try {
      const { error } = await supabase
        .from('discovery_analysis_comments')
        .update({ 
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;
      
      await fetchData();
      onRefresh();
    } catch (error: any) {
      console.error('Error approving comment:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRejectComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('discovery_analysis_comments')
        .update({ 
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      
      await fetchData();
      onRefresh();
    } catch (error: any) {
      console.error('Error rejecting comment:', error);
    }
  };

  const handleToggleLearningActive = async (learningId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('practice_learning_library')
        .update({ is_active: !currentActive })
        .eq('id', learningId);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error toggling learning:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="animate-pulse">Loading learning data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeView === 'pending'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Pending Review ({pendingComments.length})
        </button>
        <button
          onClick={() => setActiveView('library')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeView === 'library'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="h-4 w-4 inline mr-1" />
          Learning Library ({learnings.length})
        </button>
      </div>

      {/* Pending Comments View */}
      {activeView === 'pending' && (
        <div className="space-y-3">
          {pendingComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Check className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No pending comments to review</p>
            </div>
          ) : (
            pendingComments.map((comment) => (
              <div 
                key={comment.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                        {SECTION_LABELS[comment.section_type]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {COMMENT_TYPE_OPTIONS.find(o => o.value === comment.comment_type)?.icon}{' '}
                        {COMMENT_TYPE_OPTIONS.find(o => o.value === comment.comment_type)?.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {comment.comment_text}
                    </p>
                    
                    {comment.suggested_replacement && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded text-sm text-emerald-800 dark:text-emerald-300 mb-2">
                        <strong>Should be:</strong> {comment.suggested_replacement}
                      </div>
                    )}
                    
                    {comment.extracted_learning && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Learning:</strong> {comment.extracted_learning}
                          {comment.learning_category && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded">
                              {LEARNING_CATEGORY_OPTIONS.find(o => o.value === comment.learning_category)?.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Original Content Preview */}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Show original content
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(comment.original_content, null, 2)}
                      </pre>
                    </details>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApproveComment(comment)}
                      className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg"
                      title="Approve and add to learning library"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRejectComment(comment.id)}
                      className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                      title="Reject"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Learning Library View */}
      {activeView === 'library' && (
        <div className="space-y-3">
          {learnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No learnings in the library yet</p>
              <p className="text-sm">Approve feedback comments to build your practice wisdom</p>
            </div>
          ) : (
            learnings.map((learning) => (
              <div 
                key={learning.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {learning.learning_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        Validated {learning.times_validated} times
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {Math.round(learning.confidence_score * 100)}% confidence
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {learning.title}
                    </h4>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Rule:</strong> {learning.learning_rule}
                    </p>
                    
                    {learning.learning_rationale && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Why: {learning.learning_rationale}
                      </p>
                    )}

                    {(learning.before_example || learning.after_example) && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Show examples
                        </summary>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                          {learning.before_example && (
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <strong className="text-red-600">Before:</strong>
                              <p className="mt-1">{learning.before_example.substring(0, 200)}...</p>
                            </div>
                          )}
                          {learning.after_example && (
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                              <strong className="text-emerald-600">After:</strong>
                              <p className="mt-1">{learning.after_example.substring(0, 200)}...</p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleLearningActive(learning.id, true)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="Deactivate this learning"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAnalysisComments(engagementId: string | undefined, reportId: string | undefined) {
  const [comments, setComments] = useState<AnalysisComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!engagementId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discovery_analysis_comments')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [engagementId, reportId]);

  return { comments, loading, refetch: fetchComments };
}

export default SectionCommentBox;

