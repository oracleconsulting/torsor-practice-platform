import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface VersionInfo {
  version: string;
  buildDate: string;
  fixes: string[];
  expectedBehavior: {
    totalAssessments: number;
    activeSkills: number;
    teamMembers: number;
  };
}

export function DiagnosticsPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [assessmentCount, setAssessmentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runDiagnostics() {
      try {
        // Load version info
        const versionRes = await fetch('/version.json');
        const version = await versionRes.json();
        setVersionInfo(version);

        // Count assessments
        const { data, error: queryError } = await supabase
          .from('skill_assessments')
          .select('id')
          .limit(10000);

        if (queryError) throw queryError;
        setAssessmentCount(data?.length || 0);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔍 Deployment Diagnostics</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p>Loading diagnostics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Deployment Diagnostics</h1>

        {/* Version Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Version Info</h2>
          {versionInfo ? (
            <div>
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p><strong>Version:</strong> {versionInfo.version}</p>
                <p><strong>Build Date:</strong> {versionInfo.buildDate}</p>
                <p><strong>Expected Assessments:</strong> {versionInfo.expectedBehavior.totalAssessments}</p>
              </div>
              <details className="bg-gray-50 p-4 rounded">
                <summary className="cursor-pointer font-semibold mb-2">Fixes Applied</summary>
                <ul className="list-disc pl-5 space-y-1">
                  {versionInfo.fixes.map((fix, i) => (
                    <li key={i}>{fix}</li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <p className="text-red-600">❌ Failed to load version info</p>
          )}
        </div>

        {/* Supabase Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET'}</p>
            <p><strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ NOT SET'}</p>
          </div>
        </div>

        {/* Assessment Count */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Skill Assessments Query</h2>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">❌ Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded">
              <p className="mb-2">
                <strong>Total Assessments Fetched:</strong>{' '}
                <span className={`inline-block px-3 py-1 rounded font-bold ${
                  assessmentCount && assessmentCount >= 1700 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {assessmentCount}
                </span>
              </p>
              <p className="mb-2"><strong>Expected:</strong> 1773</p>
              <p>
                <strong>Status:</strong>{' '}
                {assessmentCount && assessmentCount >= 1700 ? (
                  <span className="text-green-600 font-semibold">✅ CORRECT - Fix is working!</span>
                ) : (
                  <span className="text-red-600 font-semibold">❌ STILL TRUNCATED AT 1000</span>
                )}
              </p>
              {assessmentCount && assessmentCount < 1700 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-semibold text-yellow-800">⚠️ Issue Detected:</p>
                  <p className="text-yellow-700">
                    The .limit(10000) fix is not active. The build may have failed or cached.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-800">
            <li>Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+F5)</li>
            <li>Check Railway build logs for errors</li>
            <li>Verify Railway deployed commit <code className="bg-blue-100 px-1">6d6d29c</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

