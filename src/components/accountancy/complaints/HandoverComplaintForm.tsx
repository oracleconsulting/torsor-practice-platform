import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, X, Upload, Shield } from 'lucide-react';
import type { HandoverComplaint, HandoverIssue, Evidence } from '../../types/accountancy';

interface Props {
  onSubmit: (complaint: Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loading?: boolean;
}

type NewHandoverIssue = Omit<HandoverIssue, 'id'>;
type NewEvidence = Omit<Evidence, 'id' | 'uploadedAt'>;

export const HandoverComplaintForm: React.FC<Props> = ({ onSubmit, loading = false }) => {
  const [clientName, setClientName] = useState('');
  const [previousAccountant, setPreviousAccountant] = useState('');
  const [regulatoryBody, setRegulatoryBody] = useState<HandoverComplaint['regulatoryBody']>('ICAEW');
  const [severity, setSeverity] = useState<HandoverComplaint['severity']>('medium');
  const [issues, setIssues] = useState<NewHandoverIssue[]>([]);
  const [evidence, setEvidence] = useState<NewEvidence[]>([]);

  const handleAddIssue = () => {
    setIssues([
      ...issues,
      {
        category: 'documentation',
        description: '',
        impact: '',
        status: 'open',
        priority: 'medium'
      }
    ]);
  };

  const handleRemoveIssue = (index: number) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  const handleIssueChange = (index: number, field: keyof NewHandoverIssue, value: string) => {
    setIssues(
      issues.map((issue, i) =>
        i === index ? { ...issue, [field]: value } : issue
      )
    );
  };

  const handleAddEvidence = () => {
    setEvidence([
      ...evidence,
      {
        type: 'document',
        title: '',
        description: '',
        fileUrl: '',
        uploadedBy: '',
        tags: [],
        relatedIssues: []
      }
    ]);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleEvidenceChange = (index: number, field: keyof NewEvidence, value: string) => {
    setEvidence(
      evidence.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    await onSubmit({
      clientName,
      previousAccountant,
      regulatoryBody,
      severity,
      status: 'draft',
      issues: issues as HandoverIssue[],
      evidence: evidence as Evidence[],
      timeline: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
        <h3 className="text-lg font-semibold text-white mb-4">Client Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Previous Accountant
            </label>
            <input
              type="text"
              value={previousAccountant}
              onChange={(e) => setPreviousAccountant(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Regulatory Information */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
        <h3 className="text-lg font-semibold text-white mb-4">Regulatory Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Regulatory Body
            </label>
            <select
              value={regulatoryBody}
              onChange={(e) => setRegulatoryBody(e.target.value as HandoverComplaint['regulatoryBody'])}
              className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ICAEW">ICAEW</option>
              <option value="ACCA">ACCA</option>
              <option value="AAT">AAT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as HandoverComplaint['severity'])}
              className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Issues</h3>
          <button
            type="button"
            onClick={handleAddIssue}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Issue
          </button>
        </div>
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg p-4"
            >
              <div className="flex justify-between mb-3">
                <h4 className="text-white font-medium">Issue #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveIssue(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={issue.category}
                    onChange={(e) => handleIssueChange(index, 'category', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="documentation">Documentation</option>
                    <option value="communication">Communication</option>
                    <option value="compliance">Compliance</option>
                    <option value="technical">Technical</option>
                    <option value="ethical">Ethical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={issue.description}
                    onChange={(e) => handleIssueChange(index, 'description', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Impact
                  </label>
                  <textarea
                    value={issue.impact}
                    onChange={(e) => handleIssueChange(index, 'impact', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={issue.priority}
                    onChange={(e) => handleIssueChange(index, 'priority', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
          {issues.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p>No issues added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Evidence</h3>
          <button
            type="button"
            onClick={handleAddEvidence}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
          >
            <Upload className="w-4 h-4" />
            Add Evidence
          </button>
        </div>
        <div className="space-y-4">
          {evidence.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg p-4"
            >
              <div className="flex justify-between mb-3">
                <h4 className="text-white font-medium">Evidence #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveEvidence(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={item.type}
                    onChange={(e) => handleEvidenceChange(index, 'type', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="document">Document</option>
                    <option value="email">Email</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="recording">Recording</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleEvidenceChange(index, 'title', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => handleEvidenceChange(index, 'description', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    File URL
                  </label>
                  <input
                    type="url"
                    value={item.fileUrl}
                    onChange={(e) => handleEvidenceChange(index, 'fileUrl', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            ${loading
              ? 'bg-purple-500/50 text-purple-300 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
            }
          `}
        >
          <Shield className="w-5 h-5" />
          Submit Complaint
        </button>
      </div>
    </form>
  );
}; 