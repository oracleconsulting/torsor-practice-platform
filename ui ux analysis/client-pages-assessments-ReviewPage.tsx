import { Layout } from '@/components/Layout';

export default function AssessmentReviewPage() {
  return (
    <Layout
      title="Review Your Assessments"
      subtitle="View and edit your responses before generating your roadmap"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <p className="text-slate-600 mb-8">
            Assessment review component will be implemented here.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Coming Soon:</strong> This page will show all assessment responses
              organized by part, with the ability to edit and re-submit.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

