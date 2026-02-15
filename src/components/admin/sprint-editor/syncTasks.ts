// ============================================================================
// Sprint Editor — sync approved sprint to client_tasks
// ============================================================================

import type { SprintData } from './types';

export async function syncTasksToClientTasks(
  supabase: any,
  clientId: string,
  practiceId: string,
  sprintData: SprintData,
  sprintNumber: number
): Promise<void> {
  const weeks = sprintData.weeks || [];
  const existingResult = await supabase
    .from('client_tasks')
    .select('id, title, week_number, status')
    .eq('client_id', clientId)
    .eq('sprint_number', sprintNumber);

  const existingTasks = existingResult.data || [];
  const hasProgress = existingTasks.some(
    (t: any) => t.status === 'completed' || t.status === 'skipped' || t.status === 'in_progress'
  );

  if (hasProgress) {
    // Client has started — only add new tasks; don't delete completed/in-progress
    const existingKeys = new Set(existingTasks.map((t: any) => `${t.week_number}:${t.title}`));
    const toInsert: any[] = [];
    for (const week of weeks) {
      const weekNumber = week.weekNumber ?? week.week ?? 0;
      for (let i = 0; i < (week.tasks || []).length; i++) {
        const task = week.tasks[i];
        const key = `${weekNumber}:${task.title}`;
        if (existingKeys.has(key)) continue;
        toInsert.push(buildTaskRow(clientId, practiceId, sprintNumber, weekNumber, i, week, task));
      }
    }
    if (toInsert.length > 0) {
      const { error } = await supabase.from('client_tasks').insert(toInsert);
      if (error) throw error;
    }
    return;
  }

  // No progress — full replace
  await supabase
    .from('client_tasks')
    .delete()
    .eq('client_id', clientId)
    .eq('sprint_number', sprintNumber);

  const tasksToInsert: any[] = [];
  for (const week of weeks) {
    const weekNumber = week.weekNumber ?? week.week ?? 0;
    for (let i = 0; i < (week.tasks || []).length; i++) {
      const task = week.tasks[i];
      tasksToInsert.push(buildTaskRow(clientId, practiceId, sprintNumber, weekNumber, i, week, task));
    }
  }

  if (tasksToInsert.length > 0) {
    const { error } = await supabase.from('client_tasks').insert(tasksToInsert);
    if (error) throw error;
  }
}

function buildTaskRow(
  clientId: string,
  practiceId: string,
  sprintNumber: number,
  weekNumber: number,
  sortOrder: number,
  week: any,
  task: any
) {
  return {
    client_id: clientId,
    practice_id: practiceId,
    sprint_number: sprintNumber,
    week_number: weekNumber,
    title: task.title,
    description: task.description || null,
    category: task.category || 'general',
    priority: task.priority || 'medium',
    status: 'pending',
    sort_order: sortOrder,
    estimated_hours: task.timeEstimate ? parseFloat(String(task.timeEstimate)) || null : null,
    metadata: {
      whyThisMatters: task.whyThisMatters,
      milestone: task.milestone,
      tools: task.tools,
      deliverable: task.deliverable,
      celebrationMoment: task.celebrationMoment,
      phase: week.phase,
      isCustom: task.id?.includes?.('custom') || false,
    },
  };
}
