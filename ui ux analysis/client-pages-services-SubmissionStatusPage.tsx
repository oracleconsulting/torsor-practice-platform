// ============================================================================
// SYSTEMS AUDIT — Submission confirmation (post-submit)
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function SubmissionStatusPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Your assessment has been submitted
          </h1>
          <p className="text-gray-600 mb-8">
            Your practice team will review your answers and begin analysis. You will be notified when your report is ready.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
