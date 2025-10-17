/**
 * My Assignments Page
 * Team member view of their current and past client work assignments
 */

import React, { useState, useEffect } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  getMemberAssignments,
  updateAssignment,
  logHours,
  submitFeedback,
  type WorkflowInstanceAssignment
} from '@/lib/api/workflow-instances';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  TrendingUp,
  Star,
  Edit,
  Plus
} from 'lucide-react';

export default function MyAssignmentsPage() {
  const { practice } = useAccountancyContext();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<(WorkflowInstanceAssignment & {
    workflow_instance?: any;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceMemberId, setPracticeMemberId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkflowInstanceAssignment | null>(null);
  const [isLogHoursOpen, setIsLogHoursOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMyData();
    }
  }, [user?.id]);

  const loadMyData = async () => {
    try {
      setLoading(true);

      // Get practice member for this user
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!member) {
        console.log('[MyAssignments] No practice member found for user');
        setLoading(false);
        return;
      }

      console.log('[MyAssignments] Found practice member:', member.id);
      setPracticeMemberId(member.id);

      // Load assignments
      const data = await getMemberAssignments(member.id);
      setAssignments(data as any);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeAssignments = assignments.filter(a => 
    a.status === 'assigned' || a.status === 'in_progress'
  );

  const completedAssignments = assignments.filter(a => 
    a.status === 'completed'
  );

  const totalEstimatedHours = activeAssignments.reduce((sum, a) => sum + (a.estimated_hours || 0), 0);
  const totalActualHours = activeAssignments.reduce((sum, a) => sum + (a.actual_hours || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="mt-2 text-gray-600">
          Track your client work, log hours, and submit feedback
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-amber-600">{activeAssignments.length}</p>
              </div>
              <Target className="h-10 w-10 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Est. Hours</p>
                <p className="text-3xl font-bold text-blue-600">{totalEstimatedHours.toFixed(1)}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours Logged</p>
                <p className="text-3xl font-bold text-green-600">{totalActualHours.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-purple-600">{completedAssignments.length}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Active Assignments</CardTitle>
          <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
            Current client work you're assigned to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active assignments</p>
              <p className="text-sm text-gray-500 mt-2">
                You'll see your client work here once you're assigned to projects
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => {
                const instance = assignment.workflow_instance;
                const hoursProgress = assignment.estimated_hours 
                  ? ((assignment.actual_hours || 0) / assignment.estimated_hours) * 100
                  : 0;

                return (
                  <div key={assignment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{instance?.client_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{instance?.service_id?.replace(/-/g, ' ')}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {assignment.role_seniority}
                          </Badge>
                          {assignment.stage_name && (
                            <Badge variant="secondary" className="text-xs">
                              {assignment.stage_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          assignment.status === 'in_progress' ? 'default' :
                          assignment.status === 'blocked' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {assignment.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Hours Progress */}
                    {assignment.estimated_hours && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Hours Progress</span>
                          <span className="font-semibold text-gray-900">
                            {assignment.actual_hours?.toFixed(1) || 0} / {assignment.estimated_hours.toFixed(1)}
                          </span>
                        </div>
                        <Progress value={Math.min(hoursProgress, 100)} className="h-2" />
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      {instance?.start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Started: {new Date(instance.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {instance?.target_completion_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="h-4 w-4" />
                          <span>Due: {new Date(instance.target_completion_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {assignment.notes && (
                      <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
                        {assignment.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsLogHoursOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Log Hours
                      </Button>
                      {assignment.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsFeedbackOpen(true);
                          }}
                          variant="default"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                      {assignment.status === 'assigned' && (
                        <Button
                          onClick={async () => {
                            try {
                              await updateAssignment(assignment.id, {
                                status: 'in_progress',
                                start_date: new Date().toISOString()
                              });
                              await loadAssignments();
                            } catch (error) {
                              console.error('Error starting assignment:', error);
                              alert('Failed to start assignment');
                            }
                          }}
                          variant="default"
                          size="sm"
                        >
                          Start Working
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Completed Work</CardTitle>
            <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
              Your past client engagements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedAssignments.map((assignment) => {
                const instance = assignment.workflow_instance;

                return (
                  <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{instance?.client_name}</h4>
                        <p className="text-sm text-gray-600">{assignment.role_seniority}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {assignment.actual_hours?.toFixed(1) || 0}h logged
                        </p>
                        {assignment.feedback_score && (
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: assignment.feedback_score }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Hours Dialog */}
      <LogHoursDialog
        isOpen={isLogHoursOpen}
        onClose={() => {
          setIsLogHoursOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        onSuccess={async () => {
          await loadAssignments();
          setIsLogHoursOpen(false);
          setSelectedAssignment(null);
        }}
      />

      {/* Submit Feedback Dialog */}
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => {
          setIsFeedbackOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        onSuccess={async () => {
          await loadAssignments();
          setIsFeedbackOpen(false);
          setSelectedAssignment(null);
        }}
      />
    </div>
  );
}

// Log Hours Dialog Component
interface LogHoursDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: WorkflowInstanceAssignment | null;
  onSuccess: () => Promise<void>;
}

const LogHoursDialog: React.FC<LogHoursDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess
}) => {
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!assignment) return;
    
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
      return;
    }

    try {
      setSaving(true);
      await logHours(assignment.id, hoursNum, notes || undefined);
      await onSuccess();
      setHours('');
      setNotes('');
    } catch (error) {
      console.error('Error logging hours:', error);
      alert('Failed to log hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Hours</DialogTitle>
          <DialogDescription>
            Record time spent on this assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="hours">Hours Worked *</Label>
            <Input
              id="hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.5"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="mt-1"
            />
          </div>

          {assignment && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <p className="text-gray-600">
                Current total: <span className="font-semibold text-gray-900">
                  {assignment.actual_hours?.toFixed(1) || 0}h
                </span>
              </p>
              {assignment.estimated_hours && (
                <p className="text-gray-600 mt-1">
                  Estimated: <span className="font-semibold text-gray-900">
                    {assignment.estimated_hours.toFixed(1)}h
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Log Hours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Feedback Dialog Component
interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: WorkflowInstanceAssignment | null;
  onSuccess: () => Promise<void>;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess
}) => {
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!assignment) return;
    
    if (score < 1 || score > 5) {
      alert('Please select a rating (1-5 stars)');
      return;
    }

    try {
      setSaving(true);
      await submitFeedback(assignment.id, score, notes || undefined);
      await onSuccess();
      setScore(0);
      setNotes('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Assignment</DialogTitle>
          <DialogDescription>
            Rate your experience and mark this work as complete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Rating *</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setScore(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= score
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {score === 1 && 'Poor experience'}
              {score === 2 && 'Below expectations'}
              {score === 3 && 'Met expectations'}
              {score === 4 && 'Exceeded expectations'}
              {score === 5 && 'Outstanding!'}
            </p>
          </div>

          <div>
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share your thoughts on this assignment..."
              rows={4}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || score === 0}>
            {saving ? 'Submitting...' : 'Mark Complete & Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

