import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  MicrophoneIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  callTranscriptService,
  type CallTranscript
} from '../../services/alignmentEnhancementsService';

interface CallTranscriptPanelProps {
  practiceId: string;
  oracleGroupId: string;
}

export function CallTranscriptPanel({ practiceId, oracleGroupId }: CallTranscriptPanelProps) {
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<CallTranscript | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);

  useEffect(() => {
    loadTranscripts();
  }, [oracleGroupId]);

  const loadTranscripts = async () => {
    setLoading(true);
    const data = await callTranscriptService.getTranscripts(oracleGroupId);
    setTranscripts(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await callTranscriptService.searchTranscripts(oracleGroupId, searchTerm);
      setTranscripts(results);
    } else {
      loadTranscripts();
    }
  };

  const handleDelete = async (transcriptId: string) => {
    if (!confirm('Are you sure you want to delete this transcript?')) return;
    
    const success = await callTranscriptService.deleteTranscript(transcriptId);
    if (success) {
      setTranscripts(prev => prev.filter(t => t.id !== transcriptId));
      if (selectedTranscript?.id === transcriptId) {
        setSelectedTranscript(null);
      }
    } else {
      alert('Failed to delete transcript');
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <FaceSmileIcon className="w-5 h-5 text-green-500" />;
      case 'concerned':
        return <FaceFrownIcon className="w-5 h-5 text-yellow-500" />;
      case 'urgent':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <FaceSmileIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCallTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      onboarding: 'bg-blue-100 text-blue-800',
      weekly_checkin: 'bg-green-100 text-green-800',
      milestone_review: 'bg-purple-100 text-purple-800',
      problem_solving: 'bg-orange-100 text-orange-800',
      sprint_planning: 'bg-indigo-100 text-indigo-800',
      sprint_retrospective: 'bg-pink-100 text-pink-800',
      ad_hoc: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Extract all unique topics from transcripts
  const allTopics = Array.from(new Set(transcripts.flatMap(t => t.topics || [])));

  const filteredTranscripts = filterTopic
    ? transcripts.filter(t => t.topics?.includes(filterTopic))
    : transcripts;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcripts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search & Add */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <MicrophoneIcon className="w-6 h-6 mr-2 text-purple-600" />
                Call Transcripts
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Store and search call recordings for transparency and learning
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Transcript
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcripts by content, topics, or participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  loadTranscripts();
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Topic Filter */}
          {allTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterTopic(null)}
                className={filterTopic === null ? 'bg-blue-50 border-blue-500' : ''}
              >
                All Topics
              </Button>
              {allTopics.map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterTopic(topic)}
                  className={filterTopic === topic ? 'bg-blue-50 border-blue-500' : ''}
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {topic}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcripts Grid/List */}
      {filteredTranscripts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MicrophoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transcripts Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterTopic
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first call transcript'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Transcript
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTranscripts.map((transcript) => (
            <Card
              key={transcript.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTranscript(transcript)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getCallTypeColor(transcript.call_type)}>
                        {transcript.call_type.replace(/_/g, ' ')}
                      </Badge>
                      {transcript.sentiment && getSentimentIcon(transcript.sentiment)}
                      {transcript.is_confidential && (
                        <Badge className="bg-red-100 text-red-800">Confidential</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {new Date(transcript.call_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTranscript(transcript);
                        setShowAddModal(true);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(transcript.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Participants */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="w-4 h-4" />
                    <span>{transcript.accountant_name || 'Unknown'} & {transcript.client_name || 'Client'}</span>
                  </div>

                  {/* Duration */}
                  {transcript.duration_minutes && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span>{transcript.duration_minutes} minutes</span>
                    </div>
                  )}

                  {/* Summary */}
                  {transcript.summary && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {transcript.summary}
                    </p>
                  )}

                  {/* Key Points */}
                  {transcript.key_points && transcript.key_points.length > 0 && (
                    <div className="space-y-1">
                      {transcript.key_points.slice(0, 2).map((point, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{point}</span>
                        </div>
                      ))}
                      {transcript.key_points.length > 2 && (
                        <p className="text-xs text-gray-500 ml-6">
                          +{transcript.key_points.length - 2} more points
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Items */}
                  {transcript.action_items && transcript.action_items.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {transcript.action_items.length} Action Item{transcript.action_items.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center space-x-1">
                        {transcript.action_items.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-2 h-2 bg-blue-400 rounded-full" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {transcript.topics && transcript.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {transcript.topics.slice(0, 3).map((topic, idx) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {transcript.topics.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-500 text-xs">
                          +{transcript.topics.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Audio Player (if recording available) */}
                  {transcript.recording_url && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Audio player would open here');
                        }}
                      >
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Play Recording
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddTranscriptModal
          practiceId={practiceId}
          oracleGroupId={oracleGroupId}
          transcript={selectedTranscript}
          onClose={() => {
            setShowAddModal(false);
            setSelectedTranscript(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedTranscript(null);
            loadTranscripts();
          }}
        />
      )}

      {/* Detailed View Modal (optional) */}
      {selectedTranscript && !showAddModal && (
        <TranscriptDetailModal
          transcript={selectedTranscript}
          onClose={() => setSelectedTranscript(null)}
        />
      )}
    </div>
  );
}

// Add/Edit Transcript Modal (simplified)
function AddTranscriptModal({
  practiceId,
  oracleGroupId,
  transcript,
  onClose,
  onSuccess
}: {
  practiceId: string;
  oracleGroupId: string;
  transcript: CallTranscript | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    call_type: transcript?.call_type || 'weekly_checkin',
    call_date: transcript?.call_date || new Date().toISOString().split('T')[0],
    duration_minutes: transcript?.duration_minutes || 30,
    accountant_name: transcript?.accountant_name || '',
    client_name: transcript?.client_name || '',
    summary: transcript?.summary || '',
    topics: transcript?.topics?.join(', ') || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const callData = {
        ...formData,
        topics: formData.topics.split(',').map(t => t.trim()).filter(Boolean),
        call_date: new Date(formData.call_date).toISOString()
      };

      const result = await callTranscriptService.createTranscript(
        practiceId,
        oracleGroupId,
        callData
      );

      if (result) {
        onSuccess();
      } else {
        alert('Failed to save transcript');
      }
    } catch (error) {
      alert('Error saving transcript');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {transcript ? 'Edit Transcript' : 'Add Call Transcript'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
              <select
                value={formData.call_type}
                onChange={(e) => setFormData({ ...formData, call_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="onboarding">Onboarding</option>
                <option value="weekly_checkin">Weekly Check-in</option>
                <option value="milestone_review">Milestone Review</option>
                <option value="problem_solving">Problem Solving</option>
                <option value="sprint_planning">Sprint Planning</option>
                <option value="sprint_retrospective">Sprint Retrospective</option>
                <option value="ad_hoc">Ad-hoc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.call_date}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accountant Name</label>
              <input
                type="text"
                value={formData.accountant_name}
                onChange={(e) => setFormData({ ...formData, accountant_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Brief summary of the call..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma-separated)</label>
            <input
              type="text"
              value={formData.topics}
              onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="financial planning, team issues, marketing"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : transcript ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Transcript Detail Modal (simplified)
function TranscriptDetailModal({
  transcript,
  onClose
}: {
  transcript: CallTranscript;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Call Transcript</h2>
            <p className="text-gray-600 mt-1">
              {new Date(transcript.call_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {transcript.summary && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{transcript.summary}</p>
            </div>
          )}

          {transcript.key_points && transcript.key_points.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Points</h3>
              <ul className="space-y-2">
                {transcript.key_points.map((point, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {transcript.action_items && transcript.action_items.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Action Items</h3>
              <div className="space-y-2">
                {transcript.action_items.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      readOnly
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900">{item.task}</p>
                      <p className="text-sm text-gray-600">Assigned to: {item.assignee}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcript.transcript && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Full Transcript</h3>
              <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{transcript.transcript}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

