import { Layout } from '@/components/Layout';

export default function AssessmentPart2Page() {
  return (
    <Layout
      title="Part 2: Business Deep Dive"
      subtitle="Analyzing your business model and opportunities"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <p className="text-slate-600 mb-8">
            Assessment Part 2 component will be implemented here.
            This will use the 72 questions across 13 sections from @torsor/shared.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Coming Soon:</strong> This page will render sectioned questions
              with navigation and progress persistence.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

