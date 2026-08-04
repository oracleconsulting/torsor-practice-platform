import { describe, it, expect } from 'vitest';
import { diffSprintContent, groupViolationsByPath } from './sprintRefreshDiff';

const week = (n: number, theme: string, tasks: Array<{ title: string; description?: string }>) => ({
  weekNumber: n,
  theme,
  narrative: `Narrative for week ${n}`,
  weekMilestone: `Milestone ${n}`,
  tasks: tasks.map((t) => ({ description: 'unchanged description', ...t })),
});

const published = {
  weeks: [
    week(1, 'Foundations', [{ title: 'Map the process' }]),
    week(4, 'Visibility', [
      { title: 'Build the dashboard' },
      { title: 'Chase the debtors' },
    ]),
  ],
};

describe('diffSprintContent', () => {
  it('collapses unchanged weeks and reports no changes', () => {
    const diff = diffSprintContent(published, structuredClone(published));
    expect(diff.hasChanges).toBe(false);
    expect(diff.summary).toEqual({
      weeksChanged: 0,
      tasksRemoved: 0,
      tasksAdded: 0,
      tasksChanged: 0,
    });
    // An unchanged week carries no task rows, so it renders as one line.
    expect(diff.weeks.every((w) => w.tasks.length === 0)).toBe(true);
  });

  it('counts added and removed tasks separately from edits', () => {
    const generated = {
      weeks: [
        week(1, 'Foundations', [{ title: 'Map the process' }]),
        week(4, 'Visibility', [
          { title: 'Build the dashboard', description: 'rewritten description' },
          { title: 'Hire the bookkeeper' },
        ]),
      ],
    };

    const diff = diffSprintContent(published, generated);

    expect(diff.summary.weeksChanged).toBe(1);
    expect(diff.summary.tasksAdded).toBe(1);
    expect(diff.summary.tasksRemoved).toBe(1);
    expect(diff.summary.tasksChanged).toBe(1);

    const w4 = diff.weeks.find((w) => w.weekNumber === 4)!;
    expect(w4.status).toBe('changed');
    expect(w4.tasks.find((t) => t.title === 'Hire the bookkeeper')!.status).toBe('added');
    expect(w4.tasks.find((t) => t.title === 'Chase the debtors')!.status).toBe('removed');
  });

  it('treats an alias-only move as unchanged', () => {
    const generated = {
      weeks: [
        { ...week(1, 'Foundations', [{ title: 'Map the process' }]), weekMilestone: undefined, milestone: 'Milestone 1' },
        week(4, 'Visibility', [
          { title: 'Build the dashboard' },
          { title: 'Chase the debtors' },
        ]),
      ],
    };
    expect(diffSprintContent(published, generated).hasChanges).toBe(false);
  });

  it('reads weeks nested under sprint', () => {
    const diff = diffSprintContent({ sprint: published }, { sprint: published });
    expect(diff.weeks).toHaveLength(2);
    expect(diff.hasChanges).toBe(false);
  });

  it('marks every week as added when there is no published baseline', () => {
    const diff = diffSprintContent(null, published);
    expect(diff.summary.weeksChanged).toBe(2);
    expect(diff.weeks.every((w) => w.status === 'added')).toBe(true);
  });

  it('pairs a retitled task instead of reporting a removal plus an addition', () => {
    const generated = {
      weeks: [
        week(1, 'Foundations', [{ title: 'Map the process' }]),
        week(4, 'Visibility', [
          { title: 'Build the revenue dashboard' },
          { title: 'Chase the debtors' },
        ]),
      ],
    };
    const diff = diffSprintContent(published, generated);
    expect(diff.summary.tasksAdded).toBe(0);
    expect(diff.summary.tasksRemoved).toBe(0);

    const retitled = diff.weeks
      .find((w) => w.weekNumber === 4)!
      .tasks.find((t) => t.title === 'Build the revenue dashboard')!;
    expect(retitled.status).toBe('changed');
    expect(retitled.previousTitle).toBe('Build the dashboard');
  });

  it('builds task paths that match the voice scan', () => {
    const generated = {
      weeks: [week(4, 'Visibility', [{ title: 'Build the dashboard', description: 'new' }])],
    };
    const diff = diffSprintContent(published, generated);
    const task = diff.weeks.find((w) => w.weekNumber === 4)!.tasks[0];
    expect(task.path).toBe('week4.tasks[0]');
  });
});

describe('groupViolationsByPath', () => {
  it('groups task fields under the task and week fields under the week', () => {
    const grouped = groupViolationsByPath({
      violations: [
        { path: 'week4.tasks[0].description', rule: 'em_dash', label: 'Em dash', match: '—', excerpt: '' },
        { path: 'week4.tasks[0].title', rule: 'rather_than', label: 'rather than', match: 'rather than', excerpt: '' },
        { path: 'week4.narrative', rule: 'em_dash', label: 'Em dash', match: '—', excerpt: '' },
      ],
    });

    expect(grouped.get('week4.tasks[0]')).toHaveLength(2);
    expect(grouped.get('week4')).toHaveLength(1);
  });

  it('handles a missing scan', () => {
    expect(groupViolationsByPath(null).size).toBe(0);
  });
});
