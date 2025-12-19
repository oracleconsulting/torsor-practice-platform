// ============================================================================
// SYSTEMS AUDIT - STAGE 2: SYSTEM INVENTORY
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

export default function SystemInventoryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Systems Audit - Stage 2</h1>
              <p className="text-gray-600">System Inventory</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-cyan-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">System Inventory</h2>
          <p className="text-gray-600 mb-6">
            This feature is coming soon. Your Stage 1 (Discovery Assessment) responses have been saved successfully.
          </p>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-cyan-900 mb-2">What's Next?</h3>
            <p className="text-sm text-cyan-700">
              In Stage 2, you'll be able to fill out detailed system cards for each software tool your business uses. 
              This will help us understand your tech stack, integration points, and identify opportunities for improvement.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

