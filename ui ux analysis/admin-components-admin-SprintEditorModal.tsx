// ============================================================================
// SPRINT EDITOR MODAL — v2 (Visual Refresh)
// ============================================================================
// Drop-in replacement. Same props interface as v1.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, Trash2, ChevronRight, Save, Check,
  Eye, Zap, Target, Clock, BarChart3, Sparkles,
  ArrowRight, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

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

interface ChangeEntry {
  id: string;
  weekNumber: number | null;
  taskIndex: number | null;
  field: string;
  action: string;
  summary: string;
  timestamp: string;
}

// ============================================================================
// PHASE COLOURS
// ============================================================================

const PHASE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'immediate relief': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  'immediaterelief': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  'foundation': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  'implementation': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' },
  'momentum': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  'embed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  'measure': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
};

function phaseStyle(phase: string) {
  const k = (phase || '').toLowerCase().replace(/\s+/g, '');
  return PHASE_STYLES[k] || PHASE_STYLES[(phase || '').toLowerCase()] ||
    { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SprintEditorModal({
  isOpen, onClose, onSave,
  clientId, practiceId, stageId, sprintNumber,
  generatedContent, approvedContent, currentStatus,
  clientName, tierName
}: SprintEditorModalProps) {

  const [editedSprint, setEditedSprint] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);
  const [editedWeeks, setEditedWeeks] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const src = approvedContent || generatedContent;
      if (src) setEditedSprint(JSON.parse(JSON.stringify(src)));
      setChangeLog([]); setEditedWeeks(new Set()); setIsDirty(false); setSelectedWeek(0);
    }
  }, [isOpen, generatedContent, approvedContent]);

  const addChange = useCallback((wn: number | null, ti: number | null, field: string, action: string) => {
    const wl = wn !== null ? `Wk ${wn}` : 'Overview';
    const tl = ti !== null ? ` · Task ${ti + 1}` : '';
    const al = action === 'add' ? 'added' : action === 'remove' ? 'removed' : field;
    setChangeLog(p => [...p, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      weekNumber: wn, taskIndex: ti, field, action, summary: `${wl}${tl} — ${al}`,
      timestamp: new Date().toISOString()
    }]);
    if (wn !== null) setEditedWeeks(p => new Set(p).add(wn));
    setIsDirty(true);
  }, []);

  const handleSprintField = useCallback((f: string, v: string) => {
    setEditedSprint((p: any) => p ? { ...p, [f]: v } : p);
    addChange(null, null, f, 'edit');
  }, [addChange]);

  const handleWeekField = useCallback((wn: number, f: string, v: string) => {
    setEditedSprint((p: any) => {
      if (!p?.weeks) return p;
      const u = JSON.parse(JSON.stringify(p));
      const w = u.weeks.find((x: any) => x.weekNumber === wn);
      if (w) w[f] = v;
      return u;
    });
    addChange(wn, null, f, 'edit');
  }, [addChange]);

  const handleTaskField = useCallback((wn: number, ti: number, f: string, v: string) => {
    setEditedSprint((p: any) => {
      if (!p?.weeks) return p;
      const u = JSON.parse(JSON.stringify(p));
      const w = u.weeks.find((x: any) => x.weekNumber === wn);
      if (w?.tasks?.[ti]) w.tasks[ti][f] = v;
      return u;
    });
    addChange(wn, ti, f, 'edit');
  }, [addChange]);

  const handleAddTask = useCallback((wn: number) => {
    setEditedSprint((p: any) => {
      if (!p?.weeks) return p;
      const u = JSON.parse(JSON.stringify(p));
      const w = u.weeks.find((x: any) => x.weekNumber === wn);
      if (w) {
        w.tasks = w.tasks || [];
        w.tasks.push({
          id: `w${wn}_t${w.tasks.length + 1}_custom`,
          title: '', description: '', whyThisMatters: '', milestone: '', tools: '',
          timeEstimate: '1-2 hours', deliverable: '', celebrationMoment: '', category: 'general', priority: 'medium'
        });
      }
      return u;
    });
    addChange(wn, null, 'task', 'add');
  }, [addChange]);

  const handleRemoveTask = useCallback((wn: number, ti: number) => {
    setEditedSprint((p: any) => {
      if (!p?.weeks) return p;
      const u = JSON.parse(JSON.stringify(p));
      const w = u.weeks.find((x: any) => x.weekNumber === wn);
      if (w?.tasks) w.tasks.splice(ti, 1);
      return u;
    });
    addChange(wn, ti, 'task', 'remove');
  }, [addChange]);

  const handleSaveDraft = useCallback(async () => {
    if (!stageId || !editedSprint) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('roadmap_stages').update({
        approved_content: editedSprint, updated_at: new Date().toISOString()
      }).eq('id', stageId);
      if (error) throw error;
      setIsDirty(false); onSave();
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }, [stageId, editedSprint, onSave]);

  const confirmPublish = useCallback(async () => {
    if (!stageId || !editedSprint) return;
    setPublishing(true);
    try {
      await supabase.from('roadmap_stages').update({
        approved_content: editedSprint, status: 'published', updated_at: new Date().toISOString()
      }).eq('id', stageId);

      await supabase.from('client_tasks').delete()
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber);

      const rows: any[] = [];
      for (const wk of editedSprint.weeks || []) {
        for (let i = 0; i < (wk.tasks || []).length; i++) {
          const t = wk.tasks[i];
          if (!t.title) continue;
          rows.push({
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            week_number: wk.weekNumber,
            title: t.title,
            description: t.description || '',
            category: t.category || 'general',
            priority: t.priority || 'medium',
            status: 'pending',
            sort_order: i,
            estimated_hours: t.timeEstimate ? parseFloat(t.timeEstimate) || null : null,
            metadata: {
              whyThisMatters: t.whyThisMatters || '',
              milestone: t.milestone || '',
              tools: t.tools || '',
              deliverable: t.deliverable || '',
              phase: wk.phase || '',
              isCustom: t.id?.includes('custom') || false
            }
          });
        }
      }
      if (rows.length > 0) await supabase.from('client_tasks').insert(rows);

      if (changeLog.length > 0) {
        try {
          await supabase.from('generation_feedback').insert({
            practice_id: practiceId,
            client_id: clientId,
            stage_type: 'sprint_plan_part2',
            feedback_source: 'practice_edit',
            feedback_text: `Sprint published with ${changeLog.length} changes`,
            original_content: generatedContent,
            edited_content: editedSprint
          });
        } catch { /* non-fatal */ }
      }

      // Send notification email (non-blocking — don't fail publish if email fails)
      try {
        const theme = editedSprint.sprintTheme || editedSprint.weeks?.[0]?.theme || '';
        await supabase.functions.invoke('notify-sprint-lifecycle', {
          body: {
            clientId,
            type: 'sprint_published',
            sprintNumber,
            sprintTheme: theme,
          },
        });
      } catch (emailErr) {
        console.warn('Sprint notification email failed:', emailErr);
      }

      setShowPublishConfirm(false);
      setIsDirty(false);
      onSave();
      onClose();
    } catch { alert('Failed to publish.'); }
    finally { setPublishing(false); }
  }, [stageId, editedSprint, clientId, practiceId, sprintNumber, changeLog, generatedContent, onSave, onClose]);

  const handleClose = useCallback(() => {
    if (isDirty && !confirm('Unsaved changes will be lost. Continue?')) return;
    onClose();
  }, [isDirty, onClose]);

  if (!isOpen || !editedSprint) return null;

  const weeks = editedSprint.weeks || [];
  const curWeek = selectedWeek > 0 ? weeks.find((w: any) => w.weekNumber === selectedWeek) : null;
  const totalTasks = weeks.reduce((s: number, w: any) => s + (w.tasks?.length || 0), 0);

  return (
    <>
      <style>{`
        .se-input {
          width: 100%; padding: 10px 14px; border: 1.5px solid #e2e5ea; border-radius: 10px;
          font-size: 14px; color: #1e293b; background: #fff; transition: all 0.15s ease;
          outline: none; line-height: 1.6; font-family: inherit;
        }
        .se-input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .se-input::placeholder { color: #94a3b8; }
        textarea.se-input { resize: vertical; min-height: 64px; }
        .se-input-inline {
          width: 100%; border: 0; padding: 0; background: transparent; outline: none;
          font-family: inherit; color: #1e293b; line-height: 1.5;
        }
        .se-input-inline:focus { outline: none; }
        .se-input-inline::placeholder { color: #94a3b8; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#f4f5f7' }}>

        {/* ━━ TOP BAR ━━ */}
        <header className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{clientName}'s Sprint {sprintNumber}</span>
            </div>
            <span className={`ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
              currentStatus === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
              currentStatus === 'approved' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>{currentStatus}</span>
            {tierName && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {tierName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button onClick={handleSaveDraft} disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button onClick={() => setShowPublishConfirm(true)} disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all">
              <Check className="w-3.5 h-3.5" />
              {publishing ? 'Publishing…' : 'Approve & Publish'}
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ━━ BODY ━━ */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT: Week Nav ── */}
          <nav className="w-[208px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto py-3 px-2.5">
            <NavItem icon={<Eye className="w-3.5 h-3.5" />} label="Overview"
              active={selectedWeek === 0} edited={false} onClick={() => setSelectedWeek(0)} />
            <div className="h-px bg-gray-100 my-2 mx-2" />
            {weeks.map((w: any) => {
              const ps = phaseStyle(w.phase);
              return (
                <NavItem key={w.weekNumber}
                  label={`${w.weekNumber}. ${(w.theme || '').substring(0, 17)}${(w.theme || '').length > 17 ? '…' : ''}`}
                  active={selectedWeek === w.weekNumber}
                  edited={editedWeeks.has(w.weekNumber)}
                  phaseDot={ps.dot}
                  onClick={() => setSelectedWeek(w.weekNumber)} />
              );
            })}
          </nav>

          {/* ── CENTRE: Editor ── */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[740px] mx-auto py-8 px-8">
              {selectedWeek === 0 ? (
                <OverviewPanel sprint={editedSprint} onChange={handleSprintField}
                  totalWeeks={weeks.length} totalTasks={totalTasks} />
              ) : curWeek ? (
                <WeekPanel week={curWeek} weekNumber={selectedWeek}
                  onWeekField={(f, v) => handleWeekField(selectedWeek, f, v)}
                  onTaskField={(ti, f, v) => handleTaskField(selectedWeek, ti, f, v)}
                  onAdd={() => handleAddTask(selectedWeek)}
                  onRemove={ti => handleRemoveTask(selectedWeek, ti)} />
              ) : (
                <p className="text-gray-400 text-center py-16 text-sm">Week {selectedWeek} not found</p>
              )}
            </div>
          </main>

          {/* ── RIGHT: Change Log ── */}
          <aside className="w-[224px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
            <ChangeLog changes={changeLog} onNav={setSelectedWeek} />
          </aside>
        </div>

        {/* ━━ PUBLISH DIALOG ━━ */}
        {showPublishConfirm && (
          <div className="fixed inset-0 z-[110] bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-[380px] mx-4" style={{ boxShadow: '0 24px 48px -12px rgba(0,0,0,.2)' }}>
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Publish to {clientName.split(' ')[0]}?</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">The sprint will appear in their client portal immediately.</p>
              <div className="mt-4 rounded-xl p-3 space-y-1.5 text-[13px]" style={{ background: '#f8f9fb' }}>
                <Row label="Changes" value={changeLog.length} />
                <Row label="Tasks" value={totalTasks} />
                <Row label="Weeks" value={weeks.length} />
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowPublishConfirm(false)}
                  className="flex-1 py-2.5 text-[13px] font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmPublish} disabled={publishing}
                  className="flex-1 py-2.5 text-[13px] font-medium text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {publishing ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return <p className="flex justify-between"><span className="text-gray-400">{label}</span><span className="font-semibold text-gray-700">{value}</span></p>;
}

// ============================================================================
// NAV ITEM
// ============================================================================

function NavItem({ icon, label, active, edited, phaseDot, onClick }: {
  icon?: React.ReactNode; label: string; active: boolean; edited: boolean; phaseDot?: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2 ${
        active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}>
      {icon ?? (
        <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors ${edited ? 'bg-indigo-500' : phaseDot || 'bg-gray-300'} ${!edited ? 'opacity-30' : ''}`} />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ============================================================================
// OVERVIEW PANEL
// ============================================================================

function OverviewPanel({ sprint, onChange, totalWeeks, totalTasks }: {
  sprint: any; onChange: (f: string, v: string) => void; totalWeeks: number; totalTasks: number;
}) {
  const avg = totalWeeks > 0 ? (totalTasks / totalWeeks).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Sprint Overview</h2>
        <p className="text-[13px] text-gray-400 mt-0.5">Review the overall shape before diving into weeks</p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatCard icon={Target} colour="#6366f1" label="Weeks" value={totalWeeks} />
          <StatCard icon={Zap} colour="#f59e0b" label="Tasks" value={totalTasks} />
          <StatCard icon={BarChart3} colour="#10b981" label="Avg / week" value={avg} />
        </div>
      </div>

      <Section label="Sprint Theme" icon={<Sparkles className="w-3.5 h-3.5" />}>
        <input type="text" value={sprint.sprintTheme || sprint.theme || ''}
          onChange={e => onChange('sprintTheme', e.target.value)}
          placeholder="The headline for this sprint…"
          className="se-input" />
      </Section>

      <Section label="Sprint Promise" icon={<Target className="w-3.5 h-3.5" />}>
        <textarea value={sprint.sprintPromise || sprint.promise || ''}
          onChange={e => onChange('sprintPromise', e.target.value)}
          rows={3} placeholder="By end of this sprint…"
          className="se-input" />
      </Section>

      {(sprint.sprintGoals || sprint.goals) && (
        <Section label="Sprint Goals" icon={<Zap className="w-3.5 h-3.5" />}>
          <textarea
            value={typeof (sprint.sprintGoals || sprint.goals) === 'string' ? (sprint.sprintGoals || sprint.goals) : JSON.stringify(sprint.sprintGoals || sprint.goals, null, 2)}
            onChange={e => onChange('sprintGoals', e.target.value)}
            rows={4} className="se-input font-mono text-[13px]" />
        </Section>
      )}

      {sprint.phases && (
        <div>
          <SectionLabel label="Phases" />
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {Object.entries(sprint.phases).map(([key, phase]: [string, any]) => {
              const ps = phaseStyle(key);
              return (
                <div key={key} className={`rounded-xl p-4 border ${ps.border} ${ps.bg}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${ps.dot}`} />
                    <span className={`text-[13px] font-bold capitalize ${ps.text}`}>{key}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-snug">
                    Weeks {Array.isArray(phase.weeks) ? phase.weeks.join(', ') : phase.weeks}
                  </p>
                  {phase.emotionalGoal && (
                    <p className="text-[11px] text-gray-400 mt-1.5 italic leading-snug">{phase.emotionalGoal}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, colour, label, value }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; colour: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-4 bg-white border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colour + '12' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: colour }} />
        </div>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-gray-900 leading-none">{value}</p>
    </div>
  );
}

// ============================================================================
// WEEK PANEL
// ============================================================================

function WeekPanel({ week, weekNumber, onWeekField, onTaskField, onAdd, onRemove }: {
  week: any; weekNumber: number;
  onWeekField: (f: string, v: string) => void;
  onTaskField: (ti: number, f: string, v: string) => void;
  onAdd: () => void;
  onRemove: (ti: number) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const ps = phaseStyle(week.phase);

  useEffect(() => { setExpanded(null); }, [weekNumber]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white flex-shrink-0 bg-indigo-600 shadow-sm">
          {weekNumber}
        </div>
        <div className="flex-1 pt-0.5">
          <input type="text" value={week.theme || ''}
            onChange={e => onWeekField('theme', e.target.value)}
            placeholder="Week theme…"
            className="se-input-inline text-[20px] font-bold" />
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${ps.bg} ${ps.text} border ${ps.border}`}>
              {week.phase || 'Phase'}
            </span>
            <span className="text-[12px] text-gray-400">{(week.tasks || []).length} task{(week.tasks || []).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Narrative</span>
        </div>
        <textarea value={week.narrative || ''}
          onChange={e => onWeekField('narrative', e.target.value)}
          rows={3} placeholder="The story of this week…"
          className="se-input-inline w-full px-4 py-3 text-[14px] leading-relaxed resize-y"
          style={{ minHeight: '80px' }} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel label="Tasks" />
          <span className="text-[12px] text-gray-400 font-medium">{(week.tasks || []).length}</span>
        </div>
        <div className="space-y-2">
          {(week.tasks || []).map((t: any, i: number) => (
            <TaskCard key={t.id || `t${i}`} task={t} index={i}
              open={expanded === i} toggle={() => setExpanded(expanded === i ? null : i)}
              onChange={(f, v) => onTaskField(i, f, v)} onRemove={() => onRemove(i)} />
          ))}
        </div>
        <button type="button" onClick={onAdd}
          className="w-full mt-3 p-3.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 text-[13px] font-medium flex items-center justify-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Add task
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(week.weekMilestone !== undefined || week.milestone !== undefined) && (
          <MiniCard icon={<Target className="w-3 h-3 text-emerald-500" />} label="Milestone">
            <input type="text" value={week.weekMilestone || week.milestone || ''}
              onChange={e => onWeekField('weekMilestone', e.target.value)}
              placeholder="What success looks like…"
              className="se-input-inline text-[13px]" />
          </MiniCard>
        )}
        {week.tuesdayCheckIn !== undefined && (
          <MiniCard icon={<Clock className="w-3 h-3 text-amber-500" />} label="Tuesday Check-In">
            <input type="text" value={week.tuesdayCheckIn || ''}
              onChange={e => onWeekField('tuesdayCheckIn', e.target.value)}
              placeholder="Reflection question…"
              className="se-input-inline text-[13px]" />
          </MiniCard>
        )}
      </div>
    </div>
  );
}

function MiniCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// TASK CARD
// ============================================================================

function TaskCard({ task, index, open, toggle, onChange, onRemove }: {
  task: any; index: number; open: boolean; toggle: () => void;
  onChange: (f: string, v: string) => void; onRemove: () => void;
}) {
  const prioStyle: Record<string, string> = {
    critical: 'bg-red-50 text-red-600 border-red-200',
    high: 'bg-amber-50 text-amber-600 border-amber-200',
    medium: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${open ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-100' : 'border-gray-100 hover:border-gray-200'}`} style={{ background: open ? '#fafaff' : '#fff' }}>
      <div role="button" tabIndex={0} onClick={toggle} onKeyDown={e => e.key === 'Enter' && toggle()}
        className="flex items-center px-4 py-3 cursor-pointer group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-colors ${open ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
            {index + 1}
          </div>
          <span className={`text-[14px] truncate ${task.title ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
            {task.title || 'Untitled task'}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {task.timeEstimate && (
            <span className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />{task.timeEstimate}
            </span>
          )}
          {task.priority && (
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${prioStyle[task.priority] || prioStyle.medium}`}>
              {task.priority}
            </span>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 space-y-3">
          <Field label="Title">
            <input type="text" value={task.title || ''} onChange={e => onChange('title', e.target.value)}
              className="se-input" placeholder="What the client needs to do" />
          </Field>
          <Field label="Description">
            <textarea value={task.description || ''} onChange={e => onChange('description', e.target.value)}
              rows={3} className="se-input" placeholder="Clear, actionable instructions" />
          </Field>
          <Field label="Why This Matters">
            <textarea value={task.whyThisMatters || ''} onChange={e => onChange('whyThisMatters', e.target.value)}
              rows={2} className="se-input" placeholder="Connect to their North Star" />
          </Field>
          <Field label="Deliverable">
            <input type="text" value={task.deliverable || task.milestone || ''} onChange={e => onChange('deliverable', e.target.value)}
              className="se-input" placeholder="Tangible output when done" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tools">
              <input type="text" value={task.tools || ''} onChange={e => onChange('tools', e.target.value)}
                className="se-input" placeholder="e.g. Google Sheets" />
            </Field>
            <Field label="Time">
              <input type="text" value={task.timeEstimate || ''} onChange={e => onChange('timeEstimate', e.target.value)}
                className="se-input" placeholder="e.g. 2-3 hours" />
            </Field>
          </div>
          <Field label="Priority">
            <div className="flex gap-1.5">
              {(['critical', 'high', 'medium'] as const).map(p => (
                <button key={p} type="button" onClick={() => onChange('priority', p)}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                    task.priority === p
                      ? p === 'critical' ? 'border-red-300 bg-red-50 text-red-600 shadow-sm'
                        : p === 'high' ? 'border-amber-300 bg-amber-50 text-amber-600 shadow-sm'
                          : 'border-gray-300 bg-gray-50 text-gray-600 shadow-sm'
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}>{p}</button>
              ))}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="text-[12px] font-semibold text-gray-500 mb-1.5 block">{label}</span>{children}</div>;
}

// ============================================================================
// SECTION HELPERS
// ============================================================================

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <SectionLabel label={label} />
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <span className="text-[13px] font-bold text-gray-900">{label}</span>;
}

// ============================================================================
// CHANGE LOG
// ============================================================================

function ChangeLog({ changes, onNav }: { changes: ChangeEntry[]; onNav: (w: number) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Changes</span>
        {changes.length > 0 && (
          <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-indigo-600 px-1.5">
            {changes.length}
          </span>
        )}
      </div>

      {changes.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2.5">
            <AlertCircle className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-[12px] text-gray-400 leading-relaxed">Edit any field and<br />changes appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {[...changes].reverse().map(c => (
            <button key={c.id} type="button" onClick={() => onNav(c.weekNumber ?? 0)}
              className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 bg-white transition-all group">
              <p className="text-[12px] font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                {c.summary}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
