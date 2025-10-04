import { useOracleData } from '../hooks/useOracleData';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Database, AlertCircle, CheckCircle } from 'lucide-react';

export default function DebugData() {
  const { user, loading: authLoading } = useAuth();
  const { data, loading: dataLoading, error, refetch } = useOracleData();
  const navigate = useNavigate();

  const isAuthenticated = !!user;
  const hasData = !!data;
  const hasRoadmap = !!(data?.roadmap && Object.keys(data.roadmap).length > 0);
  const hasPart1 = !!data?.part1Complete;
  const hasPart2 = !!data?.part2Complete;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Debug Data View</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => refetch?.()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Authentication Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Authentication Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</span>
            </div>
            {user && (
              <>
                <p>Email: {user.email}</p>
                <p>UID: {user.id}</p>
              </>
            )}
          </div>
        </Card>

        {/* Data Loading Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {authLoading || dataLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              ) : hasData ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Data Loaded: {hasData ? 'Yes' : 'No'}</span>
            </div>
            {error && (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                Error: {error}
              </div>
            )}
          </div>
        </Card>

        {/* Assessment Progress */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Assessment Progress</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasPart1 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Part 1 Complete: {hasPart1 ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasPart2 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Part 2 Complete: {hasPart2 ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasRoadmap ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Roadmap Generated: {hasRoadmap ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </Card>

        {/* Data Details */}
        {data && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Data Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Group ID:</strong> {data.groupId || 'Not set'}</p>
              <p><strong>Email:</strong> {data.email || 'Not set'}</p>
              <p><strong>Current Revenue:</strong> £{data.currentRevenue?.toLocaleString() || 0}</p>
              <p><strong>Target Revenue:</strong> £{data.targetRevenue?.toLocaleString() || 0}</p>
              <p><strong>ROI Value:</strong> {data.roiValue || 'Not calculated'}</p>
              <p><strong>Week Number:</strong> {data.weekNumber || 1}</p>
              <p><strong>Board Generated:</strong> {data.boardGenerated ? 'Yes' : 'No'}</p>
              <p><strong>Roadmap Generated:</strong> {data.roadmapGenerated ? 'Yes' : 'No'}</p>
            </div>
          </Card>
        )}

        {/* Raw Data Preview */}
        {data && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Raw Data Preview</h2>
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify({
                part1Answers: data.part1Answers ? Object.keys(data.part1Answers).length + ' fields' : 'None',
                part2Answers: data.part2Answers ? Object.keys(data.part2Answers).length + ' fields' : 'None',
                roadmap: data.roadmap ? Object.keys(data.roadmap).join(', ') : 'None',
                board: data.board
              }, null, 2)}
            </pre>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            {!isAuthenticated && (
              <Button onClick={() => navigate('/signin')} className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            )}
            {isAuthenticated && !hasPart1 && (
              <Button onClick={() => navigate('/assessment/part1')} className="bg-green-600 hover:bg-green-700">
                Start Part 1 Assessment
              </Button>
            )}
            {isAuthenticated && hasPart1 && !hasPart2 && (
              <Button onClick={() => navigate('/assessment/part2')} className="bg-green-600 hover:bg-green-700">
                Start Part 2 Assessment
              </Button>
            )}
            {isAuthenticated && hasPart2 && !hasRoadmap && (
              <Button onClick={() => navigate('/validation-questions')} className="bg-purple-600 hover:bg-purple-700">
                Complete Validation Questions
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 