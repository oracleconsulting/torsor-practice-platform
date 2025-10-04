import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Clock,
  FileText,
  Upload,
  Plus,
  ChevronLeft,
  ExternalLink,
  Download
} from 'lucide-react';
import { useHandoverComplaints } from '../../hooks/useHandoverComplaints';
import type { HandoverComplaint, Evidence, HandoverIssue } from '../types/accountancy';
import { toast } from 'sonner';

export const ComplaintDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getComplaintById,
    updateComplaint,
    addEvidence,
    addIssue,
    updateIssue,
    addTimelineEvent
  } = useHandoverComplaints();
  const [complaint, setComplaint] = useState<HandoverComplaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchComplaint = async () => {
      try {
        if (!id) return;
        const data = await getComplaintById(id);
        setComplaint(data);
      } catch (err) {
        console.error('Error fetching complaint:', err);
        setError('Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, getComplaintById]);

  const handleStatusChange = async (status: HandoverComplaint['status']) => {
    try {
      if (!complaint) return;
      await updateComplaint(complaint.id, { status });
      setComplaint({ ...complaint, status });
      await addTimelineEvent(complaint.id, {
        type: 'status_changed',
        description: `Status changed to ${status}`,
        actor: 'User', // TODO: Get from auth context
      });
      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleAddEvidence = async (evidence: Omit<Evidence, 'id' | 'uploadedAt'>) => {
    try {
      if (!complaint) return;
      const newEvidence = await addEvidence(complaint.id, evidence);
      setComplaint({
        ...complaint,
        evidence: [...complaint.evidence, newEvidence]
      });
      await addTimelineEvent(complaint.id, {
        type: 'evidence_added',
        description: `Added evidence: ${evidence.title}`,
        actor: 'User', // TODO: Get from auth context
      });
      toast.success('Evidence added successfully');
    } catch (err) {
      console.error('Error adding evidence:', err);
      toast.error('Failed to add evidence');
    }
  };

  const handleAddIssue = async (issue: Omit<HandoverIssue, 'id'>) => {
    try {
      if (!complaint) return;
      const newIssue = await addIssue(complaint.id, issue);
      setComplaint({
        ...complaint,
        issues: [...complaint.issues, newIssue]
      });
      await addTimelineEvent(complaint.id, {
        type: 'issue_created',
        description: `Added issue: ${issue.description.substring(0, 50)}...`,
        actor: 'User', // TODO: Get from auth context
      });
      toast.success('Issue added successfully');
    } catch (err) {
      console.error('Error adding issue:', err);
      toast.error('Failed to add issue');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500">{error || 'Complaint not found'}</p>
        <button
          onClick={() => navigate('/accountancy/complaints')}
          className="mt-4 text-purple-400 hover:text-purple-300"
        >
          Back to Complaints
        </button>
      </div>
    );
  }

  const getStatusColor = (status: HandoverComplaint['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'investigating': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'escalated': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/accountancy/complaints')}
          className="text-purple-400 hover:text-purple-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {complaint.clientName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{complaint.regulatoryBody}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">
              Reported {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issues */}
          <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Issues</h2>
              <button
                onClick={() => {/* TODO: Open add issue modal */}}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Issue
              </button>
            </div>
            <div className="space-y-4">
              {complaint.issues.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                        {issue.category.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                        {issue.priority.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {issue.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white mb-3">{issue.description}</p>
                  <div className="bg-purple-500/5 rounded p-3">
                    <p className="text-sm text-purple-300">
                      <strong>Impact:</strong> {issue.impact}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Evidence</h2>
              <button
                onClick={() => {/* TODO: Open add evidence modal */}}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
              >
                <Upload className="w-4 h-4" />
                Add Evidence
              </button>
            </div>
            <div className="space-y-4">
              {complaint.evidence.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View File
                    </a>
                    <button className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
            <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
            <div className="space-y-2">
              {['draft', 'submitted', 'investigating', 'resolved', 'escalated'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as HandoverComplaint['status'])}
                  className={`w-full px-4 py-2 rounded-lg text-left ${
                    complaint.status === status
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                  }`}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              {complaint.timeline.map((event) => (
                <div key={event.id} className="relative pl-6 pb-4">
                  <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-purple-500/20 border-2 border-purple-500" />
                  <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-purple-500/20" />
                  <p className="text-white text-sm">{event.description}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 