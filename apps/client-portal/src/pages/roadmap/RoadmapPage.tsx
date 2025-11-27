import { Layout } from '@/components/Layout';

export default function RoadmapPage() {
  return (
    <Layout
      title="Your Roadmap"
      subtitle="13-week transformation plan personalized for your business"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <p className="text-slate-600 mb-8">
          Roadmap visualization component will be implemented here.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> This page will show your AI-generated roadmap
            with a timeline view of all 13 weeks and key milestones.
          </p>
        </div>
      </div>
    </Layout>
  );
}

