import { useOracleData } from '@/hooks/useOracleData';
import { Card } from '@/components/ui/card';

export default function SprintPlanner() {
  const { data, loading, getRoadmapWeeks } = useOracleData();
  
  if (loading) return <div>Loading...</div>;
  if (!data?.threeMonthSprint) return <div>No sprint data available</div>;
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">12-Week Sprint Plan</h1>
      <div className="grid gap-6">
        {getRoadmapWeeks().map((week: any) => (
          <Card key={week.weekNumber} className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Week {week.weekNumber}: {week.theme}
            </h2>
            <p className="text-gray-600 mb-4">{week.focus}</p>
            <div className="space-y-3">
              {week.tasks?.map((task: any, i: number) => (
                <div key={i} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>⏱ {task.time_required}</span>
                    <span>📊 {task.output}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 