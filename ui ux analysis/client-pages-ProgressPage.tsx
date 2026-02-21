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

  useEffect(() => {
    if (!loading && chartData.length === 0) {
      recalculate();
    }
  }, [loading, chartData.length, recalculate]);

  if (loading) {
    return (
      <Layout title="Your Progress">
        <PageSkeleton />
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
