import { Layout } from '@/components/Layout';

export default function TasksPage() {
  return (
    <Layout
      title="Your Tasks"
      subtitle="Track and complete your weekly transformation tasks"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <p className="text-slate-600 mb-8">
          Task management component will be implemented here.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> This page will show all tasks organized by week,
            with completion tracking and notes.
          </p>
        </div>
      </div>
    </Layout>
  );
}

