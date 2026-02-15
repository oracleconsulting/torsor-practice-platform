// ============================================================================
// Sprint Editor Modal — single file: full-screen editor for reviewing/editing
// sprint before publish. All subcomponents in this file.
// ============================================================================

import { useState } from 'react';
import { X, Plus, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface SprintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  clientId: string;
  practiceId: string;
  stageId: string;
  sprintNumber: number;
  generatedContent: any;
  approvedContent: any | null;
  currentStatus: string;
  clientName: string;
  tierName: string;
}

// ----------------------------------------------------------------------------
// WeekNav — left sidebar
// ----------------------------------------------------------------------------
function WeekNav({
  weeks,
  selectedWeek,
  onSelect,
  editedWeeks,
}: {
  weeks: any[];
  selectedWeek: number;
  onSelect: (week: number) => void;
  editedWeeks: Set<number>;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect(0)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          selectedWeek === 0 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Overview
      </button>
      <div className="border-t border-slate-200 my-2" />
      {(weeks || []).map((week: any) => {
        const weekNum = week.weekNumber ?? week.week ?? 0;
        const isSelected = selectedWeek === weekNum;
        const hasEdits = editedWeeks.has(weekNum);
        return (
          <button
            key={weekNum}
            type="button"
            onClick={() => onSelect(weekNum)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
              isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasEdits ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            <span className="truncate">
              Wk {weekNum}: {(week.theme || '').substring(0, 20)}
              {(week.theme || '').length > 20 ? '...' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// SprintOverviewPanel — sprint-level fields (selectedWeek === 0)
// ----------------------------------------------------------------------------
function SprintOverviewPanel({
  sprint,
  onChange,
}: {
  sprint: any;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="max-w-3xl space-y-6">
      <h3 className="text-xl font-semibold text-slate-900">Sprint Overview</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Theme</label>
        <input
          type="text"
          value={sprint.sprintTheme || ''}
          onChange={(e) => onChange('sprintTheme', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Promise</label>
        <textarea
          value={sprint.sprintPromise || ''}
          onChange={(e) => onChange('sprintPromise', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Goals</label>
        <textarea
          value={
            typeof sprint.sprintGoals === 'string'
              ? sprint.sprintGoals
              : sprint.sprintGoals != null
                ? JSON.stringify(sprint.sprintGoals, null, 2)
                : ''
          }
          onChange={(e) => onChange('sprintGoals', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
        />
      </div>
      {sprint.phases && Object.keys(sprint.phases).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Phases</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(sprint.phases).map(([key, phase]: [string, any]) => (
              <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="font-medium text-slate-800 text-sm capitalize">{key}</p>
                <p className="text-xs text-slate-500 mt-0.5">Weeks {phase.weeks?.join(', ')}</p>
                <p className="text-xs text-slate-400 mt-1">{phase.emotionalGoal}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-4 text-sm text-slate-500 border-t border-slate-200 pt-4">
        <span>{sprint.weeks?.length || 0} weeks</span>
        <span>
          {sprint.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0} tasks
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// TaskEditorCard — single task expand/collapse
// ----------------------------------------------------------------------------
function TaskEditorCard({
  task,
  index: _index,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
}: {
  task: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        isExpanded ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-white'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
          <span className="font-medium text-slate-900 truncate">{task.title || '(untitled task)'}</span>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {task.timeEstimate && <span className="text-xs text-slate-400">{task.timeEstimate}</span>}
          {task.priority && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                task.priority === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : task.priority === 'high'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {task.priority}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              type="text"
              value={task.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={task.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Why This Matters</label>
            <textarea
              value={task.whyThisMatters || ''}
              onChange={(e) => onChange('whyThisMatters', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Deliverable</label>
            <input
              type="text"
              value={task.deliverable || ''}
              onChange={(e) => onChange('deliverable', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tools</label>
              <input
                type="text"
                value={task.tools || ''}
                onChange={(e) => onChange('tools', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Time Estimate</label>
              <input
                type="text"
                value={task.timeEstimate || ''}
                onChange={(e) => onChange('timeEstimate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
            <div className="flex gap-2">
              {['critical', 'high', 'medium'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange('priority', p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    task.priority === p
                      ? p === 'critical'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : p === 'high'
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// WeekEditorPanel — week-level editor (selectedWeek > 0)
// ----------------------------------------------------------------------------
function WeekEditorPanel({
  week,
  weekNumber,
  onWeekFieldChange,
  onTaskFieldChange,
  onAddTask,
  onRemoveTask,
}: {
  week: any;
  weekNumber: number;
  onWeekFieldChange: (field: string, value: string) => void;
  onTaskFieldChange: (taskIndex: number, field: string, value: string) => void;
  onAddTask: () => void;
  onRemoveTask: (taskIndex: number) => void;
}) {
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
          {weekNumber}
        </span>
        <div>
          <p className="text-sm text-slate-500">
            Week {weekNumber} of 12 — {week.phase || ''}
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
        <input
          type="text"
          value={week.theme || ''}
          onChange={(e) => onWeekFieldChange('theme', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Narrative</label>
        <textarea
          value={week.narrative || ''}
          onChange={(e) => onWeekFieldChange('narrative', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Tasks ({(week.tasks || []).length})
        </label>
        <div className="space-y-2">
          {(week.tasks || []).map((task: any, idx: number) => (
            <TaskEditorCard
              key={task.id || idx}
              task={task}
              index={idx}
              isExpanded={expandedTask === idx}
              onToggle={() => setExpandedTask(expandedTask === idx ? null : idx)}
              onChange={(field, value) => onTaskFieldChange(idx, field, value)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="w-full mt-3 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Week Milestone</label>
        <input
          type="text"
          value={week.weekMilestone || ''}
          onChange={(e) => onWeekFieldChange('weekMilestone', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tuesday Check-In</label>
        <input
          type="text"
          value={week.tuesdayCheckIn || ''}
          onChange={(e) => onWeekFieldChange('tuesdayCheckIn', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// ChangeLogSidebar — right sidebar
// ----------------------------------------------------------------------------
function ChangeLogSidebar({
  changes,
  onNavigate,
}: {
  changes: Array<{
    id: string;
    weekNumber: number | null;
    taskIndex: number | null;
    action: string;
    summary: string;
    timestamp: string;
  }>;
  onNavigate: (weekNumber: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-3">Changes ({changes.length})</p>
      {changes.length === 0 ? (
        <p className="text-sm text-slate-400">No changes yet</p>
      ) : (
        <div className="space-y-2">
          {[...changes].reverse().map((change) => (
            <button
              key={change.id}
              type="button"
              onClick={() => change.weekNumber != null && onNavigate(change.weekNumber)}
              className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition-colors"
            >
              <p className="text-xs font-medium text-slate-700">{change.summary}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(change.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------
export default function SprintEditorModal({
  isOpen,
  onClose,
  onSave,
  clientId,
  practiceId,
  stageId,
  sprintNumber,
  generatedContent,
  approvedContent,
  currentStatus,
  clientName,
}: SprintEditorModalProps) {
  const [editedSprint, setEditedSprint] = useState<any>(
    approvedContent ? structuredClone(approvedContent) : structuredClone(generatedContent)
  );
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [changeLog, setChangeLog] = useState<any[]>([]);
  const [editedWeeks, setEditedWeeks] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  if (!isOpen) return null;

  function addChange(
    weekNumber: number | null,
    taskIndex: number | null,
    field: string,
    action: string
  ) {
    const weekLabel = weekNumber !== null ? `Wk ${weekNumber}` : 'Overview';
    const taskLabel = taskIndex !== null ? ` / Task ${taskIndex + 1}` : '';
    const actionLabel =
      action === 'add' ? 'added' : action === 'remove' ? 'removed' : `${field} changed`;
    setChangeLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        weekNumber,
        taskIndex,
        action,
        field,
        summary: `${weekLabel}${taskLabel}: ${actionLabel}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    if (weekNumber !== null) {
      setEditedWeeks((prev) => new Set(prev).add(weekNumber));
    }
    setIsDirty(true);
  }

  function handleSprintFieldChange(field: string, value: string) {
    setEditedSprint((prev: any) => ({ ...prev, [field]: value }));
    addChange(null, null, field, 'edit');
  }

  function handleWeekFieldChange(weekNumber: number, field: string, value: string) {
    const updated = structuredClone(editedSprint);
    const week = updated.weeks?.find((w: any) => (w.weekNumber ?? w.week) === weekNumber);
    if (week) {
      (week as any)[field] = value;
      setEditedSprint(updated);
      addChange(weekNumber, null, field, 'edit');
    }
  }

  function handleTaskFieldChange(weekNumber: number, taskIndex: number, field: string, value: string) {
    const updated = structuredClone(editedSprint);
    const week = updated.weeks?.find((w: any) => (w.weekNumber ?? w.week) === weekNumber);
    if (week?.tasks?.[taskIndex]) {
      week.tasks[taskIndex][field] = value;
      setEditedSprint(updated);
      addChange(weekNumber, taskIndex, field, 'edit');
    }
  }

  function handleAddTask(weekNumber: number) {
    const updated = structuredClone(editedSprint);
    const week = updated.weeks?.find((w: any) => (w.weekNumber ?? w.week) === weekNumber);
    if (week) {
      week.tasks = week.tasks || [];
      week.tasks.push({
        id: `w${weekNumber}_t${week.tasks.length + 1}_custom`,
        title: '',
        description: '',
        whyThisMatters: '',
        milestone: '',
        tools: '',
        timeEstimate: '1-2 hours',
        deliverable: '',
        celebrationMoment: '',
        category: 'general',
        priority: 'medium',
      });
      setEditedSprint(updated);
      addChange(weekNumber, week.tasks.length - 1, 'task', 'add');
    }
  }

  function handleRemoveTask(weekNumber: number, taskIndex: number) {
    const updated = structuredClone(editedSprint);
    const week = updated.weeks?.find((w: any) => (w.weekNumber ?? w.week) === weekNumber);
    if (week?.tasks) {
      week.tasks.splice(taskIndex, 1);
      setEditedSprint(updated);
      addChange(weekNumber, taskIndex, 'task', 'remove');
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await supabase
        .from('roadmap_stages')
        .update({
          approved_content: editedSprint,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stageId);
      setIsDirty(false);
      onSave();
    } catch (err) {
      console.error('Save draft failed:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleApproveAndPublish() {
    setShowPublishConfirm(true);
  }

  async function confirmPublish() {
    setPublishing(true);
    try {
      await supabase
        .from('roadmap_stages')
        .update({
          approved_content: editedSprint,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', stageId);

      await supabase
        .from('client_tasks')
        .delete()
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber);

      const tasksToInsert: any[] = [];
      for (const week of editedSprint.weeks || []) {
        const weekNum = week.weekNumber ?? week.week ?? 0;
        for (let i = 0; i < (week.tasks || []).length; i++) {
          const task = week.tasks[i];
          tasksToInsert.push({
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            week_number: weekNum,
            title: task.title,
            description: task.description,
            category: task.category || 'general',
            priority: task.priority || 'medium',
            status: 'pending',
            sort_order: i,
            estimated_hours: task.timeEstimate ? parseFloat(String(task.timeEstimate)) || null : null,
            metadata: {
              whyThisMatters: task.whyThisMatters,
              milestone: task.milestone,
              tools: task.tools,
              deliverable: task.deliverable,
              phase: week.phase,
              isCustom: task.id?.includes?.('custom') || false,
            },
          });
        }
      }
      if (tasksToInsert.length > 0) {
        await supabase.from('client_tasks').insert(tasksToInsert);
      }

      if (changeLog.length > 0) {
        try {
          await supabase.from('generation_feedback').insert({
            practice_id: practiceId,
            client_id: clientId,
            feedback_source: 'practice_edit',
            stage_type: 'sprint_plan_part2',
            stage_id: stageId,
            feedback_text: `Sprint published with ${changeLog.length} changes`,
            original_content: generatedContent,
            edited_content: editedSprint,
          });
        } catch (fbErr) {
          console.log('Feedback logging failed (non-fatal):', fbErr);
        }
      }

      setShowPublishConfirm(false);
      setIsDirty(false);
      onSave();
      onClose();
    } catch (err) {
      console.error('Publish failed:', err);
      alert('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  function handleClose() {
    if (isDirty && !confirm('You have unsaved changes. Discard?')) return;
    onClose();
  }

  const currentWeek =
    selectedWeek > 0
      ? editedSprint.weeks?.find((w: any) => (w.weekNumber ?? w.week) === selectedWeek)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Sprint Editor — {clientName}'s Sprint {sprintNumber}
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              currentStatus === 'published'
                ? 'bg-emerald-100 text-emerald-700'
                : currentStatus === 'approved'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {currentStatus}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            type="button"
            onClick={handleApproveAndPublish}
            disabled={publishing}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {publishing ? 'Publishing...' : 'Approve & Publish'}
          </button>
          <button type="button" onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-52 border-r border-slate-200 overflow-y-auto bg-slate-50 p-4 flex-shrink-0">
          <WeekNav
            weeks={editedSprint.weeks || []}
            selectedWeek={selectedWeek}
            onSelect={setSelectedWeek}
            editedWeeks={editedWeeks}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6 min-w-0">
          {selectedWeek === 0 ? (
            <SprintOverviewPanel sprint={editedSprint} onChange={handleSprintFieldChange} />
          ) : currentWeek ? (
            <WeekEditorPanel
              week={currentWeek}
              weekNumber={selectedWeek}
              onWeekFieldChange={(field, value) => handleWeekFieldChange(selectedWeek, field, value)}
              onTaskFieldChange={(idx, field, value) =>
                handleTaskFieldChange(selectedWeek, idx, field, value)
              }
              onAddTask={() => handleAddTask(selectedWeek)}
              onRemoveTask={(idx) => handleRemoveTask(selectedWeek, idx)}
            />
          ) : null}
        </div>
        <div className="w-72 border-l border-slate-200 overflow-y-auto bg-slate-50 p-4 flex-shrink-0">
          <ChangeLogSidebar changes={changeLog} onNavigate={setSelectedWeek} />
        </div>
      </div>

      {showPublishConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Publish Sprint to {clientName}?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              This will make the sprint visible in {clientName.split(' ')[0]}'s client portal.
            </p>
            <p className="text-sm text-slate-600 mt-3">
              {changeLog.length} change{changeLog.length !== 1 ? 's' : ''} made •{' '}
              {editedSprint.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0)} tasks
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPublish}
                disabled={publishing}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {publishing ? 'Publishing...' : 'Publish Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
