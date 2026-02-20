// ============================================================================
// Sprint Editor — main modal: state, week nav, editor area, change log
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { SprintData, ChangeEntry } from './types';
import type { SprintEditorModalProps } from './types';
import { buildChangeSummary, categoriseEdits, countEditsByWeek } from './utils';
import { syncTasksToClientTasks } from './syncTasks';
import { SprintEditorHeader } from './SprintEditorHeader';
import { SprintOverview } from './SprintOverview';
import { WeekEditor, defaultNewTask } from './WeekEditor';
import { EditorChangeLog } from './EditorChangeLog';
import { PublishConfirmation } from './PublishConfirmation';

export function SprintEditorModal({
  clientId,
  practiceId,
  sprintNumber,
  stageId,
  generatedContent,
  approvedContent,
  currentStatus,
  clientName,
  tierName: _tierName,
  serviceLineId,
  onSave,
  onClose,
}: SprintEditorModalProps) {
  const [editedSprint, setEditedSprint] = useState<SprintData>(() =>
    approvedContent
      ? structuredClone(approvedContent)
      : structuredClone(generatedContent)
  );
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);

  const weeks = editedSprint.weeks || [];
  const weeksWithEdits = countEditsByWeek(weeks, changeLog);

  const handleFieldChange = useCallback(
    (weekNumber: number | null, taskIndex: number | null, field: string, newValue: string) => {
      let valueToStore: unknown = newValue;
      if (weekNumber === null && field === 'sprintGoals') {
        try {
          const parsed = JSON.parse(newValue);
          valueToStore = parsed;
        } catch {
          valueToStore = newValue;
        }
      }

      const updated = structuredClone(editedSprint);
      let oldValue = '';

      if (weekNumber === null) {
        const u = updated as unknown as Record<string, unknown>;
        const prev = u[field];
        oldValue = typeof prev === 'string' ? prev : prev != null ? JSON.stringify(prev) : '';
        u[field] = valueToStore;
      } else {
        const week = updated.weeks.find((w) => w.weekNumber === weekNumber);
        if (!week) return;

        if (taskIndex === null) {
          const w = week as unknown as Record<string, unknown>;
          const prev = w[field];
          oldValue = typeof prev === 'string' ? prev : prev != null ? String(prev) : '';
          w[field] = newValue;
        } else {
          const task = week.tasks[taskIndex];
          if (!task) return;
          const t = task as unknown as Record<string, unknown>;
          const prev = t[field];
          oldValue = typeof prev === 'string' ? prev : prev != null ? String(prev) : '';
          t[field] = newValue;
        }
      }

      if (oldValue !== newValue) {
        setChangeLog((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            weekNumber,
            taskIndex,
            field,
            action: 'edit',
            oldValue,
            newValue,
            summary: buildChangeSummary(weekNumber, taskIndex, field, 'edit', oldValue, newValue),
          },
        ]);
      }

      setEditedSprint(updated);
      setIsDirty(true);
    },
    [editedSprint]
  );

  const handleAddTask = useCallback(
    (weekNumber: number) => {
      const updated = structuredClone(editedSprint);
      const week = updated.weeks.find((w) => w.weekNumber === weekNumber);
      if (!week) return;
      const newTask = defaultNewTask(weekNumber, (week.tasks || []).length);
      week.tasks = week.tasks || [];
      week.tasks.push(newTask);

      setEditedSprint(updated);
      setIsDirty(true);
      setChangeLog((prev) => [
        ...prev,
        {
          id: `${Date.now()}-add`,
          timestamp: new Date().toISOString(),
          weekNumber,
          taskIndex: week.tasks.length - 1,
          field: 'task',
          action: 'add',
          summary: `Week ${weekNumber}: added new task`,
        },
      ]);
    },
    [editedSprint]
  );

  const handleRemoveTask = useCallback(
    (weekNumber: number, taskIndex: number) => {
      const updated = structuredClone(editedSprint);
      const week = updated.weeks.find((w) => w.weekNumber === weekNumber);
      if (!week || !week.tasks[taskIndex]) return;
      const removed = week.tasks[taskIndex];
      week.tasks.splice(taskIndex, 1);
      week.tasks.forEach((t, i) => {
        if (t.id?.includes('custom')) {
          t.id = `w${weekNumber}_t${i + 1}_custom`;
        }
      });

      setEditedSprint(updated);
      setIsDirty(true);
      setChangeLog((prev) => [
        ...prev,
        {
          id: `${Date.now()}-remove`,
          timestamp: new Date().toISOString(),
          weekNumber,
          taskIndex,
          field: 'task',
          action: 'remove',
          oldValue: removed.title,
          summary: `Week ${weekNumber}: removed "${removed.title}"`,
        },
      ]);
    },
    [editedSprint]
  );

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await supabase
        .from('roadmap_stages')
        .update({
          approved_content: editedSprint,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stageId);

      if (changeLog.length > 0) {
        await supabase.from('generation_feedback').insert({
          practice_id: practiceId,
          client_id: clientId,
          feedback_source: 'practice_edit',
          stage_type: 'sprint_plan_part2',
          stage_id: stageId,
          original_content: generatedContent,
          edited_content: editedSprint,
          feedback_text: `${changeLog.length} changes made in Sprint Editor`,
          edit_type: categoriseEdits(changeLog),
        });
      }

      setIsDirty(false);
      onSave();
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setSaving(false);
    }
  }, [
    stageId,
    editedSprint,
    changeLog,
    generatedContent,
    practiceId,
    clientId,
    onSave,
  ]);

  const confirmPublish = useCallback(async () => {
    const errors = validateTasks(editedSprint);
    if (Object.keys(errors).length > 0) {
      setShowPublishConfirmation(false);
      return;
    }

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

      await syncTasksToClientTasks(supabase, clientId, practiceId, editedSprint, sprintNumber);

      if (changeLog.length > 0) {
        await supabase.from('generation_feedback').insert({
          practice_id: practiceId,
          client_id: clientId,
          feedback_source: 'practice_edit',
          stage_type: 'sprint_plan_part2',
          stage_id: stageId,
          original_content: generatedContent,
          edited_content: editedSprint,
          feedback_text: `Sprint published with ${changeLog.length} changes`,
          edit_type: categoriseEdits(changeLog),
        });
      }

      if (sprintNumber > 1) {
        let slId = serviceLineId;
        if (!slId) {
          const { data: sl } = await supabase
            .from('service_lines')
            .select('id')
            .eq('code', '365_method')
            .maybeSingle();
          slId = sl?.id;
        }
        if (slId) {
          await supabase
            .from('client_service_lines')
            .update({ renewal_status: 'published' })
            .eq('client_id', clientId)
            .eq('service_line_id', slId);
        }
      }

      setShowPublishConfirmation(false);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error publishing sprint:', err);
    } finally {
      setPublishing(false);
    }
  }, [
    editedSprint,
    stageId,
    clientId,
    practiceId,
    sprintNumber,
    changeLog,
    generatedContent,
    serviceLineId,
    onSave,
    onClose,
  ]);

  const handleApprovePublish = useCallback(() => {
    const errors = validateTasks(editedSprint);
    const weekKeys = Object.keys(errors).map(Number);
    if (weekKeys.length > 0) {
      setSelectedWeek(Math.min(...weekKeys));
      return;
    }
    setShowPublishConfirmation(true);
  }, [editedSprint]);

  const handleResetToGenerated = useCallback(async () => {
    if (!confirm('Reset all edits and revert to the generated version? This will clear saved edits.')) return;
    try {
      await supabase
        .from('roadmap_stages')
        .update({
          approved_content: null,
          status: 'generated',
        })
        .eq('id', stageId);

      setEditedSprint(structuredClone(generatedContent));
      setChangeLog([]);
      setIsDirty(false);
      onSave();
    } catch (err) {
      console.error('Error resetting to generated:', err);
    }
  }, [stageId, generatedContent, onSave]);

  const handleRevertSessionChanges = useCallback(() => {
    setEditedSprint(
      approvedContent ? structuredClone(approvedContent) : structuredClone(generatedContent)
    );
    setChangeLog([]);
    setIsDirty(false);
  }, [approvedContent, generatedContent]);

  const handleClose = useCallback(() => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    onClose();
  }, [isDirty, onClose]);

  const changeSummary = {
    edited: changeLog.filter((e) => e.action === 'edit').length,
    added: changeLog.filter((e) => e.action === 'add').length,
    removed: changeLog.filter((e) => e.action === 'remove').length,
  };
  const totalTasks = weeks.reduce((sum, w) => sum + (w.tasks?.length || 0), 0);
  const validationErrors = validateTasks(editedSprint);
  const selectedWeekData = selectedWeek === 0 ? null : weeks.find((w) => w.weekNumber === selectedWeek);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <SprintEditorHeader
        clientName={clientName}
        sprintNumber={sprintNumber}
        currentStatus={currentStatus}
        isDirty={isDirty}
        saving={saving}
        publishing={publishing}
        onSaveDraft={handleSaveDraft}
        onApprovePublish={handleApprovePublish}
        onClose={handleClose}
        onResetToGenerated={handleResetToGenerated}
      />

      <div className="flex-1 flex min-h-0">
        <aside className="w-48 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto">
          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setSelectedWeek(0)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                selectedWeek === 0 ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            {weeks.map((w) => (
              <button
                key={w.weekNumber}
                type="button"
                onClick={() => setSelectedWeek(w.weekNumber)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  selectedWeek === w.weekNumber
                    ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300 font-medium'
                    : weeksWithEdits.has(w.weekNumber)
                      ? 'text-indigo-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={weeksWithEdits.has(w.weekNumber) ? 'text-indigo-500' : 'text-slate-400'}>
                  {selectedWeek === w.weekNumber ? '◉' : weeksWithEdits.has(w.weekNumber) ? '●' : '○'}
                </span>
                Week {w.weekNumber}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          {selectedWeek === 0 ? (
            <SprintOverview
              sprint={editedSprint}
              onChange={(field, value) => handleFieldChange(null, null, field, value)}
              changeLogCount={changeLog.length}
            />
          ) : selectedWeekData ? (
            <WeekEditor
              week={selectedWeekData}
              weekNumber={selectedWeekData.weekNumber}
              onChange={(taskIndex, field, value) =>
                handleFieldChange(selectedWeekData.weekNumber, taskIndex, field, value)
              }
              onAddTask={() => handleAddTask(selectedWeekData.weekNumber)}
              onRemoveTask={(idx) => handleRemoveTask(selectedWeekData.weekNumber, idx)}
              validationErrors={validationErrors[selectedWeekData.weekNumber]}
            />
          ) : null}
        </main>

        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <EditorChangeLog
            changeLog={changeLog}
            onNavigate={(wn) => {
              if (wn != null) setSelectedWeek(wn);
            }}
            onResetAll={changeLog.length > 0 ? handleRevertSessionChanges : undefined}
          />
        </aside>
      </div>

      {showPublishConfirmation && (
        <PublishConfirmation
          clientName={clientName}
          changeSummary={changeSummary}
          totalTasks={totalTasks}
          weekCount={weeks.length}
          onConfirm={confirmPublish}
          onCancel={() => setShowPublishConfirmation(false)}
          publishing={publishing}
        />
      )}
    </div>
  );
}

function validateTasks(sprint: SprintData): Record<number, Record<number, Record<string, string>>> {
  const out: Record<number, Record<number, Record<string, string>>> = {};
  for (const week of sprint.weeks || []) {
    const wn = week.weekNumber ?? (week as { week?: number }).week ?? 0;
    for (let i = 0; i < (week.tasks || []).length; i++) {
      const t = week.tasks[i];
      const errs: Record<string, string> = {};
      if (!(t.title ?? '').trim()) errs.title = 'Title is required';
      if (!(t.description ?? '').trim()) errs.description = 'Description is required';
      if (Object.keys(errs).length > 0) {
        if (!out[wn]) out[wn] = {};
        out[wn][i] = errs;
      }
    }
  }
  return out;
}
