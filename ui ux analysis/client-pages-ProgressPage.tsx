// ============================================================================
// Progress Page — Client value tracker (ROI, momentum, wins)
// ============================================================================

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageSkeleton } from '@/components/ui';
import { useProgress } from '@/hooks/useProgress';
import { HeroStats } from '@/components/progress/HeroStats';
import { ProgressChart } from '@/components/progress/ProgressChart';
import { ValueStory } from '@/components/progress/ValueStory';
import { WinWall } from '@/components/progress/WinWall';

export default function ProgressPage() {
  const { heroStats, chartData, valueStory, wins, totalSprints, currentSprint, loading, recalculate } = useProgress();
  const [showAllTime, setShowAllTime] = useState(false);
  const [chartDataFiltered, setChartDataFiltered] = useState(chartData);
  const [hasTriedRecalc, setHasTriedRecalc] = useState(false);

  useEffect(() => {
    if (showAllTime) {
      setChartDataFiltered(chartData);
    } else {
      const thisSprintData = chartData.filter(d =>
        String(d.week).startsWith(`S${currentSprint}W`)
      );
      setChartDataFiltered(thisSprintData.length > 0 ? thisSprintData : chartData.slice(-12));
    }
  }, [showAllTime, chartData, currentSprint]);

  // Only attempt recalculate once on mount when there's no data — prevents infinite loop
  useEffect(() => {
    if (!loading && chartData.length === 0 && !hasTriedRecalc) {
      setHasTriedRecalc(true);
      recalculate();
    }
  }, [loading, chartData.length, hasTriedRecalc, recalculate]);

  if (loading) {
    return (
      <Layout title="Your Progress">
        <PageSkeleton />
      </Layout>
    );
  }

  if (!heroStats.totalTasksCompleted && chartData.length === 0 && wins.length === 0) {
    return (
      <Layout title="Your Progress" subtitle="Nothing here yet">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Your progress will appear here</h3>
          <p className="text-sm text-slate-500 max-w-sm">Once your roadmap is published and you start completing sprint tasks, your progress, wins, and life alignment data will be tracked here.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Progress" subtitle={`Sprint ${currentSprint}`}>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
            Sprint {currentSprint}
          </span>
        </div>

        <HeroStats
          hoursReclaimed={heroStats.hoursReclaimed}
          totalTasksCompleted={heroStats.totalTasksCompleted}
          lifeAlignmentScore={heroStats.lifeAlignmentScore}
          sprintsCompleted={heroStats.sprintsCompleted}
          totalSprints={totalSprints}
          completionRate={heroStats.completionRate}
        />

        <ProgressChart
          data={chartDataFiltered}
          showAllTime={showAllTime}
          onToggle={setShowAllTime}
        />

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your journey</h2>
          <ValueStory
            starting={valueStory.starting}
            current={valueStory.current}
            heading={valueStory.heading}
          />
        </section>

        <section>
          <WinWall wins={wins} />
        </section>
      </div>
    </Layout>
  );
}
